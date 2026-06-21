import { describe, it, expect } from "vitest";
import { simulatePayoff } from "./simulate";
import type { PayoffInputs } from "./types";

const base: Omit<PayoffInputs, "extraSchedule" | "lumpSums"> = {
  debts: [
    { id: "a", currentBalanceCents: 100000, minimumPaymentCents: 10000, interestRate: 0 },
  ],
  order: ["a"],
  startMonth: "2026-07",
};

describe("simulatePayoff", () => {
  it("pays a single 0% debt with no extra in ceil(balance/min) months", () => {
    const r = simulatePayoff({ ...base, extraSchedule: [{ fromMonth: "2026-07", extraCents: 0 }], lumpSums: [] });
    // 100000 / 10000 = 10 months
    expect(r.debtFreeMonth).toBe("2027-04"); // 2026-07 + 9 = 2027-04 (10th payment)
    expect(r.monthsToPayoff).toBe(9);
    expect(r.totalInterestCents).toBe(0);
    expect(r.curve).toHaveLength(10);
    expect(r.curve.at(-1)!.balanceCents).toBe(0);
  });

  it("accrues monthly interest and reports it", () => {
    const r = simulatePayoff({
      debts: [{ id: "a", currentBalanceCents: 100000, minimumPaymentCents: 10000, interestRate: 0.12 }],
      order: ["a"],
      startMonth: "2026-07",
      extraSchedule: [{ fromMonth: "2026-07", extraCents: 0 }],
      lumpSums: [],
    });
    // 1% monthly interest on the first month = 1000 cents, so it takes longer than 10 months.
    expect(r.totalInterestCents).toBeGreaterThan(0);
    expect(r.debtFreeMonth).not.toBeNull();
  });

  it("extra accelerates payoff", () => {
    const slow = simulatePayoff({ ...base, extraSchedule: [{ fromMonth: "2026-07", extraCents: 0 }], lumpSums: [] });
    const fast = simulatePayoff({ ...base, extraSchedule: [{ fromMonth: "2026-07", extraCents: 10000 }], lumpSums: [] });
    expect(fast.monthsToPayoff).toBeLessThan(slow.monthsToPayoff);
  });

  it("stepped extra applies the larger amount from the raise month", () => {
    const stepped = simulatePayoff({
      ...base,
      extraSchedule: [
        { fromMonth: "2026-07", extraCents: 0 },
        { fromMonth: "2026-10", extraCents: 20000 },
      ],
      lumpSums: [],
    });
    const flat = simulatePayoff({ ...base, extraSchedule: [{ fromMonth: "2026-07", extraCents: 0 }], lumpSums: [] });
    expect(stepped.monthsToPayoff).toBeLessThan(flat.monthsToPayoff);
  });

  it("cascades a freed minimum onto the next debt (snowball roll-over)", () => {
    const r = simulatePayoff({
      debts: [
        { id: "small", currentBalanceCents: 10000, minimumPaymentCents: 5000, interestRate: 0 },
        { id: "big", currentBalanceCents: 60000, minimumPaymentCents: 5000, interestRate: 0 },
      ],
      order: ["small", "big"],
      startMonth: "2026-07",
      extraSchedule: [{ fromMonth: "2026-07", extraCents: 0 }],
      lumpSums: [],
    });
    // small clears in 2 months; its 5000 then rolls into big (5000+5000=10000/mo).
    // big: 60000 paid 5000 (m1) + 5000 (m2) = 50000 left, then 10000/mo → 5 more months. Total 7.
    expect(r.monthsToPayoff).toBe(6); // 2026-07 + 6 = 2027-01
    expect(r.debtFreeMonth).toBe("2027-01");
  });

  it("returns null debt-free month and full curve when MAX_MONTHS is hit", () => {
    const r = simulatePayoff({
      debts: [{ id: "a", currentBalanceCents: 100000, minimumPaymentCents: 1, interestRate: 0.99 }],
      order: ["a"],
      startMonth: "2026-07",
      extraSchedule: [{ fromMonth: "2026-07", extraCents: 0 }],
      lumpSums: [],
    });
    expect(r.debtFreeMonth).toBeNull();
    expect(r.curve.length).toBe(600);
  });
});

describe("simulatePayoff lump sums", () => {
  it("a lump sum to a target debt reduces its balance that month", () => {
    const r = simulatePayoff({
      debts: [{ id: "a", currentBalanceCents: 100000, minimumPaymentCents: 10000, interestRate: 0 }],
      order: ["a"],
      startMonth: "2026-07",
      extraSchedule: [{ fromMonth: "2026-07", extraCents: 0 }],
      lumpSums: [{ amountCents: 50000, month: "2026-07", targetDebtId: "a" }],
    });
    // 100000 − 10000 (min) − 50000 (lump) = 40000 after month 1 → 4 more months. Total 5.
    expect(r.monthsToPayoff).toBe(4); // 2026-07 + 4 = 2026-11
    expect(r.debtFreeMonth).toBe("2026-11");
  });

  it("a null-target lump sum hits the first unpaid debt in order", () => {
    const r = simulatePayoff({
      debts: [
        { id: "a", currentBalanceCents: 5000, minimumPaymentCents: 5000, interestRate: 0 },
        { id: "b", currentBalanceCents: 100000, minimumPaymentCents: 1000, interestRate: 0 },
      ],
      order: ["a", "b"],
      startMonth: "2026-07",
      extraSchedule: [{ fromMonth: "2026-07", extraCents: 0 }],
      // In month 2, "a" is already paid → lump should fall to "b".
      lumpSums: [{ amountCents: 20000, month: "2026-08", targetDebtId: null }],
    });
    expect(r.debtFreeMonth).not.toBeNull();
    // Sanity: the lump shortened "b" — compare against no-lump run.
    const noLump = simulatePayoff({
      debts: [
        { id: "a", currentBalanceCents: 5000, minimumPaymentCents: 5000, interestRate: 0 },
        { id: "b", currentBalanceCents: 100000, minimumPaymentCents: 1000, interestRate: 0 },
      ],
      order: ["a", "b"],
      startMonth: "2026-07",
      extraSchedule: [{ fromMonth: "2026-07", extraCents: 0 }],
      lumpSums: [],
    });
    expect(r.monthsToPayoff).toBeLessThan(noLump.monthsToPayoff);
  });

  it("a lump sum never drives a balance negative", () => {
    const r = simulatePayoff({
      debts: [{ id: "a", currentBalanceCents: 3000, minimumPaymentCents: 1000, interestRate: 0 }],
      order: ["a"],
      startMonth: "2026-07",
      extraSchedule: [{ fromMonth: "2026-07", extraCents: 0 }],
      lumpSums: [{ amountCents: 999999, month: "2026-07", targetDebtId: "a" }],
    });
    expect(r.debtFreeMonth).toBe("2026-07");
    expect(r.curve.at(-1)!.balanceCents).toBe(0);
  });
});
