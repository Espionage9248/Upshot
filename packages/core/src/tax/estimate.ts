import { incomeTaxCents, marginalRateBps } from "./brackets";

export interface DeductibleGroup {
  category: string;
  cents: number;
  count: number;
}

export interface TaxEstimateInput {
  grossIncomeCents: number;
  paygWithheldCents: number;
  deductibles: DeductibleGroup[];
  medicareLevyApplies: boolean;
  fy: number;
}

export interface TaxEstimate {
  fy: number;
  grossIncomeCents: number;
  totalDeductibleCents: number;
  flaggedCount: number;
  taxableIncomeCents: number;
  incomeTaxCents: number;
  medicareLevyCents: number;
  litoCents: number;
  liabilityCents: number;
  paygWithheldCents: number;
  refundPositionCents: number;
  marginalRateBps: number;
  deductionBenefitCents: number;
  byCategory: DeductibleGroup[];
  hasIncomeInputs: boolean;
}

const MEDICARE_BPS = 200; // 2%

/** Low Income Tax Offset, integer cents. Non-refundable; offsets income tax only. */
export function litoCents(taxableIncomeCents: number): number {
  if (taxableIncomeCents <= 3_750_000) return 70_000; // $700 up to $37,500
  if (taxableIncomeCents <= 4_500_000) {
    // $700 - 5c per $ over $37,500
    return Math.max(0, 70_000 - Math.round((taxableIncomeCents - 3_750_000) * 0.05));
  }
  if (taxableIncomeCents <= 6_666_700) {
    // $325 - 1.5c per $ over $45,000
    return Math.max(0, 32_500 - Math.round((taxableIncomeCents - 4_500_000) * 0.015));
  }
  return 0;
}

/** Net liability for a given taxable income (income tax − LITO, floored, + Medicare). */
function liabilityFor(taxableIncomeCents: number, medicareLevyApplies: boolean, fy: number): number {
  const tax = incomeTaxCents(taxableIncomeCents, fy);
  const lito = litoCents(taxableIncomeCents);
  const afterOffset = Math.max(0, tax - lito);
  const medicare = medicareLevyApplies ? Math.round((taxableIncomeCents * MEDICARE_BPS) / 10_000) : 0;
  return afterOffset + medicare;
}

export function buildTaxEstimate(input: TaxEstimateInput): TaxEstimate {
  const { grossIncomeCents, paygWithheldCents, deductibles, medicareLevyApplies, fy } = input;

  const byCategory = [...deductibles].sort((a, b) => b.cents - a.cents);
  const totalDeductibleCents = byCategory.reduce((s, g) => s + g.cents, 0);
  const flaggedCount = byCategory.reduce((s, g) => s + g.count, 0);

  const taxableIncomeCents = Math.max(0, grossIncomeCents - totalDeductibleCents);
  const tax = incomeTaxCents(taxableIncomeCents, fy);
  const lito = litoCents(taxableIncomeCents);
  const medicareLevyCents = medicareLevyApplies
    ? Math.round((taxableIncomeCents * MEDICARE_BPS) / 10_000)
    : 0;
  const liabilityCents = Math.max(0, tax - lito) + medicareLevyCents;

  // Deduction benefit = the real saving (liability without deductions − with).
  const liabilityNoDeductions = liabilityFor(Math.max(0, grossIncomeCents), medicareLevyApplies, fy);
  const deductionBenefitCents = Math.max(0, liabilityNoDeductions - liabilityCents);

  const hasIncomeInputs = grossIncomeCents > 0 || paygWithheldCents > 0;

  return {
    fy,
    grossIncomeCents,
    totalDeductibleCents,
    flaggedCount,
    taxableIncomeCents,
    incomeTaxCents: tax,
    medicareLevyCents,
    litoCents: lito,
    liabilityCents,
    paygWithheldCents,
    refundPositionCents: paygWithheldCents - liabilityCents,
    marginalRateBps: marginalRateBps(taxableIncomeCents, fy),
    deductionBenefitCents,
    byCategory,
    hasIncomeInputs,
  };
}
