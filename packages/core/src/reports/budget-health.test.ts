import { describe, it, expect } from "vitest";
import type { SaverBudgetAnalysis, EmergencyFundAnalysis } from "../budget";
import { calculateBudgetHealth } from "./budget-health";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSaver(overrides: Partial<SaverBudgetAnalysis> = {}): SaverBudgetAnalysis {
  return {
    saverId: "s1",
    saverName: "Groceries",
    currentBalance: 100000,
    monthlyAllocation: 50000,
    monthlySpending: 48000,
    variance: 2000,
    variancePercentage: 4,
    mode: "envelope",
    status: "BUILDING",
    goalProgress: null,
    net6MonthsCents: 10000,
    averageMonthlySpending: 47000,
    last6Months: [],
    ...overrides,
  };
}

function makeEF(overrides: Partial<EmergencyFundAnalysis> = {}): EmergencyFundAnalysis {
  return {
    accountId: "ef1",
    accountName: "Emergency Fund",
    currentBalance: 900000,
    targetBalance: 900000,
    targetMonths: 6,
    progressPercent: 100,
    status: "GOAL_MET",
    withdrawalsThisMonth: 0,
    topUpNeeded: 0,
    topUpRecommendation: null,
    replenishmentNeeded: 0,
    monthlyAllocation: 15000,
    monthlyInboundThisMonth: 15000,
    savingsShortfallThisMonth: 0,
    savingsOnTrack: true,
    readinessScore: 100,
    readinessTier: "excellent",
    readinessTips: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Structural invariants
// ---------------------------------------------------------------------------

describe("calculateBudgetHealth structural invariants", () => {
  it("returns integer score between 0 and 100", () => {
    const result = calculateBudgetHealth({
      savers: [makeSaver()],
      emergencyFund: makeEF(),
      savingsRate: 0.2,
    });
    expect(Number.isInteger(result.score)).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("sum of factor points <= sum of factor max", () => {
    const result = calculateBudgetHealth({
      savers: [makeSaver()],
      emergencyFund: makeEF(),
      savingsRate: 0.1,
    });
    const totalPoints = result.factors.reduce((s, f) => s + f.points, 0);
    const totalMax = result.factors.reduce((s, f) => s + f.max, 0);
    expect(totalPoints).toBeLessThanOrEqual(totalMax);
  });

  it("all factor points and max are integers", () => {
    const result = calculateBudgetHealth({
      savers: [makeSaver()],
      emergencyFund: makeEF(),
      savingsRate: 0.1,
    });
    for (const f of result.factors) {
      expect(Number.isInteger(f.points)).toBe(true);
      expect(Number.isInteger(f.max)).toBe(true);
    }
  });

  it("has a non-empty factors array with label and detail strings", () => {
    const result = calculateBudgetHealth({
      savers: [makeSaver()],
      emergencyFund: makeEF(),
      savingsRate: 0.1,
    });
    expect(result.factors.length).toBeGreaterThan(0);
    for (const f of result.factors) {
      expect(typeof f.label).toBe("string");
      expect(f.label.length).toBeGreaterThan(0);
      expect(typeof f.detail).toBe("string");
    }
  });
});

// ---------------------------------------------------------------------------
// Grade band: excellent
// ---------------------------------------------------------------------------

describe("calculateBudgetHealth — healthy input", () => {
  it("healthy savers, funded EF, strong savings rate → grade 'excellent'", () => {
    // All savers on-track (low variance), EF fully funded, savings rate 20%
    const result = calculateBudgetHealth({
      savers: [
        makeSaver({ variancePercentage: 2, status: "BUILDING" }),
        makeSaver({ saverId: "s2", saverName: "Dining", variancePercentage: 1, status: "BUILDING" }),
      ],
      emergencyFund: makeEF({ progressPercent: 100, status: "GOAL_MET" }),
      savingsRate: 0.2,
    });
    expect(result.grade).toBe("excellent");
    expect(result.score).toBeGreaterThanOrEqual(90);
  });
});

// ---------------------------------------------------------------------------
// Grade band: poor
// ---------------------------------------------------------------------------

describe("calculateBudgetHealth — poor input", () => {
  it("very poor budget accuracy, no savings, no EF → grade 'poor'", () => {
    const result = calculateBudgetHealth({
      savers: [
        makeSaver({ variancePercentage: 90, status: "DRAWING_DOWN" }),
        makeSaver({ saverId: "s2", saverName: "Other", variancePercentage: -80, status: "DRAWING_DOWN" }),
      ],
      emergencyFund: null,
      savingsRate: 0,
    });
    expect(result.grade).toBe("poor");
    expect(result.score).toBeLessThan(60);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("calculateBudgetHealth — edge cases", () => {
  it("empty savers array with no EF and zero savings rate → poor or fair", () => {
    const result = calculateBudgetHealth({
      savers: [],
      emergencyFund: null,
      savingsRate: 0,
    });
    expect(["poor", "fair"]).toContain(result.grade);
  });

  it("savings rate capped — passing 1.0 (100%) does not overflow score", () => {
    const result = calculateBudgetHealth({
      savers: [makeSaver({ variancePercentage: 0 })],
      emergencyFund: makeEF(),
      savingsRate: 1.0,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
