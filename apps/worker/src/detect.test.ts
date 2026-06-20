import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient, applyMigrations,
  DrizzleJobRunRepo, DrizzleInstallmentRepo, DrizzleRecurringRepo,
  tables, type DbClient,
} from "@upshot/db";
import { runDetectOnce } from "./detect";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-detect-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "detect.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

/**
 * Seed a minimal account row so transactions can reference it.
 */
function seedAccount(db: DbClient, id = "acc-1"): void {
  db.insert(tables.accounts).values({
    id,
    name: "Spending",
    type: "TRANSACTIONAL",
    ownership: "INDIVIDUAL",
    balanceCents: 100_000,
    role: "SPENDING",
    monthlyAllocationCents: 0,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  }).run();
}

describe("runDetectOnce", () => {
  it(
    "inserts SUGGESTED recurring item, advances installment plan, applies drift, records DETECT SUCCESS, and is idempotent",
    async () => {
      const db = freshDb();
      // Fix 'now' to 2026-06-15, so last-12-months window covers 2025-06-15 onwards.
      const now = () => new Date("2026-06-15T00:00:00.000Z");

      seedAccount(db);

      // --- Seed monthly pattern for detectRecurring (≥3 occurrences, monthly) ---
      // "Netflix" subscription: 3 charges ~30 days apart, all -$1500 (expense = negative cents).
      const netflixTxs = [
        { id: "tx-nf-1", createdAt: "2026-01-10T00:00:00.000Z", date: "2026-01-10" },
        { id: "tx-nf-2", createdAt: "2026-02-10T00:00:00.000Z", date: "2026-02-10" },
        { id: "tx-nf-3", createdAt: "2026-03-10T00:00:00.000Z", date: "2026-03-10" },
      ];
      for (const tx of netflixTxs) {
        db.insert(tables.transactions).values({
          id: tx.id,
          accountId: "acc-1",
          status: "SETTLED",
          description: "Netflix",
          amountCents: -1500,
          isTransfer: false,
          isSalary: false,
          createdAt: tx.createdAt,
        }).run();
      }

      // --- Seed ACTIVE installment plan + matching transactions ---
      // Plan: "Afterpay Apple Watch", 4 installments of $6250, 2 already paid.
      const planId = "plan-1";
      db.insert(tables.installmentPlans).values({
        id: planId,
        merchant: "Afterpay Apple",
        totalCents: 25_000,
        installmentCents: 6_250,
        totalInstallments: 4,
        installmentsPaid: 2,
        frequencyDays: 14,
        firstDueDate: "2026-04-01",
        nextDueDate: "2026-05-29",
        status: "ACTIVE",
        matchRuleId: null,
        notes: null,
      }).run();

      // Two already-paid installments are already in plan (installmentsPaid=2).
      // One new unmatched installment tx to be picked up.
      db.insert(tables.transactions).values({
        id: "tx-apt-3",
        accountId: "acc-1",
        status: "SETTLED",
        description: "Afterpay Apple Watch",
        amountCents: -6_250,
        isTransfer: false,
        isSalary: false,
        settledAt: "2026-05-29T00:00:00.000Z",
        createdAt: "2026-05-29T00:00:00.000Z",
      }).run();

      // --- Seed ACTIVE recurring item with drifted price ---
      // "Spotify" was $999, but the latest charge is $1099 → should trigger drift.
      const recurringRepo = new DrizzleRecurringRepo(db);
      const spotifyId = await recurringRepo.create({
        name: "Spotify",
        kind: "SUBSCRIPTION",
        amountCents: 999,
        frequency: "MONTHLY",
        lastAmountCents: null,
        status: "ACTIVE",
        category: null,
        merchant: "Spotify",
        nextExpectedDate: null,
        lastDetectedDate: null,
        firstDetectedDate: null,
        accountId: "acc-1",
        isAutoDetected: false,
        notes: null,
        matchRuleId: null,
      });

      // Latest Spotify charge: -$1099 (drifted from $999).
      db.insert(tables.transactions).values({
        id: "tx-spotify-latest",
        accountId: "acc-1",
        status: "SETTLED",
        description: "Spotify Premium",
        amountCents: -1099,
        isTransfer: false,
        isSalary: false,
        createdAt: "2026-06-01T00:00:00.000Z",
      }).run();

      const jobRuns = new DrizzleJobRunRepo(db);
      const settings = { autoDetectRecurring: true };

      // === First run ===
      const runId = await runDetectOnce({ db, jobRuns, now, settings });

      // Job run recorded as DETECT SUCCESS
      const run = await jobRuns.getById(runId);
      expect(run).not.toBeNull();
      expect(run!.job).toBe("DETECT");
      expect(run!.status).toBe("SUCCESS");
      expect(run!.counts).toMatchObject({ suggested: 1, matched: 1, drifted: 1 });

      // SUGGESTED recurring item for Netflix inserted
      const allRecurring = await recurringRepo.list();
      const netflixSuggestion = allRecurring.find((r) => r.name.toLowerCase() === "netflix");
      expect(netflixSuggestion).toBeDefined();
      expect(netflixSuggestion!.status).toBe("SUGGESTED");

      // Installment plan advanced: installmentsPaid should be 3
      const installmentRepo = new DrizzleInstallmentRepo(db);
      const plan = await installmentRepo.getById(planId);
      expect(plan).not.toBeNull();
      expect(plan!.installmentsPaid).toBe(3);
      expect(plan!.status).toBe("ACTIVE"); // still one remaining

      // payment row was created
      const linked = await installmentRepo.listLinkedTransactionIds();
      expect(linked.has("tx-apt-3")).toBe(true);

      // Spotify drift applied
      const spotify = await recurringRepo.getById(spotifyId);
      expect(spotify).not.toBeNull();
      expect(spotify!.amountCents).toBe(1099);
      expect(spotify!.lastAmountCents).toBe(999);

      // === Second run (idempotency) ===
      const runId2 = await runDetectOnce({ db, jobRuns, now, settings });
      const run2 = await jobRuns.getById(runId2);
      expect(run2).not.toBeNull();
      expect(run2!.status).toBe("SUCCESS");

      // No new suggestions: Netflix is still SUGGESTED (upsert-in-place), counts.suggested = 1 (upserted, not duplicated)
      const allRecurringAfter = await recurringRepo.list();
      const netflixItems = allRecurringAfter.filter(
        (r) => r.name.toLowerCase() === "netflix",
      );
      expect(netflixItems).toHaveLength(1); // still exactly one row

      // No re-matched installment: tx-apt-3 is already linked
      const planAfter = await installmentRepo.getById(planId);
      expect(planAfter!.installmentsPaid).toBe(3); // unchanged
      expect(run2!.counts).toMatchObject({ matched: 0 });

      // Drift: Spotify price unchanged → no re-drift
      expect(run2!.counts).toMatchObject({ drifted: 0 });
    },
  );

  it("skips auto-detection when autoDetectRecurring is false", async () => {
    const db = freshDb();
    const now = () => new Date("2026-06-15T00:00:00.000Z");
    seedAccount(db);

    // 3 Netflix charges to form a pattern
    const netflixTxs = [
      { id: "tx-nf-a", createdAt: "2026-01-10T00:00:00.000Z" },
      { id: "tx-nf-b", createdAt: "2026-02-10T00:00:00.000Z" },
      { id: "tx-nf-c", createdAt: "2026-03-10T00:00:00.000Z" },
    ];
    for (const tx of netflixTxs) {
      db.insert(tables.transactions).values({
        id: tx.id,
        accountId: "acc-1",
        status: "SETTLED",
        description: "Netflix",
        amountCents: -1500,
        isTransfer: false,
        isSalary: false,
        createdAt: tx.createdAt,
      }).run();
    }

    const jobRuns = new DrizzleJobRunRepo(db);
    const runId = await runDetectOnce({
      db, jobRuns, now, settings: { autoDetectRecurring: false },
    });

    const run = await jobRuns.getById(runId);
    expect(run!.status).toBe("SUCCESS");
    expect(run!.counts).toMatchObject({ suggested: 0 });

    const recurringRepo = new DrizzleRecurringRepo(db);
    const all = await recurringRepo.list();
    expect(all).toHaveLength(0);
  });
});
