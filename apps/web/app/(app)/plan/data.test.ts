import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  DrizzleDebtRepo,
  DrizzleInstallmentRepo,
  DrizzleRecurringRepo,
  type DbClient,
} from "@upshot/db";
import { loadPlanHubData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-plan-hub-data-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

// A fixed "today" so upcomingRecurring window is deterministic
const NOW = new Date("2026-06-20T10:00:00.000Z");

describe("loadPlanHubData", () => {
  it("returns zeros and nulls when DB is empty", async () => {
    const db = freshDb();
    const result = await loadPlanHubData(db, NOW);

    expect(result.debtTotalCents).toBe(0);
    expect(result.debtFreeMonth).toBeNull();
    expect(result.nextBnpl).toBeNull();
    expect(result.upcomingRecurring).toHaveLength(0);
    expect(result.recurringMonthlyTotalCents).toBe(0);
  });

  it("sums includeInNetWorth debts for debtTotalCents", async () => {
    const db = freshDb();
    const repo = new DrizzleDebtRepo(db);

    // In net worth — should be included
    await repo.create({
      id: "debt-1",
      name: "Visa",
      type: "CREDIT_CARD",
      currentBalanceCents: 100000,
      originalBalanceCents: null,
      creditLimitCents: 500000,
      monthlyPaymentCents: 10000,
      minimumPaymentCents: 2500,
      interestRate: 0.20,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 1,
      includeInSnowball: true,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: null,
      notes: null,
    });

    // In net worth — should also be included
    await repo.create({
      id: "debt-2",
      name: "Car Loan",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 200000,
      originalBalanceCents: null,
      creditLimitCents: null,
      monthlyPaymentCents: 15000,
      minimumPaymentCents: 15000,
      interestRate: 0.08,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 2,
      includeInSnowball: true,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: null,
      notes: null,
    });

    // NOT in net worth — should be excluded from total
    await repo.create({
      id: "debt-3",
      name: "Store Card",
      type: "CREDIT_CARD",
      currentBalanceCents: 50000,
      originalBalanceCents: null,
      creditLimitCents: 100000,
      monthlyPaymentCents: 5000,
      minimumPaymentCents: 1000,
      interestRate: 0.25,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 3,
      includeInSnowball: false,
      includeInNetWorth: false,
      matchRuleId: null,
      accountNumber: null,
      institutionName: null,
      notes: null,
    });

    const result = await loadPlanHubData(db, NOW);

    // Only debt-1 + debt-2 included
    expect(result.debtTotalCents).toBe(300000);
  });

  it("derives debtFreeMonth from snowball analysis", async () => {
    const db = freshDb();
    const repo = new DrizzleDebtRepo(db);

    await repo.create({
      id: "debt-snow",
      name: "Loan",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 300000,
      originalBalanceCents: null,
      creditLimitCents: null,
      monthlyPaymentCents: 30000,
      minimumPaymentCents: 30000,
      interestRate: 0.08,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 1,
      includeInSnowball: true,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: null,
      notes: null,
    });

    const result = await loadPlanHubData(db, NOW);

    // Should have a non-null debtFreeMonth (exact value depends on rate calc)
    expect(result.debtFreeMonth).not.toBeNull();
    // Should be a yyyy-MM string
    expect(result.debtFreeMonth).toMatch(/^\d{4}-\d{2}$/);
  });

  it("picks the earliest nextDueDate ACTIVE installment as nextBnpl", async () => {
    const db = freshDb();
    const repo = new DrizzleInstallmentRepo(db);

    // Due sooner
    await repo.create({
      id: "plan-earlier",
      merchant: "Afterpay",
      totalCents: 20000,
      installmentCents: 5000,
      totalInstallments: 4,
      installmentsPaid: 1,
      frequencyDays: 14,
      firstDueDate: "2026-06-01",
      nextDueDate: "2026-06-25",
      status: "ACTIVE",
      matchRuleId: null,
      notes: null,
    });

    // Due later
    await repo.create({
      id: "plan-later",
      merchant: "Klarna",
      totalCents: 30000,
      installmentCents: 7500,
      totalInstallments: 4,
      installmentsPaid: 1,
      frequencyDays: 14,
      firstDueDate: "2026-06-01",
      nextDueDate: "2026-07-10",
      status: "ACTIVE",
      matchRuleId: null,
      notes: null,
    });

    const result = await loadPlanHubData(db, NOW);

    expect(result.nextBnpl).not.toBeNull();
    expect(result.nextBnpl!.merchant).toBe("Afterpay");
    expect(result.nextBnpl!.nextDueDate).toBe("2026-06-25");
    expect(result.nextBnpl!.installmentCents).toBe(5000);
  });

  it("returns null nextBnpl when there are no active installment plans", async () => {
    const db = freshDb();
    const result = await loadPlanHubData(db, NOW);
    expect(result.nextBnpl).toBeNull();
  });

  it("returns null nextBnpl when only COMPLETE plans exist", async () => {
    const db = freshDb();
    const repo = new DrizzleInstallmentRepo(db);

    await repo.create({
      id: "plan-done",
      merchant: "Zip",
      totalCents: 10000,
      installmentCents: 2500,
      totalInstallments: 4,
      installmentsPaid: 4,
      frequencyDays: 14,
      firstDueDate: "2026-04-01",
      nextDueDate: "2026-06-10",
      status: "COMPLETE",
      matchRuleId: null,
      notes: null,
    });

    const result = await loadPlanHubData(db, NOW);
    expect(result.nextBnpl).toBeNull();
  });

  it("includes ACTIVE recurring items due within 30 days in upcomingRecurring", async () => {
    const db = freshDb();
    const repo = new DrizzleRecurringRepo(db);

    // Due in 5 days — within window
    await repo.create({
      name: "Netflix",
      kind: "SUBSCRIPTION",
      amountCents: 1799,
      frequency: "MONTHLY",
      status: "ACTIVE",
      nextExpectedDate: "2026-06-25",
    } as Parameters<typeof repo.create>[0]);

    // Due in 35 days — outside window
    await repo.create({
      name: "Gym",
      kind: "SUBSCRIPTION",
      amountCents: 6900,
      frequency: "MONTHLY",
      status: "ACTIVE",
      nextExpectedDate: "2026-07-25",
    } as Parameters<typeof repo.create>[0]);

    // PAUSED — should not appear even if in window
    await repo.create({
      name: "Spotify",
      kind: "SUBSCRIPTION",
      amountCents: 1199,
      frequency: "MONTHLY",
      status: "PAUSED",
      nextExpectedDate: "2026-06-28",
    } as Parameters<typeof repo.create>[0]);

    const result = await loadPlanHubData(db, NOW);

    expect(result.upcomingRecurring).toHaveLength(1);
    expect(result.upcomingRecurring[0]!.name).toBe("Netflix");
    expect(result.upcomingRecurring[0]!.nextExpectedDate).toBe("2026-06-25");
    expect(result.upcomingRecurring[0]!.amountCents).toBe(1799);
  });

  it("excludes recurring items with no nextExpectedDate from upcomingRecurring", async () => {
    const db = freshDb();
    const repo = new DrizzleRecurringRepo(db);

    await repo.create({
      name: "Old Service",
      kind: "SUBSCRIPTION",
      amountCents: 999,
      frequency: "MONTHLY",
      status: "ACTIVE",
      // no nextExpectedDate
    } as Parameters<typeof repo.create>[0]);

    const result = await loadPlanHubData(db, NOW);
    expect(result.upcomingRecurring).toHaveLength(0);
  });

  it("returns recurringMonthlyTotalCents from active recurring items", async () => {
    const db = freshDb();
    const repo = new DrizzleRecurringRepo(db);

    // $10/mo
    await repo.create({
      name: "Service A",
      kind: "SUBSCRIPTION",
      amountCents: 1000,
      frequency: "MONTHLY",
      status: "ACTIVE",
    } as Parameters<typeof repo.create>[0]);

    // $120/yr → $10/mo
    await repo.create({
      name: "Service B",
      kind: "SUBSCRIPTION",
      amountCents: 12000,
      frequency: "YEARLY",
      status: "ACTIVE",
    } as Parameters<typeof repo.create>[0]);

    // PAUSED — not included
    await repo.create({
      name: "Service C",
      kind: "SUBSCRIPTION",
      amountCents: 5000,
      frequency: "MONTHLY",
      status: "PAUSED",
    } as Parameters<typeof repo.create>[0]);

    const result = await loadPlanHubData(db, NOW);

    // 1000 + round(12000/12) = 2000
    expect(result.recurringMonthlyTotalCents).toBe(2000);
  });

  it("never leaks the encryption key in the returned data", async () => {
    const db = freshDb();
    const result = await loadPlanHubData(db, NOW);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(KEY);
    expect(serialized).not.toContain("DB_ENCRYPTION_KEY");
  });
});
