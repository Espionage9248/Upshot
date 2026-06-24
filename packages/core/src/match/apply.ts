// packages/core/src/match/apply.ts
import type { Transaction, MatchAction } from "@upshot/contracts";
import type { LoadedRule } from "../ports/match-rule-repo";
import { evaluateCondition, type MatchTarget } from "./engine";

/** Per-transaction field patch a rule's actions would produce. Pure — caller persists + pushes. */
export interface RulePatch {
  transactionId: string;
  description?: string;
  categoryId?: string;
  addTagIds?: string[];
  isSalary?: boolean;
  isTransfer?: boolean;
  isInterest?: boolean;
  isTaxDeductible?: boolean;
  taxDeductionCategory?: string | null;
}

function toTarget(txn: Transaction): MatchTarget {
  return {
    description: txn.description,
    // A stored Transaction carries only categoryId, not the category name, and the locked
    // previewMatches signature provides no name map — so categoryName conditions can't be
    // evaluated in standalone preview and will simply not match. (Resolved later in C3.)
    categoryName: null,
    rawText: txn.rawText,
    note: txn.note,
    amountCents: txn.amountCents,
    currency: txn.currency,
    foreignAmountCents: txn.foreignAmountCents,
    foreignCurrency: txn.foreignCurrency,
  };
}

/**
 * A rule matches a txn iff it has at least one condition and every condition holds.
 * A zero-condition rule matches NOTHING (never everything). Matching ignores rule.isActive —
 * preview/plan operate on a draft rule the user is still editing, before it's switched on.
 */
function matches(rule: LoadedRule, txn: Transaction): boolean {
  return rule.conditions.length > 0 && rule.conditions.every((c) => evaluateCondition(c, toTarget(txn)));
}

export function previewMatches(rule: LoadedRule, txns: Transaction[]): Transaction[] {
  return txns.filter((t) => matches(rule, t));
}

export function planRuleApplication(rule: LoadedRule, txns: Transaction[]): RulePatch[] {
  const out: RulePatch[] = [];
  for (const txn of txns) {
    if (!matches(rule, txn)) continue;
    const patch: RulePatch = { transactionId: txn.id };
    for (const action of rule.actions) applyToPatch(patch, action);
    out.push(patch);
  }
  return out;
}

function applyToPatch(patch: RulePatch, action: MatchAction): void {
  switch (action.type) {
    case "RENAME":
      if (action.value !== null) patch.description = action.value;
      return;
    case "SET_CATEGORY":
      if (action.targetId !== null) patch.categoryId = action.targetId;
      return;
    case "APPLY_TAG":
      if (action.targetId !== null) (patch.addTagIds ??= []).push(action.targetId);
      return;
    case "MARK_SALARY":
      patch.isSalary = true;
      return;
    case "MARK_TRANSFER":
      patch.isTransfer = true;
      return;
    case "MARK_INTEREST":
      patch.isInterest = true;
      return;
    case "MARK_DEDUCTIBLE":
      patch.isTaxDeductible = true;
      patch.taxDeductionCategory = action.value;
      return;
    // Deferred past Phase 4 — explicit no-ops so a new enum member is a compile error.
    case "IGNORE_SUBSCRIPTION":
    case "LINK_DEBT":
    case "LINK_RECURRING":
    case "LINK_INSTALLMENT":
      return;
    default:
      return assertNever(action.type);
  }
}

export function validateRuleTargets(
  rule: LoadedRule,
  knownCategoryIds: Set<string>,
): { ok: true } | { ok: false; badId: string } {
  for (const action of rule.actions) {
    if (action.type !== "SET_CATEGORY") continue;
    if (action.targetId === null || !knownCategoryIds.has(action.targetId)) {
      return { ok: false, badId: action.targetId ?? "" };
    }
  }
  return { ok: true };
}

/** Compile-time exhaustiveness guard: a new match action enum member becomes a build error here. */
function assertNever(value: never): never {
  throw new Error(`Unhandled match action type: ${String(value)}`);
}
