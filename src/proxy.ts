import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-runtime gate for protected routes.
 *
 * We do NOT verify the cookie's HMAC signature here — the runtime cost on
 * every request would be high, and a forged cookie still fails inside
 * `getSession()` on the server. The proxy's only job is the cheap "is the
 * cookie even present" pre-check, which keeps logged-out users from
 * hitting a Server Action behind a 401 they never see.
 */

const protectedPaths = ["/dashboard", "/receptions", "/clients", "/users"];

export async function proxy(request: NextRequest) {
  const session = request.cookies.get("cr_session");
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtected && !session) {
    const url = new URL("/login", request.url);
    // Only echo a same-origin pathname back as ?callbackUrl. This blocks
    // open-redirect attempts like /login?callbackUrl=https://evil.example.
    url.searchParams.set("callbackUrl", sanitizeCallback(pathname));
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

function sanitizeCallback(pathname: string): string {
  // Reject anything that doesn't start with `/` or starts with `//` (protocol-relative URL).
  if (!pathname.startsWith("/")) return "/dashboard";
  if (pathname.startsWith("//")) return "/dashboard";
  return pathname;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/receptions/:path*",
    "/clients/:path*",
    "/users/:path*",
    "/login",
  ],
};
