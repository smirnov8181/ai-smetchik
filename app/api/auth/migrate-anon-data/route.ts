import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/migrate-anon-data
 *
 * Migrates estimates and verifications from an anonymous user
 * to the currently logged-in user. Called after login/OAuth
 * when the user had an anonymous session with data.
 *
 * Body: { anonUserId: string }
 *
 * Security:
 * - anonUserId must belong to an anonymous user (is_anonymous = true)
 * - Current user must be authenticated and non-anonymous
 * - Uses service role to bypass RLS
 */
export async function POST(request: Request) {
  try {
    const { anonUserId } = await request.json();

    if (!anonUserId || typeof anonUserId !== "string") {
      return NextResponse.json(
        { error: "Missing anonUserId" },
        { status: 400 }
      );
    }

    // Get current authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.is_anonymous) {
      return NextResponse.json(
        { error: "Must be logged in as a registered user" },
        { status: 401 }
      );
    }

    // Don't migrate to yourself
    if (user.id === anonUserId) {
      return NextResponse.json({ migrated: 0 });
    }

    const admin = createServiceClient();

    // Verify the old user is actually anonymous
    const { data: anonUser, error: anonError } =
      await admin.auth.admin.getUserById(anonUserId);

    if (anonError || !anonUser?.user) {
      // Anon user doesn't exist anymore — nothing to migrate
      return NextResponse.json({ migrated: 0 });
    }

    if (
      !anonUser.user.is_anonymous &&
      !anonUser.user.email?.includes("@anonymous")
    ) {
      // Not an anonymous user — refuse to migrate (security)
      return NextResponse.json(
        { error: "Source user is not anonymous" },
        { status: 403 }
      );
    }

    // Migrate estimates
    const { data: estimates } = await admin
      .from("estimates")
      .update({ user_id: user.id })
      .eq("user_id", anonUserId)
      .select("id");

    // Migrate verifications
    const { data: verifications } = await admin
      .from("verifications")
      .update({ user_id: user.id })
      .eq("user_id", anonUserId)
      .select("id");

    const migratedCount =
      (estimates?.length || 0) + (verifications?.length || 0);

    // Clean up: delete orphaned subscription and anonymous user
    await admin.from("subscriptions").delete().eq("user_id", anonUserId);

    // Delete the anonymous user (best-effort)
    await admin.auth.admin.deleteUser(anonUserId).catch(() => {
      // Ignore errors — user may have already been cleaned up
    });

    return NextResponse.json({ migrated: migratedCount });
  } catch (err) {
    console.error("Migrate anon data error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
