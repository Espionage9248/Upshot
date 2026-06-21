import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, tables, DrizzlePayoffPlanRepo, type DbClient } from "@upshot/db";
import type { ScenarioInputs } from "@upshot/db";
import { buildPayoffInputs, savePlanningScenario, lockPayoffPlan, unlockPayoffPlan, type PlannerDebt } from "./planner-core";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];
let db: DbClient;

beforeEach(() => {
  const dir = mkdtempSync(join(tmpdir(), "upshot-planner-core-"));
  dirs.push(dir);
  const client = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(client.db);
  db = client.db;
});
afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });

const debts: PlannerDebt[] = [
  { id: "d1", currentBalanceCents: 100000, minimumPaymentCents: 5000, interestRate: 0.1, includeInSnowball: true },
  { id: "d2", currentBalanceCents: 50000, minimumPaymentCents: 3000, interestRate: 0.2, includeInSnowball: false },
];
const recurring = [{ id: "r1", monthlyCents: 20000 }, { id: "r2", monthlyCents: 10000 }];

const inputs: ScenarioInputs = {
  mode: "FORWARD",
  baseIncomeCents: 500000,
  raise: null,
  discretionaryCents: 50000,
  recurringEdits: [
    { id: "r1", keep: true, monthlyCentsOverride: null },
    { id: "r2", keep: false, monthlyCentsOverride: null },
  ],
  toDebtShareBps: 5000,
  strategy: "AVALANCHE",
  customOrder: null,
  lumpSums: [],
  targetMonth: null,
};

describe("buildPayoffInputs", () => {
  it("excludes cut recurring and non-included debts; computes stepped extra share", () => {
    const r = buildPayoffInputs(inputs, debts, recurring, "2026-07");
    // expenses = r1 kept (20000) + discretionary (50000) = 70000; r2 is cut.
    expect(r.expenseCents).toBe(70000);
    // minimums = only included debt d1 = 5000.
    expect(r.minimumsCents).toBe(5000);
    // headroom = 500000 − 70000 − 5000 = 425000; share 50% → 212500.
    expect(r.preExtraCents).toBe(212500);
    // only d1 enters the simulation.
    expect(r.payoffInputs.debts.map((d) => d.id)).toEqual(["d1"]);
    expect(r.payoffInputs.order).toEqual(["d1"]);
    expect(r.payoffInputs.extraSchedule).toEqual([{ fromMonth: "2026-07", extraCents: 212500 }]);
  });

  it("applies a recurring override and a raise step", () => {
    const withRaise: ScenarioInputs = {
      ...inputs,
      raise: { toCents: 600000, fromMonth: "2027-01" },
      recurringEdits: [{ id: "r1", keep: true, monthlyCentsOverride: 25000 }, { id: "r2", keep: false, monthlyCentsOverride: null }],
    };
    const r = buildPayoffInputs(withRaise, debts, recurring, "2026-07");
    expect(r.expenseCents).toBe(75000); // override 25000 + discretionary 50000
    expect(r.payoffInputs.extraSchedule).toHaveLength(2);
    expect(r.payoffInputs.extraSchedule[1]!.fromMonth).toBe("2027-01");
    expect(r.payoffInputs.extraSchedule[1]!.extraCents).toBeGreaterThan(r.payoffInputs.extraSchedule[0]!.extraCents);
  });

  it("clamps negative headroom to zero extra", () => {
    const broke: ScenarioInputs = { ...inputs, baseIncomeCents: 10000 };
    const r = buildPayoffInputs(broke, debts, recurring, "2026-07");
    expect(r.preExtraCents).toBe(0);
  });

  it("honours a CUSTOM strategy customOrder (target-first) over the strategy default", () => {
    const twoIncluded = [
      { id: "d1", currentBalanceCents: 100000, minimumPaymentCents: 5000, interestRate: 0.1, includeInSnowball: true },
      { id: "d3", currentBalanceCents: 20000, minimumPaymentCents: 2000, interestRate: 0.3, includeInSnowball: true },
    ];
    // SNOWBALL would put d3 first (smaller balance); customOrder forces d1 first.
    const custom: ScenarioInputs = { ...inputs, strategy: "CUSTOM", customOrder: ["d1", "d3"] };
    const r = buildPayoffInputs(custom, twoIncluded, recurring, "2026-07");
    expect(r.payoffInputs.order).toEqual(["d1", "d3"]);
  });

  it("falls back to the strategy default when customOrder is null", () => {
    const twoIncluded = [
      { id: "d1", currentBalanceCents: 100000, minimumPaymentCents: 5000, interestRate: 0.1, includeInSnowball: true },
      { id: "d3", currentBalanceCents: 20000, minimumPaymentCents: 2000, interestRate: 0.3, includeInSnowball: true },
    ];
    // CUSTOM with null order → orderByStrategy falls back to smallest-balance (snowball-like) → d3 first.
    const custom: ScenarioInputs = { ...inputs, strategy: "CUSTOM", customOrder: null };
    const r = buildPayoffInputs(custom, twoIncluded, recurring, "2026-07");
    expect(r.payoffInputs.order).toEqual(["d3", "d1"]);
  });
});

describe("scenario + plan writes log events", () => {
  it("savePlanningScenario writes an event_log row", async () => {
    await savePlanningScenario(db, { name: "Test", inputs });
    const logs = db.select().from(tables.eventLog).all().filter((e) => e.action === "save_scenario");
    expect(logs).toHaveLength(1);
  });

  it("lock then unlock leaves no plan and logs both", async () => {
    await lockPayoffPlan(db, {
      id: "default", strategy: "SNOWBALL", extraPaymentCents: 1000, customOrder: null,
      lumpSums: [], lockedAt: "2026-06-21T00:00:00.000Z", projectedDebtFreeMonth: "2027-01",
      projectedCurve: [], totalInterestProjectedCents: 0,
    });
    expect(await new DrizzlePayoffPlanRepo(db).get()).not.toBeNull();
    await unlockPayoffPlan(db);
    expect(await new DrizzlePayoffPlanRepo(db).get()).toBeNull();
    const actions = db.select().from(tables.eventLog).all().map((e) => e.action);
    expect(actions).toContain("lock_payoff_plan");
    expect(actions).toContain("unlock_payoff_plan");
  });
});
