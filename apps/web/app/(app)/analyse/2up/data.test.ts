import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, DrizzleTwoUpRepo, type DbClient } from "@upshot/db";
import { buildOverview, type TwoUpTxn } from "@upshot/core";
import { loadTwoUpOverview } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-2up-ov-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

let db: DbClient;

const makeRows = (): TwoUpTxn[] => [
  {
    id: "t1",
    rowHash: "rh1",
    date: "2023-06-01",
    description: "Pay",
    amountCents: 300000,
    owner: "JAMES",
    category: null,
  },
  {
    id: "t2",
    rowHash: "rh2",
    date: "2023-06-10",
    description: "Woolworths",
    amountCents: -8500,
    owner: "SHARED",
    category: "Groceries",
  },
  {
    id: "t3",
    rowHash: "rh3",
    date: "2023-07-05",
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

describe("loadTwoUpOverview", () => {
  it("returns the same totals as buildOverview called on the same rows", () => {
    const rows = makeRows();
    new DrizzleTwoUpRepo(db).upsertMany(rows);

    const result = loadTwoUpOverview(db);
    const expected = buildOverview(rows);

    expect(result.totalInCents).toBe(expected.totalInCents);
    expect(result.totalSpentCents).toBe(expected.totalSpentCents);
    expect(result.distributedCents).toBe(expected.distributedCents);
    expect(result.james.putInCents).toBe(expected.james.putInCents);
    expect(result.britt.putInCents).toBe(expected.britt.putInCents);
    expect(result.settlement.whoOwedWhomCents).toBe(expected.settlement.whoOwedWhomCents);
    expect(result.categories).toHaveLength(expected.categories.length);
    expect(result.rhythm).toHaveLength(expected.rhythm.length);
  });

  it("returns zero totals for an empty database", () => {
    const result = loadTwoUpOverview(db);
    expect(result.totalInCents).toBe(0);
    expect(result.totalSpentCents).toBe(0);
    expect(result.categories).toHaveLength(0);
    expect(result.rhythm).toHaveLength(0);
  });
});
