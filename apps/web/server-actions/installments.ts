"use server";

/**
 * Installment Plan Server Actions (auth-guarded wrappers).
 *
 * Security invariants:
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access.
 *
 * Pure logic + event_log writes live in `installments-core.ts`. A "use server"
 * module may export only async functions + `export type` re-exports.
 */

import { revalidatePath } from "next/cache";
import { gte } from "drizzle-orm";
import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { DrizzleInstallmentRepo, tables } from "@upshot/db";
import { matchInstallments, BNPL_RECENT_MATCH_WINDOW_DAYS } from "@upshot/core";
import {
  buildInstallmentFromTransaction,
  createInstallmentPlan,
  deleteInstallmentPlan,
} from "./installments-core";
import type { CreateInstallmentInput } from "./installments-core";

// Re-export shared input type so callers don't need @upshot/contracts.
export type { CreateInstallmentInput } from "./installments-core";

/** Action: mark a purchase as a BNPL installment plan. Returns the new plan id. */
export const createInstallmentPlanAction = action(
  async (_session, input: CreateInstallmentInput): Promise<string> => {
    const { db } = getDb();
    const id = await createInstallmentPlan(db, input);
    revalidatePath("/plan/installments");
    revalidatePath("/plan");
    return id;
  },
);

/** Action: delete an installment plan. */
export const deleteInstallmentPlanAction = action(
  async (_session, id: string): Promise<void> => {
    const { db } = getDb();
    await deleteInstallmentPlan(db, id);
    revalidatePath("/plan/installments");
    revalidatePath("/plan");
  },
);

// ---------------------------------------------------------------------------
// Path A: transaction-anchored BNPL create
// ---------------------------------------------------------------------------

export interface CreateInstallmentFromTransactionInput {
  transactionId: string;
  txDate: string;
  merchant: string;
  installmentCents: number;
  totalInstallments: number;
  installmentsPaid: number;
}

/**
 * Action (Path A): create a BNPL plan anchored to a known transaction.
 *
 * - Builds the plan via buildInstallmentFromTransaction.
 * - Persists it via repo.create.
 * - Immediately records the originating transaction as the first payment via
 *   repo.applyMatches so DETECT never double-counts it.
 * - installmentsPaid is clamped to [1, totalInstallments].
 *
 * Returns the new plan id.
 */
export const createInstallmentFromTransactionAction = action(
  async (
    _session,
    input: CreateInstallmentFromTransactionInput,
  ): Promise<string> => {
    const { transactionId, txDate, merchant, installmentCents, totalInstallments } = input;
    // Clamp to [1, totalInstallments]: must be at least 1 (the originating tx)
    // and cannot exceed the total count.
    const installmentsPaid = Math.min(Math.max(1, input.installmentsPaid), totalInstallments);

    const { db } = getDb();
    const repo = new DrizzleInstallmentRepo(db);

    const plan = buildInstallmentFromTransaction({
      txDate,
      merchant,
      installmentCents,
      totalInstallments,
      installmentsPaid,
    });

    const planId = await repo.create(plan);

    // Record the originating transaction so DETECT never re-counts it.
    await repo.applyMatches([], [
      { planId, transactionId, dueIndex: installmentsPaid, paidAt: txDate },
    ]);

    revalidatePath("/plan/installments");
    revalidatePath("/plan");
    return planId;
  },
);

// ---------------------------------------------------------------------------
// Path B: recent-window auto-match BNPL create
// ---------------------------------------------------------------------------

export interface CreateInstallmentByMatchInput {
  merchant: string;
  installmentCents: number;
  totalInstallments: number;
}

/**
 * Action (Path B): create a BNPL plan and auto-match recent transactions.
 *
 * - Creates the plan with installmentsPaid: 0.
 * - Loads transactions within BNPL_RECENT_MATCH_WINDOW_DAYS of now.
 * - Runs matchInstallments and persists any found matches.
 *
 * Returns { id, matched } — matched is the number of transactions linked.
 */
export const createInstallmentByMatchAction = action(
  async (
    _session,
    input: CreateInstallmentByMatchInput,
  ): Promise<{ id: string; matched: number }> => {
    const { merchant, installmentCents, totalInstallments } = input;
    const { db } = getDb();
    const repo = new DrizzleInstallmentRepo(db);

    // today as ISO date (UTC)
    const now = new Date().toISOString().slice(0, 10);

    // Compute the window cutoff: now − BNPL_RECENT_MATCH_WINDOW_DAYS days.
    const [y, m, d] = now.split("-").map(Number) as [number, number, number];
    const cutoff = new Date(Date.UTC(y, m - 1, d));
    cutoff.setUTCDate(cutoff.getUTCDate() - BNPL_RECENT_MATCH_WINDOW_DAYS);
    const windowStart =
      `${cutoff.getUTCFullYear()}-` +
      `${String(cutoff.getUTCMonth() + 1).padStart(2, "0")}-` +
      `${String(cutoff.getUTCDate()).padStart(2, "0")}`;

    // Create plan with 0 paid — matchInstallments will update it.
    const firstDueDate = now;
    const planId = await repo.create({
      merchant,
      installmentCents,
      totalInstallments,
      installmentsPaid: 0,
      frequencyDays: 14,
      firstDueDate,
      nextDueDate: firstDueDate,
      totalCents: installmentCents * totalInstallments,
      status: "ACTIVE",
      matchRuleId: null,
      notes: null,
    });

    // Load recent transactions (mirror money/data.ts:129 gte pattern).
    const txRows = db
      .select()
      .from(tables.transactions)
      .where(gte(tables.transactions.createdAt, windowStart))
      .all();

    const matchableTxs = txRows.map((tx) => ({
      id: tx.id,
      description: tx.description,
      amountCents: tx.amountCents,
      createdAt: tx.createdAt,
      settledAt: tx.settledAt ?? null,
      isTransfer: tx.isTransfer,
    }));

    const plan = {
      id: planId,
      merchant,
      installmentCents,
      totalInstallments,
      installmentsPaid: 0,
      frequencyDays: 14,
      nextDueDate: firstDueDate,
      status: "ACTIVE" as const,
    };

    const alreadyLinked = await repo.listLinkedTransactionIds();
    const { matches, planUpdates } = matchInstallments(
      [plan],
      matchableTxs,
      alreadyLinked,
      { recentWindowDays: BNPL_RECENT_MATCH_WINDOW_DAYS, now },
    );

    await repo.applyMatches(planUpdates, matches);

    revalidatePath("/plan/installments");
    revalidatePath("/plan");
    return { id: planId, matched: matches.length };
  },
);
