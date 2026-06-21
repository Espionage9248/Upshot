import { expect, test } from "vitest";
import { matchDebtPayments, compilePatternRegex } from "./match-payments";

test("compilePatternRegex matches any comma pattern, case-insensitive, escapes specials", () => {
  const re = compilePatternRegex(["ZipMoney", "ZipPay", "Zip"]);
  expect(re.test("zippay direct debit")).toBe(true);
  expect(re.test("AFTERPAY")).toBe(false);
  expect(compilePatternRegex(["a.b"]).test("aXb")).toBe(false); // "." escaped
});

const txs = [
  { id: "t1", description: "ZipPay payment", amountCents: -5000, createdAt: "2026-06-01T00:00:00Z", settledAt: null, isTransfer: false },
  { id: "t2", description: "ZipMoney", amountCents: -3000, createdAt: "2026-06-15T00:00:00Z", settledAt: null, isTransfer: false },
  { id: "t3", description: "Salary", amountCents: 400000, createdAt: "2026-06-10T00:00:00Z", settledAt: null, isTransfer: false },
  { id: "t4", description: "ZipPay", amountCents: -2000, createdAt: "2026-06-20T00:00:00Z", settledAt: null, isTransfer: true },
];

test("links negative non-transfer matches, reduces balance, ignores income/transfers/already-linked", () => {
  const m = [{ debtId: "d1", currentBalanceCents: 20000, pattern: compilePatternRegex(["Zip"]) }];
  const r = matchDebtPayments(m, txs, new Set(["t1"])); // t1 already linked
  expect(r.payments.map((p) => p.transactionId)).toEqual(["t2"]); // t3 income, t4 transfer, t1 linked
  expect(r.balanceUpdates).toEqual([{ debtId: "d1", newBalanceCents: 17000 }]); // 20000 - 3000
});

test("balance never goes below zero", () => {
  const m = [{ debtId: "d1", currentBalanceCents: 1000, pattern: compilePatternRegex(["Zip"]) }];
  const r = matchDebtPayments(m, txs.filter((t) => t.id === "t2"), new Set());
  expect(r.balanceUpdates[0].newBalanceCents).toBe(0);
});
