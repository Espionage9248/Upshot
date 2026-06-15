"use server";

/**
 * Pre-auth recovery + first-run backup-code Server Actions.
 *
 * Security invariants (auth code — non-negotiable):
 *   - Every action re-checks authorization server-side; never trust the client.
 *   - Only scrypt hashes are persisted. The plaintext backup-code set is returned
 *     to the browser EXACTLY ONCE (first-run display) and never stored or logged.
 *   - No secret (BETTER_AUTH_SECRET, the throwaway password, session tokens,
 *     plaintext codes) is ever passed to console.* / logged.
 */

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { tables } from "@upshot/db";
import { action } from "@/lib/action";
import { generateBackupCodes, hashBackupCode } from "@/lib/backup-codes";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { redeemBackupCode as redeemCore } from "./redeem-core";

/**
 * HMAC-SHA256 sign a cookie value exactly as better-call's `makeSignature` does
 * (SHA-256 HMAC, standard base64 with padding, `value.signature`). Kept in
 * lockstep with the verify path (`getSignedCookie`, which requires a 44-char
 * base64 signature ending in "=") — if the scheme diverged, the session cookie
 * would silently fail to verify (a self-inflicted recovery lockout).
 *
 * Returns the UNENCODED `value.signature`. The single `encodeURIComponent` that
 * better-auth's read path expects is applied by Next's `cookies().set` — doing
 * it here too would double-encode and the read path would reject the signature.
 */
async function signCookieValue(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${value}.${sigB64}`;
}

/**
 * Establish a real better-auth session for `userId` and set the signed session
 * cookie, using better-auth's OWN session creation (internalAdapter.createSession)
 * + its OWN cookie name/attributes from $context. We only reproduce the HMAC sign
 * (above) because the Server Action runs outside better-auth's endpoint `ctx`, so
 * setSessionCookie (which needs a ctx) is unavailable. This is the supported
 * mechanism the magic-link / anonymous plugins use internally.
 */
async function establishSession(userId: string): Promise<void> {
  const ctx = await getAuth().$context;
  const created = await ctx.internalAdapter.createSession(userId);
  const token = created.token;

  const { name, attributes } = ctx.authCookies.sessionToken;
  const value = await signCookieValue(token, ctx.secret);

  const sameSite = (attributes.sameSite?.toLowerCase() ?? "lax") as
    | "lax"
    | "strict"
    | "none";

  const jar = await cookies();
  jar.set(name, value, {
    httpOnly: attributes.httpOnly,
    secure: attributes.secure,
    sameSite,
    path: attributes.path,
    maxAge: attributes.maxAge,
    domain: attributes.domain,
  });
}

/**
 * Verify + consume a backup code, then (on success) establish a fresh session so
 * the user is authorised to register a new passkey on /login. The redeem core is
 * unit-tested; the end-to-end recovery → new-passkey flow is covered by the
 * Playwright gate (Task 28).
 *
 * PRE-AUTH RECOVERY PATH — intentionally NOT wrapped by action(): the caller is an
 * unauthenticated user on /login, authorised by the backup code itself, not a
 * session. Gating it on a session would lock recovery out entirely.
 */
export async function redeemBackupCode(
  code: string,
): Promise<{ ok: boolean }> {
  const { ok, userId } = await redeemCore(code, getDb().db);
  if (!ok || !userId) return { ok: false };
  await establishSession(userId);
  return { ok: true };
}

/**
 * First-run: generate + persist the 10 hashed backup codes for the (now
 * authenticated) single user and return the plaintext set ONCE for display.
 *
 *   - Re-checks the session server-side via action() (must be signed in via the
 *     register flow) — the wrapper short-circuits unauthenticated calls.
 *   - Idempotent guard: if codes are already provisioned, refuses to regenerate
 *     (they are shown once) and returns an empty array.
 */
export const issueBackupCodes = action(async (session): Promise<string[]> => {
  const db = getDb().db;
  const [u] = await db
    .select()
    .from(tables.user)
    .where(eq(tables.user.id, session.user.id))
    .limit(1);
  if (!u) throw new Error("User not found");
  if (u.backupCodes) return []; // already issued — never regenerate

  const codes = generateBackupCodes();
  const hashes = await Promise.all(codes.map(hashBackupCode));
  await db
    .update(tables.user)
    .set({ backupCodes: JSON.stringify(hashes) })
    .where(eq(tables.user.id, u.id));

  return codes;
});
