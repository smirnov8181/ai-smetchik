import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Skip auth check if Supabase is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Handle RU dashboard auth
    if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Handle US dashboard auth
    if (!user && request.nextUrl.pathname.startsWith("/us/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/us/login";
      return NextResponse.redirect(url);
    }

    // Redirect logged-in users from RU login/register to dashboard
    if (
      user &&
      (request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/register")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Redirect logged-in users from US login/register to US dashboard
    if (
      user &&
      (request.nextUrl.pathname === "/us/login" ||
        request.nextUrl.pathname === "/us/register")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/us/dashboard";
      return NextResponse.redirect(url);
    }
  } catch {
    // If Supabase auth fails, allow request through
    return NextResponse.next();
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/us/dashboard/:path*",
    "/us/login",
    "/us/register",
  ],
};
