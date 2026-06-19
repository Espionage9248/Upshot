"use server";

/**
 * Transaction edit Server Actions (auth-guarded wrappers).
 *
 * Security invariants (single-user app — non-negotiable):
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access and returns a
 *     safe ActionResult.
 *   - UP_API_TOKEN is read AT REQUEST TIME (inside the handler), never at module
 *     scope. This preserves the env-free `next build` invariant.
 *   - No secret is ever passed to console.* / logged.
 *
 * The actual persistence + Up write-back logic is in `money-core.ts` (pure,
 * db-injected). These wrappers stay thin so the `action()` result-contract
 * wrapper wraps them cleanly.
 */

import { UpClient, type UpClientPort } from "@upshot/core";
import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import {
  setCategory,
  setTags,
  markSalary,
  markTransfer,
  markTaxDeductible,
} from "./money-core";

// Type-only re-exports (erased at runtime → valid in a "use server" module).
export type { ServerActionWarning, SetCategoryResult, SetTagsResult } from "./money-core";

/**
 * Build the Up client lazily at request time. Returns null when UP_API_TOKEN
 * is absent (normal posture for local-only mode — no warning on missing token).
 */
function buildUpClient(): UpClientPort | null {
  const token = process.env.UP_API_TOKEN;
  return token ? new UpClient({ token, baseUrl: process.env.UP_API_BASE_URL }) : null;
}

/** Action: set the Up category on a transaction. Persists locally first, then pushes to Up. */
export const setCategoryAction = action(
  async (_session, txId: string, categoryId: string | null) => {
    const { db } = getDb();
    return setCategory(db, buildUpClient(), txId, categoryId);
  },
);

/** Action: add/remove tags on a transaction. Additions pushed to Up; removals are local-only. */
export const setTagsAction = action(
  async (_session, txId: string, addTagIds: string[], removeTagIds: string[]) => {
    const { db } = getDb();
    return setTags(db, buildUpClient(), txId, addTagIds, removeTagIds);
  },
);

/** Action: mark / unmark a transaction as salary income. Local-only. */
export const markSalaryAction = action(
  async (_session, txId: string, value: boolean) => {
    const { db } = getDb();
    await markSalary(db, txId, value);
  },
);

/** Action: mark / unmark a transaction as a transfer. Local-only. */
export const markTransferAction = action(
  async (_session, txId: string, value: boolean, transferAccountId?: string) => {
    const { db } = getDb();
    await markTransfer(db, txId, value, transferAccountId);
  },
);

/** Action: mark / unmark a transaction as tax-deductible. Local-only. */
export const markTaxDeductibleAction = action(
  async (_session, txId: string, value: boolean, deductionCategory?: string) => {
    const { db } = getDb();
    await markTaxDeductible(db, txId, value, deductionCategory);
  },
);
