import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime for PDF/XLSX parsing
export const runtime = "nodejs";
// Increase timeout for AI processing
export const maxDuration = 60;
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  parseContractorEstimate,
  verifyPrices,
  generateVerificationResult,
} from "@/lib/ai/verifier";
import { parsePdfBuffer } from "@/lib/utils/pdf-parser";
import { parseContractorXlsx, isXlsxBuffer } from "@/lib/utils/xlsx-parser";

// GET /api/verify — list user's verifications
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("verifications")
    .select(
      "id, status, input_type, total_contractor, overpay_amount, overpay_percent, is_paid, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ verifications: data });
}

// POST /api/verify — create new verification
export async function POST(request: NextRequest) {
  console.log("[Verify API] POST request received");

  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[Verify API] User:", user?.id);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    console.log("[Verify API] FormData received");
    const text = formData.get("text") as string | null;
    const files = formData.getAll("files") as File[];
    console.log("[Verify API] Files:", files.length, files.map(f => ({ name: f.name, type: f.type, size: f.size })));

    let inputType: "text" | "pdf" | "photo" | "mixed" | "xlsx" = "text";
    if (files.length > 0 && text) inputType = "mixed";
    else if (files.length > 0) {
      const hasImages = files.some((f) => f.type.startsWith("image/"));
      const hasPdfs = files.some((f) => f.type === "application/pdf");
      const hasXlsx = files.some((f) =>
        f.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        f.name.endsWith(".xlsx")
      );
      if (hasXlsx && files.length === 1) inputType = "xlsx";
      else if (hasImages && hasPdfs) inputType = "mixed";
      else if (hasImages) inputType = "photo";
      else if (hasPdfs) inputType = "pdf";
      else if (hasXlsx) inputType = "xlsx";
    }

    const { data: verification, error: createError } = await supabase
      .from("verifications")
      .insert({
        user_id: user.id,
        status: "processing",
        input_type: inputType,
        input_text: text,
      })
      .select()
      .single();

    if (createError || !verification) {
      console.log("[Verify API] Create error:", createError);
      return NextResponse.json(
        { error: createError?.message || "Failed to create verification" },
        { status: 500 }
      );
    }

    console.log("[Verify API] Verification created:", verification.id);

    // Use streaming to keep connection alive during processing
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        console.log("[Verify API] Stream started");
        // Send initial response
        controller.enqueue(encoder.encode(`data: {"status":"processing","id":"${verification.id}"}\n\n`));

        try {
          // Process with periodic heartbeats
          const heartbeat = setInterval(() => {
            controller.enqueue(encoder.encode(`data: {"status":"processing"}\n\n`));
          }, 5000);

          console.log("[Verify API] Calling processVerification...");
          await processVerification(
            verification.id,
            user.id,
            text,
            files,
            serviceClient
          );

          clearInterval(heartbeat);
          controller.enqueue(encoder.encode(`data: {"status":"ready","id":"${verification.id}"}\n\n`));
        } catch (err) {
          console.error("Verification pipeline error:", err);
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
    console.error("Create verification error:", error);
    return NextResponse.json(
      { error: "Failed to create verification" },
      { status: 500 }
    );
  }
}

async function processVerification(
  verificationId: string,
  userId: string,
  text: string | null,
  files: File[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const log = (msg: string, data?: unknown) => {
    console.log(`[Verify ${verificationId.slice(0,8)}] ${msg}`, data || "");
  };

  try {
    log("START", { filesCount: files.length, hasText: !!text });

    let pdfText = "";
    const imageUrls: string[] = [];
    let xlsxParsedItems: Awaited<ReturnType<typeof parseContractorXlsx>> | null = null;

    for (const file of files) {
      log(`Processing file: ${file.name}`, { type: file.type, size: file.size });
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${userId}/${verificationId}/${file.name}`;

      await supabase.storage
        .from("estimate-files")
        .upload(fileName, buffer, { contentType: file.type });

      const {
        data: { publicUrl },
      } = supabase.storage.from("estimate-files").getPublicUrl(fileName);

      // Handle XLSX files - direct parsing without AI
      const isXlsx = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                     file.name.endsWith(".xlsx") ||
                     isXlsxBuffer(buffer);

      if (isXlsx) {
        xlsxParsedItems = parseContractorXlsx(buffer);
        await supabase.from("verification_files").insert({
          verification_id: verificationId,
          file_url: publicUrl,
          file_type: "xlsx",
          original_name: file.name,
        });
      } else if (file.type === "application/pdf") {
        pdfText += await parsePdfBuffer(buffer);
        await supabase.from("verification_files").insert({
          verification_id: verificationId,
          file_url: publicUrl,
          file_type: "pdf",
          original_name: file.name,
        });
      } else if (file.type.startsWith("image/")) {
        const base64 = buffer.toString("base64");
        imageUrls.push(`data:${file.type};base64,${base64}`);
        await supabase.from("verification_files").insert({
          verification_id: verificationId,
          file_url: publicUrl,
          file_type: "image",
          original_name: file.name,
        });
      }
    }

    // Step 1: Parse contractor estimate
    log("Step 1: Parsing", { hasXlsx: !!xlsxParsedItems, imageCount: imageUrls.length, pdfTextLen: pdfText.length });

    let contractorItems;

    if (xlsxParsedItems && xlsxParsedItems.items.length > 0) {
      // Use directly parsed xlsx data (no AI needed)
      contractorItems = xlsxParsedItems.items;
      log("Using XLSX parsed items", { count: contractorItems.length });
    } else {
      // Use AI to parse PDF/photo/text
      log("Calling AI parseContractorEstimate...");
      const { items } = await parseContractorEstimate({
        text: text || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        pdfText: pdfText || undefined,
      });
      contractorItems = items;
      log("AI returned items", { count: contractorItems.length, items: contractorItems.slice(0, 3) });
    }

    if (!contractorItems || contractorItems.length === 0) {
      throw new Error("AI не смог распознать позиции сметы. Попробуйте более чёткое фото или текст.");
    }

    await supabase
      .from("verifications")
      .update({ parsed_items: contractorItems })
      .eq("id", verificationId);

    // Step 2: Compare with market prices
    log("Step 2: Verifying prices...");
    const verifiedItems = await verifyPrices(contractorItems);
    log("Step 2 complete", { verifiedCount: verifiedItems.length });

    // Step 3: Generate result
    log("Step 3: Generating result...");
    const result = await generateVerificationResult(verifiedItems);
    log("Step 3 complete", { total: result.total_contractor, overpay: result.overpay_percent });

    await supabase
      .from("verifications")
      .update({
        status: "ready",
        result,
        total_contractor: result.total_contractor,
        total_market: result.total_market_avg,
        overpay_amount: result.total_overpay,
        overpay_percent: result.overpay_percent,
      })
      .eq("id", verificationId);

    log("SUCCESS", { total: result.total_contractor });
  } catch (error) {
    console.error(`[Verify] ERROR:`, error);
    console.error("Verification pipeline error:", error);
    await supabase
      .from("verifications")
      .update({
        status: "error",
        error_message:
          error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", verificationId);
  }
}
