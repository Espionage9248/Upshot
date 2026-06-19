import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { BudgetAllocationRepo, NewBudgetAllocation } from "@upshot/core";
import type { BudgetAllocation } from "@upshot/contracts";
import type { DbClient } from "../client";
import { budgetAllocations } from "../schema";

export class DrizzleBudgetAllocationRepo implements BudgetAllocationRepo {
  constructor(private readonly db: DbClient) {}

  async listByMonth(month: string): Promise<BudgetAllocation[]> {
    return this.db.select().from(budgetAllocations).where(eq(budgetAllocations.month, month)).all();
  }

  async getByAccountMonth(accountId: string, month: string): Promise<BudgetAllocation | null> {
    return (
      this.db.select().from(budgetAllocations)
        .where(and(eq(budgetAllocations.accountId, accountId), eq(budgetAllocations.month, month)))
        .get() ?? null
    );
  }

  async upsert(row: NewBudgetAllocation): Promise<void> {
    const spentCents = row.spentCents ?? 0;
    const varianceCents = row.allocatedCents - spentCents;
    const year = Number(row.month.slice(0, 4));
    this.db
      .insert(budgetAllocations)
      .values({ id: row.id ?? randomUUID(), accountId: row.accountId, month: row.month, year,
        allocatedCents: row.allocatedCents, spentCents, varianceCents, notes: row.notes ?? null })
      .onConflictDoUpdate({
        target: [budgetAllocations.accountId, budgetAllocations.month],
        set: { allocatedCents: row.allocatedCents, spentCents, varianceCents, notes: row.notes ?? null },
      })
      .run();
  }
}
