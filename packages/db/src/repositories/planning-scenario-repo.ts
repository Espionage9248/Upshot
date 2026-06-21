import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { DebtStrategy } from "@upshot/core";
import type { DbClient } from "../client";
import { planningScenarios } from "../schema";

/** Canonical tuning blob persisted per scenario. Debts stay live (not stored). */
export interface ScenarioInputs {
  mode: "FORWARD" | "TARGET_DATE";
  baseIncomeCents: number;
  raise: { toCents: number; fromMonth: string } | null;
  discretionaryCents: number;
  recurringEdits: { id: string; keep: boolean; monthlyCentsOverride: number | null }[];
  toDebtShareBps: number; // 0..10000
  strategy: DebtStrategy;
  lumpSums: { amountCents: number; month: string; targetDebtId: string | null }[];
  targetMonth: string | null;
}

export interface PlanningScenarioRow {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  inputs: ScenarioInputs;
}

export class DrizzlePlanningScenarioRepo {
  constructor(private readonly db: DbClient) {}

  async list(): Promise<PlanningScenarioRow[]> {
    return this.db.select().from(planningScenarios).all() as PlanningScenarioRow[];
  }

  async getById(id: string): Promise<PlanningScenarioRow | null> {
    return (
      (this.db.select().from(planningScenarios).where(eq(planningScenarios.id, id)).get() as
        | PlanningScenarioRow
        | undefined) ?? null
    );
  }

  async create(input: { name: string; inputs: ScenarioInputs }): Promise<string> {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db
      .insert(planningScenarios)
      .values({ id, name: input.name, createdAt: now, updatedAt: now, inputs: input.inputs })
      .run();
    return id;
  }

  async update(id: string, patch: { name?: string; inputs?: ScenarioInputs }): Promise<void> {
    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (patch.name !== undefined) set.name = patch.name;
    if (patch.inputs !== undefined) set.inputs = patch.inputs;
    this.db.update(planningScenarios).set(set).where(eq(planningScenarios.id, id)).run();
  }

  async delete(id: string): Promise<void> {
    this.db.delete(planningScenarios).where(eq(planningScenarios.id, id)).run();
  }
}
