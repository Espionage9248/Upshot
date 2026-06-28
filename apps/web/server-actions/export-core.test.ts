import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, tables, type DbClient } from "@upshot/db";
import { buildTaxCsv } from "./export-core";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

// now = 2026-06-28; inside FY2025-26 (Jul 2025 – Jun 2026).
const NOW = "2026-06-28T00:00:00.000Z";

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-export-core-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

function seed(db: DbClient): void {
  // Spending account + one deductible settled transaction in FY2025-26.
  db.insert(tables.accounts)
    .values([
      {
        id: "acc-spend",
        name: "Spending",
        type: "TRANSACTIONAL",
        ownership: "INDIVIDUAL",
        balanceCents: 100000,
        role: "SPENDING",
        monthlyAllocationCents: 0,
      },
    ])
    .run();

  db.insert(tables.transactions)
    .values([
      {
        id: "tx-deductible-1",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "Home Office Supplies",
        amountCents: -5000,
        currency: "AUD",
        categoryId: null,
        parentCategoryId: null,
        isTransfer: false,
        isSalary: false,
        isTaxDeductible: true,
        taxDeductionCategory: "Home office",
        settledAt: "2026-03-15T00:00:00.000Z",
        createdAt: "2026-03-15T00:00:00.000Z",
      },
    ])
    .run();
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("buildTaxCsv", () => {
  it("returns a dated filename and CSV containing the deductible total", async () => {
    const db = freshDb();
    seed(db);

    const { filename, csv } = await buildTaxCsv(db, { now: NOW });
    expect(filename).toMatch(/^upshot-tax-FY2025-26\.csv$/);
    expect(csv).toContain("Deductible total");
  });
});
