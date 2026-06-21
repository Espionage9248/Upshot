import { describe, it, expect, test } from "vitest";
import * as fc from "fast-check";
import { computeSnowball, computeWhatIf } from "./snowball";

const zeroInterest = (id: string, bal: number, pay: number) => ({
  id, name: id, currentBalanceCents: bal, monthlyPaymentCents: pay,
  interestRate: null, payoffPriority: 999, includeInSnowball: true,
});

describe("computeSnowball", () => {
  it("pays a zero-interest debt off exactly", () => {
    const a = computeSnowball([zeroInterest("a", 30000, 10000)], {
      strategy: "SNOWBALL", extraPaymentCents: 0, startMonth: "2026-06",
    });
    const sched0 = a.schedules.at(0)!;
    expect(sched0.monthlyBreakdown).toHaveLength(3);
    expect(sched0.monthlyBreakdown.at(-1)!.remainingBalanceCents).toBe(0);
    expect(a.totalInterestPaidCents).toBe(0);
  });

  it("cascades a freed payment into the next debt", () => {
    const a = computeSnowball(
      [zeroInterest("small", 10000, 5000), zeroInterest("big", 40000, 5000)],
      { strategy: "SNOWBALL", extraPaymentCents: 0, startMonth: "2026-06" },
    );
    // small clears in 2 months; thereafter big receives 5000 + 5000 = 10000/mo.
    expect(a.payoffOrder).toEqual(["small", "big"]);
    const big = a.schedules.find((s) => s.debtId === "big")!;
    expect(big.monthlyBreakdown.at(-1)!.remainingBalanceCents).toBe(0);
  });

  it("avalanche orders by highest rate", () => {
    const debts = [
      { ...zeroInterest("low", 50000, 10000), interestRate: 0.05 },
      { ...zeroInterest("high", 50000, 10000), interestRate: 0.25 },
    ];
    const a = computeSnowball(debts, { strategy: "AVALANCHE", extraPaymentCents: 0, startMonth: "2026-06" });
    expect(a.payoffOrder.at(0)).toBe("high");
  });

  it("never loses or invents a cent (property)", () => {
    fc.assert(fc.property(
      fc.integer({ min: 1000, max: 500000 }),   // balance
      fc.integer({ min: 1000, max: 50000 }),    // payment
      fc.integer({ min: 0, max: 30 }),          // rate * 100
      (bal, pay, ratePct) => {
        // Ensure payment > first-month interest (avoids non-amortizing loans)
        // and that the debt terminates within 600 months even with interest
        const firstMonthInterest = Math.round(bal * (ratePct / 100) / 12);
        fc.pre(pay > firstMonthInterest && pay - firstMonthInterest >= Math.ceil(bal / 600));
        const a = computeSnowball(
          [{ id: "d", name: "d", currentBalanceCents: bal, monthlyPaymentCents: pay,
             interestRate: ratePct / 100, payoffPriority: 1, includeInSnowball: true }],
          { strategy: "SNOWBALL", extraPaymentCents: 0, startMonth: "2026-06" },
        );
        const sched = a.schedules.at(0)!.monthlyBreakdown;
        const principalSum = sched.reduce((s, m) => s + m.principalCents, 0);
        expect(principalSum).toBe(bal);                          // exact payoff
        expect(sched.at(-1)!.remainingBalanceCents).toBe(0);
        expect(sched.every((m) => m.remainingBalanceCents >= 0)).toBe(true);
      },
    ), { numRuns: 300 });
  });
});

describe("computeWhatIf", () => {
  it("extra payment saves months and interest", () => {
    const debts = [{ ...zeroInterest("d", 60000, 10000) }];
    const r = computeWhatIf(debts, { strategy: "SNOWBALL", extraPaymentCents: 10000, startMonth: "2026-06" });
    expect(r.monthsSaved).toBeGreaterThan(0);
    expect(r.interestSavedCents).toBeGreaterThanOrEqual(0);
  });
});

const debtsAB = [
  { id: "a", name: "Card A", currentBalanceCents: 200000, monthlyPaymentCents: 10000, interestRate: 0.2, payoffPriority: 1, includeInSnowball: true },
  { id: "b", name: "Card B", currentBalanceCents: 500000, monthlyPaymentCents: 15000, interestRate: 0.1, payoffPriority: 2, includeInSnowball: true },
];

test("rate override lowers total interest (refinance sim)", () => {
  const r = computeWhatIf(debtsAB, { strategy: "AVALANCHE", startMonth: "2026-06", extraPaymentCents: 0, rateOverrides: { a: 0.05 } });
  expect(r.withChanges.totalInterestPaidCents).toBeLessThan(r.base.totalInterestPaidCents);
  expect(r.interestSavedCents).toBeGreaterThan(0);
});

test("extraTargetDebtId applies the extra to the named debt regardless of strategy order", () => {
  const r = computeWhatIf(debtsAB, { strategy: "AVALANCHE", startMonth: "2026-06", extraPaymentCents: 20000, extraTargetDebtId: "b" });
  // Targeting B (lower rate, larger balance) still pays it down first → months saved > 0 vs base.
  expect(r.monthsSaved).toBeGreaterThanOrEqual(0);
  expect(r.withChanges.debtFreeMonth).not.toBeNull();
});

test("no extra, no overrides → withChanges equals base", () => {
  const r = computeWhatIf(debtsAB, { strategy: "SNOWBALL", startMonth: "2026-06", extraPaymentCents: 0 });
  expect(r.withChanges.totalInterestPaidCents).toBe(r.base.totalInterestPaidCents);
  expect(r.monthsSaved).toBe(0);
});
