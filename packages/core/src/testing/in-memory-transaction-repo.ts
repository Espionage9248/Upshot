import type { Transaction } from "@upshot/contracts";
import type { TransactionRepo, NewTransaction } from "../ports/transaction-repo";

export class InMemoryTransactionRepo implements TransactionRepo {
  private readonly store = new Map<string, Transaction>();

  async upsert(txn: NewTransaction): Promise<void> {
    this.store.set(txn.id, { ...txn });
  }

  async getById(id: string): Promise<Transaction | null> {
    return this.store.get(id) ?? null;
  }

  async listByAccount(accountId: string): Promise<Transaction[]> {
    return [...this.store.values()].filter((t) => t.accountId === accountId);
  }
}
