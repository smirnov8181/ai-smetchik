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

    // Handle US dashboard auth
    if (!user && request.nextUrl.pathname.startsWith("/us/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/us/login";
      return NextResponse.redirect(url);
    }

    // Handle RU dashboard auth
    if (!user && request.nextUrl.pathname.startsWith("/ru/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/ru/login";
      return NextResponse.redirect(url);
    }

    // Redirect logged-in users from RU login/register to dashboard
    if (
      user &&
      (request.nextUrl.pathname === "/ru/login" ||
        request.nextUrl.pathname === "/ru/register")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/ru/dashboard";
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
    // If Supabase auth fails on dashboard routes, redirect to login
    if (request.nextUrl.pathname.startsWith("/us/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/us/login";
      return NextResponse.redirect(url);
    }
    if (request.nextUrl.pathname.startsWith("/ru/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/ru/login";
      return NextResponse.redirect(url);
    }
    // For login/register pages, allow through even on error
    return NextResponse.next();
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/ru/dashboard/:path*",
    "/ru/login",
    "/ru/register",
    "/us/dashboard/:path*",
    "/us/login",
    "/us/register",
  ],
};
