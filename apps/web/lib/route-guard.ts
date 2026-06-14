/**
 * Pure route-gating decision (no next/server, DB, or env). Edge-safe and
 * unit-testable in isolation.
 *
 * Security posture: DEFAULT-DENY. Anything not explicitly allow-listed below
 * requires a session and is redirected to /login.
 *
 * Note: `firstRun` is only *optimistic* in middleware (the edge cannot query
 * the DB). The authoritative "a user already exists → /register is closed"
 * gate lives in the /register page server component, which redirects to /login
 * when a user exists. See middleware.ts.
 */

export type RedirectDecision = { type: "allow" } | { type: "redirect"; to: string };

export function decideRedirect(
  pathname: string,
  hasSession: boolean,
  firstRun: boolean,
): RedirectDecision {
  // Auth endpoints must always be reachable (sign-in, callbacks, etc.),
  // regardless of session state.
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
    return { type: "allow" };
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (hasSession) {
    // Authenticated users shouldn't see the auth pages.
    if (isAuthPage) return { type: "redirect", to: "/today" };
    return { type: "allow" };
  }

  // Unauthenticated:
  if (pathname === "/login") return { type: "allow" };
  if (pathname === "/register") {
    return firstRun ? { type: "allow" } : { type: "redirect", to: "/login" };
  }

  return { type: "redirect", to: "/login" };
}
