/**
 * Pure installment persistence (db-injected). Local-only.
 *
 * Kept out of the "use server" module so these helpers are NOT registered as
 * client-callable Server Actions. The thin auth-guarded wrappers live in
 * `installments.ts` (same split as debts-core.ts / debts.ts).
 */

import { randomUUID } from "node:crypto";
import { DrizzleInstallmentRepo, tables, type DbClient } from "@upshot/db";
import type { NewInstallmentPlan } from "@upshot/core";

// ---------------------------------------------------------------------------
// UTC date arithmetic (mirrors packages/core/src/installments/match.ts:11)
// ---------------------------------------------------------------------------

/** Adds `n` days to an ISO date string (date part only, e.g. "2026-06-01"). */
function addDays(isoDate: string, n: number): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + n);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// buildInstallmentFromTransaction (pure, no db)
// ---------------------------------------------------------------------------

/** Input for Path A: transaction-anchored BNPL plan creation. */
export interface BuildInstallmentFromTransactionInput {
  txDate: string;
  merchant: string;
  installmentCents: number;
  totalInstallments: number;
  installmentsPaid: number;
}

/**
 * Builds a NewInstallmentPlan from a source transaction.
 *
 * Rules:
 * - frequencyDays is always 14 (BNPL invariant).
 * - firstDueDate = txDate.
 * - nextDueDate = txDate + installmentsPaid × 14.
 * - totalCents = installmentCents × totalInstallments.
 * - status = installmentsPaid >= totalInstallments ? "COMPLETE" : "ACTIVE".
 */
export function buildInstallmentFromTransaction(
  input: BuildInstallmentFromTransactionInput,
): NewInstallmentPlan {
  const { txDate, merchant, installmentCents, totalInstallments, installmentsPaid } = input;
  const frequencyDays = 14;
  const firstDueDate = txDate;
  const nextDueDate = addDays(txDate, installmentsPaid * frequencyDays);
  const totalCents = installmentCents * totalInstallments;
  const status: "ACTIVE" | "COMPLETE" =
    installmentsPaid >= totalInstallments ? "COMPLETE" : "ACTIVE";
  return {
    merchant,
    installmentCents,
    totalInstallments,
    installmentsPaid,
    frequencyDays,
    firstDueDate,
    nextDueDate,
    totalCents,
    status,
    matchRuleId: null,
    notes: null,
  };
}

// Re-export InstallmentPlan row type (avoids @upshot/contracts import in callers).
export type InstallmentRow = Awaited<ReturnType<DrizzleInstallmentRepo["list"]>>[number];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Append an event_log entry. */
function logEvent(
  db: DbClient,
  action: string,
  entityId: string,
  description: string,
  meta: Record<string, unknown>,
): void {
  db.insert(tables.eventLog)
    .values({
      id: randomUUID(),
      category: "installment",
      action,
      entityType: "installment_plan",
      entityId,
      description,
      meta,
    })
    .run();
}

// ---------------------------------------------------------------------------
// deleteInstallmentPlan
// ---------------------------------------------------------------------------

/** Delete an installment plan and write an event_log row. */
export async function deleteInstallmentPlan(db: DbClient, id: string): Promise<void> {
  const repo = new DrizzleInstallmentRepo(db);
  await repo.delete(id);
  logEvent(db, "delete_installment_plan", id, `Deleted BNPL plan ${id}`, { id });
}
