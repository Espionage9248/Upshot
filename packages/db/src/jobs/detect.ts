import { randomUUID } from "node:crypto";
import type { JobRunRepo } from "@upshot/core";
import { detectRecurring, matchInstallments, priceDrift } from "@upshot/core";
import { DrizzleInstallmentRepo } from "../repositories/installment-repo";
import { DrizzleRecurringRepo } from "../repositories/recurring-repo";
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
        amountCents: tables.transactions.amountCents,
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

    // Shape for detectRecurring: needs amountCents < 0 expenses, date as YYYY-MM-DD.
    const detectableTxs = txRows.map((tx) => ({
      description: tx.description,
      amountCents: tx.amountCents,
      date: tx.createdAt.slice(0, 10),
      categoryName: tx.categoryId ? (categoryNameById.get(tx.categoryId) ?? null) : null,
      accountId: tx.accountId,
      isTransfer: tx.isTransfer,
      isSalary: tx.isSalary,
    }));

    // Shape for matchInstallments.
    const matchableTxs = txRows.map((tx) => ({
      id: tx.id,
      description: tx.description,
      amountCents: tx.amountCents,
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

    // Step 3: Drift on ACTIVE recurring items.
    const activeRecurring = await recurringRepo.listByStatus("ACTIVE");
    let drifted = 0;
    for (const item of activeRecurring) {
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

    await deps.jobRuns.finish(id, {
      status: "SUCCESS",
      finishedAt: nowISO,
      cursor: nowISO.slice(0, 10),
      counts: { suggested, matched, drifted },
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
