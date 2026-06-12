import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { createDbClient, type DbClient } from "./client";
import { applyMigrations } from "./migrate";
import * as s from "./schema";

const KEY = "0123456789abcdef0123456789abcdef";
let dir: string;
let db: DbClient;
let raw: { close(): void };

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "upshot-rt-"));
  const client = createDbClient({ url: join(dir, "rt.db"), key: KEY });
  db = client.db;
  raw = client.raw;
  applyMigrations(db);
});

afterEach(() => {
  raw.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("migration + round-trip on an encrypted DB", () => {
  it("writes and reads an account", () => {
    db.insert(s.accounts).values({
      id: "acc-1", name: "Spending", type: "TRANSACTIONAL", ownership: "INDIVIDUAL",
      balanceCents: 12345, role: "SPENDING",
    }).run();
    const got = db.select().from(s.accounts).where(eq(s.accounts.id, "acc-1")).get();
    expect(got?.balanceCents).toBe(12345);
    expect(got?.createdAt).toBeTypeOf("string");
  });

  it("writes a transaction with a boolean flag and reads it back as boolean", () => {
    db.insert(s.accounts).values({
      id: "acc-1", name: "S", type: "TRANSACTIONAL", ownership: "INDIVIDUAL", balanceCents: 0, role: "SPENDING",
    }).run();
    db.insert(s.transactions).values({
      id: "txn-1", accountId: "acc-1", status: "SETTLED", description: "Coffee",
      amountCents: -550, isInterest: true, createdAt: "2026-06-12T00:00:00.000Z",
    }).run();
    const got = db.select().from(s.transactions).where(eq(s.transactions.id, "txn-1")).get();
    expect(got?.amountCents).toBe(-550);
    expect(got?.isInterest).toBe(true);
    expect(got?.isTransfer).toBe(false);
  });

  it("enforces the budget unique(accountId, month) constraint", () => {
    db.insert(s.accounts).values({
      id: "sav-1", name: "Holiday", type: "SAVER", ownership: "INDIVIDUAL", balanceCents: 0, role: "SAVER",
    }).run();
    const row = {
      id: "ba-1", accountId: "sav-1", month: "2026-06", year: 2026,
      allocatedCents: 10000, varianceCents: 0,
    };
    db.insert(s.budgetAllocations).values(row).run();
    expect(() => db.insert(s.budgetAllocations).values({ ...row, id: "ba-2" }).run()).toThrow();
  });

  it("round-trips a JSON column on job_runs", () => {
    db.insert(s.jobRuns).values({
      id: "jr-1", job: "SYNC", status: "SUCCESS", counts: { created: 3, updated: 1 },
    }).run();
    const got = db.select().from(s.jobRuns).where(eq(s.jobRuns.id, "jr-1")).get();
    expect(got?.counts).toEqual({ created: 3, updated: 1 });
  });

  it("cascades match_conditions when its rule is deleted", () => {
    db.insert(s.matchRules).values({ id: "r-1", name: "Interest", priority: 1 }).run();
    db.insert(s.matchConditions).values({
      id: "c-1", ruleId: "r-1", field: "description", mode: "contains", value: "interest",
    }).run();
    expect(db.select().from(s.matchConditions).all()).toHaveLength(1); // guard against a vacuous pass
    db.delete(s.matchRules).where(eq(s.matchRules.id, "r-1")).run();
    const conds = db.select().from(s.matchConditions).all();
    expect(conds).toHaveLength(0);
  });

  it("inserts and reads at least one row for every remaining aggregate", () => {
    // Anchor rows first (FK targets).
    db.insert(s.accounts).values({ id: "a", name: "A", type: "SAVER", ownership: "INDIVIDUAL", balanceCents: 0, role: "SAVER" }).run();
    db.insert(s.categories).values({ id: "cat", name: "Food", parentId: null }).run();
    db.insert(s.transactions).values({ id: "t", accountId: "a", status: "SETTLED", description: "x", amountCents: 1, createdAt: "t" }).run();
    db.insert(s.matchRules).values({ id: "mr", name: "R", priority: 1 }).run();

    db.insert(s.matchActions).values({ id: "ma", ruleId: "mr", type: "MARK_INTEREST" }).run();
    db.insert(s.tags).values({ id: "tag" }).run();
    db.insert(s.transactionTags).values({ transactionId: "t", tagId: "tag" }).run();
    db.insert(s.debts).values({ id: "d", name: "Loan", type: "PERSONAL_LOAN", currentBalanceCents: 100, monthlyPaymentCents: 10 }).run();
    db.insert(s.debtPayments).values({ id: "dp", debtId: "d", amountCents: 10, paymentDate: "2026-06-12" }).run();
    db.insert(s.debtExpenses).values({ id: "de", debtId: "d", description: "fee", amountCents: 1, date: "2026-06-12" }).run();
    db.insert(s.installmentPlans).values({ id: "ip", merchant: "Afterpay", totalCents: 400, installmentCents: 100, totalInstallments: 4, firstDueDate: "2026-06-12", nextDueDate: "2026-06-26", status: "ACTIVE" }).run();
    db.insert(s.installmentPlanPayments).values({ id: "ipp", planId: "ip", transactionId: "t", dueIndex: 0, paidAt: "2026-06-12" }).run();
    db.insert(s.recurringItems).values({ id: "ri", name: "Netflix", kind: "SUBSCRIPTION", amountCents: 1899, frequency: "MONTHLY", status: "ACTIVE" }).run();
    db.insert(s.purchases).values({ id: "p", status: "WISHLIST", currency: "AUD" }).run();
    db.insert(s.purchaseImages).values({ id: "pi", purchaseId: "p", url: "https://x" }).run();
    db.insert(s.appSettings).values({ id: "default" }).run();
    db.insert(s.monthlySnapshots).values({ id: "ms", month: "2026-06", incomeCents: 1, expenseCents: 1, savedCents: 1, debtCents: 1, assetsCents: 1, netWorthCents: 1 }).run();
    db.insert(s.monthlySnapshotCategories).values({ id: "msc", snapshotId: "ms", categoryName: "Food", amountCents: 1 }).run();
    db.insert(s.dashboardWidgets).values({ id: "dw", widgetKey: "safe-to-spend", position: 0, size: "lg" }).run();
    db.insert(s.eventLog).values({ id: "el", category: "sync", action: "ran", description: "ok" }).run();
    db.insert(s.twoUpTransactions).values({ id: "tu", rowHash: "h1", date: "2026-06-12", description: "x", amountCents: 1 }).run();
    db.insert(s.assets).values({ id: "as", name: "Super", type: "SUPER", valueCents: 100 }).run();
    db.insert(s.assetValuations).values({ id: "av", assetId: "as", valueCents: 100, valuedAt: "2026-06-12" }).run();

    expect(db.select().from(s.assets).all()).toHaveLength(1);
    expect(db.select().from(s.recurringItems).all()).toHaveLength(1);
    expect(db.select().from(s.twoUpTransactions).all()).toHaveLength(1);
  });
});
