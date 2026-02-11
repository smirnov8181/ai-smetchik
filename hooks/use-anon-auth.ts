"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Hook that ensures a user session exists.
 * If no session — automatically signs in anonymously.
 * Returns { user, isAnonymous, loading }.
 */
export function useAnonAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const init = async () => {
      // Check existing session
      const {
        data: { user: existingUser },
      } = await supabase.auth.getUser();

      if (existingUser) {
        setUser(existingUser);
        setLoading(false);
        return;
      }

      // No session — sign in anonymously
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error("Anonymous sign-in failed:", error.message);
        setLoading(false);
        return;
      }

      setUser(data.user);
      setLoading(false);
    };

    init();

    // Listen for auth changes (e.g. after converting anon → registered)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAnonymous = user?.is_anonymous ?? false;

  return { user, isAnonymous, loading };
}
