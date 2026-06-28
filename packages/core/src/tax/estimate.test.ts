import { describe, it, expect } from "vitest";
import { buildTaxEstimate, litoCents } from "./estimate";

const D = (dollars: number) => Math.round(dollars * 100);

describe("litoCents", () => {
  it("is the full $700 at/below $37,500", () => {
    expect(litoCents(D(37_500))).toBe(D(700));
    expect(litoCents(D(10_000))).toBe(D(700));
  });
  it("tapers at 5c/$ to $325 by $45,000", () => {
    expect(litoCents(D(45_000))).toBe(D(325));
    // $40,000 → $700 - 5% of $2,500 = $700 - $125 = $575
    expect(litoCents(D(40_000))).toBe(D(575));
  });
  it("tapers at 1.5c/$ to ~$0 by $66,667", () => {
    // $60,000 → $325 - 1.5% of $15,000 = $325 - $225 = $100
    expect(litoCents(D(60_000))).toBe(D(100));
    expect(litoCents(D(66_667))).toBe(0);
    expect(litoCents(D(80_000))).toBe(0);
  });
});

describe("buildTaxEstimate", () => {
  const base = {
    grossIncomeCents: D(90_000),
    paygWithheldCents: D(20_000),
    deductibles: [
      { category: "Home office", cents: D(1_240), count: 12 },
      { category: "Vehicle", cents: D(980), count: 7 },
    ],
    medicareLevyApplies: true,
    fy: 2026,
  };

  it("sums deductibles and derives taxable income", () => {
    const e = buildTaxEstimate(base);
    expect(e.totalDeductibleCents).toBe(D(2_220));
    expect(e.flaggedCount).toBe(19);
    expect(e.taxableIncomeCents).toBe(D(87_780)); // 90,000 - 2,220
  });

  it("includes the 2% Medicare levy when it applies", () => {
    const e = buildTaxEstimate(base);
    expect(e.medicareLevyCents).toBe(Math.round(D(87_780) * 0.02));
  });

  it("omits Medicare when it does not apply", () => {
    const e = buildTaxEstimate({ ...base, medicareLevyApplies: false });
    expect(e.medicareLevyCents).toBe(0);
  });

  it("computes a positive refund when withheld exceeds liability", () => {
    const e = buildTaxEstimate(base);
    expect(e.refundPositionCents).toBe(e.paygWithheldCents - e.liabilityCents);
  });

  it("deduction benefit is the true with/without-deductions difference", () => {
    const e = buildTaxEstimate(base);
    // benefit = liability(gross, no deductions) - liability(with deductions)
    const noDed = buildTaxEstimate({ ...base, deductibles: [] });
    expect(e.deductionBenefitCents).toBe(noDed.liabilityCents - e.liabilityCents);
    expect(e.deductionBenefitCents).toBeGreaterThan(0);
  });

  it("flags missing income inputs (both zero)", () => {
    const e = buildTaxEstimate({ ...base, grossIncomeCents: 0, paygWithheldCents: 0 });
    expect(e.hasIncomeInputs).toBe(false);
    // still reports deductibles
    expect(e.totalDeductibleCents).toBe(D(2_220));
  });

  it("never loses or invents a cent across by-category", () => {
    const e = buildTaxEstimate(base);
    const sum = e.byCategory.reduce((s, g) => s + g.cents, 0);
    expect(sum).toBe(e.totalDeductibleCents);
  });

  it("clamps taxable income and liability at zero", () => {
    const e = buildTaxEstimate({
      ...base,
      grossIncomeCents: D(1_000),
      deductibles: [{ category: "X", cents: D(5_000), count: 1 }],
    });
    expect(e.taxableIncomeCents).toBe(0);
    expect(e.liabilityCents).toBe(0);
  });
});
