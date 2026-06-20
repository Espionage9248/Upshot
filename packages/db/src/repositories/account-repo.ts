import { eq } from "drizzle-orm";
import type { AccountRepo, NewAccount } from "@upshot/core";
import type { Account } from "@upshot/contracts";
import type { DbClient } from "../client";
import { accounts } from "../schema";

export class DrizzleAccountRepo implements AccountRepo {
  constructor(private readonly db: DbClient) {}

  async upsert(account: NewAccount): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .insert(accounts)
      .values({ ...account, updatedAt: now })
      .onConflictDoUpdate({
        target: accounts.id,
        set: {
          name: account.name,
          type: account.type,
          ownership: account.ownership,
          balanceCents: account.balanceCents,
          role: account.role,
          monthlyAllocationCents: account.monthlyAllocationCents,
          lastSyncedAt: account.lastSyncedAt ?? null,
          updatedAt: now,
          // goalTargetCents and goalTargetDate are intentionally omitted here.
          // Sync writes (via Up API) carry no goal data; omitting them from the
          // conflict-update set ensures user-entered goals are never clobbered.
        },
      })
      .run();
  }

  async getById(id: string): Promise<Account | null> {
    return this.db.select().from(accounts).where(eq(accounts.id, id)).get() ?? null;
  }

  async list(): Promise<Account[]> {
    return this.db.select().from(accounts).all();
  }

  async setGoal(accountId: string, goalTargetCents: number | null, goalTargetDate: string | null): Promise<void> {
    this.db
      .update(accounts)
      .set({ goalTargetCents, goalTargetDate, updatedAt: new Date().toISOString() })
      .where(eq(accounts.id, accountId))
      .run();
  }
}
