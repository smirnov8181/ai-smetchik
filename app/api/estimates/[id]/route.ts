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
