import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEstimatePdf } from "@/lib/utils/export";
import { Estimate } from "@/lib/supabase/types";

// GET /api/estimates/:id/export
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

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

  const pdfBuffer = generateEstimatePdf(estimate.result, id);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="smeta-${id}.pdf"`,
    },
  });
}
