export type DebtStrategy = "SNOWBALL" | "AVALANCHE" | "CUSTOM";

export interface DebtInput {
  id: string;
  name: string;
  currentBalanceCents: number;
  monthlyPaymentCents: number;
  interestRate: number | null; // annual fraction, e.g. 0.1999
  payoffPriority: number;
  includeInSnowball: boolean;
}

export interface MonthlyPayment {
  month: string;
  paymentCents: number;
  principalCents: number;
  interestCents: number;
  remainingBalanceCents: number;
}

export interface PayoffSchedule {
  debtId: string;
  debtName: string;
  payoffMonth: string;
  totalPaidCents: number;
  totalInterestCents: number;
  monthlyBreakdown: MonthlyPayment[];
}

export interface SnowballAnalysis {
  strategy: DebtStrategy;
  totalMonthlyPaymentCents: number;
  monthsToPayoff: number;
  debtFreeMonth: string | null;
  totalInterestPaidCents: number;
  payoffOrder: string[];
  schedules: PayoffSchedule[];
}
