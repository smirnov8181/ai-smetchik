import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { normalizeInput } from "@/lib/ai/normalizer";
import { extractWorkItems } from "@/lib/ai/extractor";
import { calculatePrices } from "@/lib/ai/calculator";
import { generateEstimate } from "@/lib/ai/generator";
import { parsePdfBuffer } from "@/lib/utils/pdf-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/estimates/:id/retry — retry a failed/stuck estimate
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

  // Fetch the estimate
  const { data: estimate, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  // Only allow retry for error or stale processing records
  if (estimate.status === "ready") {
    return NextResponse.json({ error: "Estimate already completed" }, { status: 400 });
  }

  // Reset to processing
  await supabase
    .from("estimates")
    .update({ status: "processing", error_message: null })
    .eq("id", id);

  // Re-process via SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: {"status":"processing","id":"${id}"}\n\n`));

      try {
        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(`data: {"status":"processing"}\n\n`));
        }, 5000);

        await retryProcessEstimate(id, estimate, serviceClient);

        clearInterval(heartbeat);
        controller.enqueue(encoder.encode(`data: {"status":"ready","id":"${id}"}\n\n`));
      } catch (err) {
        console.error("Estimate retry error:", err);
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

async function retryProcessEstimate(
  estimateId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  estimate: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const log = (step: string, data?: unknown) => {
    console.log(`[Estimate RETRY ${estimateId.slice(0, 8)}] ${step}`, data || "");
  };

  try {
    log("START RETRY");

    // Gather input data from original estimate
    let pdfText = "";
    const imageUrls: string[] = [];

    // Fetch associated files
    const { data: files } = await supabase
      .from("estimate_files")
      .select("*")
      .eq("estimate_id", estimateId);

    if (files && files.length > 0) {
      for (const file of files) {
        // Extract path from public URL
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

        if (file.file_type === "pdf") {
          try {
            const extractedText = await parsePdfBuffer(buffer);
            if (extractedText.trim().length < 50) {
              const base64 = buffer.toString("base64");
              imageUrls.push(`data:application/pdf;base64,${base64}`);
            } else {
              pdfText += extractedText + "\n";
            }
          } catch {
            const base64 = buffer.toString("base64");
            imageUrls.push(`data:application/pdf;base64,${base64}`);
          }
        } else if (file.file_type === "image") {
          const base64 = buffer.toString("base64");
          imageUrls.push(`data:image/jpeg;base64,${base64}`);
        }
      }
    }

    const text = estimate.input_text;
    const region = estimate.region || "moscow";

    // Step 1: Normalize input
    log("Step 1: Normalizing input...");
    const normalizedInput = await normalizeInput({
      text: text || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      pdfText: pdfText || undefined,
    });
    log("Step 1 complete");

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
    const pricedItems = await calculatePrices(workItems, region);
    log("Step 3 complete");

    // Step 4: Generate final estimate
    log("Step 4: Generating estimate...");
    const result = await generateEstimate(pricedItems, normalizedInput);
    log("Step 4 complete", { total: result.total });

    // Save result
    await supabase
      .from("estimates")
      .update({
        status: "ready",
        result,
        total_amount: result.total,
      })
      .eq("id", estimateId);

    log("RETRY SUCCESS", { total: result.total });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
    log("RETRY ERROR", errorMsg);

    await supabase
      .from("estimates")
      .update({
        status: "error",
        error_message: errorMsg,
      })
      .eq("id", estimateId);

    throw error;
  }
}
