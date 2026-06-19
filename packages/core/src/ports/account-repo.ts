import type { Account } from "@upshot/contracts";

/** New-account input: timestamps are assigned by the store. Goal fields are omitted (optional) so sync writes that carry no goal data do not clobber user-entered goals. */
export type NewAccount = Omit<Account, "createdAt" | "updatedAt" | "lastSyncedAt" | "goalTargetCents" | "goalTargetDate"> & {
  lastSyncedAt?: string | null;
  goalTargetCents?: number | null;
  goalTargetDate?: string | null;
};

export interface AccountRepo {
  upsert(account: NewAccount): Promise<void>;
  getById(id: string): Promise<Account | null>;
  list(): Promise<Account[]>;
  setGoal(accountId: string, goalTargetCents: number | null, goalTargetDate: string | null): Promise<void>;
}
