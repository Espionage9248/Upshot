import { describe, it, expect } from "vitest";
import { accrueFee } from "./fees";
import type { FeeAccrualInput } from "./fees";

describe("accrueFee", () => {
  it("applies a fee when due today and not yet applied this month", () => {
    const debt: FeeAccrualInput = {
      monthlyFeeCents: 2500,
      feeDueDay: 15,
      lastFeeAppliedAt: "2026-05-15T00:00:00.000Z",
      currentBalanceCents: 100_000,
    };
    // now = 2026-06-15 (due day, not yet applied in June)
    const result = accrueFee(debt, "2026-06-15T00:00:00.000Z");
    expect(result).not.toBeNull();
    expect(result!.newBalanceCents).toBe(102_500);
    expect(result!.lastFeeAppliedAt.slice(0, 7)).toBe("2026-06");
  });

  it("returns null when fee already applied this calendar month", () => {
    const debt: FeeAccrualInput = {
      monthlyFeeCents: 2500,
      feeDueDay: 15,
      lastFeeAppliedAt: "2026-06-15T00:00:00.000Z",
      currentBalanceCents: 102_500,
    };
    // now = 2026-06-20 — same month as last applied
    const result = accrueFee(debt, "2026-06-20T00:00:00.000Z");
    expect(result).toBeNull();
  });

  it("returns null when monthlyFeeCents is null", () => {
    const debt: FeeAccrualInput = {
      monthlyFeeCents: null,
      feeDueDay: 15,
      lastFeeAppliedAt: null,
      currentBalanceCents: 100_000,
    };
    const result = accrueFee(debt, "2026-06-15T00:00:00.000Z");
    expect(result).toBeNull();
  });

  it("returns null when feeDueDay is null", () => {
    const debt: FeeAccrualInput = {
      monthlyFeeCents: 2500,
      feeDueDay: null,
      lastFeeAppliedAt: null,
      currentBalanceCents: 100_000,
    };
    const result = accrueFee(debt, "2026-06-15T00:00:00.000Z");
    expect(result).toBeNull();
  });

  it("returns null when now day is before feeDueDay", () => {
    const debt: FeeAccrualInput = {
      monthlyFeeCents: 2500,
      feeDueDay: 15,
      lastFeeAppliedAt: "2026-05-15T00:00:00.000Z",
      currentBalanceCents: 100_000,
    };
    // now = 2026-06-14 — one day before the due day
    const result = accrueFee(debt, "2026-06-14T00:00:00.000Z");
    expect(result).toBeNull();
  });

  it("applies when now day equals feeDueDay exactly", () => {
    const debt: FeeAccrualInput = {
      monthlyFeeCents: 500,
      feeDueDay: 1,
      lastFeeAppliedAt: null,
      currentBalanceCents: 50_000,
    };
    const result = accrueFee(debt, "2026-06-01T00:00:00.000Z");
    expect(result).not.toBeNull();
    expect(result!.newBalanceCents).toBe(50_500);
  });

  it("applies when now day is after feeDueDay (catchup scenario)", () => {
    const debt: FeeAccrualInput = {
      monthlyFeeCents: 1000,
      feeDueDay: 10,
      lastFeeAppliedAt: "2026-05-10T00:00:00.000Z",
      currentBalanceCents: 80_000,
    };
    // now = 2026-06-20 — past the due day but not yet applied in June
    const result = accrueFee(debt, "2026-06-20T00:00:00.000Z");
    expect(result).not.toBeNull();
    expect(result!.newBalanceCents).toBe(81_000);
  });
});
