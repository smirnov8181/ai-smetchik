import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime for PDF/XLSX parsing
export const runtime = "nodejs";
// Increase timeout for AI processing
export const maxDuration = 300;
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  parseContractorEstimate,
  verifyPrices,
  generateVerificationResult,
} from "@/lib/ai/verifier";
import { parsePdfBuffer } from "@/lib/utils/pdf-parser";
import { parseContractorXlsx, isXlsxBuffer } from "@/lib/utils/xlsx-parser";

interface UploadedFile {
  path: string;
  name: string;
  type: string;
  size: number;
}

// GET /api/verify — list user's verifications
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const region = request.nextUrl.searchParams.get("region") || "moscow";

  const { data, error } = await supabase
    .from("verifications")
    .select(
      "id, status, input_type, total_contractor, overpay_amount, overpay_percent, is_paid, created_at"
    )
    .eq("user_id", user.id)
    .eq("region", region)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ verifications: data });
}

// POST /api/verify — create new verification
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Accept JSON body with file paths (files already uploaded to Storage by client)
    const body = await request.json();
    const text: string | null = body.text || null;
    const filePaths: UploadedFile[] = body.filePaths || [];
    const region: string = body.region || "moscow";

    let inputType: "text" | "pdf" | "photo" | "mixed" | "xlsx" = "text";
    if (filePaths.length > 0 && text) inputType = "mixed";
    else if (filePaths.length > 0) {
      const hasImages = filePaths.some((f) => f.type.startsWith("image/"));
      const hasPdfs = filePaths.some((f) => f.type === "application/pdf");
      const hasXlsx = filePaths.some((f) =>
        f.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        f.name.endsWith(".xlsx")
      );
      if (hasXlsx && filePaths.length === 1) inputType = "xlsx";
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
        region,
      })
      .select()
      .single();

    if (createError || !verification) {
      return NextResponse.json(
        { error: createError?.message || "Failed to create verification" },
        { status: 500 }
      );
    }

    // Use streaming to keep connection alive during processing
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial response
        controller.enqueue(encoder.encode(`data: {"status":"processing","id":"${verification.id}"}\n\n`));

        try {
          // Process with periodic heartbeats
          const heartbeat = setInterval(() => {
            controller.enqueue(encoder.encode(`data: {"status":"processing"}\n\n`));
          }, 5000);

          await processVerification(
            verification.id,
            user.id,
            text,
            filePaths,
            serviceClient,
            region
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
  filePaths: UploadedFile[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  region: string = "moscow"
) {
  const log = (msg: string, data?: unknown) => {
    console.log(`[Verify ${verificationId.slice(0,8)}] ${msg}`, data || "");
  };

  try {
    log("START", { filesCount: filePaths.length, hasText: !!text });

    let pdfText = "";
    const imageUrls: string[] = [];
    let xlsxParsedItems: Awaited<ReturnType<typeof parseContractorXlsx>> | null = null;

    for (const fileInfo of filePaths) {
      log(`Processing file: ${fileInfo.name}`, { type: fileInfo.type, size: fileInfo.size });

      // Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("estimate-files")
        .download(fileInfo.path);

      if (downloadError || !fileData) {
        log(`Download error for ${fileInfo.name}:`, downloadError?.message);
        continue;
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());

      const {
        data: { publicUrl },
      } = supabase.storage.from("estimate-files").getPublicUrl(fileInfo.path);

      // Handle XLSX files - direct parsing without AI
      const isXlsx = fileInfo.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                     fileInfo.name.endsWith(".xlsx") ||
                     isXlsxBuffer(buffer);

      if (isXlsx) {
        xlsxParsedItems = parseContractorXlsx(buffer);
        await supabase.from("verification_files").insert({
          verification_id: verificationId,
          file_url: publicUrl,
          file_type: "xlsx",
          original_name: fileInfo.name,
        });
      } else if (fileInfo.type === "application/pdf") {
        pdfText += await parsePdfBuffer(buffer);
        await supabase.from("verification_files").insert({
          verification_id: verificationId,
          file_url: publicUrl,
          file_type: "pdf",
          original_name: fileInfo.name,
        });
      } else if (fileInfo.type.startsWith("image/")) {
        const base64 = buffer.toString("base64");
        imageUrls.push(`data:${fileInfo.type};base64,${base64}`);
        await supabase.from("verification_files").insert({
          verification_id: verificationId,
          file_url: publicUrl,
          file_type: "image",
          original_name: fileInfo.name,
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
        region,
      });
      contractorItems = items;
      log("AI returned items", { count: contractorItems.length, items: contractorItems.slice(0, 3) });
    }

    if (!contractorItems || contractorItems.length === 0) {
      const isUS = region === "us_national" || region.startsWith("US-");
      throw new Error(
        isUS
          ? "AI could not parse the estimate. Please try a clearer photo or text."
          : "AI не смог распознать позиции сметы. Попробуйте более чёткое фото или текст."
      );
    }

    await supabase
      .from("verifications")
      .update({ parsed_items: contractorItems })
      .eq("id", verificationId);

    // Step 2: Compare with market prices
    log("Step 2: Verifying prices...");
    const verifiedItems = await verifyPrices(contractorItems, region);
    log("Step 2 complete", { verifiedCount: verifiedItems.length });

    // Step 3: Generate result
    log("Step 3: Generating result...");
    const result = await generateVerificationResult(verifiedItems, region);
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
