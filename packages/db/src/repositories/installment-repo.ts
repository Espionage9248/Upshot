import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { InstallmentRepo, NewInstallmentPlan } from "@upshot/core";
import type { InstallmentMatch, PlanUpdate } from "@upshot/core";
import type { InstallmentPlan } from "@upshot/contracts";
import type { DbClient } from "../client";
import { installmentPlans, installmentPlanPayments } from "../schema";

export class DrizzleInstallmentRepo implements InstallmentRepo {
  constructor(private readonly db: DbClient) {}

  async list(): Promise<InstallmentPlan[]> {
    return this.db.select().from(installmentPlans).all() as InstallmentPlan[];
  }

  async getById(id: string): Promise<InstallmentPlan | null> {
    return (this.db.select().from(installmentPlans).where(eq(installmentPlans.id, id)).get() as InstallmentPlan | undefined) ?? null;
  }

  async create(input: NewInstallmentPlan): Promise<string> {
    const id = (input as { id?: string }).id ?? randomUUID();
    this.db.insert(installmentPlans).values({
      id,
      merchant: input.merchant,
      totalCents: input.totalCents,
      installmentCents: input.installmentCents,
      totalInstallments: input.totalInstallments,
      installmentsPaid: input.installmentsPaid ?? 0,
      frequencyDays: input.frequencyDays,
      firstDueDate: input.firstDueDate,
      nextDueDate: input.nextDueDate ?? input.firstDueDate,
      status: input.status ?? "ACTIVE",
      matchRuleId: input.matchRuleId ?? null,
      notes: input.notes ?? null,
    }).run();
    return id;
  }

  async applyMatches(updates: PlanUpdate[], payments: InstallmentMatch[]): Promise<void> {
    this.db.transaction((tx) => {
      for (const u of updates) {
        tx.update(installmentPlans).set({
          installmentsPaid: u.installmentsPaid,
          nextDueDate: u.nextDueDate,
          status: u.status,
        }).where(eq(installmentPlans.id, u.planId)).run();
      }
      for (const p of payments) {
        tx.insert(installmentPlanPayments).values({
          id: randomUUID(),
          planId: p.planId,
          transactionId: p.transactionId,
          dueIndex: p.dueIndex,
          paidAt: p.paidAt,
        }).run();
      }
    });
  }

  async listLinkedTransactionIds(): Promise<Set<string>> {
    const rows = this.db.select({ transactionId: installmentPlanPayments.transactionId })
      .from(installmentPlanPayments)
      .all();
    return new Set(rows.map((r) => r.transactionId));
  }

  /** Point this entity at a matching rule (or clear it with null). */
  async setMatchRule(id: string, ruleId: string | null): Promise<void> {
    this.db.update(installmentPlans).set({ matchRuleId: ruleId }).where(eq(installmentPlans.id, id)).run();
  }

  /** Clear the FK on every entity that points at this rule (used when the rule is deleted). */
  async clearMatchRuleByRule(ruleId: string): Promise<void> {
    this.db.update(installmentPlans).set({ matchRuleId: null }).where(eq(installmentPlans.matchRuleId, ruleId)).run();
  }

  async delete(id: string): Promise<void> {
    // installment_plan_payments cascade via schema onDelete: "cascade"
    this.db.delete(installmentPlans).where(eq(installmentPlans.id, id)).run();
  }
}
