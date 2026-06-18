// packages/core/src/match/apply.test.ts
import { describe, it, expect } from "vitest";
import { previewMatches, planRuleApplication, validateRuleTargets, type RulePatch } from "./apply";
import type { LoadedRule } from "../ports/match-rule-repo";
import type { Transaction, MatchCondition, MatchAction } from "@upshot/contracts";

function txn(over: Partial<Transaction> = {}): Transaction {
  return {
    id: "t1", accountId: "a1", status: "SETTLED", description: "Patreon", message: null, rawText: null,
    amountCents: -1430, currency: "AUD", foreignAmountCents: null, foreignCurrency: null,
    categoryId: null, parentCategoryId: null, isTransfer: false, transferAccountId: null,
    isSalary: false, isInterest: false, isTaxDeductible: false, taxDeductionCategory: null,
    cardPurchaseMethod: null, cardNumberSuffix: null, roundUpCents: null, cashbackCents: null,
    note: null, attachmentId: null, attachmentUrl: null, settledAt: null,
    createdAt: "2026-06-12T00:00:00.000Z", ...over,
  };
}

function rule(
  over: Partial<LoadedRule["rule"]>,
  conditions: MatchCondition[],
  actions: MatchAction[],
): LoadedRule {
  return { rule: { id: "r", name: "r", isActive: true, priority: 10, ...over }, conditions, actions };
}

function cond(over: Partial<MatchCondition>): MatchCondition {
  return { id: "c", ruleId: "r", field: "description", mode: "contains", value: "", amountCents: null, toleranceCents: null, currency: null, ...over };
}

function action(over: Partial<MatchAction>): MatchAction {
  return { id: "a", ruleId: "r", type: "MARK_SALARY", value: null, targetId: null, ...over };
}

describe("previewMatches", () => {
  it("returns only txns matching the conditions", () => {
    const r = rule({}, [cond({ field: "description", mode: "contains", value: "patreon" })], []);
    const a = txn({ id: "a", description: "Patreon monthly" });
    const b = txn({ id: "b", description: "Coffee" });
    expect(previewMatches(r, [a, b])).toEqual([a]);
  });

  it("exercises engine amount±tolerance + currency/foreign-leg semantics", () => {
    // USD Patreon charge matched on the foreign amount within tolerance
    const r = rule({}, [
      cond({ field: "description", mode: "exact", value: "Patreon", amountCents: 6073, toleranceCents: 100, currency: "USD" }),
    ], []);
    const inTol = txn({ id: "in", amountCents: -9500, foreignAmountCents: -6073, foreignCurrency: "USD" });
    const outTol = txn({ id: "out", amountCents: -9500, foreignAmountCents: -6500, foreignCurrency: "USD" });
    expect(previewMatches(r, [inTol, outTol])).toEqual([inTol]);
  });

  it("a zero-condition rule matches nothing", () => {
    const r = rule({}, [], [action({ type: "MARK_SALARY" })]);
    expect(previewMatches(r, [txn({ id: "a" }), txn({ id: "b" })])).toEqual([]);
  });

  it("matches regardless of isActive", () => {
    const r = rule({ isActive: false }, [cond({ value: "patreon" })], []);
    const a = txn({ id: "a", description: "Patreon" });
    expect(previewMatches(r, [a])).toEqual([a]);
  });
});

describe("validateRuleTargets", () => {
  const known = new Set(["cat-1", "cat-2"]);

  it("returns ok:true when all SET_CATEGORY targets are known", () => {
    const r = rule({}, [cond({ value: "x" })], [action({ type: "SET_CATEGORY", targetId: "cat-1" })]);
    expect(validateRuleTargets(r, known)).toEqual({ ok: true });
  });

  it("returns ok:true when there are no SET_CATEGORY actions", () => {
    const r = rule({}, [cond({ value: "x" })], [action({ type: "MARK_SALARY" }), action({ type: "APPLY_TAG", targetId: "tag-x" })]);
    expect(validateRuleTargets(r, known)).toEqual({ ok: true });
  });

  it("flags a SET_CATEGORY whose targetId is not in the known set", () => {
    const r = rule({}, [cond({ value: "x" })], [action({ type: "SET_CATEGORY", targetId: "cat-missing" })]);
    expect(validateRuleTargets(r, known)).toEqual({ ok: false, badId: "cat-missing" });
  });

  it("flags a SET_CATEGORY with a null targetId (badId empty string)", () => {
    const r = rule({}, [cond({ value: "x" })], [action({ type: "SET_CATEGORY", targetId: null })]);
    expect(validateRuleTargets(r, known)).toEqual({ ok: false, badId: "" });
  });

  it("short-circuits on the first offender", () => {
    const r = rule({}, [cond({ value: "x" })], [
      action({ id: "a1", type: "SET_CATEGORY", targetId: "bad-1" }),
      action({ id: "a2", type: "SET_CATEGORY", targetId: "bad-2" }),
    ]);
    expect(validateRuleTargets(r, known)).toEqual({ ok: false, badId: "bad-1" });
  });
});

