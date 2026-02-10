import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  parseContractorEstimate,
  verifyPrices,
  generateVerificationResult,
} from "@/lib/ai/verifier";
import { parsePdfBuffer } from "@/lib/utils/pdf-parser";
import { parseContractorXlsx, isXlsxBuffer } from "@/lib/utils/xlsx-parser";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/verify/:id/retry — retry a failed/stuck verification
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: verification, error } = await supabase
    .from("verifications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !verification) {
    return NextResponse.json({ error: "Verification not found" }, { status: 404 });
  }

  if (verification.status === "ready") {
    return NextResponse.json({ error: "Verification already completed" }, { status: 400 });
  }

  // Reset to processing
  await supabase
    .from("verifications")
    .update({ status: "processing", error_message: null, created_at: new Date().toISOString() })
    .eq("id", id);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: {"status":"processing","id":"${id}"}\n\n`));

      try {
        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(`data: {"status":"processing"}\n\n`));
        }, 5000);

        await retryProcessVerification(id, verification, serviceClient);

        clearInterval(heartbeat);
        controller.enqueue(encoder.encode(`data: {"status":"ready","id":"${id}"}\n\n`));
      } catch (err) {
        console.error("Verification retry error:", err);
        controller.enqueue(
          encoder.encode(
            `data: {"status":"error","error":"${err instanceof Error ? err.message : "Unknown error"}"}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function retryProcessVerification(
  verificationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verification: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const log = (msg: string, data?: unknown) => {
    console.log(`[Verify RETRY ${verificationId.slice(0, 8)}] ${msg}`, data || "");
  };

  try {
    log("START RETRY");

    let pdfText = "";
    const imageUrls: string[] = [];
    let xlsxParsedItems: Awaited<ReturnType<typeof parseContractorXlsx>> | null = null;

    // Fetch associated files
    const { data: files } = await supabase
      .from("verification_files")
      .select("*")
      .eq("verification_id", verificationId);

    if (files && files.length > 0) {
      for (const file of files) {
        const urlParts = file.file_url.split("/estimate-files/");
        const filePath = urlParts[1];
        if (!filePath) continue;

        const { data: fileData, error: downloadError } = await supabase.storage
          .from("estimate-files")
          .download(filePath);

        if (downloadError || !fileData) {
          log(`Download error for ${file.original_name}:`, downloadError?.message);
          continue;
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());

        if (file.file_type === "xlsx" || isXlsxBuffer(buffer)) {
          xlsxParsedItems = parseContractorXlsx(buffer);
        } else if (file.file_type === "pdf") {
          pdfText += await parsePdfBuffer(buffer);
        } else if (file.file_type === "image") {
          const base64 = buffer.toString("base64");
          imageUrls.push(`data:image/jpeg;base64,${base64}`);
        }
      }
    }

    const text = verification.input_text;
    const region = verification.region || "moscow";

    // Step 1: Parse contractor estimate
    log("Step 1: Parsing...");
    let contractorItems;

    if (xlsxParsedItems && xlsxParsedItems.items.length > 0) {
      contractorItems = xlsxParsedItems.items;
      log("Using XLSX parsed items", { count: contractorItems.length });
    } else {
      const { items } = await parseContractorEstimate({
        text: text || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        pdfText: pdfText || undefined,
        region,
      });
      contractorItems = items;
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
    const verifiedItems = await verifyPrices(contractorItems, region);
    log("Step 2 complete");

    // Step 3: Generate result
    log("Step 3: Generating result...");
    const result = await generateVerificationResult(verifiedItems, region);
    log("Step 3 complete");

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

    log("RETRY SUCCESS");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    log("RETRY ERROR", errorMsg);

    await supabase
      .from("verifications")
      .update({
        status: "error",
        error_message: errorMsg,
      })
      .eq("id", verificationId);

    throw error;
  }
}
