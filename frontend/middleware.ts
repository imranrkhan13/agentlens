import { NextRequest, NextResponse } from "next/server";

const legacyRoutes = ["/dashboard", "/projects", "/providers", "/events", "/settings", "/diagnostics", "/api-keys"];

/**
 * Keep the visual app shell private before it renders. API routes still verify
 * the signed Better Auth session on the server, so a cookie alone never grants
 * data access.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSessionCookie = request.cookies.has("better-auth.session_token") || request.cookies.has("__Secure-better-auth.session_token");
  if (!hasSessionCookie) return NextResponse.redirect(new URL("/login", request.url));

  const isLegacyRoute = legacyRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isLegacyRoute) {
    const destination = `/app${pathname === "/dashboard" ? "" : pathname}${search}`;
    return NextResponse.redirect(new URL(destination, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/dashboard/:path*", "/projects/:path*", "/providers/:path*", "/events/:path*", "/settings/:path*", "/diagnostics/:path*", "/api-keys/:path*"],
};
