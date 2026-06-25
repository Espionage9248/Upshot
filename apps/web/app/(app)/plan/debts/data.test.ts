import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  DrizzleDebtRepo,
  DrizzleInstallmentRepo,
  DrizzlePayoffPlanRepo,
  tables,
  type DbClient,
} from "@upshot/db";
import { loadDebtsData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-debts-data-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const NOW = new Date("2026-06-20T10:00:00.000Z");

/** Seed one personal loan: $5,000 balance, $300/month, 8% APR. */
async function seedDebt(db: DbClient, id = "debt-a") {
  await new DrizzleDebtRepo(db).create({
    id,
    name: "Personal Loan",
    type: "PERSONAL_LOAN",
    currentBalanceCents: 500000,
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
}

/** Write stale appSettings that must NOT influence the loader after the repoint. */
function setStaleSettings(db: DbClient) {
  db.insert(tables.appSettings)
    .values({ id: "default", debtStrategy: "AVALANCHE", extraPaymentCents: 99999 })
    .onConflictDoUpdate({
      target: tables.appSettings.id,
      set: { debtStrategy: "AVALANCHE", extraPaymentCents: 99999 },
    })
    .run();
}

describe("loadDebtsData", () => {
  it("returns empty debts and empty analysis when no debts exist", async () => {
    const db = freshDb();
    const result = await loadDebtsData(db, NOW);

    expect(result.debts).toHaveLength(0);
    expect(result.analysis.payoffOrder).toHaveLength(0);
    expect(result.analysis.schedules).toHaveLength(0);
    expect(result.analysis.debtFreeMonth).toBeNull();
  });

  it("returns a debt row with computed utilisation for a credit card", async () => {
    const db = freshDb();
    const repo = new DrizzleDebtRepo(db);
    await repo.create({
      id: "debt-visa",
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

    const result = await loadDebtsData(db, NOW);

    expect(result.debts).toHaveLength(1);
    expect(result.debts[0]!.row.id).toBe("debt-visa");
    expect(result.debts[0]!.row.name).toBe("Visa Card");
    expect(result.debts[0]!.row.currentBalanceCents).toBe(250000);
    // utilisation = 250000 / 500000 = 0.5
    expect(result.debts[0]!.utilisation).toBeCloseTo(0.5);
  });

  it("returns null utilisation for a debt with no credit limit", async () => {
    const db = freshDb();
    const repo = new DrizzleDebtRepo(db);
    await repo.create({
      id: "debt-car",
      name: "Car Loan",
      type: "PERSONAL_LOAN",
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
      institutionName: "CBA",
      notes: null,
    });

    const result = await loadDebtsData(db, NOW);

    expect(result.debts[0]!.utilisation).toBeNull();
  });

  it("analysis payoffOrder includes the seeded debt id", async () => {
    const db = freshDb();
    const repo = new DrizzleDebtRepo(db);
    await repo.create({
      id: "debt-1",
      name: "Personal Loan",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 500000,
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

    const result = await loadDebtsData(db, NOW);

    expect(result.analysis.payoffOrder).toContain("debt-1");
    expect(result.analysis.schedules).toHaveLength(1);
    expect(result.analysis.schedules[0]!.debtId).toBe("debt-1");
  });

  it("locked plan drives analysis — stale appSettings are ignored", async () => {
    const db = freshDb();
    await seedDebt(db);
    // Set stale appSettings (AVALANCHE + huge extra) that MUST be ignored.
    setStaleSettings(db);
    // Lock a plan with SNOWBALL + $200/month extra (20000 cents).
    await new DrizzlePayoffPlanRepo(db).upsert({
      id: "default",
      strategy: "SNOWBALL",
      extraPaymentCents: 20000,
      customOrder: null,
      lumpSums: [],
      lockedAt: "2026-06-20T00:00:00.000Z",
      projectedDebtFreeMonth: null,
      projectedCurve: [],
      totalInterestProjectedCents: 0,
      inputs: null,
    });

    const result = await loadDebtsData(db, NOW);

    // With $300/month minimum + $200 extra = $500/month on a $5,000 balance at 8% APR,
    // the debt-free month should reflect the $20,000-cent extra (not the stale 99,999-cent extra).
    // Real captured value: 2027-04 (mirrors [id]/data.test.ts locked-plan test at same NOW/debt).
    expect(result.analysis.debtFreeMonth).toBe("2027-04");
    // Analysis strategy must come from the locked plan.
    expect(result.analysis.strategy).toBe("SNOWBALL");
  });

  it("unlocked baseline — no locked plan falls back to SNOWBALL/0 (minimums-only)", async () => {
    const db = freshDb();
    await seedDebt(db);
    // Stale appSettings set — must be ignored (no locked plan → minimums only).
    setStaleSettings(db);
    // Do NOT lock any plan.

    const result = await loadDebtsData(db, NOW);

    // Minimums-only: $300/month on $5,000 at 8% APR.
    // Real captured value: mirrors [id]/data.test.ts baseline (same debt/NOW): 2027-11.
    expect(result.analysis.debtFreeMonth).toBe("2027-11");
    expect(result.analysis.strategy).toBe("SNOWBALL");
  });

  it("never leaks the encryption key in the returned data", async () => {
    const db = freshDb();
    const result = await loadDebtsData(db, NOW);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(KEY);
    expect(serialized).not.toContain("DB_ENCRYPTION_KEY");
  });

  it("returns BNPL rollup from ACTIVE installment plans", async () => {
    const db = freshDb();
    await new DrizzleInstallmentRepo(db).create({
      id: "p1", merchant: "Afterpay – ACME", totalCents: 40000, installmentCents: 10000,
      totalInstallments: 4, installmentsPaid: 1, frequencyDays: 14,
      firstDueDate: "2026-06-01", nextDueDate: "2026-06-15", status: "ACTIVE",
      matchRuleId: null, notes: null,
    });
    const result = await loadDebtsData(db, NOW);
    expect(result.rollup.activeCount).toBe(1);
    expect(result.rollup.remainingCents).toBe(30000); // (4 - 1) × 10000
    expect(result.rollup.nextDueDate).toBe("2026-06-15");
    // Compact per-plan views drive the debts-surface BNPL card.
    expect(result.bnplPlans).toEqual([
      {
        id: "p1",
        merchant: "Afterpay – ACME",
        remainingCents: 30000,
        percentComplete: 25, // 1 of 4 paid
        installmentsPaid: 1,
        totalInstallments: 4,
        nextDueDate: "2026-06-15",
      },
    ]);
  });

  it("excludes COMPLETE plans from bnplPlans", async () => {
    const db = freshDb();
    await new DrizzleInstallmentRepo(db).create({
      id: "done", merchant: "Zip – Paid", totalCents: 20000, installmentCents: 10000,
      totalInstallments: 2, installmentsPaid: 2, frequencyDays: 14,
      firstDueDate: "2026-05-01", nextDueDate: "2026-05-15", status: "COMPLETE",
      matchRuleId: null, notes: null,
    });
    const result = await loadDebtsData(db, NOW);
    expect(result.bnplPlans).toEqual([]);
  });
});
