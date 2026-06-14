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
 * Task 24 will extend THIS file with an `action()` result-contract wrapper;
 * keep this signature stable so that extension does not break callers.
 */
export async function requireSession() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  return session;
}
