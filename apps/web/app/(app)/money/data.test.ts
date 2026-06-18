import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  DrizzleAccountRepo,
  tables,
  type DbClient,
} from "@upshot/db";
import { loadLedger } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-money-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

/** Insert a minimal transaction row; caller controls only the fields that differ. */
function insertTx(
  db: DbClient,
  row: {
    id: string;
    accountId: string;
    description?: string;
    status?: "HELD" | "SETTLED";
    amountCents?: number;
    categoryId?: string | null;
    isSalary?: boolean;
    isTransfer?: boolean;
    isInterest?: boolean;
    isTaxDeductible?: boolean;
    createdAt?: string;
  },
) {
  db.insert(tables.transactions)
    .values({
      id: row.id,
      accountId: row.accountId,
      description: row.description ?? row.id,
      status: row.status ?? "SETTLED",
      amountCents: row.amountCents ?? -1000,
      categoryId: row.categoryId ?? null,
      isSalary: row.isSalary ?? false,
      isTransfer: row.isTransfer ?? false,
      isInterest: row.isInterest ?? false,
      isTaxDeductible: row.isTaxDeductible ?? false,
      createdAt: row.createdAt ?? "2026-06-10T10:00:00.000Z",
    })
    .run();
}

async function seedAccount(db: DbClient, id = "acc-1") {
  const repo = new DrizzleAccountRepo(db);
  await repo.upsert({
    id,
    name: "Spending",
    type: "TRANSACTIONAL",
    ownership: "INDIVIDUAL",
    balanceCents: 10000,
    role: "SPENDING",
    monthlyAllocationCents: 0,
    lastSyncedAt: null,
  });
}

