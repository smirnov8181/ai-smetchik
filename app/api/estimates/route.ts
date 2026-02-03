import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";

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

    // Schedule processing after response is sent (Next.js 15 after API)
    after(async () => {
      await processEstimate(estimate.id, user.id, text, files, serviceClient).catch(
        (err) => console.error("Pipeline error:", err)
      );
    });

    return NextResponse.json({ estimate: { id: estimate.id, status: "processing" } });
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
  try {
    // Process files
    let pdfText = "";
    const imageUrls: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${userId}/${estimateId}/${file.name}`;

      // Upload to Supabase Storage
      await supabase.storage.from("estimate-files").upload(fileName, buffer, {
        contentType: file.type,
      });

      const {
        data: { publicUrl },
      } = supabase.storage.from("estimate-files").getPublicUrl(fileName);

      if (file.type === "application/pdf") {
        pdfText += await parsePdfBuffer(buffer);
        await supabase.from("estimate_files").insert({
          estimate_id: estimateId,
          file_url: publicUrl,
          file_type: "pdf",
          original_name: file.name,
        });
      } else if (file.type.startsWith("image/")) {
        // Convert to base64 data URL for OpenAI vision
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

    // Step 1: Normalize input
    const normalizedInput = await normalizeInput({
      text: text || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      pdfText: pdfText || undefined,
    });

    // Update with normalized data
    await supabase
      .from("estimates")
      .update({ input_data: normalizedInput })
      .eq("id", estimateId);

    // Step 2: Extract work items
    const workItems = await extractWorkItems(normalizedInput);

    // Step 3: Calculate prices
    const pricedItems = await calculatePrices(workItems);

    // Step 4: Generate final estimate
    const result = await generateEstimate(pricedItems, normalizedInput);

    // Save result
    await supabase
      .from("estimates")
      .update({
        status: "ready",
        result,
        total_amount: result.total,
      })
      .eq("id", estimateId);

    // Increment usage counter
    const { error: rpcError } = await supabase.rpc("increment_estimates_used", { uid: userId });
    if (rpcError) {
      // Fallback: direct increment via SQL
      await supabase
        .from("subscriptions")
        .update({ estimates_used: 1 }) // Will be fixed with proper SQL
        .eq("user_id", userId);
    }
  } catch (error) {
    console.error("Pipeline error:", error);
    await supabase
      .from("estimates")
      .update({
        status: "error",
        error_message:
          error instanceof Error ? error.message : "Unknown error occurred",
      })
      .eq("id", estimateId);
  }
}
