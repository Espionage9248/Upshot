import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { decideRedirect } from "@/lib/route-guard";

/**
 * Session gate for ALL routes (security boundary, default-deny).
 *
 * Runs on the EDGE runtime, so it must NOT import the database, native modules
 * (better-sqlite3), or the auth instance (all node-only). It only performs an
 * edge-safe cookie presence check via better-auth's `getSessionCookie`, which
 * returns the session token cookie value (or null) WITHOUT hitting the DB.
 * Our auth config sets no custom cookie name/prefix, so the better-auth
 * defaults match and no config arg is needed. The cookie's mere presence is
 * trusted here; full session validation is deferred to the server (pages /
 * route handlers / server actions, which have DB access).
 *
 * firstRun is passed as `true` optimistically: the edge cannot query the DB to
 * know whether the single user already exists. The authoritative gate lives in
 * the /register page server component, which redirects an already-registered
 * visitor to /login. So middleware lets an unauthenticated /register through
 * and the page bounces it server-side when registration is already complete.
 */
export function middleware(request: NextRequest): NextResponse {
  const hasSession = !!getSessionCookie(request);
  const decision = decideRedirect(request.nextUrl.pathname, hasSession, true);

  if (decision.type === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything EXCEPT static assets. /api/auth/* is intentionally NOT
  // excluded here — it's allow-listed in decideRedirect so the gating logic
  // stays in one place.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
