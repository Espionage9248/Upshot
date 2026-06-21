import type { DebtStrategy } from "../debt/types";

export type { DebtStrategy };

export interface PayoffDebtInput {
  id: string;
  currentBalanceCents: number;
  minimumPaymentCents: number;
  interestRate: number | null; // annual fraction, e.g. 0.1999
}

export interface LumpSum {
  amountCents: number;
  month: string; // "yyyy-MM"
  targetDebtId: string | null; // null = current highest-priority unpaid debt
}

export interface ExtraStep {
  fromMonth: string; // "yyyy-MM"; extra is active from this month onward
  extraCents: number;
}

export interface PayoffInputs {
  debts: PayoffDebtInput[];
  order: string[]; // debt ids, highest priority (target) first
  startMonth: string; // "yyyy-MM"
  extraSchedule: ExtraStep[]; // step function; latest applicable fromMonth wins
  lumpSums: LumpSum[];
}

export interface PayoffResult {
  debtFreeMonth: string | null;
  monthsToPayoff: number;
  totalInterestCents: number;
  curve: { month: string; balanceCents: number }[]; // total balance, end of each month
}

export interface PlanStatus {
  status: "ahead" | "on-track" | "behind";
  balanceGapCents: number; // expected − current; positive = ahead (owe less than planned)
  slipMonths: number; // recomputed debt-free month − locked projection; negative = early
  contributionsShortfallCents: number; // max(0, committed − actual paid this month)
}
