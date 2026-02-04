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
  console.log(`[DELETE verification] Starting delete for ${id}`);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log(`[DELETE verification] Unauthorized`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership before delete
  const { data: verification, error: findError } = await supabase
    .from("verifications")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (findError) {
    console.log(`[DELETE verification] Find error:`, findError.message);
  }

  if (!verification) {
    console.log(`[DELETE verification] Not found or not owned`);
    return NextResponse.json({ error: "Verification not found" }, { status: 404 });
  }

  // Try to delete files from storage (ignore errors - files might not exist)
  try {
    const { data: files } = await supabase
      .from("verification_files")
      .select("file_url")
      .eq("verification_id", id);

    console.log(`[DELETE verification] Found ${files?.length || 0} files`);

    if (files && files.length > 0) {
      const filePaths = files.map((f) => {
        try {
          const url = new URL(f.file_url);
          return url.pathname.split("/estimate-files/")[1];
        } catch {
          return null;
        }
      }).filter(Boolean) as string[];

      if (filePaths.length > 0) {
        console.log(`[DELETE verification] Removing files:`, filePaths);
        await supabase.storage.from("estimate-files").remove(filePaths);
      }
    }
  } catch (fileError) {
    console.log(`[DELETE verification] File cleanup error (ignored):`, fileError);
  }

  // Delete verification_files first (in case no CASCADE)
  console.log(`[DELETE verification] Deleting verification_files records`);
  const { error: filesDeleteError } = await supabase
    .from("verification_files")
    .delete()
    .eq("verification_id", id);

  if (filesDeleteError) {
    console.log(`[DELETE verification] Files delete error:`, filesDeleteError.message);
    // Continue anyway - table might not exist or have no records
  }

  // Delete verification
  console.log(`[DELETE verification] Deleting verification record`);
  const { error } = await supabase
    .from("verifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.log(`[DELETE verification] Delete error:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[DELETE verification] Success`);
  return NextResponse.json({ success: true });
}
