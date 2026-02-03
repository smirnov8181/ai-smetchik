import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEstimatePdf, generateEstimateCsv } from "@/lib/utils/export";
import { Estimate } from "@/lib/supabase/types";

// GET /api/estimates/:id/export?format=pdf|csv
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Get format from query params (default: pdf)
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "pdf";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: estimate, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<Estimate>();

  if (error || !estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  if (estimate.status !== "ready" || !estimate.result) {
    return NextResponse.json(
      { error: "Estimate is not ready for export" },
      { status: 400 }
    );
  }

  // CSV export
  if (format === "csv") {
    const csvContent = generateEstimateCsv(estimate.result, id);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="smeta-${id.slice(0, 8)}.csv"`,
      },
    });
  }

  // PDF export (default)
  const pdfBuffer = generateEstimatePdf(estimate.result, id);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="smeta-${id.slice(0, 8)}.pdf"`,
    },
  });
}
