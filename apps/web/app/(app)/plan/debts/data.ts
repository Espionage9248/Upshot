import { DrizzleDebtRepo, DrizzleInstallmentRepo, DrizzlePayoffPlanRepo, type DbClient } from "@upshot/db";
import {
  bnplRollup,
  computeSnowball,
  effectiveDebtPaymentCents,
  planProgress,
  utilisation,
  type DebtStrategy,
  type SnowballAnalysis,
} from "@upshot/core";

/** Debt row as returned by the repo — avoids a direct @upshot/contracts dep in apps/web. */
export type DebtRow = Awaited<ReturnType<DrizzleDebtRepo["list"]>>[number];

/** Compact active-BNPL-plan view for the debts-surface summary card. */
export interface BnplPlanView {
  id: string;
  merchant: string;
  remainingCents: number;
  percentComplete: number;
  installmentsPaid: number;
  totalInstallments: number;
  nextDueDate: string | null;
}

export interface DebtsData {
  debts: { row: DebtRow; utilisation: number | null; effectivePaymentCents: number; paymentIsActual: boolean }[];
  analysis: SnowballAnalysis;
  rollup: { remainingCents: number; activeCount: number; nextDueDate: string | null };
  bnplPlans: BnplPlanView[];
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

  const lockedPlan = await new DrizzlePayoffPlanRepo(db).get();
  const strategy = lockedPlan ? toStrategy(lockedPlan.strategy) : "SNOWBALL";
  const extraPaymentCents = lockedPlan?.extraPaymentCents ?? 0;
  const customOrder = lockedPlan?.customOrder ?? undefined;

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
    ...(customOrder ? { customOrder } : {}),
  });

  const installments = await new DrizzleInstallmentRepo(db).list();
  const rollup = bnplRollup(installments);
  const bnplPlans: BnplPlanView[] = installments
    .filter((p) => p.status !== "COMPLETE")
    .map((p) => {
      const prog = planProgress(p);
      return {
        id: p.id,
        merchant: p.merchant,
        remainingCents: prog.remainingCents,
        percentComplete: prog.percentComplete,
        installmentsPaid: p.installmentsPaid,
        totalInstallments: p.totalInstallments,
        nextDueDate: p.nextDueDate,
      };
    });

  return { debts, analysis, rollup, bnplPlans };
}
