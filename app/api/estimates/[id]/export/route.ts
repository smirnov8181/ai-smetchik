import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime
export const runtime = "nodejs";
import { createClient } from "@/lib/supabase/server";
import { generateEstimateCsv } from "@/lib/utils/export-csv";
import { Estimate } from "@/lib/supabase/types";

// GET /api/estimates/:id/export?format=csv
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Get format from query params (default: csv for now, PDF disabled)
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";

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

  // PDF temporarily disabled due to serverless compatibility issues
  if (format === "pdf") {
    return NextResponse.json(
      { error: "PDF export temporarily unavailable. Please use CSV." },
      { status: 501 }
    );
  }

  // CSV export
  const csvContent = generateEstimateCsv(estimate.result, id);
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="smeta-${id.slice(0, 8)}.csv"`,
    },
  });
}
