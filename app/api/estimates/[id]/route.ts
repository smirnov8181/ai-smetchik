import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/estimates/:id
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
    .single();

  if (error || !estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  // Also fetch files
  const { data: files } = await supabase
    .from("estimate_files")
    .select("*")
    .eq("estimate_id", id);

  return NextResponse.json({ estimate, files: files || [] });
}

// DELETE /api/estimates/:id
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
  const { data: estimate } = await supabase
    .from("estimates")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  // Delete files from storage
  const { data: files } = await supabase
    .from("estimate_files")
    .select("file_url")
    .eq("estimate_id", id);

  if (files && files.length > 0) {
    const filePaths = files.map((f) => {
      const url = new URL(f.file_url);
      return url.pathname.split("/estimate-files/")[1];
    }).filter(Boolean);

    if (filePaths.length > 0) {
      await supabase.storage.from("estimate-files").remove(filePaths);
    }
  }

  // Delete estimate (cascade will delete estimate_files)
  const { error } = await supabase
    .from("estimates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
