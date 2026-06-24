"use server";

/**
 * Scenario Planner Server Actions (auth-guarded wrappers).
 *
 * Pure logic + event_log writes live in planner-core.ts. A "use server" module
 * may export only async functions + `export type` re-exports (with `from`).
 */

import { revalidatePath } from "next/cache";
import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { simulatePayoff, solveExtraForTargetDate, toMonthlyCostCents, headroomCents, effectiveDebtPaymentCents, type PayoffResult } from "@upshot/core";
import {
  DrizzleDebtRepo,
  DrizzleRecurringRepo,
  type DbClient,
  type PayoffPlanRow,
  type ScenarioInputs,
} from "@upshot/db";
import {
  buildPayoffInputs,
  lockPayoffPlan,
  unlockPayoffPlan,
  savePlanningScenario,
  updatePlanningScenario,
  deletePlanningScenario,
  promoteScenarioToPlan,
  type PlannerDebt,
} from "./planner-core";

export type { ScenarioInputs } from "@upshot/db";

/** Live debts + recurring monthly costs + the current month. Shared by preview/lock/promote. */
async function liveContext(
  db: DbClient,
): Promise<{ debts: PlannerDebt[]; recurring: { id: string; monthlyCents: number }[]; startMonth: string }> {
  const debtRepo = new DrizzleDebtRepo(db);
  const debtRows = await debtRepo.list();
  const latest = await debtRepo.latestPaymentCentsByDebt();
  const debts: PlannerDebt[] = debtRows.map((row) => {
    const actual = latest.get(row.id)?.amountCents ?? null;
    return {
      id: row.id,
      currentBalanceCents: row.currentBalanceCents,
      minimumPaymentCents: row.minimumPaymentCents ?? row.monthlyPaymentCents,
      effectivePaymentCents: effectiveDebtPaymentCents({
        actualPaymentCents: actual,
        minimumPaymentCents: row.minimumPaymentCents,
        monthlyPaymentCents: row.monthlyPaymentCents,
      }),
      paymentIsActual: actual !== null,
      interestRate: row.interestRate ?? null,
      includeInSnowball: row.includeInSnowball,
    };
  });

  const recurringRows = await new DrizzleRecurringRepo(db).list();
  const recurring = recurringRows
    .filter((r) => r.status === "ACTIVE")
    .map((r) => ({ id: r.id, monthlyCents: toMonthlyCostCents(r.amountCents, r.frequency) }));

  return { debts, recurring, startMonth: new Date().toISOString().slice(0, 7) };
}

function revalidatePlan(): void {
  revalidatePath("/plan/debts");
  revalidatePath("/plan");
}

/** Read-only: compute the scenario timeline + the baseline (extra = 0) for the chart/outputs. */
export const previewScenarioAction = action(
  async (
    _session,
    inputs: ScenarioInputs,
  ): Promise<{ scenario: PayoffResult; baseline: PayoffResult; extraPaymentCents: number; achievable: boolean; headroomCents: number; overHeadroom: boolean }> => {
    const { db } = getDb();
    const { debts, recurring, startMonth } = await liveContext(db);
    const built = buildPayoffInputs(inputs, debts, recurring, startMonth);
    const headroom = headroomCents(inputs.baseIncomeCents, built.expenseCents, built.minimumsCents);

    const baseline = simulatePayoff({ ...built.payoffInputs, extraSchedule: [{ fromMonth: startMonth, extraCents: 0 }], lumpSums: [] });

    if (inputs.mode === "TARGET_DATE" && inputs.targetMonth) {
      const { extraCents, achievable } = solveExtraForTargetDate(
        { debts: built.payoffInputs.debts, order: built.payoffInputs.order, startMonth, lumpSums: built.payoffInputs.lumpSums },
        inputs.targetMonth,
      );
      const scenario = simulatePayoff({ ...built.payoffInputs, extraSchedule: [{ fromMonth: startMonth, extraCents }] });
      return { scenario, baseline, extraPaymentCents: extraCents, achievable, headroomCents: headroom, overHeadroom: extraCents > headroom };
    }

    const scenario = simulatePayoff(built.payoffInputs);
    return { scenario, baseline, extraPaymentCents: built.preExtraCents, achievable: true, headroomCents: headroom, overHeadroom: built.preExtraCents > headroom };
  },
);

/** Lock the current scenario as the tracked plan: freeze its curve against live debts. */
export const lockPayoffPlanAction = action(async (_session, inputs: ScenarioInputs): Promise<void> => {
  const { db } = getDb();
  const { debts, recurring, startMonth } = await liveContext(db);
  const built = buildPayoffInputs(inputs, debts, recurring, startMonth);
  const result = simulatePayoff(built.payoffInputs);
  const row: PayoffPlanRow = {
    id: "default",
    strategy: inputs.strategy,
    extraPaymentCents: built.preExtraCents,
    customOrder: inputs.customOrder,
    lumpSums: inputs.lumpSums,
    lockedAt: new Date().toISOString(),
    projectedDebtFreeMonth: result.debtFreeMonth,
    projectedCurve: result.curve,
    totalInterestProjectedCents: result.totalInterestCents,
    inputs: inputs as unknown as Record<string, unknown>,
  };
  await lockPayoffPlan(db, row);
  revalidatePlan();
});

export const unlockPayoffPlanAction = action(async (): Promise<void> => {
  const { db } = getDb();
  await unlockPayoffPlan(db);
  revalidatePlan();
});

export const savePlanningScenarioAction = action(
  async (_session, input: { name: string; inputs: ScenarioInputs }): Promise<string> => {
    const { db } = getDb();
    const id = await savePlanningScenario(db, input);
    revalidatePlan();
    return id;
  },
);

export const updatePlanningScenarioAction = action(
  async (_session, input: { id: string; name?: string; inputs?: ScenarioInputs }): Promise<void> => {
    const { db } = getDb();
    await updatePlanningScenario(db, input.id, { name: input.name, inputs: input.inputs });
    revalidatePlan();
  },
);

export const deletePlanningScenarioAction = action(async (_session, id: string): Promise<void> => {
  const { db } = getDb();
  await deletePlanningScenario(db, id);
  revalidatePlan();
});

export const promoteScenarioToPlanAction = action(async (_session, id: string): Promise<void> => {
  const { db } = getDb();
  const { debts, recurring, startMonth } = await liveContext(db);
  await promoteScenarioToPlan(db, id, debts, recurring, startMonth);
  revalidatePlan();
});
