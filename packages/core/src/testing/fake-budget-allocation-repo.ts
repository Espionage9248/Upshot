import type { BudgetAllocationRepo, NewBudgetAllocation } from "../ports";
import type { BudgetAllocation } from "@upshot/contracts";

export class FakeBudgetAllocationRepo implements BudgetAllocationRepo {
  private rows = new Map<string, BudgetAllocation>(); // key = `${accountId}:${month}`
  async listByMonth(month: string) {
    return [...this.rows.values()].filter((r) => r.month === month);
  }
  async getByAccountMonth(accountId: string, month: string) {
    return this.rows.get(`${accountId}:${month}`) ?? null;
  }
  async upsert(row: NewBudgetAllocation) {
    const varianceCents = row.allocatedCents - (row.spentCents ?? 0);
    this.rows.set(`${row.accountId}:${row.month}`, { ...row, spentCents: row.spentCents ?? 0, varianceCents });
  }
}
