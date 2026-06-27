import { afterEach, describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient, applyMigrations,
  DrizzleJobRunRepo, DrizzleInstallmentRepo, DrizzleRecurringRepo, DrizzleDebtRepo,
  tables, type DbClient,
} from "../index";
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
      // Category the Netflix charges are tagged with — a detected suggestion
      // must store the category NAME, not this raw id.
      db.insert(tables.categories).values({ id: "cat-ent", name: "Entertainment" }).run();
      for (const tx of netflixTxs) {
        db.insert(tables.transactions).values({
          id: tx.id,
          accountId: "acc-1",
          status: "SETTLED",
          description: "Netflix",
          amountCents: -1500,
          categoryId: "cat-ent",
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
      // Category is the resolved NAME, not the raw category id ("cat-ent").
      expect(netflixSuggestion!.category).toBe("Entertainment");

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

  it("applies active MARK_SALARY rule (description match) to existing transactions", async () => {
    const db = freshDb();
    const now = () => new Date("2026-06-15T00:00:00.000Z");
    seedAccount(db);

    // Active rule: description contains "salary" → MARK_SALARY.
    db.insert(tables.matchRules).values({ id: "r-sal", name: "Salary", isActive: true, priority: 10 }).run();
    db.insert(tables.matchConditions).values({
      id: "c-sal", ruleId: "r-sal", field: "description", mode: "contains", value: "salary",
      amountCents: null, toleranceCents: null, currency: null,
    }).run();
    db.insert(tables.matchActions).values({
      id: "a-sal", ruleId: "r-sal", type: "MARK_SALARY", value: null, targetId: null,
    }).run();

    // A matching (unmarked) salary txn + a non-matching txn, both within 12 months.
    db.insert(tables.transactions).values({
      id: "tx-pay", accountId: "acc-1", status: "SETTLED",
      description: "ACME PAYROLL SALARY", amountCents: 500_000,
      isTransfer: false, isSalary: false, createdAt: "2026-06-01T00:00:00.000Z",
    }).run();
    db.insert(tables.transactions).values({
      id: "tx-shop", accountId: "acc-1", status: "SETTLED",
      description: "Woolworths", amountCents: -4_200,
      isTransfer: false, isSalary: false, createdAt: "2026-06-02T00:00:00.000Z",
    }).run();

    const jobRuns = new DrizzleJobRunRepo(db);
    await runDetectOnce({ db, jobRuns, now, settings: { autoDetectRecurring: true } });

    const pay = db.select().from(tables.transactions).where(eq(tables.transactions.id, "tx-pay")).all()[0];
    const shop = db.select().from(tables.transactions).where(eq(tables.transactions.id, "tx-shop")).all()[0];
    expect(pay!.isSalary).toBe(true); // rule auto-applied by DETECT
    expect(shop!.isSalary).toBe(false); // non-matching untouched
  });

  it("matches debt payments, updates balance, records debtPayments count, and is idempotent", async () => {
    const db = freshDb();
    // Fix 'now' to 2026-06-15; last-12-months window covers 2025-06-15 onwards.
    const now = () => new Date("2026-06-15T00:00:00.000Z");

    seedAccount(db);

    // Seed a match rule + condition (field: description, mode: contains, value: "zip")
    const ruleId = "rule-zip-1";
    db.insert(tables.matchRules).values({
      id: ruleId,
      name: "Zip payment rule",
      isActive: true,
      priority: 1,
    }).run();
    db.insert(tables.matchConditions).values({
      id: "cond-zip-1",
      ruleId,
      field: "description",
      mode: "contains",
      value: "zip",
    }).run();

    // Seed a debt with balance 20000, linked to the match rule, paymentsLinkedAt before the tx
    const debtId = "debt-zip-1";
    db.insert(tables.debts).values({
      id: debtId,
      name: "Zip Pay",
      type: "BNPL",
      currentBalanceCents: 20_000,
      monthlyPaymentCents: 3_000,
      payoffPriority: 1,
      includeInSnowball: true,
      includeInNetWorth: true,
      matchRuleId: ruleId,
      paymentsLinkedAt: "2025-01-01",
    }).run();

    // Seed a -3000 "ZipPay payment" transaction within the last 12 months
    db.insert(tables.transactions).values({
      id: "tx-zip-1",
      accountId: "acc-1",
      status: "SETTLED",
      description: "ZipPay payment",
      amountCents: -3_000,
      isTransfer: false,
      isSalary: false,
      createdAt: "2026-05-01T00:00:00.000Z",
    }).run();

    const jobRuns = new DrizzleJobRunRepo(db);
    const settings = { autoDetectRecurring: false };

    // === First run ===
    const runId = await runDetectOnce({ db, jobRuns, now, settings });
    const run = await jobRuns.getById(runId);
    expect(run!.status).toBe("SUCCESS");
    expect(run!.counts).toMatchObject({ debtPayments: 1 });

    // debt_payments row created
    const debtRepo = new DrizzleDebtRepo(db);
    const payments = await debtRepo.listPayments(debtId);
    expect(payments).toHaveLength(1);
    expect(payments[0]!.amountCents).toBe(3_000);

    // debt balance reduced from 20000 to 17000
    const debt = await debtRepo.getById(debtId);
    expect(debt!.currentBalanceCents).toBe(17_000);

    // === Second run (no double-count) ===
    const runId2 = await runDetectOnce({ db, jobRuns, now, settings });
    const run2 = await jobRuns.getById(runId2);
    expect(run2!.status).toBe("SUCCESS");
    expect(run2!.counts).toMatchObject({ debtPayments: 0 });

    const paymentsAfter = await debtRepo.listPayments(debtId);
    expect(paymentsAfter).toHaveLength(1); // still one, not doubled
    const debtAfter = await debtRepo.getById(debtId);
    expect(debtAfter!.currentBalanceCents).toBe(17_000); // unchanged
  });

  it("links ACTIVE recurring items with a match rule via engine (Patreon end-to-end)", async () => {
    const db = freshDb();
    const now = () => new Date("2026-06-15T00:00:00.000Z");
    seedAccount(db);

    // Seed a match rule for Patreon: description contains "patreon" AND USD 12.00 ±$1.00
    const ruleId = "rule-patreon-1";
    db.insert(tables.matchRules).values({
      id: ruleId,
      name: "Patreon USD rule",
      isActive: true,
      priority: 1,
    }).run();
    db.insert(tables.matchConditions).values({
      id: "cond-pat-desc",
      ruleId,
      field: "description",
      mode: "contains",
      value: "patreon",
    }).run();
    db.insert(tables.matchConditions).values({
      id: "cond-pat-amt",
      ruleId,
      field: "description", // amount condition uses field=description but amountCents drives matchAmount
      mode: "contains",
      value: "patreon",
      amountCents: 1200,
      toleranceCents: 100,
      currency: "USD",
    }).run();

    // Seed ACTIVE recurring item "Patreon", MONTHLY, $12.00 AUD base
    const recurringRepo = new DrizzleRecurringRepo(db);
    const patreonId = await recurringRepo.create({
      name: "Patreon",
      kind: "SUBSCRIPTION",
      amountCents: 1200,
      frequency: "MONTHLY",
      lastAmountCents: null,
      status: "ACTIVE",
      category: null,
      merchant: "Patreon",
      nextExpectedDate: null,
      lastDetectedDate: null,
      firstDetectedDate: null,
      accountId: "acc-1",
      isAutoDetected: false,
      notes: null,
      matchRuleId: ruleId,
    });

    // In-band tx: "Patreon", foreignCurrency USD, foreignAmountCents -1250 (within 100 cents of 1200)
    db.insert(tables.transactions).values({
      id: "tx-pat-in",
      accountId: "acc-1",
      status: "SETTLED",
      description: "Patreon",
      amountCents: -1900, // AUD equivalent
      currency: "AUD",
      foreignAmountCents: -1250,
      foreignCurrency: "USD",
      isTransfer: false,
      isSalary: false,
      settledAt: "2026-06-01T00:00:00.000Z",
      createdAt: "2026-06-01T00:00:00.000Z",
    }).run();

    // Out-of-band tx: "Patreon", foreignCurrency USD, foreignAmountCents -2000 (>100 cents away)
    db.insert(tables.transactions).values({
      id: "tx-pat-out",
      accountId: "acc-1",
      status: "SETTLED",
      description: "Patreon",
      amountCents: -3100, // AUD equivalent
      currency: "AUD",
      foreignAmountCents: -2000,
      foreignCurrency: "USD",
      isTransfer: false,
      isSalary: false,
      settledAt: "2026-05-01T00:00:00.000Z",
      createdAt: "2026-05-01T00:00:00.000Z",
    }).run();

    const jobRuns = new DrizzleJobRunRepo(db);
    const settings = { autoDetectRecurring: false };

    // === First run ===
    const runId = await runDetectOnce({ db, jobRuns, now, settings });
    const run = await jobRuns.getById(runId);
    expect(run!.status).toBe("SUCCESS");
    // recurringLinked count should be 1 (one item updated)
    expect(run!.counts).toMatchObject({ recurringLinked: 1 });

    // Item tracking should be updated to the most-recent IN-BAND tx (2026-06-01)
    const patreon = await recurringRepo.getById(patreonId);
    expect(patreon).not.toBeNull();
    expect(patreon!.lastDetectedDate).toBe("2026-06-01");
    // MONTHLY from 2026-06-01 → next expected 2026-07-01
    expect(patreon!.nextExpectedDate).toBe("2026-07-01");

    // === Second run (idempotency) ===
    const runId2 = await runDetectOnce({ db, jobRuns, now, settings });
    const run2 = await jobRuns.getById(runId2);
    expect(run2!.status).toBe("SUCCESS");
    // Re-running sets same date → still counts as 1 (idempotent update is fine)
    // Most important: item dates haven't regressed
    const patreon2 = await recurringRepo.getById(patreonId);
    expect(patreon2!.lastDetectedDate).toBe("2026-06-01");
    expect(patreon2!.nextExpectedDate).toBe("2026-07-01");
  });

  it("excludes debt-matched transactions from generic recurring detection", async () => {
    const db = freshDb();
    seedAccount(db);

    // Seed a match rule + condition for "ZIP PAYMENT"
    db.insert(tables.matchRules).values({ id: "zip-rule", name: "Zip", isActive: true, priority: 50 }).run();
    db.insert(tables.matchConditions).values({
      id: "zc1", ruleId: "zip-rule", field: "description", mode: "contains", value: "ZIP PAYMENT",
    }).run();

    // Seed a debt linked to that rule
    db.insert(tables.debts).values({
      id: "zip",
      name: "Zip",
      type: "BNPL",
      currentBalanceCents: 50000,
      monthlyPaymentCents: 8000,
      payoffPriority: 1,
      includeInSnowball: true,
      includeInNetWorth: true,
      matchRuleId: "zip-rule",
    }).run();

    // Three monthly ZIP PAYMENT txns (would otherwise be a perfect generic suggestion)
    for (let i = 1; i <= 3; i++) {
      db.insert(tables.transactions).values({
        id: `zip-tx-${i}`,
        accountId: "acc-1",
        status: "SETTLED",
        description: "ZIP PAYMENT",
        amountCents: -8000,
        isTransfer: false,
        isSalary: false,
        createdAt: `2026-0${i}-12T10:00:00.000Z`,
        settledAt: `2026-0${i}-12T10:00:00.000Z`,
      }).run();
    }
    // Three NETFLIX txns that SHOULD still be detected
    for (let i = 1; i <= 3; i++) {
      db.insert(tables.transactions).values({
        id: `nf-tx-${i}`,
        accountId: "acc-1",
        status: "SETTLED",
        description: "NETFLIX",
        amountCents: -1899,
        isTransfer: false,
        isSalary: false,
        createdAt: `2026-0${i}-20T10:00:00.000Z`,
        settledAt: `2026-0${i}-20T10:00:00.000Z`,
      }).run();
    }

    const jobRuns = new DrizzleJobRunRepo(db);
    const now = () => new Date("2026-04-01T00:00:00.000Z");

    // Run 1: debt matching only — links the ZIP txns so listLinkedPaymentTxIds is populated.
    await runDetectOnce({ db, jobRuns, now, settings: { autoDetectRecurring: false } });
    // Run 2: detection enabled — ZIP txns are now excluded so ZIP must NOT be suggested.
    await runDetectOnce({ db, jobRuns, now, settings: { autoDetectRecurring: true } });

    const suggestions = new DrizzleRecurringRepo(db);
    const suggested = await suggestions.listByStatus("SUGGESTED");
    const names = suggested.map((s) => s.name.toLowerCase());
    expect(names.some((n) => n.includes("zip"))).toBe(false);
    expect(names.some((n) => n.includes("netflix"))).toBe(true);
  });

  it("rule-driven recurring item does NOT get double-processed by description-substring drift", async () => {
    const db = freshDb();
    const now = () => new Date("2026-06-15T00:00:00.000Z");
    seedAccount(db);

    // Match rule: description contains "patreon"
    const ruleId = "rule-pat-skip";
    db.insert(tables.matchRules).values({
      id: ruleId,
      name: "Patreon skip-drift rule",
      isActive: true,
      priority: 1,
    }).run();
    db.insert(tables.matchConditions).values({
      id: "cond-pat-skip",
      ruleId,
      field: "description",
      mode: "contains",
      value: "patreon",
    }).run();

    const recurringRepo = new DrizzleRecurringRepo(db);
    await recurringRepo.create({
      name: "Patreon",
      kind: "SUBSCRIPTION",
      amountCents: 1200,
      frequency: "MONTHLY",
      lastAmountCents: null,
      status: "ACTIVE",
      category: null,
      merchant: "Patreon",
      nextExpectedDate: null,
      lastDetectedDate: null,
      firstDetectedDate: null,
      accountId: "acc-1",
      isAutoDetected: false,
      notes: null,
      matchRuleId: ruleId,
    });

    // tx that would trigger description-substring drift if not skipped
    db.insert(tables.transactions).values({
      id: "tx-pat-drift",
      accountId: "acc-1",
      status: "SETTLED",
      description: "Patreon",
      amountCents: -1500,
      currency: "AUD",
      isTransfer: false,
      isSalary: false,
      createdAt: "2026-06-01T00:00:00.000Z",
    }).run();

    const jobRuns = new DrizzleJobRunRepo(db);
    const runId = await runDetectOnce({ db, jobRuns, now, settings: { autoDetectRecurring: false } });
    const run = await jobRuns.getById(runId);
    expect(run!.status).toBe("SUCCESS");
    // drifted must be 0: rule-driven items are skipped by the description-substring step
    expect(run!.counts).toMatchObject({ drifted: 0 });
  });

  it("DETECT step 4 records all matched payments but only decrements forward of paymentsLinkedAt", async () => {
    const db = freshDb();
    const jobRuns = new DrizzleJobRunRepo(db);
    db.insert(tables.accounts).values({ id: "acc", name: "Spend", type: "TRANSACTIONAL", ownership: "INDIVIDUAL", balanceCents: 0, role: "SPENDING" }).run();
    // a debt linked with a rule whose single condition matches "ZipPay", balance 10000, linked 2026-03-01
    const ruleId = "rule-zip";
    db.insert(tables.matchRules).values({ id: ruleId, name: "Zip", isActive: true, priority: 50 }).run();
    db.insert(tables.matchConditions).values({ id: "cz", ruleId, field: "description", mode: "contains", value: "zip" }).run();
    db.insert(tables.debts).values({
      id: "debt-zip", name: "Zip", type: "BNPL", currentBalanceCents: 10000,
      monthlyPaymentCents: 0, payoffPriority: 999, includeInSnowball: true, includeInNetWorth: true,
      matchRuleId: ruleId, paymentsLinkedAt: "2026-03-01",
    }).run();
    db.insert(tables.transactions).values([
      { id: "tx-pre", accountId: "acc", status: "SETTLED", description: "ZipPay", amountCents: -3000, isTransfer: false, isSalary: false, isInterest: false, isTaxDeductible: false, createdAt: "2026-01-10T00:00:00Z", settledAt: "2026-01-10T00:00:00Z" },
      { id: "tx-post", accountId: "acc", status: "SETTLED", description: "ZipPay", amountCents: -2000, isTransfer: false, isSalary: false, isInterest: false, isTaxDeductible: false, createdAt: "2026-06-10T00:00:00Z", settledAt: "2026-06-10T00:00:00Z" },
    ]).run();

    await runDetectOnce({ db, jobRuns, now: () => new Date("2026-06-24T00:00:00Z"), settings: { autoDetectRecurring: false } });

    const payments = db.select().from(tables.debtPayments).where(eq(tables.debtPayments.debtId, "debt-zip")).all();
    expect(payments.map((p) => p.transactionId).sort()).toEqual(["tx-post", "tx-pre"]);
    const debt = db.select().from(tables.debts).where(eq(tables.debts.id, "debt-zip")).get();
    expect(debt?.currentBalanceCents).toBe(8000); // 10000 - 2000 (only the post-link payment)
  });

  it("DETECT step 4 records payments older than the 12-month window but never decrements for them", async () => {
    const db = freshDb();
    const jobRuns = new DrizzleJobRunRepo(db);
    db.insert(tables.accounts).values({ id: "acc", name: "Spend", type: "TRANSACTIONAL", ownership: "INDIVIDUAL", balanceCents: 0, role: "SPENDING" }).run();
    const ruleId = "rule-zip";
    db.insert(tables.matchRules).values({ id: ruleId, name: "Zip", isActive: true, priority: 50 }).run();
    db.insert(tables.matchConditions).values({ id: "cz", ruleId, field: "description", mode: "contains", value: "zip" }).run();
    // linkedAt deliberately ancient: the linkedAt gate alone would decrement the old payment,
    // so the only thing protecting the balance is the recent-window decrement floor.
    db.insert(tables.debts).values({
      id: "debt-zip", name: "Zip", type: "BNPL", currentBalanceCents: 10000,
      monthlyPaymentCents: 0, payoffPriority: 999, includeInSnowball: true, includeInNetWorth: true,
      matchRuleId: ruleId, paymentsLinkedAt: "2020-01-01",
    }).run();
    // now = 2026-06-24 → 12-month cutoff = 2025-06-24. tx-old (2024) is pre-cutoff; tx-recent is in-window.
    db.insert(tables.transactions).values([
      { id: "tx-old", accountId: "acc", status: "SETTLED", description: "ZipPay", amountCents: -3000, isTransfer: false, isSalary: false, isInterest: false, isTaxDeductible: false, createdAt: "2024-01-10T00:00:00Z", settledAt: "2024-01-10T00:00:00Z" },
      { id: "tx-recent", accountId: "acc", status: "SETTLED", description: "ZipPay", amountCents: -2000, isTransfer: false, isSalary: false, isInterest: false, isTaxDeductible: false, createdAt: "2026-06-10T00:00:00Z", settledAt: "2026-06-10T00:00:00Z" },
    ]).run();

    await runDetectOnce({ db, jobRuns, now: () => new Date("2026-06-24T00:00:00Z"), settings: { autoDetectRecurring: false } });

    // Full-history recording: BOTH payments recorded (the old one would be excluded by the 12-month window).
    const payments = db.select().from(tables.debtPayments).where(eq(tables.debtPayments.debtId, "debt-zip")).all();
    expect(payments.map((p) => p.transactionId).sort()).toEqual(["tx-old", "tx-recent"]);
    // Decrement stays window-scoped: only tx-recent draws down. 10000 - 2000 = 8000 (tx-old recorded, not decremented).
    const debt = db.select().from(tables.debts).where(eq(tables.debts.id, "debt-zip")).get();
    expect(debt?.currentBalanceCents).toBe(8000);
  });
});
