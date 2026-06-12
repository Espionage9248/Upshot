import { describe, it } from "vitest";
import { repoContract } from "./repo-contract";
import { InMemoryAccountRepo } from "./testing/in-memory-account-repo";
import { InMemoryTransactionRepo } from "./testing/in-memory-transaction-repo";

const contract = repoContract(() => ({
  accounts: new InMemoryAccountRepo(),
  transactions: new InMemoryTransactionRepo(),
}));

describe("in-memory repos satisfy the repo contract", () => {
  it("upserts and reads an account", contract.upsertsAndReadsAnAccount);
  it("upsert is idempotent and updates", contract.upsertIsIdempotentAndUpdates);
  it("returns null for a missing id", contract.returnsNullForMissing);
  it("upserts and lists transactions by account", contract.upsertsAndListsTransactionsByAccount);
});
