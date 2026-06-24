import { expect, test } from "vitest";
import { matchDebtPayments, compilePatternRegex } from "./match-payments";
import type { MatchCondition } from "@upshot/contracts";

test("compilePatternRegex matches any comma pattern, case-insensitive, escapes specials", () => {
  const re = compilePatternRegex(["ZipMoney", "ZipPay", "Zip"]);
  expect(re.test("zippay direct debit")).toBe(true);
  expect(re.test("AFTERPAY")).toBe(false);
  expect(compilePatternRegex(["a.b"]).test("aXb")).toBe(false); // "." escaped
});

// ---------------------------------------------------------------------------
// New-shape transactions (full MatchTarget fields)
// ---------------------------------------------------------------------------
const baseTx = {
  rawText: null as string | null,
  note: null as string | null,
  currency: "AUD",
  foreignAmountCents: null as number | null,
  foreignCurrency: null as string | null,
  categoryName: null as string | null,
};

const txs = [
  { id: "t1", description: "ZipPay payment", amountCents: -5000, createdAt: "2026-06-01T00:00:00Z", settledAt: null, isTransfer: false, ...baseTx },
  { id: "t2", description: "ZipMoney", amountCents: -3000, createdAt: "2026-06-15T00:00:00Z", settledAt: null, isTransfer: false, ...baseTx },
  { id: "t3", description: "Salary", amountCents: 400000, createdAt: "2026-06-10T00:00:00Z", settledAt: null, isTransfer: false, ...baseTx },
  { id: "t4", description: "ZipPay", amountCents: -2000, createdAt: "2026-06-20T00:00:00Z", settledAt: null, isTransfer: true, ...baseTx },
];

// ---------------------------------------------------------------------------
// (a) Backward-compat: description-only condition still matches
// ---------------------------------------------------------------------------
test("(a) description-only condition: matches outgoing tx by description, reduces balance", () => {
  const conditions: MatchCondition[] = [
    { id: "c1", ruleId: "r1", field: "description", mode: "contains", value: "zip", amountCents: null, toleranceCents: null, currency: null },
  ];
  const matchers = [{ debtId: "d1", currentBalanceCents: 20000, conditions }];
  const r = matchDebtPayments(matchers, txs, new Set(["t1"])); // t1 already linked
  // t2 matches "zip" (contains), t3 income skipped, t4 transfer skipped, t1 already linked
  expect(r.payments.map((p) => p.transactionId)).toEqual(["t2"]);
  expect(r.balanceUpdates).toEqual([{ debtId: "d1", newBalanceCents: 17000 }]); // 20000 - 3000
});

// ---------------------------------------------------------------------------
// (b) Amount condition: matches only in-band outgoing txs
// ---------------------------------------------------------------------------
test("(b) amount condition: matches -3000 tx but not -5000 tx for the same description", () => {
  // Two "ZipPay" txs: -5000 (t1) and -3000 (t2). Debt has description+amount condition for 3000 exact.
  const conditions: MatchCondition[] = [
    { id: "c1", ruleId: "r1", field: "description", mode: "contains", value: "zip", amountCents: null, toleranceCents: null, currency: null },
    { id: "c2", ruleId: "r1", field: "description", mode: "contains", value: "zip", amountCents: 3000, toleranceCents: 0, currency: null },
  ];
  const matchers = [{ debtId: "d1", currentBalanceCents: 10000, conditions }];
  const r = matchDebtPayments(matchers, txs, new Set());
  // t1 is -5000, t2 is -3000 — only t2 passes the amount=3000 condition
  // Both have "zip" in description but t1 fails the amount check (5000 != 3000)
  expect(r.payments.map((p) => p.transactionId)).toEqual(["t2"]);
  expect(r.balanceUpdates).toEqual([{ debtId: "d1", newBalanceCents: 7000 }]); // 10000 - 3000
});

// ---------------------------------------------------------------------------
// (c) Transfers and incoming (positive) txs never match
// ---------------------------------------------------------------------------
test("(c) transfers and incoming txs never match", () => {
  const conditions: MatchCondition[] = [
    { id: "c1", ruleId: "r1", field: "description", mode: "contains", value: "zip", amountCents: null, toleranceCents: null, currency: null },
  ];
  const matchers = [{ debtId: "d1", currentBalanceCents: 5000, conditions }];
  // Use only t3 (income) and t4 (transfer)
  const r = matchDebtPayments(matchers, [txs[2]!, txs[3]!], new Set());
  expect(r.payments).toHaveLength(0);
  expect(r.balanceUpdates).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// Balance never goes below zero (existing property)
// ---------------------------------------------------------------------------
test("balance never goes below zero", () => {
  const conditions: MatchCondition[] = [
    { id: "c1", ruleId: "r1", field: "description", mode: "contains", value: "zip", amountCents: null, toleranceCents: null, currency: null },
  ];
  const matchers = [{ debtId: "d1", currentBalanceCents: 1000, conditions }];
  const r = matchDebtPayments(matchers, [txs[1]!], new Set()); // t2 is -3000, balance 1000
  expect(r.balanceUpdates[0]!.newBalanceCents).toBe(0);
});

// ---------------------------------------------------------------------------
// Debt with zero conditions matches nothing
// ---------------------------------------------------------------------------
test("debt with zero conditions matches nothing", () => {
  const matchers = [{ debtId: "d1", currentBalanceCents: 10000, conditions: [] as MatchCondition[] }];
  const r = matchDebtPayments(matchers, txs, new Set());
  expect(r.payments).toHaveLength(0);
  expect(r.balanceUpdates).toHaveLength(0);
});
