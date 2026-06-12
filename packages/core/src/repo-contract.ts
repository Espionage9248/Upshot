import { expect } from "vitest";
import type { AccountRepo } from "./ports/account-repo";
import type { TransactionRepo } from "./ports/transaction-repo";

export interface RepoUnderTest {
  accounts: AccountRepo;
  transactions: TransactionRepo;
}

/** Behaviours every AccountRepo + TransactionRepo implementation must satisfy. */
export function repoContract(make: () => Promise<RepoUnderTest> | RepoUnderTest) {
  return {
    async upsertsAndReadsAnAccount() {
      const { accounts } = await make();
      await accounts.upsert({
        id: "acc-1", name: "Spending", type: "TRANSACTIONAL", ownership: "INDIVIDUAL",
        balanceCents: 5000, role: "SPENDING", monthlyAllocationCents: 0,
      });
      const got = await accounts.getById("acc-1");
      expect(got?.balanceCents).toBe(5000);
      expect(got?.createdAt).toBeTypeOf("string");
    },

    async upsertIsIdempotentAndUpdates() {
      const { accounts } = await make();
      const base = {
        id: "acc-1", name: "Spending", type: "TRANSACTIONAL", ownership: "INDIVIDUAL",
        balanceCents: 5000, role: "SPENDING", monthlyAllocationCents: 0,
      } as const;
      await accounts.upsert({ ...base, lastSyncedAt: "2026-01-01T00:00:00.000Z" });
      const first = await accounts.getById("acc-1");
      await accounts.upsert({ ...base, balanceCents: 9000 });
      const second = await accounts.getById("acc-1");
      expect(await accounts.list()).toHaveLength(1);
      expect(second?.balanceCents).toBe(9000);
      // createdAt is stable across upserts; lastSyncedAt follows the latest write (full-replace).
      expect(second?.createdAt).toBe(first?.createdAt);
      expect(second?.lastSyncedAt).toBeNull();
    },

    async returnsNullForMissing() {
      const { accounts } = await make();
      expect(await accounts.getById("nope")).toBeNull();
    },

    async upsertsAndListsTransactionsByAccount() {
      const repos = await make();
      await repos.accounts.upsert({
        id: "acc-1", name: "S", type: "TRANSACTIONAL", ownership: "INDIVIDUAL",
        balanceCents: 0, role: "SPENDING", monthlyAllocationCents: 0,
      });
      await repos.transactions.upsert(txn("txn-1", "acc-1", -550));
      await repos.transactions.upsert(txn("txn-2", "acc-1", -200));
      const list = await repos.transactions.listByAccount("acc-1");
      expect(list.map((t) => t.id).sort()).toEqual(["txn-1", "txn-2"]);
      expect((await repos.transactions.getById("txn-1"))?.amountCents).toBe(-550);
    },
  };
}

function txn(id: string, accountId: string, amountCents: number) {
  return {
    id, accountId, status: "SETTLED" as const, description: "x", message: null, rawText: null,
    amountCents, currency: "AUD", foreignAmountCents: null, foreignCurrency: null,
    categoryId: null, parentCategoryId: null, isTransfer: false, transferAccountId: null,
    isSalary: false, isInterest: false, isTaxDeductible: false, taxDeductionCategory: null,
    cardPurchaseMethod: null, cardNumberSuffix: null, roundUpCents: null, cashbackCents: null,
    note: null, attachmentId: null, attachmentUrl: null, settledAt: null,
    createdAt: "2026-06-12T00:00:00.000Z",
  };
}
