import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient, applyMigrations,
  DrizzleJobRunRepo, DrizzleDebtRepo, tables, type DbClient,
} from "../index";
import { runFeesOnce } from "./fees";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-fees-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "fees.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

describe("runFeesOnce", () => {
  it("applies fee to eligible debt, records FEES SUCCESS job_run, and is idempotent within same month", async () => {
    const db = freshDb();
    // now = 2026-06-15: fee due on day 15, last applied in May → eligible
    const now = () => new Date("2026-06-15T00:00:00.000Z");

    // Debt 1: fee-eligible (feeDueDay=15, lastFeeAppliedAt=May, fee=2500)
    db.insert(tables.debts).values({
      id: "debt-fee",
      name: "Credit card",
      type: "CREDIT_CARD",
      currentBalanceCents: 100_000,
      monthlyPaymentCents: 5_000,
      monthlyFeeCents: 2_500,
      feeDueDay: 15,
      lastFeeAppliedAt: "2026-05-15T00:00:00.000Z",
      includeInNetWorth: true,
      includeInSnowball: true,
      payoffPriority: 1,
    }).run();

    // Debt 2: no fee configured (monthlyFeeCents=null, feeDueDay=null)
    db.insert(tables.debts).values({
      id: "debt-nofee",
      name: "Personal loan",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 50_000,
      monthlyPaymentCents: 1_000,
      monthlyFeeCents: null,
      feeDueDay: null,
      lastFeeAppliedAt: null,
      includeInNetWorth: true,
      includeInSnowball: true,
      payoffPriority: 2,
    }).run();

    const jobRuns = new DrizzleJobRunRepo(db);
    const runId = await runFeesOnce({ db, jobRuns, now });

    // job_run recorded as FEES SUCCESS
    const latestRun = await jobRuns.latest("FEES");
    expect(latestRun).not.toBeNull();
    expect(latestRun!.id).toBe(runId);
    expect(latestRun!.status).toBe("SUCCESS");

    // debt-fee balance increased by the fee
    const debtRepo = new DrizzleDebtRepo(db);
    const debtFee = await debtRepo.getById("debt-fee");
    expect(debtFee).not.toBeNull();
    expect(debtFee!.currentBalanceCents).toBe(102_500);
    expect(debtFee!.lastFeeAppliedAt!.slice(0, 7)).toBe("2026-06");

    // debt-nofee balance unchanged
    const debtNoFee = await debtRepo.getById("debt-nofee");
    expect(debtNoFee!.currentBalanceCents).toBe(50_000);

    // counts reflects one fee applied
    expect(latestRun!.counts).toEqual({ feesApplied: 1 });

    // Idempotency: second run in same month applies nothing
    const jobRuns2 = new DrizzleJobRunRepo(db);
    const runId2 = await runFeesOnce({ db, jobRuns: jobRuns2, now });
    const run2 = await jobRuns2.getById(runId2);
    expect(run2).not.toBeNull();
    expect(run2!.status).toBe("SUCCESS");
    expect(run2!.counts).toEqual({ feesApplied: 0 });

    // Balance still the same — fee was not doubled
    const debtFeeAfter = await debtRepo.getById("debt-fee");
    expect(debtFeeAfter!.currentBalanceCents).toBe(102_500);
  });
});
