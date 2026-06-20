"use server";

/**
 * Debt Server Actions (auth-guarded wrappers).
 *
 * Security invariants:
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access.
 *
 * Pure logic + event_log writes live in `debts-core.ts`. A "use server" module
 * may export only async functions + `export type` re-exports.
 */

import { revalidatePath } from "next/cache";
import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { computeWhatIf } from "@upshot/core";
import { DrizzleDebtRepo, tables } from "@upshot/db";
import { createDebt, updateDebt, deleteDebt, recordDebtPayment } from "./debts-core";
import type { DebtRow, CreateDebtInput } from "./debts-core";
import type { RecordDebtPayment } from "@upshot/core";
import type { SnowballAnalysis, DebtStrategy } from "@upshot/core";

/** Action: create a new debt entry. Returns the new debt id. */
export const createDebtAction = action(
  async (_session, input: CreateDebtInput): Promise<string> => {
    const { db } = getDb();
    const id = await createDebt(db, input);
    revalidatePath("/plan/debts");
    revalidatePath("/plan");
    return id;
  },
);

/** Action: update an existing debt. */
export const updateDebtAction = action(
  async (_session, input: DebtRow): Promise<void> => {
    const { db } = getDb();
    await updateDebt(db, input);
    revalidatePath("/plan/debts");
    revalidatePath("/plan");
  },
);

/** Action: delete a debt. */
export const deleteDebtAction = action(
  async (_session, id: string): Promise<void> => {
    const { db } = getDb();
    await deleteDebt(db, id);
    revalidatePath("/plan/debts");
    revalidatePath("/plan");
  },
);

/** Action: record a payment against a debt. */
export const recordDebtPaymentAction = action(
  async (_session, payment: RecordDebtPayment): Promise<void> => {
    const { db } = getDb();
    await recordDebtPayment(db, payment);
    revalidatePath("/plan/debts");
    revalidatePath("/plan");
  },
);

/** Maps the raw app_settings string to a typed DebtStrategy. */
function toStrategy(raw: string): DebtStrategy {
  if (raw === "SNOWBALL" || raw === "AVALANCHE" || raw === "CUSTOM") return raw;
  return "CUSTOM";
}

/**
 * Action: pure what-if calculation — computes snowball with extra payment.
 * Read-only: no DB writes, no revalidatePath.
 */
export const whatIfAction = action(
  async (
    _session,
    extraPaymentCents: number,
  ): Promise<{ withExtra: SnowballAnalysis; base: SnowballAnalysis; monthsSaved: number; interestSavedCents: number }> => {
    const { db } = getDb();

    const settings = db
      .select({
        debtStrategy: tables.appSettings.debtStrategy,
      })
      .from(tables.appSettings)
      .get();

    const strategy = toStrategy(settings?.debtStrategy ?? "SNOWBALL");
    const startMonth = new Date().toISOString().slice(0, 7);

    const repo = new DrizzleDebtRepo(db);
    const rows = await repo.list();

    const debtInputs = rows.map((row) => ({
      id: row.id,
      name: row.name,
      currentBalanceCents: row.currentBalanceCents,
      monthlyPaymentCents: row.monthlyPaymentCents,
      interestRate: row.interestRate ?? null,
      payoffPriority: row.payoffPriority,
      includeInSnowball: row.includeInSnowball,
    }));

    return computeWhatIf(debtInputs, {
      strategy,
      extraPaymentCents,
      startMonth,
    });
  },
);
