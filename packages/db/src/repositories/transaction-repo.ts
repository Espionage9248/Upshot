import { eq } from "drizzle-orm";
import type { TransactionRepo, NewTransaction } from "@upshot/core";
import type { Transaction } from "@upshot/contracts";
import type { DbClient } from "../client";
import { transactions } from "../schema";

export class DrizzleTransactionRepo implements TransactionRepo {
  constructor(private readonly db: DbClient) {}

  async upsert(txn: NewTransaction): Promise<void> {
    this.db
      .insert(transactions)
      .values(txn)
      .onConflictDoUpdate({ target: transactions.id, set: txn })
      .run();
  }

  async getById(id: string): Promise<Transaction | null> {
    return this.db.select().from(transactions).where(eq(transactions.id, id)).get() ?? null;
  }

  async listByAccount(accountId: string): Promise<Transaction[]> {
    return this.db.select().from(transactions).where(eq(transactions.accountId, accountId)).all();
  }
}
