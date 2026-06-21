import { and, eq, gte, lt } from "drizzle-orm";
import {
  DrizzleDebtRepo,
  DrizzleRecurringRepo,
  DrizzlePayoffPlanRepo,
  DrizzlePlanningScenarioRepo,
  tables,
  type DbClient,
} from "@upshot/db";
import { simulatePayoff, evaluatePlanStatus, orderByStrategy, toMonthlyCostCents } from "@upshot/core";
import { buildPayoffInputs, type PlannerDebt } from "@/server-actions/planner-core";

export interface PlanningData {
  startMonth: string;
  incomeBaseSeedCents: number;
  discretionarySeedCents: number;
  recurring: { id: string; name: string; monthlyCents: number; kind: string }[];
  debts: { id: string; name: string; currentBalanceCents: number; minimumPaymentCents: number; interestRate: number | null; includeInSnowball: boolean }[];
  strategy: "SNOWBALL" | "AVALANCHE" | "CUSTOM";
  scenarios: { id: string; name: string; debtFreeMonth: string | null; extraPaymentCents: number }[];
  lockedPlan: {
    lockedAt: string;
    extraPaymentCents: number;
    projectedDebtFreeMonth: string | null;
    expectedBalanceCents: number;
    currentBalanceCents: number;
    status: "ahead" | "on-track" | "behind";
    balanceGapCents: number;
    slipMonths: number;
    contributionsShortfallCents: number;
  } | null;
}

function monthOf(d: Date): string {
  return d.toISOString().slice(0, 7);
}
function toStrategy(raw: string): "SNOWBALL" | "AVALANCHE" | "CUSTOM" {
  return raw === "AVALANCHE" || raw === "CUSTOM" ? raw : "SNOWBALL";
}

