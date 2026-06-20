import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { DebtRepo, NewDebt, RecordDebtPayment, DebtProjection } from "@upshot/core";
import type { Debt, DebtPayment } from "@upshot/contracts";
import type { DbClient } from "../client";
import { debts, debtPayments } from "../schema";

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
}
