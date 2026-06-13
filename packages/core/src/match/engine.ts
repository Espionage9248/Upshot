// packages/core/src/match/engine.ts
import type { MatchCondition, MatchAction } from "@upshot/contracts";
import type { LoadedRule } from "../ports/match-rule-repo";
import type { NewTransaction } from "../ports/transaction-repo";

export interface MatchTarget {
  description: string;
  categoryName: string | null;
  rawText: string | null;
  amountCents: number;
  currency: string;
  foreignAmountCents: number | null;
  foreignCurrency: string | null;
}

/** Phase 2 supports the transaction-column actions only. The rest are deferred (Phase 4.3). */
const SUPPORTED = new Set(["RENAME", "SET_CATEGORY", "MARK_SALARY", "MARK_TRANSFER", "MARK_INTEREST", "MARK_DEDUCTIBLE"]);

/**
 * Apply active rules (assumed already sorted by ascending priority) to `txn`.
 * Conditions are evaluated against the immutable `target`; supported actions
 * accumulate onto a copy of `txn`. Returns the result + the list of applied
 * action types (for counts).
 */
export function applyRules(
  txn: NewTransaction,
  target: MatchTarget,
  rules: LoadedRule[],
): { transaction: NewTransaction; applied: string[] } {
  let out = { ...txn };
  const applied: string[] = [];
  for (const { rule, conditions, actions } of rules) {
    if (!rule.isActive || conditions.length === 0) continue;
    if (!conditions.every((c) => evaluateCondition(c, target))) continue;
    for (const action of actions) {
      if (!SUPPORTED.has(action.type)) continue;
      out = applyAction(out, action);
      applied.push(action.type);
    }
  }
  return { transaction: out, applied };
}

export function evaluateCondition(c: MatchCondition, t: MatchTarget): boolean {
  if (!matchText(c, t)) return false;
  if (c.amountCents !== null && !matchAmount(c, t)) return false;
  return true;
}

function fieldValue(field: MatchCondition["field"], t: MatchTarget): string | null {
  switch (field) {
    case "description": return t.description;
    case "categoryName": return t.categoryName;
    case "rawText": return t.rawText;
    default: return assertNever(field);
  }
}

function matchText(c: MatchCondition, t: MatchTarget): boolean {
  const value = fieldValue(c.field, t);
  if (value === null) return false;
  if (c.mode === "regex") return new RegExp(c.value).test(value);
  const hay = value.toLowerCase();
  const needle = c.value.toLowerCase();
  switch (c.mode) {
    case "contains": return hay.includes(needle);
    case "startsWith": return hay.startsWith(needle);
    case "exact": return hay === needle;
    default: return assertNever(c.mode);
  }
}

/**
 * Currency-aware amount match (reproduces V1 Patreon semantics):
 * - condition.currency === txn.foreignCurrency → compare |foreignAmountCents|
 * - condition.currency === txn.currency, and NO foreign leg → compare |amountCents|
 * - condition.currency null → compare |amountCents|
 */
function matchAmount(c: MatchCondition, t: MatchTarget): boolean {
  const tol = c.toleranceCents ?? 0;
  const target = Math.abs(c.amountCents as number);
  if (c.currency !== null) {
    if (t.foreignCurrency !== null && c.currency === t.foreignCurrency) {
      if (t.foreignAmountCents === null) return false;
      return Math.abs(Math.abs(t.foreignAmountCents) - target) <= tol;
    }
    if (c.currency === t.currency) {
      if (t.foreignCurrency !== null) return false;
      return Math.abs(Math.abs(t.amountCents) - target) <= tol;
    }
    return false;
  }
  return Math.abs(Math.abs(t.amountCents) - target) <= tol;
}

function applyAction(txn: NewTransaction, action: MatchAction): NewTransaction {
  switch (action.type) {
    case "RENAME": return action.value ? { ...txn, description: action.value } : txn;
    case "SET_CATEGORY": return { ...txn, categoryId: action.targetId ?? action.value ?? txn.categoryId };
    case "MARK_SALARY": return { ...txn, isSalary: true };
    case "MARK_TRANSFER": return { ...txn, isTransfer: true };
    case "MARK_INTEREST": return { ...txn, isInterest: true };
    case "MARK_DEDUCTIBLE": return { ...txn, isTaxDeductible: true, taxDeductionCategory: action.value ?? txn.taxDeductionCategory };
    default: return txn;
  }
}

/** Compile-time exhaustiveness guard: a new match enum member becomes a build error here. */
function assertNever(value: never): never {
  throw new Error(`Unhandled match enum value: ${String(value)}`);
}
