import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  DrizzleInstallmentRepo,
  tables,
  type DbClient,
} from "@upshot/db";
import { loadInstallmentsData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-installments-data-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("loadInstallmentsData", () => {
  it("returns empty active and complete when no plans exist", async () => {
    const db = freshDb();
    const result = await loadInstallmentsData(db);

    expect(result.active).toHaveLength(0);
    expect(result.complete).toHaveLength(0);
  });

  it("returns an active plan with computed progress", async () => {
    const db = freshDb();
    const repo = new DrizzleInstallmentRepo(db);
    await repo.create({
      id: "plan-afterpay",
      merchant: "Afterpay",
      totalCents: 20000,
      installmentCents: 5000,
      totalInstallments: 4,
      installmentsPaid: 1,
      frequencyDays: 14,
      firstDueDate: "2026-06-01",
      nextDueDate: "2026-06-15",
      status: "ACTIVE",
      matchRuleId: null,
      notes: null,
    });

    const result = await loadInstallmentsData(db);

    expect(result.active).toHaveLength(1);
    expect(result.complete).toHaveLength(0);
    expect(result.active[0]!.row.id).toBe("plan-afterpay");
    expect(result.active[0]!.row.merchant).toBe("Afterpay");
    // 1 of 4 paid → 25%
    expect(result.active[0]!.progress.percentComplete).toBe(25);
    // 3 remaining installments × 5000 = 15000
    expect(result.active[0]!.progress.remainingCents).toBe(15000);
  });

  it("classifies COMPLETE plans in the complete bucket", async () => {
    const db = freshDb();
    const repo = new DrizzleInstallmentRepo(db);
    await repo.create({
      id: "plan-zip",
      merchant: "Zip",
      totalCents: 30000,
      installmentCents: 7500,
      totalInstallments: 4,
      installmentsPaid: 4,
      frequencyDays: 14,
      firstDueDate: "2026-04-01",
      nextDueDate: "2026-06-10",
      status: "COMPLETE",
      matchRuleId: null,
      notes: null,
    });

    const result = await loadInstallmentsData(db);

    expect(result.active).toHaveLength(0);
    expect(result.complete).toHaveLength(1);
    expect(result.complete[0]!.id).toBe("plan-zip");
  });

  it("separates active and complete plans correctly", async () => {
    const db = freshDb();
    const repo = new DrizzleInstallmentRepo(db);

    await repo.create({
      id: "plan-active",
      merchant: "Klarna",
      totalCents: 10000,
      installmentCents: 2500,
      totalInstallments: 4,
      installmentsPaid: 2,
      frequencyDays: 14,
      firstDueDate: "2026-06-01",
      nextDueDate: "2026-06-29",
      status: "ACTIVE",
      matchRuleId: null,
      notes: null,
    });

    await repo.create({
      id: "plan-done",
      merchant: "Laybuy",
      totalCents: 6000,
      installmentCents: 1000,
      totalInstallments: 6,
      installmentsPaid: 6,
      frequencyDays: 7,
      firstDueDate: "2026-04-01",
      nextDueDate: "2026-05-12",
      status: "COMPLETE",
      matchRuleId: null,
      notes: null,
    });

    const result = await loadInstallmentsData(db);

    expect(result.active).toHaveLength(1);
    expect(result.complete).toHaveLength(1);
    expect(result.active[0]!.row.id).toBe("plan-active");
    expect(result.complete[0]!.id).toBe("plan-done");
    // 2 of 4 paid → 50%
    expect(result.active[0]!.progress.percentComplete).toBe(50);
    expect(result.active[0]!.progress.remainingCents).toBe(5000);
  });

  it("derives a plan's category from its linked transactions (most common)", async () => {
    const db = freshDb();
    const repo = new DrizzleInstallmentRepo(db);

    db.insert(tables.accounts).values({
      id: "acc-1", name: "Spending", type: "TRANSACTIONAL", ownership: "INDIVIDUAL", balanceCents: 0, role: "SPENDING",
    }).run();
    db.insert(tables.categories).values([
      { id: "cat-shop", name: "Shopping", parentId: null },
      { id: "cat-tech", name: "Tech", parentId: null },
    ]).run();
    db.insert(tables.transactions).values([
      { id: "tx-1", accountId: "acc-1", status: "SETTLED", description: "Zip 1", amountCents: -2500, categoryId: "cat-shop", createdAt: "2026-06-01T00:00:00.000Z" },
      { id: "tx-2", accountId: "acc-1", status: "SETTLED", description: "Zip 2", amountCents: -2500, categoryId: "cat-shop", createdAt: "2026-06-15T00:00:00.000Z" },
      { id: "tx-3", accountId: "acc-1", status: "SETTLED", description: "Zip 3", amountCents: -2500, categoryId: "cat-tech", createdAt: "2026-06-29T00:00:00.000Z" },
    ]).run();

    await repo.create({
      id: "plan-zip", merchant: "Zip", totalCents: 10000, installmentCents: 2500,
      totalInstallments: 4, installmentsPaid: 3, frequencyDays: 14,
      firstDueDate: "2026-06-01", nextDueDate: "2026-06-29", status: "ACTIVE",
      matchRuleId: null, notes: null,
    });
    await repo.applyMatches([], [
      { planId: "plan-zip", transactionId: "tx-1", dueIndex: 1, paidAt: "2026-06-01" },
      { planId: "plan-zip", transactionId: "tx-2", dueIndex: 2, paidAt: "2026-06-15" },
      { planId: "plan-zip", transactionId: "tx-3", dueIndex: 3, paidAt: "2026-06-29" },
    ]);

    const result = await loadInstallmentsData(db);
    expect(result.active).toHaveLength(1);
    // Two txs in Shopping vs one in Tech → Shopping wins.
    expect(result.active[0]!.row.category).toBe("Shopping");
  });

  it("derives null category when no linked transactions have a category", async () => {
    const db = freshDb();
    const repo = new DrizzleInstallmentRepo(db);
    await repo.create({
      id: "plan-bare", merchant: "Afterpay", totalCents: 8000, installmentCents: 2000,
      totalInstallments: 4, installmentsPaid: 1, frequencyDays: 14,
      firstDueDate: "2026-06-01", nextDueDate: "2026-06-15", status: "ACTIVE",
      matchRuleId: null, notes: null,
    });
    const result = await loadInstallmentsData(db);
    expect(result.active[0]!.row.category).toBeNull();
  });

  it("never leaks the encryption key in the returned data", async () => {
    const db = freshDb();
    const result = await loadInstallmentsData(db);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(KEY);
    expect(serialized).not.toContain("DB_ENCRYPTION_KEY");
  });
});