describe("planRuleApplication", () => {
  it("produces one patch per matching txn with only the fields the actions set", () => {
    const r = rule({}, [cond({ value: "patreon" })], [action({ type: "RENAME", value: "Renamed" })]);
    const a = txn({ id: "a", description: "Patreon" });
    const b = txn({ id: "b", description: "Coffee" });
    const patches = planRuleApplication(r, [a, b]);
    expect(patches).toEqual<RulePatch[]>([{ transactionId: "a", description: "Renamed" }]);
  });

  it("maps RENAME → description (only when value non-null)", () => {
    const a = txn({ id: "a", description: "Patreon" });
    const r = rule({}, [cond({ value: "patreon" })], [action({ type: "RENAME", value: null })]);
    expect(planRuleApplication(r, [a])).toEqual<RulePatch[]>([{ transactionId: "a" }]);
  });

  it("maps SET_CATEGORY → categoryId", () => {
    const a = txn({ id: "a", description: "Patreon" });
    const r = rule({}, [cond({ value: "patreon" })], [action({ type: "SET_CATEGORY", targetId: "cat-1" })]);
    expect(planRuleApplication(r, [a])).toEqual<RulePatch[]>([{ transactionId: "a", categoryId: "cat-1" }]);
  });

  it("maps APPLY_TAG → addTagIds (engine does not handle this)", () => {
    const a = txn({ id: "a", description: "Patreon" });
    const r = rule({}, [cond({ value: "patreon" })], [
      action({ id: "a1", type: "APPLY_TAG", targetId: "tag-1" }),
      action({ id: "a2", type: "APPLY_TAG", targetId: "tag-2" }),
      action({ id: "a3", type: "APPLY_TAG", targetId: null }),
    ]);
    expect(planRuleApplication(r, [a])).toEqual<RulePatch[]>([{ transactionId: "a", addTagIds: ["tag-1", "tag-2"] }]);
  });

  it("maps MARK_* flags", () => {
    const a = txn({ id: "a", description: "Patreon" });
    const r = rule({}, [cond({ value: "patreon" })], [
      action({ id: "s", type: "MARK_SALARY" }),
      action({ id: "t", type: "MARK_TRANSFER" }),
      action({ id: "i", type: "MARK_INTEREST" }),
    ]);
    expect(planRuleApplication(r, [a])).toEqual<RulePatch[]>([
      { transactionId: "a", isSalary: true, isTransfer: true, isInterest: true },
    ]);
  });

  it("maps MARK_DEDUCTIBLE → isTaxDeductible + taxDeductionCategory", () => {
    const a = txn({ id: "a", description: "Patreon" });
    const r = rule({}, [cond({ value: "patreon" })], [action({ type: "MARK_DEDUCTIBLE", value: "Home office" })]);
    expect(planRuleApplication(r, [a])).toEqual<RulePatch[]>([
      { transactionId: "a", isTaxDeductible: true, taxDeductionCategory: "Home office" },
    ]);
  });

  it("skips deferred action types (no patch field)", () => {
    const a = txn({ id: "a", description: "Patreon" });
    const r = rule({}, [cond({ value: "patreon" })], [
      action({ id: "ig", type: "IGNORE_SUBSCRIPTION" }),
      action({ id: "ld", type: "LINK_DEBT", targetId: "d1" }),
    ]);
    expect(planRuleApplication(r, [a])).toEqual<RulePatch[]>([{ transactionId: "a" }]);
  });

  it("folds multiple actions into one patch", () => {
    const a = txn({ id: "a", description: "Patreon" });
    const r = rule({}, [cond({ value: "patreon" })], [
      action({ id: "r1", type: "RENAME", value: "Patreon - TrueAnon" }),
      action({ id: "c1", type: "SET_CATEGORY", targetId: "cat-1" }),
      action({ id: "t1", type: "APPLY_TAG", targetId: "tag-1" }),
    ]);
    expect(planRuleApplication(r, [a])).toEqual<RulePatch[]>([
      { transactionId: "a", description: "Patreon - TrueAnon", categoryId: "cat-1", addTagIds: ["tag-1"] },
    ]);
  });
});
