"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Yandex OAuth button using the official Yandex ID SDK.
 *
 * Flow:
 * 1. Load sdk-suggest-with-polyfills-latest.js
 * 2. YaAuthSuggest.init() renders Yandex button into a container
 * 3. User clicks the Yandex button → popup/iframe auth
 * 4. Token comes back via postMessage from /yandex-token.html
 * 5. We POST the access_token to /api/auth/yandex → Supabase session
 * 6. Redirect to dashboard
 */

interface YandexAuthButtonProps {
  /** Height of the container for the Yandex button */
  height?: number;
}

export function YandexAuthButton({ height = 44 }: YandexAuthButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const initedRef = useRef(false);
  const containerId = useRef(
    `ya-auth-${Math.random().toString(36).slice(2, 8)}`
  ).current;

  const clientId = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    // Prevent double init (React StrictMode calls useEffect twice)
    if (initedRef.current) return;
    initedRef.current = true;

    const origin = window.location.origin;

    // Load Yandex SDK
    const scriptId = "ya-sdk-suggest";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    function initSdk() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const YaAuthSuggest = (window as any).YaAuthSuggest;
      if (!YaAuthSuggest) return;

      YaAuthSuggest.init(
        {
          client_id: clientId,
          response_type: "token",
          redirect_uri: `${origin}/yandex-token.html`,
        },
        origin,
        {
          view: "button",
          parentId: containerId,
          buttonView: "main",
          buttonTheme: "light",
          buttonSize: "m",
          buttonBorderRadius: 12,
          buttonIcon: "ya",
        }
      )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ handler }: { handler: () => Promise<any> }) => handler())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(async (data: any) => {
          // data contains { access_token, token_type, ... }
          const accessToken = data?.access_token;
          if (!accessToken) {
            console.error("Yandex SDK: no access_token", data);
            setError(true);
            return;
          }

          setLoading(true);

          // Send token to our API
          const res = await fetch("/api/auth/yandex", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: accessToken }),
          });

          if (!res.ok) {
            console.error("Yandex auth API error:", await res.text());
            setError(true);
            setLoading(false);
            return;
          }

          router.push("/ru/dashboard");
          router.refresh();
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((err: any) => {
          // "in_progress" is not a real error — SDK was already initialized
          if (err?.code === "in_progress") return;
          console.error("YaAuthSuggest error:", err);
          setError(true);
        });
    }

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js";
      script.async = true;
      script.onload = initSdk;
      document.head.appendChild(script);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if ((window as any).YaAuthSuggest) {
      initSdk();
    } else {
      script.addEventListener("load", initSdk);
    }
  }, [clientId, containerId, router]);

  if (!clientId) return null;

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-[#161616]/40" />
        <span className="ml-2 text-sm text-[#161616]/50">
          Входим через Яндекс...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-3">
        <p className="text-sm text-[#FA5424]">
          Не удалось войти через Яндекс
        </p>
      </div>
    );
  }

  return (
    <div
      id={containerId}
      style={{ height, width: "100%", overflow: "hidden", borderRadius: 12 }}
    />
  );
}
