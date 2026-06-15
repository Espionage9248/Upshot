import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuth } from "./auth";

/**
 * Server-only session re-check (defence in depth). Middleware route-gating is
 * not sufficient on its own — a direct hit that bypasses middleware must still
 * be bounced — so every authenticated layout/page re-validates here.
 *
 * Returns the better-auth session ({ user, session }) when present; otherwise
 * redirects to /login (redirect() throws, so callers can rely on a non-null
 * return).
 *
 * The non-redirecting `getSession()` below performs the same server-side read but
 * returns `null` when absent — used by the `action()` result-contract wrapper
 * (lib/action.ts), where a redirect is the wrong response for a programmatically
 * invoked Server Action.
 */

/**
 * Read the better-auth session server-side. Returns the session ({ user, session })
 * when a user is present, otherwise `null`. Does NOT redirect.
 */
export async function getSession() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user ? session : null;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
