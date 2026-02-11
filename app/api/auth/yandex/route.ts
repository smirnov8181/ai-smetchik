import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/auth/yandex
 *
 * Receives a Yandex OAuth access_token from the client (SDK flow).
 * 1. Fetches user info from Yandex API
 * 2. Creates or finds user in Supabase via admin API
 * 3. Signs in the user by setting a session cookie via magic link OTP
 */
export async function POST(request: Request) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: "Missing access_token" },
        { status: 400 }
      );
    }

    // Step 1: Get user info from Yandex
    const userRes = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${access_token}` },
    });

    if (!userRes.ok) {
      console.error("Yandex user info failed:", await userRes.text());
      return NextResponse.json(
        { error: "Failed to get Yandex user info" },
        { status: 400 }
      );
    }

    const yandexUser = await userRes.json();
    const email: string | undefined =
      yandexUser.default_email || yandexUser.emails?.[0];
    const displayName: string =
      yandexUser.display_name || yandexUser.real_name || "";

    if (!email) {
      return NextResponse.json(
        { error: "No email from Yandex" },
        { status: 400 }
      );
    }

    // Step 2: Create or find user in Supabase
    const supabaseAdmin = createServiceClient();

    const { data: existingUsers } =
      await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === email
    );

    if (!existingUser) {
      // Create new user
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
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    }

    // Step 3: Generate magic link and sign in
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Generate link failed:", linkError);
      return NextResponse.json(
        { error: "Failed to generate login link" },
        { status: 500 }
      );
    }

    // Step 4: Verify the OTP to create a session and set cookies
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
      return NextResponse.json(
        { error: "Failed to verify session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Yandex auth error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
