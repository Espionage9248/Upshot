// packages/core/src/match/engine.test.ts
import { describe, it, expect } from "vitest";
import { applyRules, type MatchTarget } from "./engine";
import type { LoadedRule } from "../ports/match-rule-repo";
import type { NewTransaction } from "../ports/transaction-repo";

function baseTxn(over: Partial<NewTransaction> = {}): NewTransaction {
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

function targetFrom(t: NewTransaction, categoryName: string | null = null): MatchTarget {
  return {
    description: t.description, categoryName, rawText: t.rawText,
    amountCents: t.amountCents, currency: t.currency,
    foreignAmountCents: t.foreignAmountCents, foreignCurrency: t.foreignCurrency,
  };
}

function rule(over: Partial<LoadedRule["rule"]>, conditions: LoadedRule["conditions"], actions: LoadedRule["actions"]): LoadedRule {
  return { rule: { id: "r", name: "r", isActive: true, priority: 10, ...over }, conditions, actions };
}

describe("applyRules — Patreon USD (foreign leg)", () => {
  it("renames a USD Patreon charge matched on the foreign amount within tolerance", () => {
    const txn = baseTxn({ amountCents: -9500, foreignAmountCents: -6073, foreignCurrency: "USD" });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "description", mode: "exact", value: "Patreon", amountCents: 6073, toleranceCents: 100, currency: "USD" },
    ], [
      { id: "a", ruleId: "r", type: "RENAME", value: "Patreon - TrueAnon", targetId: null },
    ])];
    const { transaction, applied } = applyRules(txn, targetFrom(txn), rules);
    expect(transaction.description).toBe("Patreon - TrueAnon");
    expect(applied).toEqual(["RENAME"]);
  });

  it("does NOT match a USD rule against an AUD-only charge", () => {
    const txn = baseTxn({ amountCents: -6073, foreignAmountCents: null, foreignCurrency: null });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "description", mode: "exact", value: "Patreon", amountCents: 6073, toleranceCents: 100, currency: "USD" },
    ], [{ id: "a", ruleId: "r", type: "RENAME", value: "Patreon - TrueAnon", targetId: null }])];
    const { transaction } = applyRules(txn, targetFrom(txn), rules);
    expect(transaction.description).toBe("Patreon");
  });
});

describe("applyRules — Patreon AUD (primary leg, only when no foreign)", () => {
  it("matches an AUD-direct charge", () => {
    const txn = baseTxn({ amountCents: -935, foreignAmountCents: null, foreignCurrency: null });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "description", mode: "exact", value: "Patreon", amountCents: 935, toleranceCents: 100, currency: "AUD" },
    ], [{ id: "a", ruleId: "r", type: "RENAME", value: "Patreon - Blank Check", targetId: null }])];
    expect(applyRules(txn, targetFrom(txn), rules).transaction.description).toBe("Patreon - Blank Check");
  });

  it("does NOT match an AUD rule when a USD foreign leg is present (avoids false-positive)", () => {
    const txn = baseTxn({ amountCents: -935, foreignAmountCents: -600, foreignCurrency: "USD" });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "description", mode: "exact", value: "Patreon", amountCents: 935, toleranceCents: 100, currency: "AUD" },
    ], [{ id: "a", ruleId: "r", type: "RENAME", value: "Patreon - Blank Check", targetId: null }])];
    expect(applyRules(txn, targetFrom(txn), rules).transaction.description).toBe("Patreon");
  });
});

describe("applyRules — salary / transfer / interest / deductible", () => {
  it("MARK_SALARY on a description contains match", () => {
    const txn = baseTxn({ description: "EMPLOYER PTY LTD SALARY", amountCents: 500000 });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "description", mode: "contains", value: "salary", amountCents: null, toleranceCents: null, currency: null },
    ], [{ id: "a", ruleId: "r", type: "MARK_SALARY", value: null, targetId: null }])];
    expect(applyRules(txn, targetFrom(txn), rules).transaction.isSalary).toBe(true);
  });

  it("MARK_TRANSFER", () => {
    const txn = baseTxn({ description: "Transfer to Savings" });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "description", mode: "startsWith", value: "transfer", amountCents: null, toleranceCents: null, currency: null },
    ], [{ id: "a", ruleId: "r", type: "MARK_TRANSFER", value: null, targetId: null }])];
    expect(applyRules(txn, targetFrom(txn), rules).transaction.isTransfer).toBe(true);
  });

  it("MARK_INTEREST on a categoryName match", () => {
    const txn = baseTxn({ description: "Bonus Interest", amountCents: 152 });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "categoryName", mode: "exact", value: "Interest", amountCents: null, toleranceCents: null, currency: null },
    ], [{ id: "a", ruleId: "r", type: "MARK_INTEREST", value: null, targetId: null }])];
    expect(applyRules(txn, targetFrom(txn, "Interest"), rules).transaction.isInterest).toBe(true);
  });

  it("MARK_DEDUCTIBLE sets the flag and the deduction category", () => {
    const txn = baseTxn({ description: "Accountant Fee" });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "description", mode: "contains", value: "accountant", amountCents: null, toleranceCents: null, currency: null },
    ], [{ id: "a", ruleId: "r", type: "MARK_DEDUCTIBLE", value: "Tax Affairs", targetId: null }])];
    const out = applyRules(txn, targetFrom(txn), rules).transaction;
    expect(out.isTaxDeductible).toBe(true);
    expect(out.taxDeductionCategory).toBe("Tax Affairs");
  });

  it("SET_CATEGORY uses targetId", () => {
    const txn = baseTxn({ description: "Woolworths" });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "description", mode: "contains", value: "woolworths", amountCents: null, toleranceCents: null, currency: null },
    ], [{ id: "a", ruleId: "r", type: "SET_CATEGORY", value: null, targetId: "groceries" }])];
    expect(applyRules(txn, targetFrom(txn), rules).transaction.categoryId).toBe("groceries");
  });
});

