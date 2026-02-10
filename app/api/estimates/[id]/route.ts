import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/utils/admin";

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

  // Stale detection: if processing for more than 5 minutes, mark as error
  if (estimate.status === "processing") {
    const checkTime = new Date(estimate.updated_at || estimate.created_at).getTime();
    const now = Date.now();
    const STALE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    if (now - checkTime > STALE_TIMEOUT_MS) {
      await supabase
        .from("estimates")
        .update({
          status: "error",
          error_message: "Обработка заняла слишком долго. Попробуйте создать смету заново.",
        })
        .eq("id", id);
      estimate.status = "error";
      estimate.error_message = "Обработка заняла слишком долго. Попробуйте создать смету заново.";
    }
  }

  // Also fetch files
  const { data: files } = await supabase
    .from("estimate_files")
    .select("*")
    .eq("estimate_id", id);

  const admin = isAdminUser(user.email ?? undefined);

  // Server-side paywall: if not paid and not admin, show only first 30% of sections
  if (!estimate.is_paid && !admin && estimate.result?.sections) {
    const sections = estimate.result.sections as Array<{
      category: string;
      items: Array<Record<string, unknown>>;
      subtotal: number;
    }>;
    const freeCount = Math.max(1, Math.ceil(sections.length * 0.3));
    const hiddenSections = sections.slice(freeCount);
    const hiddenItemCount = hiddenSections.reduce(
      (sum, s) => sum + s.items.length,
      0
    );

    estimate.result = {
      ...estimate.result,
      sections: sections.slice(0, freeCount),
      _hiddenSections: sections.length - freeCount,
      _hiddenItems: hiddenItemCount,
    };
  }

  return NextResponse.json({ estimate, files: files || [], isAdmin: admin });
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
