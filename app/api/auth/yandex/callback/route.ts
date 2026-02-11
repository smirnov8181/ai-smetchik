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
 * 6. Set session cookie and redirect to dashboard
 *
 * Supabase does NOT have a built-in Yandex provider,
 * so we handle the full OAuth flow manually.
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

    // Step 3: Create or sign in user via Supabase Admin API
    const supabase = createServiceClient();

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === email
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user with a random password (they'll use OAuth to log in)
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password: randomPassword,
          email_confirm: true,
          user_metadata: {
            full_name: displayName,
            provider: "yandex",
          },
        });

      if (createError || !newUser?.user) {
        console.error("Supabase create user failed:", createError);
        return NextResponse.redirect(
          `${origin}/ru/login?error=yandex_create`
        );
      }

      userId = newUser.user.id;
    }

    // Step 4: Generate a magic link to establish a session
    // We use admin.generateLink to create a one-time login link
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${origin}/ru/dashboard`,
        },
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Supabase generate link failed:", linkError);
      return NextResponse.redirect(
        `${origin}/ru/login?error=yandex_link`
      );
    }

    // The hashed_token can be used to verify the OTP and create a session
    // We redirect to the Supabase verify endpoint which sets the session cookies
    const verifyUrl = new URL(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`
    );
    verifyUrl.searchParams.set("token", linkData.properties.hashed_token);
    verifyUrl.searchParams.set("type", "magiclink");
    verifyUrl.searchParams.set(
      "redirect_to",
      `${origin}/auth/callback?next=/ru/dashboard`
    );

    return NextResponse.redirect(verifyUrl.toString());
  } catch (err) {
    console.error("Yandex OAuth error:", err);
    return NextResponse.redirect(
      `${origin}/ru/login?error=yandex_unknown`
    );
  }
}
