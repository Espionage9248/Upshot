import { describe, it, expect } from "vitest";
import { orderByStrategy } from "./order";
import type { PayoffDebtInput } from "./types";

const debts: PayoffDebtInput[] = [
  { id: "a", currentBalanceCents: 50000, minimumPaymentCents: 2000, interestRate: 0.05 },
  { id: "b", currentBalanceCents: 10000, minimumPaymentCents: 1000, interestRate: 0.20 },
  { id: "c", currentBalanceCents: 30000, minimumPaymentCents: 1500, interestRate: 0.10 },
];

describe("orderByStrategy", () => {
  it("SNOWBALL orders by smallest balance first", () => {
    expect(orderByStrategy(debts, "SNOWBALL")).toEqual(["b", "c", "a"]);
  });

  it("AVALANCHE orders by highest interest rate first", () => {
    expect(orderByStrategy(debts, "AVALANCHE")).toEqual(["b", "c", "a"]);
  });

  it("CUSTOM uses the provided order, unknown ids last", () => {
    expect(orderByStrategy(debts, "CUSTOM", ["c", "a"])).toEqual(["c", "a", "b"]);
  });

  it("AVALANCHE treats null rate as 0 (lowest priority)", () => {
    const withNull: PayoffDebtInput[] = [
      { id: "x", currentBalanceCents: 100, minimumPaymentCents: 10, interestRate: null },
      { id: "y", currentBalanceCents: 100, minimumPaymentCents: 10, interestRate: 0.01 },
    ];
    expect(orderByStrategy(withNull, "AVALANCHE")).toEqual(["y", "x"]);
  });
});
