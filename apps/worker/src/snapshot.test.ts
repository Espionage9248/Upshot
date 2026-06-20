import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient, applyMigrations,
  DrizzleJobRunRepo, tables, type DbClient,
} from "@upshot/db";
import { runSnapshotOnce } from "./snapshot";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-snapshot-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "snap.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

describe("runSnapshotOnce", () => {
  it("writes the previous calendar month snapshot, records SUCCESS job_run, and is idempotent", async () => {
    const db = freshDb();
    // now = 2026-06-15 => target month = "2026-05"
    const now = () => new Date("2026-06-15T00:00:00.000Z");

    // Seed: 1 account
    db.insert(tables.accounts).values({
      id: "acc-1",
      name: "Spending",
      type: "TRANSACTIONAL",
      ownership: "INDIVIDUAL",
      balanceCents: 100_000,
      role: "SPENDING",
      monthlyAllocationCents: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }).run();

    // Seed: 2 assets — one included, one excluded
    db.insert(tables.assets).values({
      id: "asset-1",
      name: "Super",
      type: "SUPER",
      valueCents: 200_000,
      includeInNetWorth: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }).run();
    db.insert(tables.assets).values({
      id: "asset-2",
      name: "Excluded asset",
      type: "OTHER",
      valueCents: 50_000,
      includeInNetWorth: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }).run();

    // Seed: 1 debt
    db.insert(tables.debts).values({
      id: "debt-1",
      name: "Credit card",
      type: "CREDIT_CARD",
      currentBalanceCents: 30_000,
      monthlyPaymentCents: 5_000,
      includeInNetWorth: true,
    }).run();

    // Seed: transactions
    // May 2026: income +$500, expense -$300, transfer (should be excluded)
    db.insert(tables.transactions).values({
      id: "tx-may-income",
      accountId: "acc-1",
      status: "SETTLED",
      description: "Salary",
      amountCents: 500_000,
      isTransfer: false,
      createdAt: "2026-05-15T00:00:00.000Z",
    }).run();
    db.insert(tables.transactions).values({
      id: "tx-may-expense",
      accountId: "acc-1",
      status: "SETTLED",
      description: "Rent",
      amountCents: -300_000,
      isTransfer: false,
      createdAt: "2026-05-20T00:00:00.000Z",
    }).run();
    db.insert(tables.transactions).values({
      id: "tx-may-transfer",
      accountId: "acc-1",
      status: "SETTLED",
      description: "Transfer to savings",
      amountCents: -50_000,
      isTransfer: true,
      createdAt: "2026-05-25T00:00:00.000Z",
    }).run();
    // June 2026: should be excluded (different month)
    db.insert(tables.transactions).values({
      id: "tx-june",
      accountId: "acc-1",
      status: "SETTLED",
      description: "June expense",
      amountCents: -10_000,
      isTransfer: false,
      createdAt: "2026-06-01T00:00:00.000Z",
    }).run();

    const jobRuns = new DrizzleJobRunRepo(db);
    const runId = await runSnapshotOnce({ db, jobRuns, now });

    // Should have exactly 1 snapshot row
    const snapshots = db.select().from(tables.monthlySnapshots).all();
    expect(snapshots).toHaveLength(1);
    const snap = snapshots[0]!;

    expect(snap.month).toBe("2026-05");
    // income = 500_000 (May non-transfer positive), expense = 300_000 (May non-transfer negative, stored positive)
    expect(snap.incomeCents).toBe(500_000);
    expect(snap.expenseCents).toBe(300_000);
    // savedCents = income - expense
    expect(snap.savedCents).toBe(200_000);
    // assetsCents = 200_000 (only includeInNetWorth=true asset)
    expect(snap.assetsCents).toBe(200_000);
    // debtCents = 30_000
    expect(snap.debtCents).toBe(30_000);
    // netWorthCents = accounts(100_000) + assets(200_000) - debts(30_000) = 270_000
    expect(snap.netWorthCents).toBe(270_000);

    // Job run recorded as SUCCESS
    const latestRun = await jobRuns.latest("SNAPSHOT");
    expect(latestRun).not.toBeNull();
    expect(latestRun!.id).toBe(runId);
    expect(latestRun!.status).toBe("SUCCESS");
    expect(latestRun!.cursor).toBe("2026-05");

    // Idempotency: re-run with same now → still exactly 1 row (upsert, not duplicate)
    await runSnapshotOnce({ db, jobRuns: new DrizzleJobRunRepo(db), now });
    const snapshotsAfterRerun = db.select().from(tables.monthlySnapshots).all();
    expect(snapshotsAfterRerun).toHaveLength(1);
    expect(snapshotsAfterRerun[0]!.month).toBe("2026-05");
  });
});
