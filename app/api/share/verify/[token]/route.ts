import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/share/verify/:token — get verification by share token (public, no auth)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: verification, error } = await supabase
    .from("verifications")
    .select(
      "id, status, result, total_contractor, total_market, overpay_amount, overpay_percent, created_at"
    )
    .eq("share_token", token)
    .single();

  if (error || !verification) {
    return NextResponse.json(
      { error: "Verification not found" },
      { status: 404 }
    );
  }

  if (verification.status !== "ready" || !verification.result) {
    return NextResponse.json(
      { error: "Verification is not ready for viewing" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    verification: {
      id: verification.id,
      status: verification.status,
      result: verification.result,
      total_contractor: verification.total_contractor,
      total_market: verification.total_market,
      overpay_amount: verification.overpay_amount,
      overpay_percent: verification.overpay_percent,
      created_at: verification.created_at,
    },
  });
}
