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

/** Create input: id, notes, and matchRuleId are optional (auto-generated / null when absent). */
export type CreateInstallmentInput = Omit<NewInstallmentPlan, "id" | "notes" | "matchRuleId"> & {
  id?: string;
  notes?: string | null;
  matchRuleId?: string | null;
};

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
// createInstallmentPlan
// ---------------------------------------------------------------------------

/** Create an installment plan and write an event_log row. Returns the new plan id. */
export async function createInstallmentPlan(
  db: DbClient,
  input: CreateInstallmentInput,
): Promise<string> {
  const repo = new DrizzleInstallmentRepo(db);
  const normalized: NewInstallmentPlan = {
    ...input,
    notes: input.notes ?? null,
    matchRuleId: input.matchRuleId ?? null,
  };
  const id = await repo.create(normalized);
  logEvent(db, "create_installment_plan", id, `Created BNPL plan: ${input.merchant}`, {
    merchant: input.merchant,
    totalCents: input.totalCents,
    totalInstallments: input.totalInstallments,
  });
  return id;
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
