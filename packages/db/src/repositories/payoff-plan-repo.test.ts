import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, type DbClient } from "@upshot/db";
import { DrizzlePayoffPlanRepo, type PayoffPlanRow } from "./payoff-plan-repo";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];
let db: DbClient;

beforeEach(() => {
  const dir = mkdtempSync(join(tmpdir(), "upshot-payoff-plan-"));
  dirs.push(dir);
  const client = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(client.db);
  db = client.db;
});

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const sample: PayoffPlanRow = {
  id: "default",
  strategy: "SNOWBALL",
  extraPaymentCents: 20000,
  customOrder: null,
  lumpSums: [{ amountCents: 50000, month: "2026-09", targetDebtId: "d1" }],
  lockedAt: "2026-06-21T00:00:00.000Z",
  projectedDebtFreeMonth: "2027-12",
  projectedCurve: [{ month: "2026-07", balanceCents: 100000 }],
  totalInterestProjectedCents: 12345,
  inputs: null,
};

describe("DrizzlePayoffPlanRepo", () => {
  it("returns null when nothing is locked", async () => {
    expect(await new DrizzlePayoffPlanRepo(db).get()).toBeNull();
  });

  it("upserts then reads back the single plan with JSON intact", async () => {
    const repo = new DrizzlePayoffPlanRepo(db);
    await repo.upsert(sample);
    const got = await repo.get();
    expect(got).not.toBeNull();
    expect(got!.extraPaymentCents).toBe(20000);
    expect(got!.lumpSums).toEqual(sample.lumpSums);
    expect(got!.projectedCurve).toEqual(sample.projectedCurve);
  });

  it("upsert overwrites the existing row (stays 0-or-1)", async () => {
    const repo = new DrizzlePayoffPlanRepo(db);
    await repo.upsert(sample);
    await repo.upsert({ ...sample, extraPaymentCents: 99999 });
    const got = await repo.get();
    expect(got!.extraPaymentCents).toBe(99999);
    expect(db.select().from((await import("@upshot/db")).tables.payoffPlan).all()).toHaveLength(1);
  });

  it("delete clears the locked plan", async () => {
    const repo = new DrizzlePayoffPlanRepo(db);
    await repo.upsert(sample);
    await repo.delete();
    expect(await repo.get()).toBeNull();
  });
});