export async function loadPlanningData(db: DbClient, now: Date = new Date()): Promise<PlanningData> {
  const startMonth = monthOf(now);

  // --- live debts ---
  const debtRows = await new DrizzleDebtRepo(db).list();
  const debts = debtRows.map((row) => ({
    id: row.id,
    name: row.name,
    currentBalanceCents: row.currentBalanceCents,
    minimumPaymentCents: row.minimumPaymentCents ?? row.monthlyPaymentCents,
    interestRate: row.interestRate ?? null,
    includeInSnowball: row.includeInSnowball,
  }));
  const plannerDebts: PlannerDebt[] = debts.map((d) => ({
    id: d.id,
    currentBalanceCents: d.currentBalanceCents,
    minimumPaymentCents: d.minimumPaymentCents,
    interestRate: d.interestRate,
    includeInSnowball: d.includeInSnowball,
  }));

  // --- recurring (monthly normalised) ---
  const recurringRows = await new DrizzleRecurringRepo(db).list();
  const activeRecurring = recurringRows.filter((r) => r.status === "ACTIVE");
  const recurring = activeRecurring.map((r) => ({
    id: r.id,
    name: r.name,
    monthlyCents: toMonthlyCostCents(r.amountCents, r.frequency),
    kind: r.kind,
  }));
  const recurringMonthlyTotal = recurring.reduce((s, r) => s + r.monthlyCents, 0);

  // --- income seed: trailing-month salary ---
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const salaryRows = db
    .select({ amountCents: tables.transactions.amountCents })
    .from(tables.transactions)
    .where(and(eq(tables.transactions.isSalary, true), gte(tables.transactions.createdAt, monthAgo.toISOString())))
    .all();
  const incomeBaseSeedCents = Math.max(0, salaryRows.reduce((s, r) => s + r.amountCents, 0));

  // --- discretionary seed: trailing-6mo non-transfer non-salary outflow / 6 − recurring ---
  const sixAgo = new Date(now);
  sixAgo.setMonth(sixAgo.getMonth() - 6);
  const outflowRows = db
    .select({ amountCents: tables.transactions.amountCents })
    .from(tables.transactions)
    .where(
      and(
        eq(tables.transactions.isTransfer, false),
        eq(tables.transactions.isSalary, false),
        lt(tables.transactions.amountCents, 0),
        gte(tables.transactions.createdAt, sixAgo.toISOString()),
      ),
    )
    .all();
  const sixMoOutflow = outflowRows.reduce((s, r) => s + Math.abs(r.amountCents), 0);
  const discretionarySeedCents = Math.max(0, Math.round(sixMoOutflow / 6) - recurringMonthlyTotal);

  // --- strategy ---
  const settings = db.select({ debtStrategy: tables.appSettings.debtStrategy }).from(tables.appSettings).get();
  const strategy = toStrategy(settings?.debtStrategy ?? "SNOWBALL");

  // --- saved scenarios: recompute debt-free month against LIVE debts ---
  const scenarioRows = await new DrizzlePlanningScenarioRepo(db).list();
  const scenarios = scenarioRows.map((s) => {
    const built = buildPayoffInputs(s.inputs, plannerDebts, recurring, startMonth);
    const result = simulatePayoff(built.payoffInputs);
    return { id: s.id, name: s.name, debtFreeMonth: result.debtFreeMonth, extraPaymentCents: built.preExtraCents };
  });

  // --- locked plan status ---
  const locked = await new DrizzlePayoffPlanRepo(db).get();
  let lockedPlan: PlanningData["lockedPlan"] = null;
  if (locked) {
    const included = plannerDebts.filter((d) => d.includeInSnowball);
    const currentBalanceCents = included.reduce((s, d) => s + d.currentBalanceCents, 0);

    // expected balance for the current month from the frozen curve (nearest earlier point).
    let expectedBalanceCents = locked.projectedCurve[0]?.balanceCents ?? currentBalanceCents;
    for (const p of locked.projectedCurve) {
      if (p.month <= startMonth) expectedBalanceCents = p.balanceCents;
    }

    // recompute debt-free month from current balances with the locked extra/strategy.
    const minimumsCents = included.reduce((s, d) => s + d.minimumPaymentCents, 0);
    const recomputed = simulatePayoff({
      debts: included.map((d) => ({ id: d.id, currentBalanceCents: d.currentBalanceCents, minimumPaymentCents: d.minimumPaymentCents, interestRate: d.interestRate })),
      order: orderByStrategy(
        included.map((d) => ({ id: d.id, currentBalanceCents: d.currentBalanceCents, minimumPaymentCents: d.minimumPaymentCents, interestRate: d.interestRate })),
        locked.strategy as PlanningData["strategy"],
        locked.customOrder ?? undefined,
      ),
      startMonth,
      extraSchedule: [{ fromMonth: startMonth, extraCents: locked.extraPaymentCents }],
      lumpSums: locked.lumpSums,
    });

    // contributions: debt_payments this month vs committed (minimums + extra).
    const paidRows = db
      .select({ amountCents: tables.debtPayments.amountCents, paymentDate: tables.debtPayments.paymentDate })
      .from(tables.debtPayments)
      .all()
      .filter((p) => typeof p.paymentDate === "string" && p.paymentDate.slice(0, 7) === startMonth);
    const actualPaidThisMonthCents = paidRows.reduce((s, p) => s + p.amountCents, 0);
    const committedThisMonthCents = minimumsCents + locked.extraPaymentCents;

    const status = evaluatePlanStatus({
      expectedBalanceCents,
      currentBalanceCents,
      projectedDebtFreeMonth: locked.projectedDebtFreeMonth,
      recomputedDebtFreeMonth: recomputed.debtFreeMonth,
      committedThisMonthCents,
      actualPaidThisMonthCents,
      toleranceCents: 5000,
    });

    lockedPlan = {
      lockedAt: locked.lockedAt,
      extraPaymentCents: locked.extraPaymentCents,
      projectedDebtFreeMonth: locked.projectedDebtFreeMonth,
      expectedBalanceCents,
      currentBalanceCents,
      status: status.status,
      balanceGapCents: status.balanceGapCents,
      slipMonths: status.slipMonths,
      contributionsShortfallCents: status.contributionsShortfallCents,
    };
  }

  return { startMonth, incomeBaseSeedCents, discretionarySeedCents, recurring, debts, strategy, scenarios, lockedPlan };
}
