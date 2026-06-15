import { getSession } from "./auth-guard";

/** The authenticated session shape passed into action handlers. */
export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

/**
 * Standard typed result for Server Actions so the UI handles success/error
 * uniformly. Errors carry a stable `code` + a SAFE, generic `message` — never a
 * stack trace or secret.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

/**
 * Higher-order wrapper enforcing the per-action auth re-check + result contract.
 * Middleware route-gating is not sufficient on its own — Server Actions are
 * independently invocable (fetch/RSC), so each one re-checks auth here.
 *
 *   - Re-checks the session via getSession() (no redirect: a redirect is wrong
 *     for a programmatically invoked action). If absent, short-circuits to the
 *     `unauthorized` contract BEFORE the handler runs.
 *   - The authenticated session is passed to the handler as its first argument;
 *     any caller-supplied arguments follow.
 *   - On success returns { ok: true, data }.
 *   - A thrown error is mapped to a SAFE { ok: false, error: { code: "internal" } }:
 *     never `err.message`, the stack, or any secret reaches the client.
 */
export function action<Args extends unknown[], T>(
  handler: (session: Session, ...args: Args) => Promise<T>,
): (...args: Args) => Promise<ActionResult<T>> {
  return async (...args: Args): Promise<ActionResult<T>> => {
    const session = await getSession();
    if (!session) {
      return {
        ok: false,
        error: { code: "unauthorized", message: "You must be signed in." },
      };
    }

    try {
      const data = await handler(session, ...args);
      return { ok: true, data };
    } catch {
      // Deliberately discard the error: nothing about it (message/stack) is safe
      // to surface to the client.
      return {
        ok: false,
        error: { code: "internal", message: "Something went wrong." },
      };
    }
  };
}
