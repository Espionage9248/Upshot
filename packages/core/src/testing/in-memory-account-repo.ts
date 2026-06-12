import type { Account } from "@upshot/contracts";
import type { AccountRepo, NewAccount } from "../ports/account-repo";

export class InMemoryAccountRepo implements AccountRepo {
  private readonly store = new Map<string, Account>();

  async upsert(account: NewAccount): Promise<void> {
    const now = new Date().toISOString();
    const existing = this.store.get(account.id);
    this.store.set(account.id, {
      ...account,
      // Full-replace upsert: the write wins (matches DrizzleAccountRepo). createdAt is preserved.
      lastSyncedAt: account.lastSyncedAt ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async getById(id: string): Promise<Account | null> {
    return this.store.get(id) ?? null;
  }

  async list(): Promise<Account[]> {
    return [...this.store.values()];
  }
}
