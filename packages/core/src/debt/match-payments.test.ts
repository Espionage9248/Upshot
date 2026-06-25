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
  const matchers = [{ debtId: "d1", currentBalanceCents: 20000, conditions, linkedAt: "2020-01-01" }];
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
  const matchers = [{ debtId: "d1", currentBalanceCents: 10000, conditions, linkedAt: "2020-01-01" }];
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
  const matchers = [{ debtId: "d1", currentBalanceCents: 5000, conditions, linkedAt: null }];
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
  const matchers = [{ debtId: "d1", currentBalanceCents: 1000, conditions, linkedAt: "2020-01-01" }];
  const r = matchDebtPayments(matchers, [txs[1]!], new Set()); // t2 is -3000, balance 1000
  expect(r.balanceUpdates[0]!.newBalanceCents).toBe(0);
});

// ---------------------------------------------------------------------------
// Debt with zero conditions matches nothing
// ---------------------------------------------------------------------------
test("debt with zero conditions matches nothing", () => {
  const matchers = [{ debtId: "d1", currentBalanceCents: 10000, conditions: [] as MatchCondition[], linkedAt: null }];
  const r = matchDebtPayments(matchers, txs, new Set());
  expect(r.payments).toHaveLength(0);
  expect(r.balanceUpdates).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// Forward-only balance: linkedAt gates the decrement
// ---------------------------------------------------------------------------

// two outgoing Zip payments, one before and one after the link date
const fwdTxs = [
  { id: "p1", description: "ZipPay", amountCents: -3000, createdAt: "2026-01-10T00:00:00Z", settledAt: null, isTransfer: false, ...baseTx },
  { id: "p2", description: "ZipPay", amountCents: -2000, createdAt: "2026-06-10T00:00:00Z", settledAt: null, isTransfer: false, ...baseTx },
];

const zipCond: MatchCondition[] = [
  { id: "c1", ruleId: "r1", field: "description", mode: "contains", value: "zip", amountCents: null, toleranceCents: null, currency: null },
];

test("forward-only: records both payments but only decrements for paidAt >= linkedAt", () => {
  const matchers = [{ debtId: "d1", currentBalanceCents: 10000, conditions: zipCond, linkedAt: "2026-03-01" }];
  const r = matchDebtPayments(matchers, fwdTxs, new Set());
  // both recorded for history
  expect(r.payments.map((p) => p.transactionId)).toEqual(["p1", "p2"]);
  // only p2 (2026-06-10 >= 2026-03-01) decrements: 10000 - 2000 = 8000
  expect(r.balanceUpdates).toEqual([{ debtId: "d1", newBalanceCents: 8000 }]);
});

test("forward-only: linkedAt null records all but decrements nothing", () => {
  const matchers = [{ debtId: "d1", currentBalanceCents: 10000, conditions: zipCond, linkedAt: null }];
  const r = matchDebtPayments(matchers, fwdTxs, new Set());
  expect(r.payments.map((p) => p.transactionId)).toEqual(["p1", "p2"]);
  expect(r.balanceUpdates).toEqual([{ debtId: "d1", newBalanceCents: 10000 }]);
});

// ---------------------------------------------------------------------------
// decrementSince: full-history recording, but decrement stays in a recent window
// ---------------------------------------------------------------------------

// linkedAt far in the past so the linkedAt gate alone would decrement BOTH;
// decrementSince is the real floor that keeps the old payment out of the decrement.
test("decrementSince: records a pre-window payment but only decrements within the window", () => {
  const matchers = [{ debtId: "d1", currentBalanceCents: 10000, conditions: zipCond, linkedAt: "2020-01-01" }];
  // p1 (2026-01-10) is before decrementSince; p2 (2026-06-10) is on/after it.
  const r = matchDebtPayments(matchers, fwdTxs, new Set(), "2026-03-01");
  // both still recorded for the full-history surface
  expect(r.payments.map((p) => p.transactionId)).toEqual(["p1", "p2"]);
  // only p2 decrements (>= decrementSince): 10000 - 2000 = 8000; p1 recorded but not decremented
  expect(r.balanceUpdates).toEqual([{ debtId: "d1", newBalanceCents: 8000 }]);
});

test("decrementSince omitted preserves prior behaviour (linkedAt-only gate)", () => {
  const matchers = [{ debtId: "d1", currentBalanceCents: 10000, conditions: zipCond, linkedAt: "2020-01-01" }];
  const r = matchDebtPayments(matchers, fwdTxs, new Set());
  // no extra floor → both decrement: 10000 - 3000 - 2000 = 5000
  expect(r.balanceUpdates).toEqual([{ debtId: "d1", newBalanceCents: 5000 }]);
});