describe("applyRules — engine semantics", () => {
  it("ignores unsupported actions (APPLY_TAG/LINK_*) and does not count them", () => {
    const txn = baseTxn({ description: "Netflix" });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "description", mode: "contains", value: "netflix", amountCents: null, toleranceCents: null, currency: null },
    ], [
      { id: "a1", ruleId: "r", type: "APPLY_TAG", value: "Streaming", targetId: null },
      { id: "a2", ruleId: "r", type: "MARK_DEDUCTIBLE", value: null, targetId: null },
    ])];
    const { transaction, applied } = applyRules(txn, targetFrom(txn), rules);
    expect(transaction.isTaxDeductible).toBe(true);
    expect(applied).toEqual(["MARK_DEDUCTIBLE"]); // APPLY_TAG not applied
  });

  it("evaluates against the original target — a RENAME does not affect later rules", () => {
    const txn = baseTxn({ description: "Patreon" });
    const rules = [
      rule({ id: "r1", priority: 10 }, [
        { id: "c1", ruleId: "r1", field: "description", mode: "exact", value: "Patreon", amountCents: null, toleranceCents: null, currency: null },
      ], [{ id: "a1", ruleId: "r1", type: "RENAME", value: "Patreon - X", targetId: null }]),
      rule({ id: "r2", priority: 20 }, [
        { id: "c2", ruleId: "r2", field: "description", mode: "exact", value: "Patreon", amountCents: null, toleranceCents: null, currency: null },
      ], [{ id: "a2", ruleId: "r2", type: "MARK_DEDUCTIBLE", value: null, targetId: null }]),
    ];
    const out = applyRules(txn, targetFrom(txn), rules).transaction;
    expect(out.description).toBe("Patreon - X");
    expect(out.isTaxDeductible).toBe(true); // r2 still matched the original "Patreon"
  });

  it("a rule with no conditions never matches", () => {
    const txn = baseTxn();
    const rules = [rule({}, [], [{ id: "a", ruleId: "r", type: "MARK_SALARY", value: null, targetId: null }])];
    expect(applyRules(txn, targetFrom(txn), rules).transaction.isSalary).toBe(false);
  });

  it("regex mode matches on the raw (case-sensitive) value", () => {
    const txn = baseTxn({ description: "UBER *EATS" });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "description", mode: "regex", value: "^UBER \\*", amountCents: null, toleranceCents: null, currency: null },
    ], [{ id: "a", ruleId: "r", type: "MARK_DEDUCTIBLE", value: null, targetId: null }])];
    expect(applyRules(txn, targetFrom(txn), rules).transaction.isTaxDeductible).toBe(true);
  });

  it("skips inactive rules", () => {
    const txn = baseTxn({ description: "Patreon" });
    const rules = [rule({ isActive: false }, [
      { id: "c", ruleId: "r", field: "description", mode: "exact", value: "Patreon", amountCents: null, toleranceCents: null, currency: null },
    ], [{ id: "a", ruleId: "r", type: "MARK_SALARY", value: null, targetId: null }])];
    expect(applyRules(txn, targetFrom(txn), rules).transaction.isSalary).toBe(false);
  });

  it("amount match is inclusive at the tolerance boundary (diff === tolerance)", () => {
    const txn = baseTxn({ amountCents: -1035, foreignAmountCents: null, foreignCurrency: null });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "description", mode: "exact", value: "Patreon", amountCents: 935, toleranceCents: 100, currency: "AUD" },
    ], [{ id: "a", ruleId: "r", type: "MARK_DEDUCTIBLE", value: null, targetId: null }])];
    // |1035 - 935| = 100 === tolerance → inclusive (<=) match
    expect(applyRules(txn, targetFrom(txn), rules).transaction.isTaxDeductible).toBe(true);
  });

  it("amount match with null tolerance requires the exact amount", () => {
    const onAmount = baseTxn({ amountCents: -935, foreignAmountCents: null, foreignCurrency: null });
    const offByOne = baseTxn({ amountCents: -936, foreignAmountCents: null, foreignCurrency: null });
    const rules = [rule({}, [
      { id: "c", ruleId: "r", field: "description", mode: "exact", value: "Patreon", amountCents: 935, toleranceCents: null, currency: "AUD" },
    ], [{ id: "a", ruleId: "r", type: "MARK_DEDUCTIBLE", value: null, targetId: null }])];
    expect(applyRules(onAmount, targetFrom(onAmount), rules).transaction.isTaxDeductible).toBe(true);
    expect(applyRules(offByOne, targetFrom(offByOne), rules).transaction.isTaxDeductible).toBe(false);
  });
});
