import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime (not Edge) for PDF parsing
export const runtime = "nodejs";
// Increase timeout for AI processing (60s for Pro, 10s for Hobby)
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizeInput } from "@/lib/ai/normalizer";
import { extractWorkItems } from "@/lib/ai/extractor";
import { calculatePrices } from "@/lib/ai/calculator";
import { generateEstimate } from "@/lib/ai/generator";
import { parsePdfBuffer } from "@/lib/utils/pdf-parser";

// GET /api/estimates — list user's estimates
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("estimates")
    .select("id, status, input_type, total_amount, created_at, updated_at, result")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ estimates: data });
}

// POST /api/estimates — create new estimate
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription limits
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (subscription) {
    const limit =
      subscription.plan === "business"
        ? Infinity
        : subscription.estimates_limit;
    if (subscription.estimates_used >= limit) {
      return NextResponse.json(
        { error: "Estimate limit reached. Please upgrade your plan." },
        { status: 403 }
      );
    }
  }

  try {
    const formData = await request.formData();
    const text = formData.get("text") as string | null;
    const files = formData.getAll("files") as File[];

    // Determine input type
    let inputType: "text" | "pdf" | "photo" | "mixed" = "text";
    if (files.length > 0 && text) inputType = "mixed";
    else if (files.length > 0) {
      const hasImages = files.some((f) => f.type.startsWith("image/"));
      const hasPdfs = files.some((f) => f.type === "application/pdf");
      if (hasImages && hasPdfs) inputType = "mixed";
      else if (hasImages) inputType = "photo";
      else inputType = "pdf";
    }

    // Create estimate record (processing)
    const { data: estimate, error: createError } = await supabase
      .from("estimates")
      .insert({
        user_id: user.id,
        status: "processing",
        input_type: inputType,
        input_text: text,
      })
      .select()
      .single();

    if (createError || !estimate) {
      return NextResponse.json(
        { error: createError?.message || "Failed to create estimate" },
        { status: 500 }
      );
    }

    // Use streaming to keep connection alive during processing
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial response
        controller.enqueue(encoder.encode(`data: {"status":"processing","id":"${estimate.id}"}\n\n`));

        try {
          // Process with periodic heartbeats
          const heartbeat = setInterval(() => {
            controller.enqueue(encoder.encode(`data: {"status":"processing"}\n\n`));
          }, 5000);

          await processEstimate(estimate.id, user.id, text, files, serviceClient);

          clearInterval(heartbeat);
          controller.enqueue(encoder.encode(`data: {"status":"ready","id":"${estimate.id}"}\n\n`));
        } catch (err) {
          console.error("Estimate pipeline error:", err);
          controller.enqueue(encoder.encode(`data: {"status":"error","error":"${err instanceof Error ? err.message : 'Unknown error'}"}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Create estimate error:", error);
    return NextResponse.json(
      { error: "Failed to create estimate" },
      { status: 500 }
    );
  }
}

async function processEstimate(
  estimateId: string,
  userId: string,
  text: string | null,
  files: File[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const log = (step: string, data?: unknown) => {
    console.log(`[Estimate ${estimateId.slice(0, 8)}] ${step}`, data || "");
  };

  try {
    log("START", { filesCount: files.length, hasText: !!text });

    // Process files
    let pdfText = "";
    const imageUrls: string[] = [];

    for (const file of files) {
      log(`Processing file: ${file.name}`, { type: file.type, size: file.size });

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        log(`File too large, skipping: ${file.name}`);
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${userId}/${estimateId}/${file.name}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("estimate-files")
        .upload(fileName, buffer, { contentType: file.type });

      if (uploadError) {
        log(`Upload error for ${file.name}:`, uploadError.message);
        // Continue processing even if upload fails
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("estimate-files").getPublicUrl(fileName);

      if (file.type === "application/pdf") {
        log(`Parsing PDF: ${file.name}`);
        try {
          const extractedText = await parsePdfBuffer(buffer);
          log(`PDF text extracted`, { length: extractedText.length });

          // If PDF is empty (likely a scan), treat as image
          if (extractedText.trim().length < 50) {
            log(`PDF appears to be a scan (empty text), treating as image`);
            const base64 = buffer.toString("base64");
            imageUrls.push(`data:application/pdf;base64,${base64}`);
          } else {
            pdfText += extractedText + "\n";
          }
        } catch (pdfError) {
          log(`PDF parse error:`, pdfError instanceof Error ? pdfError.message : pdfError);
          // Try to treat as image if parsing fails
          const base64 = buffer.toString("base64");
          imageUrls.push(`data:application/pdf;base64,${base64}`);
        }

        await supabase.from("estimate_files").insert({
          estimate_id: estimateId,
          file_url: publicUrl,
          file_type: "pdf",
          original_name: file.name,
        });
      } else if (file.type.startsWith("image/")) {
        log(`Processing image: ${file.name}`);
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${file.type};base64,${base64}`;
        imageUrls.push(dataUrl);

        await supabase.from("estimate_files").insert({
          estimate_id: estimateId,
          file_url: publicUrl,
          file_type: "image",
          original_name: file.name,
        });
      }
    }

    log("Files processed", { pdfTextLength: pdfText.length, imagesCount: imageUrls.length });

    // Step 1: Normalize input
    log("Step 1: Normalizing input...");
    const normalizedInput = await normalizeInput({
      text: text || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      pdfText: pdfText || undefined,
    });
    log("Step 1 complete", { rooms: normalizedInput.rooms?.length || 0 });

    // Update with normalized data
    await supabase
      .from("estimates")
      .update({ input_data: normalizedInput })
      .eq("id", estimateId);

    // Step 2: Extract work items
    log("Step 2: Extracting work items...");
    const workItems = await extractWorkItems(normalizedInput);
    log("Step 2 complete", { itemsCount: workItems.length });

    // Step 3: Calculate prices
    log("Step 3: Calculating prices...");
    const pricedItems = await calculatePrices(workItems);
    log("Step 3 complete", { pricedCount: pricedItems.length });

    // Step 4: Generate final estimate
    log("Step 4: Generating estimate...");
    const result = await generateEstimate(pricedItems, normalizedInput);
    log("Step 4 complete", { total: result.total, sectionsCount: result.sections?.length || 0 });

    // Save result
    await supabase
      .from("estimates")
      .update({
        status: "ready",
        result,
        total_amount: result.total,
      })
      .eq("id", estimateId);

    log("SUCCESS", { total: result.total });

    // Increment usage counter
    const { error: rpcError } = await supabase.rpc("increment_estimates_used", { uid: userId });
    if (rpcError) {
      log("RPC error, using fallback:", rpcError.message);
      await supabase
        .from("subscriptions")
        .update({ estimates_used: 1 })
        .eq("user_id", userId);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
    log("ERROR", errorMsg);
    console.error("Full error:", error);

    await supabase
      .from("estimates")
      .update({
        status: "error",
        error_message: errorMsg,
      })
      .eq("id", estimateId);
  }
}
