"use server";

/**
 * Budget allocation Server Actions (local bookkeeping only — no Up call).
 *
 * Security invariants (single-user app — non-negotiable):
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access and returns a
 *     safe ActionResult.
 *   - No secret is ever passed to console.* / logged.
 *
 * The actual persistence is the pure, db-injected `setAllocation` /
 * `transferAllocation` in `budget-core.ts`. These wrappers stay thin so the
 * `action()` result-contract wrapper wraps them cleanly. The core's own typed
 * domain result (e.g. an overdraw) rides through as the action's `data`.
 */

import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { setAllocation, transferAllocation } from "./budget-core";

// Type-only re-exports (erased at runtime → valid in a "use server" module).
export type { SetAllocationResult, TransferResult } from "./budget-core";

/** Action: set an account's allocation for a month. Re-checks auth, then delegates. */
export const setAllocationAction = action(
  async (_session, accountId: string, month: string, allocatedCents: number) => {
    const { db } = getDb();
    return setAllocation(db, accountId, month, allocatedCents);
  },
);

/** Action: move allocation between accounts for a month. Re-checks auth, then delegates. */
export const transferAllocationAction = action(
  async (
    _session,
    fromAccountId: string,
    toAccountId: string,
    month: string,
    cents: number,
  ) => {
    const { db } = getDb();
    return transferAllocation(db, fromAccountId, toAccountId, month, cents);
  },
);
