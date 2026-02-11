"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Client-side handler for Yandex OAuth session.
 *
 * After Supabase /auth/v1/verify, the browser is redirected here with
 * #access_token=...&refresh_token=... in the URL hash.
 *
 * We pick up these tokens and call supabase.auth.setSession()
 * to establish the session, then redirect to dashboard.
 */
export default function YandexSessionPage() {
  const router = useRouter();

  useEffect(() => {
    const handleSession = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const supabase = createClient();

        // Sign out any existing session first (e.g. anonymous)
        await supabase.auth.signOut();

        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        router.replace("/ru/dashboard");
      } else {
        // No tokens in hash — redirect to login
        router.replace("/ru/login?error=yandex_session");
      }
    };

    handleSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAF4EC] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#161616]/40 mx-auto mb-4" />
        <p className="text-[#161616]/50">Входим через Яндекс...</p>
      </div>
    </div>
  );
}
