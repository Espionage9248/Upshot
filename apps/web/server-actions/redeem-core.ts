/**
 * Testable core of backup-code redemption — deliberately NOT a "use server"
 * module so it can accept a non-serializable injected `db` (the Server Action in
 * recovery.ts wraps this with the app singleton and keeps a serializable
 * `(code: string)` signature). No env, secrets, or WebAuthn required, so it is
 * unit-testable in isolation.
 */

import { eq } from "drizzle-orm";
import { tables, type DbClient } from "@upshot/db";
import { verifyAndConsume } from "@/lib/backup-codes";

/**
 * Verify a backup code against the single user's stored hashes and consume it.
 * On success, persists the reduced hash set (one fewer code) and returns the
 * userId so the caller can establish a session. Returns `{ ok: false }` for an
 * invalid code, an already-consumed code, or when no codes are provisioned.
 */
export async function redeemBackupCode(
  code: string,
  db: DbClient,
): Promise<{ ok: boolean; userId?: string }> {
  // Single-user app: there is at most one user row.
  const [u] = await db.select().from(tables.user).limit(1);
  if (!u || !u.backupCodes) return { ok: false };

  const hashes = JSON.parse(u.backupCodes) as string[];
  const { ok, remaining } = verifyAndConsume(code, hashes);
  if (!ok) return { ok: false };

  await db
    .update(tables.user)
    .set({ backupCodes: JSON.stringify(remaining) })
    .where(eq(tables.user.id, u.id));

  return { ok: true, userId: u.id };
}
