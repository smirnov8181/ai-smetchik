import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/share/:token — get estimate by share token (public, no auth)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: estimate, error } = await supabase
    .from("estimates")
    .select("id, status, result, total_amount, created_at, input_text")
    .eq("share_token", token)
    .single();

  if (error || !estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  if (estimate.status !== "ready" || !estimate.result) {
    return NextResponse.json(
      { error: "Estimate is not ready for viewing" },
      { status: 400 }
    );
  }

  // Return limited data (no user info, no sensitive data)
  return NextResponse.json({
    estimate: {
      id: estimate.id,
      status: estimate.status,
      result: estimate.result,
      total_amount: estimate.total_amount,
      created_at: estimate.created_at,
      // Truncate input text for privacy
      input_preview: estimate.input_text?.slice(0, 100) || null,
    },
  });
}
