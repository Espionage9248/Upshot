import { randomUUID } from "node:crypto";
import type { Debt, DebtPayment } from "@upshot/contracts";
import type { DebtRepo, NewDebt, RecordDebtPayment, DebtProjection } from "../ports/debt-repo";

export class InMemoryDebtRepo implements DebtRepo {
  private readonly store = new Map<string, Debt>();
  private readonly payments: DebtPayment[] = [];

  async list(): Promise<Debt[]> {
    return [...this.store.values()];
  }

  async getById(id: string): Promise<Debt | null> {
    return this.store.get(id) ?? null;
  }

  async create(input: NewDebt): Promise<string> {
    const id = (input as { id?: string }).id ?? randomUUID();
    this.store.set(id, {
      ...input,
      id,
      estimatedPayoffDate: input.estimatedPayoffDate ?? null,
      monthsRemaining: input.monthsRemaining ?? null,
      totalInterestProjectedCents: input.totalInterestProjectedCents ?? null,
      lastFeeAppliedAt: input.lastFeeAppliedAt ?? null,
      paymentsLinkedAt: input.paymentsLinkedAt ?? null,
    });
    return id;
  }

  async update(input: Debt): Promise<void> {
    this.store.set(input.id, { ...input });
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
    // remove associated payments
    const toRemove = this.payments.filter((p) => p.debtId === id);
    for (const p of toRemove) {
      const idx = this.payments.indexOf(p);
      if (idx !== -1) this.payments.splice(idx, 1);
    }
  }

  async recordPayment(p: RecordDebtPayment): Promise<void> {
    this.payments.push({
      id: randomUUID(),
      debtId: p.debtId,
      amountCents: p.amountCents,
      principalCents: p.principalCents ?? null,
      interestCents: p.interestCents ?? null,
      paymentDate: p.paymentDate,
      transactionId: p.transactionId ?? null,
      notes: p.notes ?? null,
    });
  }

  async listPayments(debtId: string): Promise<DebtPayment[]> {
    return this.payments.filter((p) => p.debtId === debtId);
  }

  async updateProjections(debtId: string, projection: DebtProjection): Promise<void> {
    const existing = this.store.get(debtId);
    if (!existing) return;
    this.store.set(debtId, {
      ...existing,
      estimatedPayoffDate: projection.estimatedPayoffDate,
      monthsRemaining: projection.monthsRemaining,
      totalInterestProjectedCents: projection.totalInterestProjectedCents,
    });
  }

  async applyFee(debtId: string, newBalanceCents: number, lastFeeAppliedAt: string): Promise<void> {
    const existing = this.store.get(debtId);
    if (!existing) return;
    this.store.set(debtId, { ...existing, currentBalanceCents: newBalanceCents, lastFeeAppliedAt });
  }
}
