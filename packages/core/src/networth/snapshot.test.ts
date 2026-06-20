import { describe, it, expect } from "vitest";
import { computeMonthlySnapshot } from "./snapshot";

describe("computeMonthlySnapshot", () => {
  it("passes income and expense through", () => {
    const result = computeMonthlySnapshot({
      month: "2026-05",
      incomeCents: 500_000,
      expenseCents: 300_000,
      accountBalancesCents: [],
      assets: [],
      debts: [],
    });
    expect(result.incomeCents).toBe(500_000);
    expect(result.expenseCents).toBe(300_000);
  });

  it("derives savedCents = incomeCents - expenseCents", () => {
    const result = computeMonthlySnapshot({
      month: "2026-05",
      incomeCents: 500_000,
      expenseCents: 300_000,
      accountBalancesCents: [],
      assets: [],
      debts: [],
    });
    expect(result.savedCents).toBe(200_000);
  });

  it("savedCents may be negative when expense > income", () => {
    const result = computeMonthlySnapshot({
      month: "2026-05",
      incomeCents: 100_000,
      expenseCents: 250_000,
      accountBalancesCents: [],
      assets: [],
      debts: [],
    });
    expect(result.savedCents).toBe(-150_000);
  });

  it("assetsCents sums only includeInNetWorth=true assets", () => {
    const result = computeMonthlySnapshot({
      month: "2026-05",
      incomeCents: 0,
      expenseCents: 0,
      accountBalancesCents: [],
      assets: [
        { valueCents: 100_000, includeInNetWorth: true },
        { valueCents: 50_000, includeInNetWorth: false },
        { valueCents: 200_000, includeInNetWorth: true },
      ],
      debts: [],
    });
    expect(result.assetsCents).toBe(300_000);
  });

  it("debtCents sums only includeInNetWorth=true debts", () => {
    const result = computeMonthlySnapshot({
      month: "2026-05",
      incomeCents: 0,
      expenseCents: 0,
      accountBalancesCents: [],
      assets: [],
      debts: [
        { currentBalanceCents: 80_000, includeInNetWorth: true },
        { currentBalanceCents: 40_000, includeInNetWorth: false },
        { currentBalanceCents: 120_000, includeInNetWorth: true },
      ],
    });
    expect(result.debtCents).toBe(200_000);
  });

  it("netWorthCents = sum of account balances + assetsCents - debtCents", () => {
    const result = computeMonthlySnapshot({
      month: "2026-05",
      incomeCents: 0,
      expenseCents: 0,
      accountBalancesCents: [50_000, 30_000],
      assets: [
        { valueCents: 200_000, includeInNetWorth: true },
        { valueCents: 10_000, includeInNetWorth: false },
      ],
      debts: [
        { currentBalanceCents: 60_000, includeInNetWorth: true },
      ],
    });
    // accounts: 80_000, assetsCents: 200_000, debtCents: 60_000
    // net = 80_000 + 200_000 - 60_000 = 220_000
    expect(result.assetsCents).toBe(200_000);
    expect(result.debtCents).toBe(60_000);
    expect(result.netWorthCents).toBe(220_000);
  });

  it("month is passed through unchanged", () => {
    const result = computeMonthlySnapshot({
      month: "2026-01",
      incomeCents: 0,
      expenseCents: 0,
      accountBalancesCents: [],
      assets: [],
      debts: [],
    });
    expect(result.month).toBe("2026-01");
  });
});
