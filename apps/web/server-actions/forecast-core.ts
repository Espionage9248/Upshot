/**
 * Pure forecast-simulator helpers (db-injected, no auth/Next concerns).
 *
 * Kept out of the "use server" module so these are NOT registered as
 * client-callable Server Actions and are separately unit-testable.
 * The thin auth-guarded wrappers live in `forecast.ts` and delegate here.
 */

import {
  simulateSalaryChange,
  simulateExpenseChange,
  type SalaryChangeResult,
  type ExpenseChangeResult,
  type ExpenseAdjustmentInput,
} from "@upshot/core";
import type { DbClient } from "@upshot/db";
import { loadForecastData } from "@/app/(app)/analyse/forecast/data";

const HORIZON = 90 as const;

/**
 * Re-reads the salary baseline from the DB, merges the user's new monthly
 * income, and runs the salary-change simulator. db-injected + pure.
 */
export async function recomputeSalaryChange(
  db: DbClient,
  now: string,
  input: { newMonthlyIncomeCents: number },
): Promise<SalaryChangeResult> {
  const { salaryBaseline } = await loadForecastData(db, { now, horizon: HORIZON });
  return simulateSalaryChange({
    ...salaryBaseline,
    newMonthlyIncomeCents: input.newMonthlyIncomeCents,
  });
}

/**
 * Re-reads the expense baseline from the DB, applies the user's saver
 * adjustments, and runs the expense-change simulator. db-injected + pure.
 */
export async function recomputeExpenseChange(
  db: DbClient,
  now: string,
  input: { adjustments: ExpenseAdjustmentInput[] },
): Promise<ExpenseChangeResult> {
  const { expenseBaseline } = await loadForecastData(db, { now, horizon: HORIZON });
  return simulateExpenseChange({
    ...expenseBaseline,
    adjustments: input.adjustments,
  });
}
