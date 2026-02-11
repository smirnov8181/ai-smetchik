import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Yandex OAuth callback handler.
 *
 * Flow:
 * 1. User clicks "Войти через Яндекс" → redirected to oauth.yandex.ru
 * 2. Yandex redirects back here with ?code=...
 * 3. We exchange code → access_token via Yandex API
 * 4. Fetch user info (email, name) from Yandex
 * 5. Create or find Supabase user via admin API
 * 6. Generate magic link → redirect to Supabase verify → client handler sets session
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/ru/login?error=yandex_no_code`);
  }

  const clientId = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID;
  const clientSecret = process.env.YANDEX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Yandex OAuth: missing env vars");
    return NextResponse.redirect(`${origin}/ru/login?error=yandex_config`);
  }

  try {
    // Step 1: Exchange authorization code for Yandex access token
    const tokenRes = await fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Yandex token exchange failed:", err);
      return NextResponse.redirect(`${origin}/ru/login?error=yandex_token`);
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    // Step 2: Fetch user info from Yandex
    const userRes = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${accessToken}` },
    });

    if (!userRes.ok) {
      console.error("Yandex user info failed:", await userRes.text());
      return NextResponse.redirect(`${origin}/ru/login?error=yandex_user`);
    }

    const yandexUser = await userRes.json();
    const email: string | undefined =
      yandexUser.default_email || yandexUser.emails?.[0];
    const displayName: string =
      yandexUser.display_name || yandexUser.real_name || "";

    if (!email) {
      console.error("Yandex OAuth: no email returned", yandexUser);
      return NextResponse.redirect(`${origin}/ru/login?error=yandex_no_email`);
    }

    // Step 3: Create user if not exists (ignore "already registered")
    const supabaseAdmin = createServiceClient();

    const randomPassword = crypto.randomUUID() + crypto.randomUUID();
    const { error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: displayName,
          provider: "yandex",
        },
      });

    if (
      createError &&
      !createError.message?.includes("already been registered")
    ) {
      console.error("Supabase create user failed:", createError);
      return NextResponse.redirect(`${origin}/ru/login?error=yandex_create`);
    }

    // Step 4: Generate magic link
    // The admin API returns action_link at the top level (not in properties)
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${origin}/auth/yandex-session`,
        },
      });

    if (linkError) {
      console.error("Supabase generate link failed:", linkError);
      return NextResponse.redirect(`${origin}/ru/login?error=yandex_link`);
    }

    // action_link is on the raw response but TS types put it under properties
    const actionLink: string | undefined =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (linkData as any)?.action_link ||
      linkData?.properties?.action_link;

    if (!actionLink) {
      console.error("No action_link in generateLink response");
      return NextResponse.redirect(`${origin}/ru/login?error=yandex_link`);
    }

    // Step 5: Redirect to Supabase verify endpoint
    // Supabase will verify the token and redirect to /auth/yandex-session#access_token=...
    // The client page will pick up the tokens from the hash and set the session
    return NextResponse.redirect(actionLink);
  } catch (err) {
    console.error("Yandex OAuth error:", err);
    return NextResponse.redirect(`${origin}/ru/login?error=yandex_unknown`);
  }
}
