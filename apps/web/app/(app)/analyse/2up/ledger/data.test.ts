import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, DrizzleTwoUpRepo, type DbClient } from "@upshot/db";
import type { TwoUpTxn } from "@upshot/core";
import { loadTwoUpLedger } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-2up-ledger-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

let db: DbClient;

const makeRows = (): TwoUpTxn[] => [
  {
    id: "t1",
    rowHash: "rh1",
    date: "2023-06-01",
    description: "Pay James",
    amountCents: 300000,
    owner: "JAMES",
    category: null,
  },
  {
    id: "t2",
    rowHash: "rh2",
    date: "2023-07-10",
    description: "Woolworths",
    amountCents: -8500,
    owner: "SHARED",
    category: "Groceries",
  },
  {
    id: "t3",
    rowHash: "rh3",
    date: "2023-05-15",
    description: "Salary Britt",
    amountCents: 250000,
    owner: "BRITTNEY",
    category: null,
  },
];

beforeEach(() => {
  const client = createDbClient({ url: tempDbPath(), key: KEY });
  applyMigrations(client.db);
  db = client.db;
});

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("loadTwoUpLedger", () => {
  it("returns rows sorted date DESC", () => {
    const rows = makeRows();
    new DrizzleTwoUpRepo(db).upsertMany(rows);

    const result = loadTwoUpLedger(db);
    expect(result.length).toBe(3);
    // date DESC: 2023-07-10 > 2023-06-01 > 2023-05-15
    expect(result[0]!.date).toBe("2023-07-10");
    expect(result[1]!.date).toBe("2023-06-01");
    expect(result[2]!.date).toBe("2023-05-15");
  });

  it("returns empty array for an empty database", () => {
    expect(loadTwoUpLedger(db)).toHaveLength(0);
  });

  it("includes all expected fields on each row", () => {
    const rows = makeRows();
    new DrizzleTwoUpRepo(db).upsertMany(rows);
    const result = loadTwoUpLedger(db);
    const woolies = result.find((r) => r.description === "Woolworths");
    expect(woolies).toBeDefined();
    expect(woolies!.amountCents).toBe(-8500);
    expect(woolies!.owner).toBe("SHARED");
    expect(woolies!.category).toBe("Groceries");
  });
});
