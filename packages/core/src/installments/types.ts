export interface InstallmentPlanInput {
  id: string;
  merchant: string;
  installmentCents: number;
  totalInstallments: number;
  installmentsPaid: number;
  frequencyDays: number;
  nextDueDate: string;
  status: "ACTIVE" | "COMPLETE";
}

export interface MatchableTransaction {
  id: string;
  description: string;
  amountCents: number;
  createdAt: string;
  settledAt?: string | null;
  isTransfer: boolean;
}

export interface InstallmentMatch {
  planId: string;
  transactionId: string;
  dueIndex: number;
  paidAt: string;
}

export interface PlanUpdate {
  planId: string;
  installmentsPaid: number;
  nextDueDate: string;
  status: "ACTIVE" | "COMPLETE";
}
