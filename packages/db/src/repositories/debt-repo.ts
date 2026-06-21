import { eq, isNotNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { DebtRepo, NewDebt, RecordDebtPayment, DebtProjection } from "@upshot/core";
import type { Debt, DebtPayment, MatchCondition } from "@upshot/contracts";
import type { DbClient } from "../client";
import { debts, debtPayments, matchConditions } from "../schema";

export class DrizzleDebtRepo implements DebtRepo {
  constructor(private readonly db: DbClient) {}

  async list(): Promise<Debt[]> {
    return this.db.select().from(debts).all() as Debt[];
  }

  async getById(id: string): Promise<Debt | null> {
    return (this.db.select().from(debts).where(eq(debts.id, id)).get() as Debt | undefined) ?? null;
  }

  async create(input: NewDebt): Promise<string> {
    const id = (input as { id?: string }).id ?? randomUUID();
    this.db.insert(debts).values({
      id,
      name: input.name,
      type: input.type,
      currentBalanceCents: input.currentBalanceCents,
      originalBalanceCents: input.originalBalanceCents ?? null,
      creditLimitCents: input.creditLimitCents ?? null,
      monthlyPaymentCents: input.monthlyPaymentCents,
      minimumPaymentCents: input.minimumPaymentCents ?? null,
      interestRate: input.interestRate ?? null,
      monthlyFeeCents: input.monthlyFeeCents ?? null,
      feeDueDay: input.feeDueDay ?? null,
      lastFeeAppliedAt: input.lastFeeAppliedAt ?? null,
      payoffPriority: input.payoffPriority,
      includeInSnowball: input.includeInSnowball,
      includeInNetWorth: input.includeInNetWorth,
      matchRuleId: input.matchRuleId ?? null,
      accountNumber: input.accountNumber ?? null,
      institutionName: input.institutionName ?? null,
      notes: input.notes ?? null,
      estimatedPayoffDate: input.estimatedPayoffDate ?? null,
      monthsRemaining: input.monthsRemaining ?? null,
      totalInterestProjectedCents: input.totalInterestProjectedCents ?? null,
    }).run();
    return id;
  }

  async update(input: Debt): Promise<void> {
    this.db.update(debts).set({
      name: input.name,
      type: input.type,
      currentBalanceCents: input.currentBalanceCents,
      originalBalanceCents: input.originalBalanceCents ?? null,
      creditLimitCents: input.creditLimitCents ?? null,
      monthlyPaymentCents: input.monthlyPaymentCents,
      minimumPaymentCents: input.minimumPaymentCents ?? null,
      interestRate: input.interestRate ?? null,
      monthlyFeeCents: input.monthlyFeeCents ?? null,
      feeDueDay: input.feeDueDay ?? null,
      lastFeeAppliedAt: input.lastFeeAppliedAt ?? null,
      payoffPriority: input.payoffPriority,
      includeInSnowball: input.includeInSnowball,
      includeInNetWorth: input.includeInNetWorth,
      matchRuleId: input.matchRuleId ?? null,
      accountNumber: input.accountNumber ?? null,
      institutionName: input.institutionName ?? null,
      notes: input.notes ?? null,
      estimatedPayoffDate: input.estimatedPayoffDate ?? null,
      monthsRemaining: input.monthsRemaining ?? null,
      totalInterestProjectedCents: input.totalInterestProjectedCents ?? null,
    }).where(eq(debts.id, input.id)).run();
  }

  async delete(id: string): Promise<void> {
    // debt_payments + debt_expenses cascade via schema onDelete: "cascade"
    this.db.delete(debts).where(eq(debts.id, id)).run();
  }

  async recordPayment(p: RecordDebtPayment): Promise<void> {
    this.db.insert(debtPayments).values({
      id: randomUUID(),
      debtId: p.debtId,
      amountCents: p.amountCents,
      principalCents: p.principalCents ?? null,
      interestCents: p.interestCents ?? null,
      paymentDate: p.paymentDate,
      transactionId: p.transactionId ?? null,
      notes: p.notes ?? null,
    }).run();
  }

  async listPayments(debtId: string): Promise<DebtPayment[]> {
    return this.db.select().from(debtPayments)
      .where(eq(debtPayments.debtId, debtId))
      .all() as DebtPayment[];
  }

  async updateProjections(debtId: string, projection: DebtProjection): Promise<void> {
    this.db.update(debts).set({
      estimatedPayoffDate: projection.estimatedPayoffDate,
      monthsRemaining: projection.monthsRemaining,
      totalInterestProjectedCents: projection.totalInterestProjectedCents,
    }).where(eq(debts.id, debtId)).run();
  }

  async applyFee(debtId: string, newBalanceCents: number, lastFeeAppliedAt: string): Promise<void> {
    this.db.update(debts).set({
      currentBalanceCents: newBalanceCents,
      lastFeeAppliedAt,
    }).where(eq(debts.id, debtId)).run();
  }

  async listWithRule(): Promise<{ debt: Debt; conditions: MatchCondition[] }[]> {
    const allDebts = this.db.select().from(debts).all() as Debt[];
    return allDebts.map((debt) => {
      if (!debt.matchRuleId) return { debt, conditions: [] };
      const rows = this.db.select().from(matchConditions)
        .where(eq(matchConditions.ruleId, debt.matchRuleId))
        .all();
      return { debt, conditions: rows as MatchCondition[] };
    });
  }

  async listLinkedPaymentTxIds(): Promise<Set<string>> {
    const rows = this.db.select({ transactionId: debtPayments.transactionId })
      .from(debtPayments)
      .where(isNotNull(debtPayments.transactionId))
      .all();
    return new Set(rows.map((r) => r.transactionId as string));
  }

  async applyPaymentMatches(
    payments: { debtId: string; transactionId: string; amountCents: number; paidAt: string }[],
    balanceUpdates: { debtId: string; newBalanceCents: number }[],
  ): Promise<void> {
    this.db.transaction((tx) => {
      for (const p of payments) {
        if (p.transactionId == null) continue;
        tx.insert(debtPayments).values({
          id: randomUUID(),
          debtId: p.debtId,
          transactionId: p.transactionId,
          amountCents: p.amountCents,
          paymentDate: p.paidAt,
        }).run();
      }
      for (const b of balanceUpdates) {
        tx.update(debts).set({ currentBalanceCents: b.newBalanceCents })
          .where(eq(debts.id, b.debtId)).run();
      }
    });
  }
}
