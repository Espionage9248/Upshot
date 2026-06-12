import type { Transaction } from "@upshot/contracts";

/** New-transaction input: createdAt is required (Up provides it); the rest map 1:1. */
export type NewTransaction = Transaction;

export interface TransactionRepo {
  upsert(txn: NewTransaction): Promise<void>;
  getById(id: string): Promise<Transaction | null>;
  listByAccount(accountId: string): Promise<Transaction[]>;
}
