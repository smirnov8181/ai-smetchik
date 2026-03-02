import { NextResponse, type NextRequest } from "next/server";

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Preserve OAuth error redirect on root.
  if (pathname === "/") {
    const error = request.nextUrl.searchParams.get("error");
    if (error) {
      const url = request.nextUrl.clone();
      url.pathname = "/ru/login";
      url.search = request.nextUrl.search;
      return NextResponse.redirect(url);
    }
  }

  // Keep middleware fast: rely on cookie presence only (no network calls in Edge).
  if (pathname.startsWith("/us/dashboard") && !hasSupabaseAuthCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/us/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/ru/dashboard/:path*",
    "/ru/login",
    "/ru/register",
    "/us/dashboard/:path*",
    "/us/login",
    "/us/register",
  ],
};
