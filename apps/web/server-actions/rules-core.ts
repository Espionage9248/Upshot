/**
 * Pure match-rule CRUD / preview / apply (db-injected + optional Up write-back).
 *
 * Kept out of the "use server" module so these helpers are NOT registered as
 * client-callable Server Actions (they take a non-serializable DbClient). The
 * thin auth-guarded wrappers live in `rules.ts` (same split as money-core.ts /
 * money.ts).
 *
 * saveRule validates SET_CATEGORY targets against the synced categories BEFORE
 * any persist and surfaces a bad target as a TYPED result (NOT a throw) — the
 * action() wrapper discards thrown messages, so a distinction the UI must make
 * has to ride inside data.
 *
 * applyRule reuses money-core's setCategory/setTags so the local-first +
 * best-effort Up push + event_log contract is identical (never rolled back).
 */

import { eq } from "drizzle-orm";
import { tables, DrizzleMatchRuleRepo, DrizzleCategoryRepo, type DbClient } from "@upshot/db";
import {
  previewMatches,
  planRuleApplication,
  validateRuleTargets,
  type LoadedRule,
  type UpClientPort,
} from "@upshot/core";
import { setCategory, setTags, logEvent, type ServerActionWarning } from "./money-core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SaveRuleResult = { ok: true } | { ok: false; badCategoryId: string };
export type ApplyRuleResult = { applied: number; warning?: ServerActionWarning };

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/** All rules (active + inactive) with their conditions + actions. */
export async function listRules(db: DbClient): Promise<LoadedRule[]> {
  return new DrizzleMatchRuleRepo(db).loadAll();
}

/**
 * Validate SET_CATEGORY targets against the synced categories, then create or
 * update the rule. A bad target is returned as a typed result and NOTHING is
 * written.
 */
export async function saveRule(db: DbClient, rule: LoadedRule): Promise<SaveRuleResult> {
  const ids = new Set((await new DrizzleCategoryRepo(db).list()).map((c) => c.id));
  const v = validateRuleTargets(rule, ids);
  if (!v.ok) return { ok: false, badCategoryId: v.badId };

  const repo = new DrizzleMatchRuleRepo(db);
  const exists = await repo.getById(rule.rule.id);
  if (exists) {
    await repo.update(rule);
  } else {
    await repo.create(rule);
  }
  return { ok: true };
}

/** Delete a rule (cascade removes its conditions + actions). */
export async function deleteRule(db: DbClient, id: string): Promise<void> {
  await new DrizzleMatchRuleRepo(db).delete(id);
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

/** Count how many stored transactions the (possibly draft) rule would match. */
export async function previewRule(db: DbClient, rule: LoadedRule): Promise<{ count: number }> {
  const txns = db.select().from(tables.transactions).all();
  return { count: previewMatches(rule, txns).length };
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

/**
 * Plan the rule against all stored transactions and apply each patch
 * local-first, then best-effort push to Up. A push failure is logged and
 * surfaced via the first warning — the local write is NEVER rolled back.
 */
export async function applyRule(
  db: DbClient,
  up: UpClientPort | null,
  id: string,
): Promise<ApplyRuleResult> {
  const repo = new DrizzleMatchRuleRepo(db);
  const loaded = await repo.getById(id);
  if (loaded === null) return { applied: 0 };

  const txns = db.select().from(tables.transactions).all();
  const patches = planRuleApplication(loaded, txns);

  let warning: ServerActionWarning | undefined;

  for (const patch of patches) {
    // Local-only columns — one combined update of just the present fields.
    const localSet: Partial<typeof tables.transactions.$inferInsert> = {};
    if (patch.description !== undefined) localSet.description = patch.description;
    if (patch.isSalary !== undefined) localSet.isSalary = patch.isSalary;
    if (patch.isTransfer !== undefined) localSet.isTransfer = patch.isTransfer;
    if (patch.isInterest !== undefined) localSet.isInterest = patch.isInterest;
    if (patch.isTaxDeductible !== undefined) localSet.isTaxDeductible = patch.isTaxDeductible;
    if (patch.taxDeductionCategory !== undefined) {
      localSet.taxDeductionCategory = patch.taxDeductionCategory;
    }
    if (Object.keys(localSet).length > 0) {
      db.update(tables.transactions)
        .set(localSet)
        .where(eq(tables.transactions.id, patch.transactionId))
        .run();
      logEvent(db, "apply_rule", "transaction", patch.transactionId, "Applied rule local fields", {
        ruleId: id,
        fields: Object.keys(localSet),
      });
    }

    // categoryId — local write + best-effort Up push (B3 contract).
    if (patch.categoryId !== undefined) {
      const r = await setCategory(db, up, patch.transactionId, patch.categoryId);
      warning ??= r.warning;
    }

    // addTagIds — local insert + best-effort Up push (B3 contract).
    if (patch.addTagIds?.length) {
      const r = await setTags(db, up, patch.transactionId, patch.addTagIds, []);
      warning ??= r.warning;
    }
  }

  return { applied: patches.length, warning };
}
