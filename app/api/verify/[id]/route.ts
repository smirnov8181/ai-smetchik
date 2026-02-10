import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Strip full result details if not paid (server-side paywall)
  if (!verification.is_paid && verification.result) {
    const freePreviewCount = 3;
    const result = verification.result as { items?: Array<Record<string, unknown>>; recommendations?: string[]; [key: string]: unknown };
    if (result.items && Array.isArray(result.items)) {
      const overpayItems = result.items
        .filter((i: Record<string, unknown>) => i.status !== "ok")
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.overpay_amount as number) - (a.overpay_amount as number));
      const okItems = result.items.filter((i: Record<string, unknown>) => i.status === "ok");

      // Only include free preview items + redacted ok items count
      const visibleItems = overpayItems.slice(0, freePreviewCount);
      const hiddenCount = overpayItems.length - freePreviewCount + okItems.length;

      result.items = visibleItems;
      result.recommendations = [];
      (result as Record<string, unknown>)._hiddenCount = hiddenCount > 0 ? hiddenCount : 0;
    }
    verification.result = result;
  }

  return NextResponse.json({ verification });
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
