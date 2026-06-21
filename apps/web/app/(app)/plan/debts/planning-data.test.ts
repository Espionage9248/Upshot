import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, tables, DrizzleDebtRepo, type DbClient } from "@upshot/db";
import { loadPlanningData } from "./planning-data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];
let db: DbClient;

beforeEach(() => {
  const dir = mkdtempSync(join(tmpdir(), "upshot-planning-data-"));
  dirs.push(dir);
  const client = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(client.db);
  db = client.db;
});
afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });

const NOW = new Date("2026-07-15T00:00:00.000Z");

describe("loadPlanningData", () => {
  it("returns empty seeds and no locked plan on a fresh DB", async () => {
    const d = await loadPlanningData(db, NOW);
    expect(d.startMonth).toBe("2026-07");
    expect(d.incomeBaseSeedCents).toBe(0);
    expect(d.discretionarySeedCents).toBe(0);
    expect(d.debts).toHaveLength(0);
    expect(d.scenarios).toHaveLength(0);
    expect(d.lockedPlan).toBeNull();
  });

  it("seeds income from trailing-month salary transactions", async () => {
    db.insert(tables.accounts).values({ id: "a1", name: "S", type: "TRANSACTIONAL", ownership: "INDIVIDUAL", balanceCents: 0, role: "SPENDING" }).run();
    db.insert(tables.transactions).values([
      { id: "t1", accountId: "a1", status: "SETTLED", description: "Pay", amountCents: 300000, isSalary: true, createdAt: "2026-07-01T00:00:00.000Z" },
      { id: "t2", accountId: "a1", status: "SETTLED", description: "Old pay", amountCents: 300000, isSalary: true, createdAt: "2026-01-01T00:00:00.000Z" },
    ]).run();
    const d = await loadPlanningData(db, NOW);
    expect(d.incomeBaseSeedCents).toBe(300000); // only the trailing-month salary
  });

  it("includes live debts with a minimum-payment fallback", async () => {
    await new DrizzleDebtRepo(db).create({
      id: "d1", name: "Visa", type: "CREDIT_CARD", currentBalanceCents: 100000,
      monthlyPaymentCents: 5000, minimumPaymentCents: null, interestRate: 0.2,
      payoffPriority: 1, includeInSnowball: true, includeInNetWorth: true,
      originalBalanceCents: null, creditLimitCents: null, monthlyFeeCents: null,
      feeDueDay: null, matchRuleId: null, accountNumber: null, institutionName: null, notes: null,
    });
    const d = await loadPlanningData(db, NOW);
    expect(d.debts).toHaveLength(1);
    expect(d.debts[0]!.minimumPaymentCents).toBe(5000); // falls back to monthlyPaymentCents
  });

  it("never leaks the encryption key", async () => {
    const d = await loadPlanningData(db, NOW);
    expect(JSON.stringify(d)).not.toContain(KEY);
  });
});
