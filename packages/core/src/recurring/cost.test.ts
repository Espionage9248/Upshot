import { describe, it, expect } from "vitest";
import { toMonthlyCostCents, costPerUseCents } from "./cost";
import { nextExpectedDate } from "./detect";

describe("toMonthlyCostCents", () => {
  it("WEEKLY: rounds 1500 * 52 / 12 = 6500", () => {
    expect(toMonthlyCostCents(1500, "WEEKLY")).toBe(Math.round((1500 * 52) / 12));
  });

  it("FORTNIGHTLY: rounds 1500 * 26 / 12 = 3250", () => {
    expect(toMonthlyCostCents(1500, "FORTNIGHTLY")).toBe(Math.round((1500 * 26) / 12));
  });

  it("MONTHLY: returns amount unchanged", () => {
    expect(toMonthlyCostCents(1500, "MONTHLY")).toBe(1500);
  });

  it("QUARTERLY: returns Math.round(amount / 3)", () => {
    expect(toMonthlyCostCents(3000, "QUARTERLY")).toBe(Math.round(3000 / 3));
  });

  it("QUARTERLY: rounds correctly for odd amounts", () => {
    expect(toMonthlyCostCents(1000, "QUARTERLY")).toBe(Math.round(1000 / 3)); // 333
  });

  it("YEARLY: returns Math.round(amount / 12)", () => {
    expect(toMonthlyCostCents(12000, "YEARLY")).toBe(Math.round(12000 / 12)); // 1000
  });

  it("YEARLY: rounds correctly for non-divisible amounts", () => {
    expect(toMonthlyCostCents(9999, "YEARLY")).toBe(Math.round(9999 / 12)); // 833
  });

  it("returns an integer (not a float)", () => {
    const result = toMonthlyCostCents(1500, "WEEKLY");
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("costPerUseCents", () => {
  it("returns null when usageCount is 0", () => {
    expect(costPerUseCents(6500, 0)).toBeNull();
  });

  it("returns null when usageCount is negative", () => {
    expect(costPerUseCents(6500, -1)).toBeNull();
  });

  it("returns monthlyCostCents / usageCount when usageCount > 0", () => {
    expect(costPerUseCents(6500, 5)).toBe(Math.round(6500 / 5)); // 1300
  });

  it("returns integer when result divides evenly", () => {
    const result = costPerUseCents(1000, 4);
    expect(result).toBe(250);
    expect(Number.isInteger(result!)).toBe(true);
  });

  it("rounds to integer for non-divisible amounts", () => {
    const result = costPerUseCents(1000, 3);
    expect(result).toBe(Math.round(1000 / 3)); // 333
    expect(Number.isInteger(result!)).toBe(true);
  });
});

describe("nextExpectedDate (via detect)", () => {
  it("MONTHLY: 2026-06-01 + 1 month = 2026-07-01", () => {
    expect(nextExpectedDate("2026-06-01", "MONTHLY")).toBe("2026-07-01");
  });

  it("MONTHLY: handles month-end rollover (Apr -> May)", () => {
    expect(nextExpectedDate("2026-04-05", "MONTHLY")).toBe("2026-05-05");
  });

  it("WEEKLY: 2026-06-01 + 7 days = 2026-06-08", () => {
    expect(nextExpectedDate("2026-06-01", "WEEKLY")).toBe("2026-06-08");
  });

  it("YEARLY: 2026-06-01 + 1 year = 2027-06-01", () => {
    expect(nextExpectedDate("2026-06-01", "YEARLY")).toBe("2027-06-01");
  });
});
