import { randomUUID } from "node:crypto";
import type { JobRunRepo } from "@upshot/core";
import { detectRecurring, matchInstallments, priceDrift, matchDebtPayments, evaluateCondition, nextExpectedDate } from "@upshot/core";
import type { Frequency } from "@upshot/core";
import { DrizzleInstallmentRepo } from "../repositories/installment-repo";
import { DrizzleRecurringRepo } from "../repositories/recurring-repo";
import { DrizzleDebtRepo } from "../repositories/debt-repo";
import type { DbClient } from "../client";
import * as tables from "../schema";
import { gte } from "drizzle-orm";

/**
 * One DETECT tick: auto-detect recurring suggestions, match installment
 * payments, and apply price-drift to ACTIVE recurring items.
 *
 * Mirrors runFeesOnce / runSnapshotOnce job-run lifecycle:
 *   jobRuns.create → try block → jobRuns.finish SUCCESS with counts
 *   → catch → finish FAILED.
 *
 * Idempotency:
 *   - detectRecurring is suppressed for non-SUGGESTED patterns (knownPatterns).
 *   - upsertSuggestion updates-in-place (keyed by name.trim().toLowerCase()).
 *   - matchInstallments skips already-linked txIds (listLinkedTransactionIds).
 */
export async function runDetectOnce(deps: {
  db: DbClient;
  jobRuns: JobRunRepo;
  now?: () => Date;
  settings: { autoDetectRecurring: boolean };
}): Promise<string> {
  const now = deps.now ?? (() => new Date());
  const id = randomUUID();

  await deps.jobRuns.create({ id, job: "DETECT", startedAt: now().toISOString() });

  try {
    const nowDate = now();
    const nowISO = nowDate.toISOString();

    // Last-12-months cutoff (ISO string, inclusive lower bound).
    const cutoff = new Date(nowDate);
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
    const cutoffISO = cutoff.toISOString();

    // Load last-12-months transactions.
    const txRows = deps.db
      .select({
        id: tables.transactions.id,
        description: tables.transactions.description,
        rawText: tables.transactions.rawText,
        amountCents: tables.transactions.amountCents,
        currency: tables.transactions.currency,
        foreignAmountCents: tables.transactions.foreignAmountCents,
        foreignCurrency: tables.transactions.foreignCurrency,
        categoryId: tables.transactions.categoryId,
        accountId: tables.transactions.accountId,
        isTransfer: tables.transactions.isTransfer,
        isSalary: tables.transactions.isSalary,
        settledAt: tables.transactions.settledAt,
        createdAt: tables.transactions.createdAt,
      })
      .from(tables.transactions)
      .where(gte(tables.transactions.createdAt, cutoffISO))
      .all();

    // Resolve category IDs to human-readable names so detected suggestions
    // store the category name (not the raw Up category ID).
    const categoryRows = deps.db
      .select({ id: tables.categories.id, name: tables.categories.name })
      .from(tables.categories)
      .all();
    const categoryNameById = new Map(categoryRows.map((c) => [c.id, c.name]));

    // Debt-matched transactions are owned by their debt (Approach A) — never
    // offer them as a generic recurring suggestion (spec §7). Built once here
    // and reused by Step 4 below.
    const debtRepo = new DrizzleDebtRepo(deps.db);
    const linkedDebtTxIds = await debtRepo.listLinkedPaymentTxIds();

    // Shape for detectRecurring: needs amountCents < 0 expenses, date as YYYY-MM-DD.
    // Exclude transactions already matched to a debt (owned by the debt).
    const detectableTxs = txRows
      .filter((tx) => !linkedDebtTxIds.has(tx.id))
      .map((tx) => ({
        description: tx.description,
        amountCents: tx.amountCents,
        date: tx.createdAt.slice(0, 10),
        categoryName: tx.categoryId ? (categoryNameById.get(tx.categoryId) ?? null) : null,
        accountId: tx.accountId,
        isTransfer: tx.isTransfer,
        isSalary: tx.isSalary,
      }));

    // Shape for matchInstallments (and debt matching).
    const matchableTxs = txRows.map((tx) => ({
      id: tx.id,
      description: tx.description,
      rawText: tx.rawText ?? null,
      amountCents: tx.amountCents,
      currency: tx.currency ?? "AUD",
      foreignAmountCents: tx.foreignAmountCents ?? null,
      foreignCurrency: tx.foreignCurrency ?? null,
      categoryName: tx.categoryId ? (categoryNameById.get(tx.categoryId) ?? null) : null,
      createdAt: tx.createdAt,
      settledAt: tx.settledAt ?? null,
      isTransfer: tx.isTransfer,
    }));

    const recurringRepo = new DrizzleRecurringRepo(deps.db);
    const installmentRepo = new DrizzleInstallmentRepo(deps.db);

    // Step 1: Auto-detect recurring suggestions.
    let suggested = 0;
    if (deps.settings.autoDetectRecurring) {
      const detected = detectRecurring(detectableTxs, {
        now: nowISO.slice(0, 10),
        existingNonSuggestedPatterns: await recurringRepo.knownPatterns(),
      });
      for (const item of detected) {
        await recurringRepo.upsertSuggestion(item);
        suggested++;
      }
    }

    // Step 2: Installment matching.
    const allPlans = await installmentRepo.list();
    const activePlans = allPlans.filter((p) => p.status === "ACTIVE").map((p) => ({
      id: p.id,
      merchant: p.merchant,
      installmentCents: p.installmentCents,
      totalInstallments: p.totalInstallments,
      installmentsPaid: p.installmentsPaid,
      frequencyDays: p.frequencyDays,
      nextDueDate: p.nextDueDate,
      status: p.status as "ACTIVE",
    }));

    const alreadyLinkedTxIds = await installmentRepo.listLinkedTransactionIds();
    const { matches, planUpdates } = matchInstallments(
      activePlans,
      matchableTxs,
      alreadyLinkedTxIds,
    );
    await installmentRepo.applyMatches(planUpdates, matches);
    const matched = matches.length;

    // Step 3: Drift on ACTIVE recurring items WITHOUT a match rule (rule-driven handled in Step 3a).
    const activeRecurring = await recurringRepo.listByStatus("ACTIVE");
    let drifted = 0;
    for (const item of activeRecurring) {
      // Skip rule-driven items — they are handled by the engine-based step below.
      if (item.matchRuleId !== null) continue;

      // Find the newest matching charge: description contains item name/merchant (case-insensitive), negative amount.
      const nameLower = (item.merchant ?? item.name).toLowerCase();
      let newestCharge: { amountCents: number; createdAt: string } | null = null;
      for (const tx of matchableTxs) {
        if (tx.isTransfer) continue;
        if (tx.amountCents >= 0) continue;
        if (!tx.description.toLowerCase().includes(nameLower)) continue;
        if (newestCharge === null || tx.createdAt > newestCharge.createdAt) {
          newestCharge = tx;
        }
      }
      if (newestCharge === null) continue;

      const newChargeCents = Math.abs(newestCharge.amountCents);
      const result = priceDrift(
        { amountCents: item.amountCents, lastAmountCents: item.lastAmountCents },
        newChargeCents,
      );
      if (result.changed) {
        await recurringRepo.applyDrift(item.id, newChargeCents, item.amountCents, nowISO);
        drifted++;
      }
    }

    // Step 3a: Engine-based detection for ACTIVE recurring items WITH a match rule.
    // Uses evaluateCondition (amount/currency-aware) for precise matching — e.g. Patreon USD.
    const activeWithRule = await recurringRepo.listActiveWithRule();
    let recurringLinked = 0;
    for (const { item, conditions } of activeWithRule) {
      if (conditions.length === 0) continue;

      // Find all matching txs for this item.
      let newestMatch: (typeof matchableTxs)[number] | null = null;
      for (const tx of matchableTxs) {
        if (tx.isTransfer) continue;
        const target = {
          description: tx.description,
          categoryName: tx.categoryName,
          rawText: tx.rawText,
          amountCents: tx.amountCents,
          currency: tx.currency,
          foreignAmountCents: tx.foreignAmountCents,
          foreignCurrency: tx.foreignCurrency,
        };
        if (!conditions.every((c) => evaluateCondition(c, target))) continue;
        const txDate = tx.settledAt ?? tx.createdAt;
        if (newestMatch === null || txDate > (newestMatch.settledAt ?? newestMatch.createdAt)) {
          newestMatch = tx;
        }
      }

      if (newestMatch === null) continue;

      const lastDetectedDate = (newestMatch.settledAt ?? newestMatch.createdAt).slice(0, 10);
      const nextDate = nextExpectedDate(lastDetectedDate, item.frequency as Frequency);
      const newAmountCents = Math.abs(newestMatch.amountCents);
      const driftResult = priceDrift(
        { amountCents: item.amountCents, lastAmountCents: item.lastAmountCents },
        newAmountCents,
      );

      await recurringRepo.recordDetection(item.id, {
        lastDetectedDate,
        nextExpectedDate: nextDate,
        ...(driftResult.changed
          ? { newAmountCents, previousAmountCents: item.amountCents, changedAt: nowISO }
          : {}),
      });
      recurringLinked++;
    }

    // Step 4: Debt payment matching (Zip et al.) — reuses the matchableTxs already built above.
    const withRules = await debtRepo.listWithRule();
    const matchers = withRules
      .filter((w) => w.conditions.length > 0)
      .map((w) => ({ debtId: w.debt.id, currentBalanceCents: w.debt.currentBalanceCents, conditions: w.conditions }));
    const { payments, balanceUpdates } = matchDebtPayments(matchers, matchableTxs, linkedDebtTxIds);
    await debtRepo.applyPaymentMatches(payments, balanceUpdates);
    const debtPayments = payments.length;

    await deps.jobRuns.finish(id, {
      status: "SUCCESS",
      finishedAt: nowISO,
      cursor: nowISO.slice(0, 10),
      counts: { suggested, matched, drifted, debtPayments, recurringLinked },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await deps.jobRuns.finish(id, {
      status: "FAILED",
      finishedAt: now().toISOString(),
      cursor: null,
      counts: null,
      error: message,
    });
  }

  return id;
}
