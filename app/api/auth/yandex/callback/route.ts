import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Yandex OAuth callback handler.
 *
 * Flow:
 * 1. User clicks "Войти через Яндекс" → redirected to oauth.yandex.ru
 * 2. Yandex redirects back here with ?code=...
 * 3. We exchange code → access_token via Yandex API
 * 4. Fetch user info (email, name) from Yandex
 * 5. Create or find Supabase user via admin API
 * 6. Verify OTP to set session cookies, redirect to dashboard
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${origin}/ru/login?error=yandex_no_code`
    );
  }

  const clientId = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID;
  const clientSecret = process.env.YANDEX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Yandex OAuth: missing NEXT_PUBLIC_YANDEX_CLIENT_ID or YANDEX_CLIENT_SECRET");
    return NextResponse.redirect(
      `${origin}/ru/login?error=yandex_config`
    );
  }

  try {
    // Step 1: Exchange authorization code for access token
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
      return NextResponse.redirect(
        `${origin}/ru/login?error=yandex_token`
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    // Step 2: Fetch user info from Yandex
    const userRes = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${accessToken}` },
    });

    if (!userRes.ok) {
      console.error("Yandex user info failed:", await userRes.text());
      return NextResponse.redirect(
        `${origin}/ru/login?error=yandex_user`
      );
    }

    const yandexUser = await userRes.json();
    const email: string | undefined =
      yandexUser.default_email || yandexUser.emails?.[0];
    const displayName: string =
      yandexUser.display_name || yandexUser.real_name || "";

    if (!email) {
      console.error("Yandex OAuth: no email returned", yandexUser);
      return NextResponse.redirect(
        `${origin}/ru/login?error=yandex_no_email`
      );
    }

    // Step 3: Create or find user via Supabase Admin API
    const supabaseAdmin = createServiceClient();

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === email
    );

    if (!existingUser) {
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

      if (createError) {
        console.error("Supabase create user failed:", createError);
        return NextResponse.redirect(
          `${origin}/ru/login?error=yandex_create`
        );
      }
    }

    // Step 4: Generate magic link OTP
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Supabase generate link failed:", linkError);
      return NextResponse.redirect(
        `${origin}/ru/login?error=yandex_link`
      );
    }

    // Step 5: Verify OTP server-side to set session cookies
    const cookieStore = await cookies();
    const supabaseWithCookies = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error: verifyError } = await supabaseWithCookies.auth.verifyOtp({
      email,
      token: linkData.properties.hashed_token,
      type: "magiclink",
    });

    if (verifyError) {
      console.error("OTP verify failed:", verifyError);
      return NextResponse.redirect(
        `${origin}/ru/login?error=yandex_verify`
      );
    }

    // Step 6: Redirect to dashboard
    return NextResponse.redirect(`${origin}/ru/dashboard`);
  } catch (err) {
    console.error("Yandex OAuth error:", err);
    return NextResponse.redirect(
      `${origin}/ru/login?error=yandex_unknown`
    );
  }
}
