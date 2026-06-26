import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/** 0-or-1 row (id always "default"). Absent row = nothing locked. */
export const payoffPlan = sqliteTable("payoff_plan", {
  id: text().primaryKey(), // always "default"
  strategy: text().notNull(),
  extraPaymentCents: integer().notNull(),
  customOrder: text({ mode: "json" }).$type<string[] | null>(),
  lumpSums: text({ mode: "json" })
    .$type<{ amountCents: number; month: string; targetDebtId: string | null }[]>()
    .notNull(),
  lockedAt: text().notNull(),
  projectedDebtFreeMonth: text(),
  projectedCurve: text({ mode: "json" })
    .$type<{ month: string; balanceCents: number }[]>()
    .notNull(),
  totalInterestProjectedCents: integer().notNull(),
  // Full ScenarioInputs captured at lock time so "Re-model" restores the exact tuning.
  // Loosely typed (no import cycle); cast to ScenarioInputs on read, as planning_scenarios.inputs does.
  inputs: text({ mode: "json" }).$type<Record<string, unknown> | null>(),
});

/** 0..many named simulations. `inputs` holds tuning only — debts stay live. */
export const planningScenarios = sqliteTable("planning_scenarios", {
  id: text().primaryKey(),
  name: text().notNull(),
  createdAt: text().notNull(),
  updatedAt: text().notNull(),
  inputs: text({ mode: "json" }).$type<Record<string, unknown>>().notNull(),
});
