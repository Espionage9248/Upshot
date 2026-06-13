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
}
