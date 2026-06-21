/**
 * Pure planner persistence + the input-mapping helper (db-injected). Local-only.
 *
 * Kept out of the "use server" module so these helpers are NOT registered as
 * client-callable Server Actions. The thin auth-guarded wrappers live in
 * planner.ts (same split as debts-core.ts / debts.ts).
 */

import { randomUUID } from "node:crypto";
import {
  simulatePayoff,
  orderByStrategy,
  headroomCents,
  type PayoffInputs,
} from "@upshot/core";
import {
  DrizzlePayoffPlanRepo,
  DrizzlePlanningScenarioRepo,
  tables,
  type DbClient,
  type PayoffPlanRow,
  type ScenarioInputs,
} from "@upshot/db";

export interface PlannerDebt {
  id: string;
  currentBalanceCents: number;
  minimumPaymentCents: number;
  interestRate: number | null;
  includeInSnowball: boolean;
}

function logEvent(db: DbClient, action: string, entityId: string, description: string, meta: Record<string, unknown>): void {
  db.insert(tables.eventLog)
    .values({ id: randomUUID(), category: "planner", action, entityType: "planner", entityId, description, meta })
    .run();
}

/** Map tuned scenario inputs + live debts into a PayoffInputs for the engine. */
export function buildPayoffInputs(
  inputs: ScenarioInputs,
  debts: PlannerDebt[],
  recurring: { id: string; monthlyCents: number }[],
  startMonth: string,
): { payoffInputs: PayoffInputs; expenseCents: number; minimumsCents: number; preExtraCents: number } {
  const recurringById = new Map(recurring.map((r) => [r.id, r.monthlyCents]));
  const keptRecurringCents = inputs.recurringEdits
    .filter((e) => e.keep)
    .reduce((sum, e) => sum + (e.monthlyCentsOverride ?? recurringById.get(e.id) ?? 0), 0);
  const expenseCents = keptRecurringCents + inputs.discretionaryCents;

  const included = debts.filter((d) => d.includeInSnowball);
  const minimumsCents = included.reduce((sum, d) => sum + d.minimumPaymentCents, 0);

  const share = (income: number): number =>
    Math.max(0, Math.floor((headroomCents(income, expenseCents, minimumsCents) * inputs.toDebtShareBps) / 10000));

  const preExtraCents = share(inputs.baseIncomeCents);
  const extraSchedule = inputs.raise
    ? [
        { fromMonth: startMonth, extraCents: preExtraCents },
        { fromMonth: inputs.raise.fromMonth, extraCents: share(inputs.raise.toCents) },
      ]
    : [{ fromMonth: startMonth, extraCents: preExtraCents }];

  const payoffInputs: PayoffInputs = {
    debts: included.map((d) => ({
      id: d.id,
      currentBalanceCents: d.currentBalanceCents,
      minimumPaymentCents: d.minimumPaymentCents,
      interestRate: d.interestRate,
    })),
    order: orderByStrategy(
      included.map((d) => ({
        id: d.id,
        currentBalanceCents: d.currentBalanceCents,
        minimumPaymentCents: d.minimumPaymentCents,
        interestRate: d.interestRate,
      })),
      inputs.strategy,
    ),
    startMonth,
    extraSchedule,
    lumpSums: inputs.lumpSums,
  };

  return { payoffInputs, expenseCents, minimumsCents, preExtraCents };
}

export async function lockPayoffPlan(db: DbClient, row: PayoffPlanRow): Promise<void> {
  await new DrizzlePayoffPlanRepo(db).upsert(row);
  logEvent(db, "lock_payoff_plan", "default", "Locked debt payoff plan", {
    strategy: row.strategy,
    extraPaymentCents: row.extraPaymentCents,
    projectedDebtFreeMonth: row.projectedDebtFreeMonth,
  });
}

export async function unlockPayoffPlan(db: DbClient): Promise<void> {
  await new DrizzlePayoffPlanRepo(db).delete();
  logEvent(db, "unlock_payoff_plan", "default", "Unlocked debt payoff plan", {});
}

export async function savePlanningScenario(db: DbClient, input: { name: string; inputs: ScenarioInputs }): Promise<string> {
  const id = await new DrizzlePlanningScenarioRepo(db).create(input);
  logEvent(db, "save_scenario", id, `Saved scenario: ${input.name}`, { name: input.name });
  return id;
}

export async function updatePlanningScenario(db: DbClient, id: string, patch: { name?: string; inputs?: ScenarioInputs }): Promise<void> {
  await new DrizzlePlanningScenarioRepo(db).update(id, patch);
  logEvent(db, "update_scenario", id, `Updated scenario ${id}`, { name: patch.name ?? null });
}

export async function deletePlanningScenario(db: DbClient, id: string): Promise<void> {
  await new DrizzlePlanningScenarioRepo(db).delete(id);
  logEvent(db, "delete_scenario", id, `Deleted scenario ${id}`, {});
}

/** Promote a saved scenario to the Locked Plan: recompute its curve against LIVE debts and freeze it. */
export async function promoteScenarioToPlan(
  db: DbClient,
  id: string,
  debts: PlannerDebt[],
  recurring: { id: string; monthlyCents: number }[],
  startMonth: string,
): Promise<void> {
  const scenario = await new DrizzlePlanningScenarioRepo(db).getById(id);
  if (!scenario) throw new Error(`promoteScenarioToPlan: scenario ${id} not found`);
  const { payoffInputs, preExtraCents } = buildPayoffInputs(scenario.inputs, debts, recurring, startMonth);
  const result = simulatePayoff(payoffInputs);
  await lockPayoffPlan(db, {
    id: "default",
    strategy: scenario.inputs.strategy,
    extraPaymentCents: preExtraCents,
    customOrder: null,
    lumpSums: scenario.inputs.lumpSums,
    lockedAt: new Date().toISOString(),
    projectedDebtFreeMonth: result.debtFreeMonth,
    projectedCurve: result.curve,
    totalInterestProjectedCents: result.totalInterestCents,
  });
}
