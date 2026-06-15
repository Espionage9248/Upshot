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
  isServerAction = false,
): RedirectDecision {
  // Auth endpoints must always be reachable (sign-in, callbacks, etc.),
  // regardless of session state.
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
    return { type: "allow" };
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (hasSession) {
    // Authenticated users shouldn't *navigate* to the auth pages. But a Server
    // Action invoked FROM an auth page POSTs back to that same route — and the
    // first-run flow does exactly this: sign-up establishes a session, then
    // issueBackupCodes (a Server Action on /register) runs while authenticated.
    // Redirecting that POST would swallow the action and surface a client
    // "unexpected response", so let Server Actions through (they enforce their
    // own authorization via the action() wrapper).
    if (isAuthPage && !isServerAction) return { type: "redirect", to: "/today" };
    return { type: "allow" };
  }

  // Unauthenticated:
  if (pathname === "/login") return { type: "allow" };
  if (pathname === "/register") {
    return firstRun ? { type: "allow" } : { type: "redirect", to: "/login" };
  }

  return { type: "redirect", to: "/login" };
}
