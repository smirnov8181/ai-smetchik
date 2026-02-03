import { NextRequest, NextResponse } from "next/server";
import { updatePricesFromSources } from "@/lib/scraper/update-prices";

// POST /api/admin/update-prices
// Protected by secret key — called by cron or manually
export async function POST(request: NextRequest) {
  // Verify authorization — either admin key or Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-vercel-cron-secret");

  const isAuthorized =
    authHeader === `Bearer ${process.env.ADMIN_SECRET_KEY}` ||
    cronSecret === process.env.CRON_SECRET;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await updatePricesFromSources();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Price update failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Update failed",
      },
      { status: 500 }
    );
  }
}

// GET — for Vercel Cron (cron jobs use GET by default)
export async function GET(request: NextRequest) {
  return POST(request);
}
