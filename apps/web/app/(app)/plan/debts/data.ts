import { DrizzleDebtRepo, DrizzleInstallmentRepo, tables, type DbClient } from "@upshot/db";
import {
  bnplRollup,
  computeSnowball,
  effectiveDebtPaymentCents,
  utilisation,
  type DebtStrategy,
  type SnowballAnalysis,
} from "@upshot/core";

/** Debt row as returned by the repo — avoids a direct @upshot/contracts dep in apps/web. */
export type DebtRow = Awaited<ReturnType<DrizzleDebtRepo["list"]>>[number];

export interface DebtsData {
  debts: { row: DebtRow; utilisation: number | null; effectivePaymentCents: number; paymentIsActual: boolean }[];
  analysis: SnowballAnalysis;
  strategy: DebtStrategy;
  rollup: { remainingCents: number; activeCount: number; nextDueDate: string | null };
}

/** Maps the raw app_settings string to a typed DebtStrategy. */
function toStrategy(raw: string): DebtStrategy {
  if (raw === "SNOWBALL" || raw === "AVALANCHE" || raw === "CUSTOM") return raw;
  return "CUSTOM";
}

/** `yyyy-MM` of a Date (UTC). */
function monthOf(d: Date): string {
  return d.toISOString().slice(0, 7);
}

/**
 * Server-only loader for the Debts surface. Reads the encrypted DB in-process
 * via injected `db`. Returns domain data only — no @upshot/contracts import.
 */
export async function loadDebtsData(db: DbClient, now: Date = new Date()): Promise<DebtsData> {
  const startMonth = monthOf(now);

  // Read app_settings for debt strategy + extra payment.
  const settings = db.select({
    debtStrategy: tables.appSettings.debtStrategy,
    extraPaymentCents: tables.appSettings.extraPaymentCents,
  }).from(tables.appSettings).get();

  const strategy = toStrategy(settings?.debtStrategy ?? "SNOWBALL");
  const extraPaymentCents = settings?.extraPaymentCents ?? 0;

  const repo = new DrizzleDebtRepo(db);
  const rows = await repo.list();
  const latest = await repo.latestPaymentCentsByDebt();

  const debts = rows.map((row) => {
    const actual = latest.get(row.id)?.amountCents ?? null;
    return {
      row,
      utilisation: utilisation(row.currentBalanceCents, row.creditLimitCents ?? null),
      effectivePaymentCents: effectiveDebtPaymentCents({
        actualPaymentCents: actual,
        minimumPaymentCents: row.minimumPaymentCents ?? null,
        monthlyPaymentCents: row.monthlyPaymentCents,
      }),
      paymentIsActual: actual !== null,
    };
  });

  const debtInputs = rows.map((row) => ({
    id: row.id,
    name: row.name,
    currentBalanceCents: row.currentBalanceCents,
    monthlyPaymentCents: row.monthlyPaymentCents,
    interestRate: row.interestRate ?? null,
    payoffPriority: row.payoffPriority,
    includeInSnowball: row.includeInSnowball,
  }));

  const analysis = computeSnowball(debtInputs, {
    strategy,
    extraPaymentCents,
    startMonth,
  });

  const installments = await new DrizzleInstallmentRepo(db).list();
  const rollup = bnplRollup(installments);

  return { debts, analysis, strategy, rollup };
}
