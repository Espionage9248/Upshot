import type { BudgetAllocation } from "@upshot/contracts";

/** Upsert input: id is caller-supplied (uuid); variance is derived by the store on write. */
export type NewBudgetAllocation = Omit<BudgetAllocation, "varianceCents"> & {
  varianceCents?: number;
};

export interface BudgetAllocationRepo {
  /** All allocation rows for a given YYYY-MM, across accounts. */
  listByMonth(month: string): Promise<BudgetAllocation[]>;
  getByAccountMonth(accountId: string, month: string): Promise<BudgetAllocation | null>;
  /** Upsert by (accountId, month); recomputes varianceCents = allocatedCents - spentCents. */
  upsert(row: NewBudgetAllocation): Promise<void>;
}
