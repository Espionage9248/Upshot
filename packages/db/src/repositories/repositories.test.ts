import { afterEach, describe, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoContract } from "@upshot/core";
import { createDbClient, type DbClient } from "../client";
import { applyMigrations } from "../migrate";
import { DrizzleAccountRepo } from "./account-repo";
import { DrizzleTransactionRepo } from "./transaction-repo";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshRepos(): { accounts: DrizzleAccountRepo; transactions: DrizzleTransactionRepo } {
  const dir = mkdtempSync(join(tmpdir(), "upshot-repo-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "repo.db"), key: KEY });
  applyMigrations(db as DbClient);
  return { accounts: new DrizzleAccountRepo(db as DbClient), transactions: new DrizzleTransactionRepo(db as DbClient) };
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const contract = repoContract(freshRepos);

describe("Drizzle repos satisfy the repo contract", () => {
  it("upserts and reads an account", contract.upsertsAndReadsAnAccount);
  it("upsert is idempotent and updates", contract.upsertIsIdempotentAndUpdates);
  it("returns null for a missing id", contract.returnsNullForMissing);
  it("upserts and lists transactions by account", contract.upsertsAndListsTransactionsByAccount);
});
