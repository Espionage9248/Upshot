import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  DrizzleDebtRepo,
  DrizzlePayoffPlanRepo,
  tables,
  type DbClient,
} from "@upshot/db";
import { loadDebtDetail } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-debt-detail-data-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const NOW = new Date("2026-06-15T10:00:00.000Z");

/** Seed one personal loan debt: $5,000 balance, $300/month, 8% APR. */
async function seedDebt(db: DbClient) {
  await new DrizzleDebtRepo(db).create({
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
}

/** Write stale appSettings (AVALANCHE + enormous extra) that must NOT be used. */
function setStaleSettings(db: DbClient) {
  db.insert(tables.appSettings)
    .values({ id: "default", debtStrategy: "AVALANCHE", extraPaymentCents: 99999 })
    .onConflictDoUpdate({
      target: tables.appSettings.id,
      set: { debtStrategy: "AVALANCHE", extraPaymentCents: 99999 },
    })
    .run();
}

describe("loadDebtDetail — payoff timeline reads the locked plan", () => {
  it("uses the locked plan's strategy + extra, not appSettings", async () => {
    const db = freshDb();
    await seedDebt(db);
    setStaleSettings(db);

    // Lock a plan: SNOWBALL + $200/month extra (extraPaymentCents=20000)
    await new DrizzlePayoffPlanRepo(db).upsert({
      id: "default",
      strategy: "SNOWBALL",
      extraPaymentCents: 20000,
      customOrder: null,
      lumpSums: [],
      lockedAt: "2026-06-15T00:00:00.000Z",
      projectedDebtFreeMonth: null,
      projectedCurve: [],
      totalInterestProjectedCents: 0,
      inputs: null,
    });

    const data = await loadDebtDetail(db, "debt-1", NOW);
    expect(data).not.toBeNull();
    expect(data!.schedule).not.toBeNull();

    // The locked plan contributes $200/month extra → payoff sooner than minimum-only (2027-11)
    // but later than the stale $999.99 extra (2026-09). Captured from real run: 2027-04.
    expect(data!.schedule!.payoffMonth).toBe("2027-04");
  });

  it("falls back to minimums-only baseline when no plan is locked", async () => {
    const db = freshDb();
    await seedDebt(db);
    setStaleSettings(db);
    // NO locked plan — payoff_plan table is empty

    const data = await loadDebtDetail(db, "debt-1", NOW);
    expect(data).not.toBeNull();
    expect(data!.schedule).not.toBeNull();

    // Baseline: SNOWBALL + $0 extra = minimum-only. Captured from real run: 2027-11.
    expect(data!.schedule!.payoffMonth).toBe("2027-11");
  });
});
