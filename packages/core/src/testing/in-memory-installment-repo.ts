import { randomUUID } from "node:crypto";
import type { InstallmentPlan } from "@upshot/contracts";
import type { InstallmentMatch, PlanUpdate } from "../installments";
import type { InstallmentRepo, NewInstallmentPlan } from "../ports/installment-repo";

export class InMemoryInstallmentRepo implements InstallmentRepo {
  private readonly store = new Map<string, InstallmentPlan>();
  private readonly payments: Array<{ id: string; planId: string; transactionId: string; dueIndex: number; paidAt: string }> = [];

  async list(): Promise<InstallmentPlan[]> {
    return [...this.store.values()];
  }

  async getById(id: string): Promise<InstallmentPlan | null> {
    return this.store.get(id) ?? null;
  }

  async create(input: NewInstallmentPlan): Promise<string> {
    const id = (input as { id?: string }).id ?? randomUUID();
    this.store.set(id, {
      ...input,
      id,
      installmentsPaid: input.installmentsPaid ?? 0,
      nextDueDate: input.nextDueDate ?? input.firstDueDate,
      status: input.status ?? "ACTIVE",
      matchRuleId: input.matchRuleId ?? null,
      notes: input.notes ?? null,
    });
    return id;
  }

  async applyMatches(updates: PlanUpdate[], payments: InstallmentMatch[]): Promise<void> {
    for (const u of updates) {
      const existing = this.store.get(u.planId);
      if (!existing) continue;
      this.store.set(u.planId, {
        ...existing,
        installmentsPaid: u.installmentsPaid,
        nextDueDate: u.nextDueDate,
        status: u.status,
      });
    }
    for (const p of payments) {
      this.payments.push({ id: randomUUID(), planId: p.planId, transactionId: p.transactionId, dueIndex: p.dueIndex, paidAt: p.paidAt });
    }
  }

  async listLinkedTransactionIds(): Promise<Set<string>> {
    return new Set(this.payments.map((p) => p.transactionId));
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
    const toRemove = this.payments.filter((p) => p.planId === id);
    for (const p of toRemove) {
      const idx = this.payments.indexOf(p);
      if (idx !== -1) this.payments.splice(idx, 1);
    }
  }
}
