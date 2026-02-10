import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/utils/admin";

// GET /api/verify/:id
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

  const { data: verification, error } = await supabase
    .from("verifications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !verification) {
    return NextResponse.json(
      { error: "Verification not found" },
      { status: 404 }
    );
  }

  const admin = isAdminUser(user.email ?? undefined);

  // Server-side paywall: show all items but strip market prices and recommendations
  if (!verification.is_paid && !admin && verification.result) {
    const result = verification.result as { items?: Array<Record<string, unknown>>; recommendations?: string[]; summary?: string; total_market_avg?: number; total_overpay?: number; [key: string]: unknown };
    if (result.items && Array.isArray(result.items)) {
      // Keep all items but remove market_avg and overpay_amount (keep status, overpay_percent, work, contractor_price, unit)
      result.items = result.items.map((item: Record<string, unknown>) => ({
        work: item.work,
        unit: item.unit,
        quantity: item.quantity,
        contractor_price: item.contractor_price,
        status: item.status,
        overpay_percent: item.overpay_percent,
        // Strip these from free version:
        market_avg: 0,
        market_min: 0,
        market_max: 0,
        overpay_amount: 0,
      }));
      result.recommendations = [];
      result.summary = "";
      result.total_market_avg = 0;
      result.total_overpay = 0;
    }
    verification.result = result;
  }

  return NextResponse.json({ verification, isAdmin: admin });
}

// DELETE /api/verify/:id
export async function DELETE(
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

  // Simple delete - just delete the record (rely on CASCADE for related records)
  const { error } = await supabase
    .from("verifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
