/**
 * Check if a user email is in the admin list.
 * Admin users bypass all paywalls (estimates + verifications are free).
 *
 * Set ADMIN_EMAILS env var as comma-separated list:
 *   ADMIN_EMAILS=admin@example.com,owner@example.com
 */
export function isAdminUser(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = process.env.ADMIN_EMAILS || "";
  const list = adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
