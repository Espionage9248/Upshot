import { describe, it, expect } from "vitest";
import { computeNetWorth, type NetWorthInput } from "./index";

describe("computeNetWorth", () => {
  it("sums all bank account balances", () => {
    const input: NetWorthInput = {
      accountBalancesCents: [100_000, 50_000, 25_000],
      assets: [],
      debts: [],
    };
    expect(computeNetWorth(input)).toBe(175_000);
  });

  it("adds only assets where includeInNetWorth is true", () => {
    const input: NetWorthInput = {
      accountBalancesCents: [100_000],
      assets: [
        { valueCents: 200_000, includeInNetWorth: true },
        { valueCents: 50_000, includeInNetWorth: false },
      ],
      debts: [],
    };
    // 100_000 + 200_000 (excluded: 50_000)
    expect(computeNetWorth(input)).toBe(300_000);
  });

  it("subtracts only debts where includeInNetWorth is true", () => {
    const input: NetWorthInput = {
      accountBalancesCents: [200_000],
      assets: [],
      debts: [
        { currentBalanceCents: 80_000, includeInNetWorth: true },
        { currentBalanceCents: 30_000, includeInNetWorth: false },
      ],
    };
    // 200_000 − 80_000 (excluded: 30_000)
    expect(computeNetWorth(input)).toBe(120_000);
  });

  it("empty debts gives bank + included assets", () => {
    const input: NetWorthInput = {
      accountBalancesCents: [60_000, 40_000],
      assets: [
        { valueCents: 150_000, includeInNetWorth: true },
        { valueCents: 10_000, includeInNetWorth: false },
      ],
      debts: [],
    };
    // 60_000 + 40_000 + 150_000
    expect(computeNetWorth(input)).toBe(250_000);
  });

  it("uses integer cents throughout — no float intermediate values", () => {
    const input: NetWorthInput = {
      accountBalancesCents: [1],
      assets: [{ valueCents: 2, includeInNetWorth: true }],
      debts: [{ currentBalanceCents: 3, includeInNetWorth: true }],
    };
    // 1 + 2 − 3 = 0
    expect(computeNetWorth(input)).toBe(0);
    // result is an exact integer
    expect(Number.isInteger(computeNetWorth(input))).toBe(true);
  });

  it("handles all-zero inputs", () => {
    const input: NetWorthInput = {
      accountBalancesCents: [],
      assets: [],
      debts: [],
    };
    expect(computeNetWorth(input)).toBe(0);
  });

  it("net worth can be negative when debts exceed bank + assets", () => {
    const input: NetWorthInput = {
      accountBalancesCents: [10_000],
      assets: [],
      debts: [{ currentBalanceCents: 50_000, includeInNetWorth: true }],
    };
    expect(computeNetWorth(input)).toBe(-40_000);
  });
});
