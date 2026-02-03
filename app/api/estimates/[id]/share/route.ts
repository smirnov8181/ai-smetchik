import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

// POST /api/estimates/:id/share — generate share token
export async function POST(
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

  // Verify ownership
  const { data: estimate } = await supabase
    .from("estimates")
    .select("id, share_token")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  // If already has token, return it
  if (estimate.share_token) {
    return NextResponse.json({ share_token: estimate.share_token });
  }

  // Generate new token
  const shareToken = randomBytes(16).toString("hex");

  const { error } = await supabase
    .from("estimates")
    .update({ share_token: shareToken })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ share_token: shareToken });
}

// DELETE /api/estimates/:id/share — remove share token
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

  const { error } = await supabase
    .from("estimates")
    .update({ share_token: null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
