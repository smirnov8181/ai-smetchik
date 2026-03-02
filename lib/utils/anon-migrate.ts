const STORAGE_KEY = "anon_user_id";

/**
 * Save the current anonymous user ID to localStorage
 * before an auth action that will replace the session.
 */
export function saveAnonUserId(userId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, userId);
  } catch {
    // localStorage not available (SSR, private browsing edge cases)
  }
}

/**
 * Get and clear the saved anonymous user ID.
 * Returns null if none was saved.
 */
export function consumeAnonUserId(): string | null {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    if (id) {
      localStorage.removeItem(STORAGE_KEY);
    }
    return id;
  } catch {
    return null;
  }
}

/**
 * Call the migration API to move anon data to the current user.
 * Fire-and-forget — errors are logged but don't block the user.
 */
export async function migrateAnonData(): Promise<number> {
  const anonUserId = consumeAnonUserId();
  if (!anonUserId) return 0;

  try {
    const res = await fetch("/api/auth/migrate-anon-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonUserId }),
    });

    if (!res.ok) {
      console.error("Migration failed:", await res.text());
      return 0;
    }

    const data = await res.json();
    if (data.migrated > 0) {
      console.log(`Migrated ${data.migrated} items from anonymous session`);
    }
    return data.migrated || 0;
  } catch (err) {
    console.error("Migration error:", err);
    return 0;
  }
}
