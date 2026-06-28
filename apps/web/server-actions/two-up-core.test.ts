import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  DrizzleTwoUpRepo,
  type DbClient,
} from "@upshot/db";
import type { TwoUpTxn } from "@upshot/core";
import { updateTwoUpAttribution } from "./two-up-core";

// 32 hex chars — matches the encrypted-DB key contract used elsewhere.
const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-2up-action-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

let db: DbClient;

const baseRow = (): TwoUpTxn => ({
  id: "txn-1",
  rowHash: "rh-1",
  date: "2024-03-15",
  description: "Woolworths",
  amountCents: -5000,
  owner: "SHARED",
  category: "Groceries",
});

beforeEach(() => {
  const client = createDbClient({ url: tempDbPath(), key: KEY });
  applyMigrations(client.db);
  db = client.db;
});

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("updateTwoUpAttribution", () => {
  it("updates owner on an existing row", async () => {
    const repo = new DrizzleTwoUpRepo(db);
    repo.upsertMany([baseRow()]);

    await updateTwoUpAttribution(db, { id: "txn-1", owner: "JAMES" });

    const rows = repo.list();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.owner).toBe("JAMES");
    expect(rows[0]!.category).toBe("Groceries"); // unchanged
  });

  it("updates category on an existing row", async () => {
    const repo = new DrizzleTwoUpRepo(db);
    repo.upsertMany([baseRow()]);

    await updateTwoUpAttribution(db, { id: "txn-1", category: "Dining" });

    const rows = repo.list();
    expect(rows[0]!.category).toBe("Dining");
    expect(rows[0]!.owner).toBe("SHARED"); // unchanged
  });

  it("can set category to null", async () => {
    const repo = new DrizzleTwoUpRepo(db);
    repo.upsertMany([baseRow()]);

    await updateTwoUpAttribution(db, { id: "txn-1", category: null });

    const rows = repo.list();
    expect(rows[0]!.category).toBeNull();
    expect(rows[0]!.owner).toBe("SHARED"); // unchanged
  });

  it("updates both owner and category together", async () => {
    const repo = new DrizzleTwoUpRepo(db);
    repo.upsertMany([baseRow()]);

    await updateTwoUpAttribution(db, { id: "txn-1", owner: "BRITTNEY", category: "Transport" });

    const rows = repo.list();
    expect(rows[0]!.owner).toBe("BRITTNEY");
    expect(rows[0]!.category).toBe("Transport");
  });
});
