"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Hook that ensures a user session exists.
 * If no session — automatically signs in anonymously with retry logic.
 * Returns { user, isAnonymous, loading, error }.
 */
export function useAnonAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const init = async () => {
      // Check existing session first via getSession (faster, uses cache)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        if (!cancelled) {
          setUser(session.user);
          setLoading(false);
        }
        return;
      }

      // Double-check with getUser (validates token with server)
      const {
        data: { user: existingUser },
      } = await supabase.auth.getUser();

      if (existingUser) {
        if (!cancelled) {
          setUser(existingUser);
          setLoading(false);
        }
        return;
      }

      // No session — sign in anonymously with retries
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (cancelled) return;

        try {
          const { data, error: signInError } = await supabase.auth.signInAnonymously();

          if (!signInError && data.user) {
            if (!cancelled) {
              setUser(data.user);
              setError(null);
              setLoading(false);
            }
            return;
          }

          console.error(
            `Anonymous sign-in attempt ${attempt}/${MAX_RETRIES} failed:`,
            signInError?.message,
            signInError?.status,
            JSON.stringify(signInError)
          );
        } catch (e) {
          console.error(
            `Anonymous sign-in attempt ${attempt}/${MAX_RETRIES} threw:`,
            e
          );
        }

        // Wait before retry (except on last attempt)
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        }
      }

      // All retries exhausted
      if (!cancelled) {
        setError("Не удалось создать сессию. Проверьте подключение к интернету.");
        setLoading(false);
      }
    };

    init();

    // Listen for auth changes (e.g. after converting anon → registered)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const isAnonymous = user?.is_anonymous ?? false;

  return { user, isAnonymous, loading, error };
}
