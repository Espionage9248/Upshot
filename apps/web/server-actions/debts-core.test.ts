import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, tables, type DbClient } from "@upshot/db";
import { createDebt, updateDebt, deleteDebt, recordDebtPayment } from "./debts-core";
import { computeWhatIf } from "@upshot/core";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-debts-core-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

let db: DbClient;

beforeEach(() => {
  const client = createDbClient({ url: tempDbPath(), key: KEY });
  applyMigrations(client.db);
  db = client.db;
});

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function debtEventRows(action: string) {
  return db
    .select()
    .from(tables.eventLog)
    .all()
    .filter((e) => e.category === "debt" && e.action === action);
}

// ---------------------------------------------------------------------------
// createDebt
// ---------------------------------------------------------------------------

describe("createDebt", () => {
  it("inserts a debt row and writes an event_log entry", async () => {
    const id = await createDebt(db, {
      name: "Visa Card",
      type: "CREDIT_CARD",
      currentBalanceCents: 250000,
      originalBalanceCents: null,
      creditLimitCents: 500000,
      monthlyPaymentCents: 20000,
      minimumPaymentCents: 5000,
      interestRate: 0.1995,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 1,
      includeInSnowball: true,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: "ANZ",
      notes: null,
    });

    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);

    const row = db.select().from(tables.debts).all();
    expect(row).toHaveLength(1);
    expect(row[0]!.name).toBe("Visa Card");
    expect(row[0]!.currentBalanceCents).toBe(250000);
    expect(row[0]!.creditLimitCents).toBe(500000);

    const logs = debtEventRows("create_debt");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
    expect(logs[0]!.category).toBe("debt");
  });

  it("returns the provided id when one is supplied", async () => {
    const id = await createDebt(db, {
      id: "debt-explicit",
      name: "Car Loan",
      type: "CAR",
      currentBalanceCents: 1500000,
      originalBalanceCents: 2000000,
      creditLimitCents: null,
      monthlyPaymentCents: 50000,
      minimumPaymentCents: 50000,
      interestRate: 0.0799,
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

    expect(id).toBe("debt-explicit");
  });
});

// ---------------------------------------------------------------------------
// updateDebt
// ---------------------------------------------------------------------------

describe("updateDebt", () => {
  it("updates a debt row and writes an event_log entry", async () => {
    const id = await createDebt(db, {
      name: "Old Name",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 100000,
      originalBalanceCents: null,
      creditLimitCents: null,
      monthlyPaymentCents: 10000,
      minimumPaymentCents: 10000,
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

    const existing = db.select().from(tables.debts).all()[0]!;
    await updateDebt(db, {
      ...existing,
      name: "New Name",
      currentBalanceCents: 90000,
    });

    const updated = db.select().from(tables.debts).all()[0]!;
    expect(updated.name).toBe("New Name");
    expect(updated.currentBalanceCents).toBe(90000);

    const logs = debtEventRows("update_debt");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
  });
});

// ---------------------------------------------------------------------------
// deleteDebt
// ---------------------------------------------------------------------------

describe("deleteDebt", () => {
  it("removes the debt and writes an event_log entry", async () => {
    const id = await createDebt(db, {
      name: "To Delete",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 50000,
      originalBalanceCents: null,
      creditLimitCents: null,
      monthlyPaymentCents: 5000,
      minimumPaymentCents: 5000,
      interestRate: null,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 1,
      includeInSnowball: false,
      includeInNetWorth: false,
      matchRuleId: null,
      accountNumber: null,
      institutionName: null,
      notes: null,
    });

    await deleteDebt(db, id);

    expect(db.select().from(tables.debts).all()).toHaveLength(0);

    const logs = debtEventRows("delete_debt");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
  });
});

// ---------------------------------------------------------------------------
// recordDebtPayment
// ---------------------------------------------------------------------------

describe("recordDebtPayment", () => {
  it("inserts a payment and writes an event_log entry", async () => {
    const id = await createDebt(db, {
      name: "Loan",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 200000,
      originalBalanceCents: null,
      creditLimitCents: null,
      monthlyPaymentCents: 15000,
      minimumPaymentCents: 15000,
      interestRate: 0.10,
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

    await recordDebtPayment(db, {
      debtId: id,
      amountCents: 15000,
      principalCents: 13500,
      interestCents: 1500,
      paymentDate: "2026-06-20",
    });

    const payments = db.select().from(tables.debtPayments).all();
    expect(payments).toHaveLength(1);
    expect(payments[0]!.amountCents).toBe(15000);
    expect(payments[0]!.principalCents).toBe(13500);
    expect(payments[0]!.interestCents).toBe(1500);
    expect(payments[0]!.paymentDate).toBe("2026-06-20");

    const logs = debtEventRows("record_payment");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
  });
});

// ---------------------------------------------------------------------------
// whatIf — pure, no DB writes
// ---------------------------------------------------------------------------

describe("whatIf (computeWhatIf — pure)", () => {
  it("returns monthsSaved and interestSavedCents for extra payment", () => {
    const debts = [
      {
        id: "d1",
        name: "Visa",
        currentBalanceCents: 300000,
        monthlyPaymentCents: 15000,
        interestRate: 0.20,
        payoffPriority: 1,
        includeInSnowball: true,
      },
    ];

    const result = computeWhatIf(debts, {
      strategy: "SNOWBALL",
      extraPaymentCents: 10000,
      startMonth: "2026-06",
    });

    // With $100/mo extra on a $3000/20% card: should pay off sooner
    expect(result.monthsSaved).toBeGreaterThanOrEqual(0);
    expect(result.interestSavedCents).toBeGreaterThanOrEqual(0);
    // base has no extra; withExtra has extra — withExtra should payoff faster
    expect(result.withExtra.monthsToPayoff).toBeLessThanOrEqual(result.base.monthsToPayoff);
  });

  it("returns zero savings when extra payment is 0", () => {
    const debts = [
      {
        id: "d1",
        name: "Visa",
        currentBalanceCents: 100000,
        monthlyPaymentCents: 10000,
        interestRate: 0.18,
        payoffPriority: 1,
        includeInSnowball: true,
      },
    ];

    const result = computeWhatIf(debts, {
      strategy: "SNOWBALL",
      extraPaymentCents: 0,
      startMonth: "2026-06",
    });

    expect(result.monthsSaved).toBe(0);
    expect(result.interestSavedCents).toBe(0);
  });
});
