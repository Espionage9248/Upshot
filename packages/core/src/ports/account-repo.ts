import type { Account } from "@upshot/contracts";

/** New-account input: timestamps are assigned by the store. */
export type NewAccount = Omit<Account, "createdAt" | "updatedAt" | "lastSyncedAt"> & {
  lastSyncedAt?: string | null;
};

export interface AccountRepo {
  upsert(account: NewAccount): Promise<void>;
  getById(id: string): Promise<Account | null>;
  list(): Promise<Account[]>;
}
