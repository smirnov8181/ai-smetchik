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

  // Verify ownership before delete
  const { data: verification } = await supabase
    .from("verifications")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!verification) {
    return NextResponse.json({ error: "Verification not found" }, { status: 404 });
  }

  // Delete files from storage
  const { data: files } = await supabase
    .from("verification_files")
    .select("file_url")
    .eq("verification_id", id);

  if (files && files.length > 0) {
    const filePaths = files.map((f) => {
      const url = new URL(f.file_url);
      return url.pathname.split("/estimate-files/")[1];
    }).filter(Boolean);

    if (filePaths.length > 0) {
      await supabase.storage.from("estimate-files").remove(filePaths);
    }
  }

  // Delete verification (cascade will delete verification_files)
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
