import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  DrizzleDebtRepo,
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

  it("reads debtStrategy and extraPaymentCents from app_settings (SNOWBALL default)", async () => {
    const db = freshDb();
    const repo = new DrizzleDebtRepo(db);
    await repo.create({
      id: "debt-a",
      name: "A",
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

    const result = await loadDebtsData(db, NOW);
    // Default strategy from app_settings is SNOWBALL
    expect(result.analysis.strategy).toBe("SNOWBALL");
  });

  it("uses AVALANCHE strategy when app_settings.debtStrategy is AVALANCHE", async () => {
    const db = freshDb();
    // Insert/update app_settings to AVALANCHE
    db.insert(tables.appSettings)
      .values({ id: "default", debtStrategy: "AVALANCHE" })
      .onConflictDoUpdate({ target: tables.appSettings.id, set: { debtStrategy: "AVALANCHE" } })
      .run();
    const repo = new DrizzleDebtRepo(db);
    await repo.create({
      id: "debt-b",
      name: "B",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 200000,
      originalBalanceCents: null,
      creditLimitCents: null,
      monthlyPaymentCents: 15000,
      minimumPaymentCents: 15000,
      interestRate: 0.12,
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
    expect(result.analysis.strategy).toBe("AVALANCHE");
  });

  it("maps unknown debtStrategy values to CUSTOM", async () => {
    const db = freshDb();
    // Insert an app_settings row with a non-standard strategy value.
    db.insert(tables.appSettings)
      .values({ id: "default", debtStrategy: "SOMETHING_ELSE" })
      .onConflictDoUpdate({ target: tables.appSettings.id, set: { debtStrategy: "SOMETHING_ELSE" } })
      .run();

    const result = await loadDebtsData(db, NOW);
    expect(result.analysis.strategy).toBe("CUSTOM");
  });

  it("never leaks the encryption key in the returned data", async () => {
    const db = freshDb();
    const result = await loadDebtsData(db, NOW);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(KEY);
    expect(serialized).not.toContain("DB_ENCRYPTION_KEY");
  });
});
