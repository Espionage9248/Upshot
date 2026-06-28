import { describe, it, expect } from "vitest";
import { incomeTaxCents, marginalRateBps } from "./brackets";

const D = (dollars: number) => Math.round(dollars * 100); // dollars → cents helper

describe("incomeTaxCents (FY2026 resident)", () => {
  it("is nil at and below the tax-free threshold", () => {
    expect(incomeTaxCents(0, 2026)).toBe(0);
    expect(incomeTaxCents(D(18_200), 2026)).toBe(0);
  });

  it("taxes the 16% band correctly", () => {
    // $1 over $18,200 → 16c
    expect(incomeTaxCents(D(18_201), 2026)).toBe(16);
    // $45,000 → 16% of ($45,000-$18,200) = 16% of $26,800 = $4,288
    expect(incomeTaxCents(D(45_000), 2026)).toBe(D(4_288));
  });

  it("taxes the 30% band cumulatively", () => {
    // $135,000 → $4,288 + 30% of $90,000 = $4,288 + $27,000 = $31,288
    expect(incomeTaxCents(D(135_000), 2026)).toBe(D(31_288));
  });

  it("taxes the 37% band cumulatively", () => {
    // $190,000 → $31,288 + 37% of $55,000 = $31,288 + $20,350 = $51,638
    expect(incomeTaxCents(D(190_000), 2026)).toBe(D(51_638));
  });

  it("taxes the top 45% band cumulatively", () => {
    // $200,000 → $51,638 + 45% of $10,000 = $51,638 + $4,500 = $56,138
    expect(incomeTaxCents(D(200_000), 2026)).toBe(D(56_138));
  });

  it("never returns a negative or fractional cent", () => {
    const t = incomeTaxCents(D(63_457.89 /* odd */) | 0, 2026);
    expect(Number.isInteger(t)).toBe(true);
    expect(t).toBeGreaterThanOrEqual(0);
  });

  it("throws on an unsupported financial year", () => {
    expect(() => incomeTaxCents(D(50_000), 1999)).toThrow();
  });
});

describe("marginalRateBps (FY2026 resident)", () => {
  it("returns the band rate at the income", () => {
    expect(marginalRateBps(D(10_000), 2026)).toBe(0);
    expect(marginalRateBps(D(30_000), 2026)).toBe(1600);
    expect(marginalRateBps(D(50_000), 2026)).toBe(3000);
    expect(marginalRateBps(D(150_000), 2026)).toBe(3700);
    expect(marginalRateBps(D(250_000), 2026)).toBe(4500);
  });
});
