"use server";

/**
 * Forecast simulator Server Actions (salary-change / expense-change recompute).
 *
 * Security invariants (single-user app — non-negotiable):
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access.
 *   - No secret is ever logged.
 *
 * The pure, db-injected recompute logic lives in `forecast-core.ts` (separately
 * unit-tested). These wrappers are intentionally thin so the action() result
 * contract wraps them cleanly.
 */

import type { ExpenseAdjustmentInput } from "@upshot/core";
import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { recomputeSalaryChange, recomputeExpenseChange } from "./forecast-core";

// Type-only re-exports (erased at runtime, so valid in a "use server" module).
// `from` is REQUIRED — a bare `export type {X};` crashes every action at runtime.
export type { SalaryChangeResult, ExpenseChangeResult } from "@upshot/core";

/** Action: recompute the salary-change scenario for a new monthly income. */
export const recomputeSalaryChangeAction = action(
  async (_session, input: { newMonthlyIncomeCents: number }) => {
    const { db } = getDb();
    return recomputeSalaryChange(db, new Date().toISOString(), input);
  },
);

/** Action: recompute the expense-change scenario for saver allocation adjustments. */
export const recomputeExpenseChangeAction = action(
  async (_session, input: { adjustments: ExpenseAdjustmentInput[] }) => {
    const { db } = getDb();
    return recomputeExpenseChange(db, new Date().toISOString(), input);
  },
);