describe("loadLedger", () => {
  it("returns rows in createdAt DESC order", async () => {
    const db = freshDb();
    await seedAccount(db);
    insertTx(db, { id: "t1", accountId: "acc-1", createdAt: "2026-06-08T10:00:00.000Z" });
    insertTx(db, { id: "t3", accountId: "acc-1", createdAt: "2026-06-10T10:00:00.000Z" });
    insertTx(db, { id: "t2", accountId: "acc-1", createdAt: "2026-06-09T10:00:00.000Z" });

    const result = await loadLedger(db, {}, 0);

    expect(result.rows.map((r) => r.id)).toEqual(["t3", "t2", "t1"]);
  });

  it("returns total and hasNext=false when all rows fit on one page", async () => {
    const db = freshDb();
    await seedAccount(db);
    insertTx(db, { id: "t1", accountId: "acc-1" });
    insertTx(db, { id: "t2", accountId: "acc-1" });

    const result = await loadLedger(db, {}, 0);

    expect(result.total).toBe(2);
    expect(result.hasNext).toBe(false);
  });

  it("filters by accountId", async () => {
    const db = freshDb();
    await seedAccount(db, "acc-1");
    await seedAccount(db, "acc-2");
    insertTx(db, { id: "t1", accountId: "acc-1" });
    insertTx(db, { id: "t2", accountId: "acc-2" });

    const result = await loadLedger(db, { accountId: "acc-1" }, 0);

    expect(result.rows.map((r) => r.id)).toEqual(["t1"]);
    expect(result.total).toBe(1);
  });

  it("filters by status", async () => {
    const db = freshDb();
    await seedAccount(db);
    insertTx(db, { id: "held", accountId: "acc-1", status: "HELD" });
    insertTx(db, { id: "settled", accountId: "acc-1", status: "SETTLED" });

    const result = await loadLedger(db, { status: "HELD" }, 0);

    expect(result.rows.map((r) => r.id)).toEqual(["held"]);
    expect(result.total).toBe(1);
  });

  it("filters by categoryId", async () => {
    const db = freshDb();
    await seedAccount(db);
    // Insert a category row first to satisfy FK
    db.insert(tables.categories).values({ id: "cat-food", name: "Food", parentId: null }).run();
    insertTx(db, { id: "t-cat", accountId: "acc-1", categoryId: "cat-food" });
    insertTx(db, { id: "t-nocat", accountId: "acc-1", categoryId: null });

    const result = await loadLedger(db, { categoryId: "cat-food" }, 0);

    expect(result.rows.map((r) => r.id)).toEqual(["t-cat"]);
    expect(result.total).toBe(1);
  });

  it("filters by boolean flag isSalary", async () => {
    const db = freshDb();
    await seedAccount(db);
    insertTx(db, { id: "salary", accountId: "acc-1", isSalary: true });
    insertTx(db, { id: "other", accountId: "acc-1", isSalary: false });

    const result = await loadLedger(db, { isSalary: true }, 0);

    expect(result.rows.map((r) => r.id)).toEqual(["salary"]);
    expect(result.total).toBe(1);
  });

  it("filters by boolean flag isTransfer", async () => {
    const db = freshDb();
    await seedAccount(db);
    insertTx(db, { id: "transfer", accountId: "acc-1", isTransfer: true });
    insertTx(db, { id: "other", accountId: "acc-1", isTransfer: false });

    const result = await loadLedger(db, { isTransfer: true }, 0);

    expect(result.rows.map((r) => r.id)).toEqual(["transfer"]);
    expect(result.total).toBe(1);
  });

  it("filters by boolean flag isInterest", async () => {
    const db = freshDb();
    await seedAccount(db);
    insertTx(db, { id: "interest", accountId: "acc-1", isInterest: true });
    insertTx(db, { id: "other", accountId: "acc-1", isInterest: false });

    const result = await loadLedger(db, { isInterest: true }, 0);

    expect(result.rows.map((r) => r.id)).toEqual(["interest"]);
    expect(result.total).toBe(1);
  });

  it("filters by boolean flag isTaxDeductible", async () => {
    const db = freshDb();
    await seedAccount(db);
    insertTx(db, { id: "deductible", accountId: "acc-1", isTaxDeductible: true });
    insertTx(db, { id: "other", accountId: "acc-1", isTaxDeductible: false });

    const result = await loadLedger(db, { isTaxDeductible: true }, 0);

    expect(result.rows.map((r) => r.id)).toEqual(["deductible"]);
    expect(result.total).toBe(1);
  });

  it("filters by inclusive date range (from and to)", async () => {
    const db = freshDb();
    await seedAccount(db);
    insertTx(db, { id: "before", accountId: "acc-1", createdAt: "2026-06-01T00:00:00.000Z" });
    insertTx(db, { id: "from",   accountId: "acc-1", createdAt: "2026-06-05T00:00:00.000Z" });
    insertTx(db, { id: "mid",    accountId: "acc-1", createdAt: "2026-06-10T00:00:00.000Z" });
    insertTx(db, { id: "to",     accountId: "acc-1", createdAt: "2026-06-15T00:00:00.000Z" });
    insertTx(db, { id: "after",  accountId: "acc-1", createdAt: "2026-06-20T00:00:00.000Z" });

    const result = await loadLedger(
      db,
      { from: "2026-06-05T00:00:00.000Z", to: "2026-06-15T00:00:00.000Z" },
      0,
    );

    expect(result.rows.map((r) => r.id)).toEqual(["to", "mid", "from"]);
    expect(result.total).toBe(3);
  });

  it("free-text filter on description is case-insensitive (SQLite LIKE)", async () => {
    const db = freshDb();
    await seedAccount(db);
    insertTx(db, { id: "match",   accountId: "acc-1", description: "Coffee Shop" });
    insertTx(db, { id: "nomatch", accountId: "acc-1", description: "Groceries" });

    // Query lowercase — must still match the mixed-case description
    const result = await loadLedger(db, { q: "coffee" }, 0);

    expect(result.rows.map((r) => r.id)).toEqual(["match"]);
    expect(result.total).toBe(1);
  });

  it("filters compose with AND semantics", async () => {
    const db = freshDb();
    await seedAccount(db, "acc-1");
    await seedAccount(db, "acc-2");
    insertTx(db, { id: "acc1-settled",  accountId: "acc-1", status: "SETTLED" });
    insertTx(db, { id: "acc1-held",     accountId: "acc-1", status: "HELD" });
    insertTx(db, { id: "acc2-settled",  accountId: "acc-2", status: "SETTLED" });

    // Only acc-1 + SETTLED should match
    const result = await loadLedger(db, { accountId: "acc-1", status: "SETTLED" }, 0);

    expect(result.rows.map((r) => r.id)).toEqual(["acc1-settled"]);
    expect(result.total).toBe(1);
  });

  it("filters by tagId via join-table subquery", async () => {
    const db = freshDb();
    await seedAccount(db);
    insertTx(db, { id: "tagged",   accountId: "acc-1" });
    insertTx(db, { id: "untagged", accountId: "acc-1" });
    // Insert a tag and link it to the first transaction
    db.insert(tables.tags).values({ id: "tag-work", createdAt: "2026-06-10T00:00:00.000Z" }).run();
    db.insert(tables.transactionTags).values({ transactionId: "tagged", tagId: "tag-work" }).run();

    const result = await loadLedger(db, { tagId: "tag-work" }, 0);

    expect(result.rows.map((r) => r.id)).toEqual(["tagged"]);
    expect(result.total).toBe(1);
  });

  it("free-text filter treats LIKE metacharacters as literals (not wildcards)", async () => {
    const db = freshDb();
    await seedAccount(db);
    insertTx(db, { id: "literal-match",  accountId: "acc-1", description: "50% off coffee" });
    insertTx(db, { id: "no-match",       accountId: "acc-1", description: "500 dollars" });

    // "50%" must match only the literal substring "50%", NOT treat % as a wildcard
    const result = await loadLedger(db, { q: "50%" }, 0);

    expect(result.rows.map((r) => r.id)).toEqual(["literal-match"]);
    expect(result.total).toBe(1);
  });

  it("paginates: page 1 returns the next 50 rows and hasNext reflects remaining rows", async () => {
    const db = freshDb();
    await seedAccount(db);
    // Insert 55 transactions; createdAt is padded so ordering is deterministic
    for (let i = 1; i <= 55; i++) {
      const pad = String(i).padStart(2, "0");
      insertTx(db, {
        id: `t${pad}`,
        accountId: "acc-1",
        createdAt: `2026-06-${pad}T00:00:00.000Z`,
      });
    }

    const page0 = await loadLedger(db, {}, 0);
    expect(page0.rows).toHaveLength(50);
    expect(page0.total).toBe(55);
    expect(page0.hasNext).toBe(true);

    const page1 = await loadLedger(db, {}, 1);
    expect(page1.rows).toHaveLength(5);
    expect(page1.total).toBe(55);
    expect(page1.hasNext).toBe(false);
  });
});
