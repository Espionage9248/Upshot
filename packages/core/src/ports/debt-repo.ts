import type { Debt, DebtPayment } from "@upshot/contracts";

/** New-debt input: computed/optional projection fields omitted (or overrideable). */
export type NewDebt = Omit<Debt, "estimatedPayoffDate" | "monthsRemaining" | "totalInterestProjectedCents" | "lastFeeAppliedAt">
  & { estimatedPayoffDate?: string | null; monthsRemaining?: number | null; totalInterestProjectedCents?: number | null; lastFeeAppliedAt?: string | null };

export interface RecordDebtPayment {
  debtId: string;
  amountCents: number;
  principalCents?: number | null;
  interestCents?: number | null;
  paymentDate: string;
  transactionId?: string | null;
  notes?: string | null;
}

export interface DebtProjection {
  estimatedPayoffDate: string | null;
  monthsRemaining: number | null;
  totalInterestProjectedCents: number | null;
}

export interface DebtRepo {
  list(): Promise<Debt[]>;
  getById(id: string): Promise<Debt | null>;
  create(input: NewDebt): Promise<string>; // returns id
  update(input: Debt): Promise<void>;
  delete(id: string): Promise<void>; // debt_payments + debt_expenses cascade
  recordPayment(p: RecordDebtPayment): Promise<void>;
  listPayments(debtId: string): Promise<DebtPayment[]>;
  updateProjections(debtId: string, projection: DebtProjection): Promise<void>;
  applyFee(debtId: string, newBalanceCents: number, lastFeeAppliedAt: string): Promise<void>;
}
