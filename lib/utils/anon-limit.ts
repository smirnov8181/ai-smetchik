import { SupabaseClient } from "@supabase/supabase-js";

const ANON_FREE_LIMIT = 3;

/**
 * Check if an anonymous user has reached their free usage limit.
 * Counts total estimates + verifications for the user.
 * Returns { allowed, used, limit } or null if user is not anonymous.
 */
export async function checkAnonLimit(
  supabase: SupabaseClient,
  userId: string,
  isAnonymous: boolean
): Promise<{ allowed: boolean; used: number; limit: number } | null> {
  // Not anonymous — no limit
  if (!isAnonymous) return null;

  // Count estimates (any status — processing, ready, error all count)
  const { count: estimatesCount } = await supabase
    .from("estimates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  // Count verifications
  const { count: verificationsCount } = await supabase
    .from("verifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const used = (estimatesCount ?? 0) + (verificationsCount ?? 0);

  return {
    allowed: used < ANON_FREE_LIMIT,
    used,
    limit: ANON_FREE_LIMIT,
  };
}
