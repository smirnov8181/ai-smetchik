"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    YaAuthSuggest: {
      init: (
        oauthParams: {
          client_id: string;
          response_type: string;
          redirect_uri: string;
        },
        tokenPageOrigin: string,
        options?: {
          view: string;
          parentId?: string;
          buttonSize?: string;
          buttonView?: string;
          buttonTheme?: string;
          buttonBorderRadius?: number;
          buttonIcon?: string;
        }
      ) => Promise<{ handler: () => Promise<{ access_token: string }> }>;
    };
  }
}

interface YandexAuthButtonProps {
  label?: string;
}

export function YandexAuthButton({
  label = "Войти через Яндекс",
}: YandexAuthButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const handlerRef = useRef<(() => Promise<{ access_token: string }>) | null>(
    null
  );

  const clientId = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    // Load Yandex SDK script
    const existingScript = document.querySelector(
      'script[src*="sdk-suggest-with-polyfills"]'
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src =
        "https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js";
      script.async = true;
      script.onload = () => initSdk();
      document.head.appendChild(script);
    } else {
      // Script already loaded
      if (window.YaAuthSuggest) {
        initSdk();
      } else {
        existingScript.addEventListener("load", () => initSdk());
      }
    }

    function initSdk() {
      if (!window.YaAuthSuggest || !clientId) return;

      const origin = window.location.origin;

      window.YaAuthSuggest.init(
        {
          client_id: clientId,
          response_type: "token",
          redirect_uri: `${origin}/yandex-token.html`,
        },
        origin,
        {
          view: "button",
          parentId: "yandex-auth-container",
          buttonSize: "m",
          buttonView: "main",
          buttonTheme: "light",
          buttonBorderRadius: 12,
          buttonIcon: "ya",
        }
      )
        .then(({ handler }) => {
          handlerRef.current = handler;
          setSdkReady(true);
        })
        .catch((error: unknown) => {
          console.error("YaAuthSuggest init error:", error);
          // Fallback: allow manual click
          setSdkReady(true);
        });
    }
  }, [clientId]);

  const handleClick = async () => {
    if (!clientId) return;

    setLoading(true);

    try {
      let tokenData: { access_token: string } | null = null;

      if (handlerRef.current) {
        // SDK flow: opens popup/iframe, returns token
        tokenData = await handlerRef.current();
      }

      if (!tokenData?.access_token) {
        // Fallback: redirect to Yandex OAuth manually
        const origin = window.location.origin;
        const redirectUri = `${origin}/api/auth/yandex/callback`;
        window.location.href = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
        return;
      }

      // Send token to our API to create/find Supabase user
      const res = await fetch("/api/auth/yandex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: tokenData.access_token }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Yandex auth API error:", data);
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push("/ru/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Yandex auth error:", error);
      setLoading(false);
    }
  };

  if (!clientId) return null;

  return (
    <>
      {/* Hidden container for Yandex SDK button (we use our own styled button) */}
      <div id="yandex-auth-container" className="hidden" />
      <button
        onClick={handleClick}
        disabled={loading}
        className="cursor-pointer w-full bg-white border-2 border-[#161616]/10 text-[#161616] font-semibold py-4 rounded-xl hover:bg-[#FAF4EC] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#FC3F1D"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.77 14.63h-2.2V7.38h1.14c2.07 0 3.15 1.05 3.15 2.73 0 1.21-.6 2.07-1.72 2.56l2.24 3.96h-2.37l-1.9-3.57h-.53v3.57h.19zm-1.97-5.26h.73c1.09 0 1.68-.55 1.68-1.42 0-.88-.59-1.38-1.68-1.38h-.73v2.8z"
            />
          </svg>
        )}
        {label}
      </button>
    </>
  );
}
