/**
 * Budget-health score.
 *
 * Pure function: derives a 0–100 integer score and grade from already-analysed
 * inputs (savers, emergencyFund, savingsRate). Ported from V1
 * `BudgetAnalysisService.calculateBudgetHealth` (reference/v1/backend-src/
 * services/budgetAnalysis.ts lines 335–471). V1 read the DB to gather inputs;
 * this version is pure — callers assemble the inputs from existing V2 core
 * analysers and pass them in.
 *
 * Factor weights (matching V1):
 *   Budget accuracy  30 pts  (avg per-saver closeness to allocation)
 *   Savings rate     30 pts  (savingsRate × 100 × 2, capped at 30; ≥15% → max)
 *   Debt-to-income   40 pts  (no debt input → assumed 0% DTI → always 40)
 *   Emergency fund   10 pts  (months covered × 5, capped at 10; ≥2 months → max)
 *
 * Integer cents only; never parseFloat. Score is Math.round of raw, then
 * clamped 0..100.
 */

import type { SaverBudgetAnalysis, EmergencyFundAnalysis } from "../budget";

export interface BudgetHealthScore {
  score: number; // 0..100 integer
  grade: "excellent" | "good" | "fair" | "poor";
  factors: Array<{ label: string; points: number; max: number; detail: string }>;
}

export function calculateBudgetHealth(input: {
  savers: SaverBudgetAnalysis[];
  emergencyFund: EmergencyFundAnalysis | null;
  savingsRate: number; // 0..1
}): BudgetHealthScore {
  const { savers, emergencyFund, savingsRate } = input;

  // -------------------------------------------------------------------------
  // Factor 1 — Budget accuracy (30 pts max)
  // Per-saver accuracy = max(0, 100 - |variancePercentage|).
  // Average across savers; 0 when no savers.
  // -------------------------------------------------------------------------
  let budgetAccuracy = 0;
  if (savers.length > 0) {
    const accuracyScores = savers.map((a) =>
      Math.max(0, 100 - Math.abs(a.variancePercentage))
    );
    budgetAccuracy =
      accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length;
  }
  const accuracyPoints = Math.round(budgetAccuracy * 0.3); // 0..30

  // -------------------------------------------------------------------------
  // Factor 2 — Savings rate (30 pts max)
  // V1 had savingsRate as 0..100; here it is 0..1, so multiply by 100 first.
  // Formula: min(rate_pct * 2, 30) → 15% rate → max 30 pts.
  // -------------------------------------------------------------------------
  const savingsRatePct = savingsRate * 100;
  const savingsPoints = Math.min(Math.round(savingsRatePct * 2), 30); // 0..30

  // -------------------------------------------------------------------------
  // Factor 3 — Debt-to-income (40 pts max)
  // No debt input in this pure function. Treated as 0% DTI → full 40 pts.
  // -------------------------------------------------------------------------
  const debtPoints = 40; // V1: max(40 - debtToIncome, 0); DTI=0 → 40

  // -------------------------------------------------------------------------
  // Factor 4 — Emergency fund months covered (10 pts max)
  // EF balance ÷ (targetBalance ÷ 6) = months covered.
  // V1 formula: min(months * 5, 10) → 2 months → max 10 pts.
  // -------------------------------------------------------------------------
  let efMonths = 0;
  if (emergencyFund !== null && emergencyFund.targetBalance > 0) {
    const avgMonthlyExpenses = emergencyFund.targetBalance / 6;
    efMonths = emergencyFund.currentBalance / avgMonthlyExpenses;
  }
  const efPoints = Math.min(Math.round(efMonths * 5), 10); // 0..10

  // -------------------------------------------------------------------------
  // Raw score: sum of factor points, clamped 0..100.
  // -------------------------------------------------------------------------
  const raw = accuracyPoints + savingsPoints + debtPoints + efPoints;
  const score = Math.min(100, Math.max(0, Math.round(raw)));

  // -------------------------------------------------------------------------
  // Grade thresholds (V1 used A/B/C/D/F; mapped to the V2 label set).
  // -------------------------------------------------------------------------
  const grade: BudgetHealthScore["grade"] =
    score >= 90
      ? "excellent"
      : score >= 80
        ? "good"
        : score >= 60
          ? "fair"
          : "poor";

  // -------------------------------------------------------------------------
  // Factors breakdown (human-readable, for display).
  // -------------------------------------------------------------------------
  const factors: BudgetHealthScore["factors"] = [
    {
      label: "Budget accuracy",
      points: accuracyPoints,
      max: 30,
      detail:
        savers.length === 0
          ? "No budget envelopes configured"
          : `${Math.round(budgetAccuracy)}% average accuracy across ${savers.length} saver${savers.length === 1 ? "" : "s"}`,
    },
    {
      label: "Savings rate",
      points: savingsPoints,
      max: 30,
      detail: `${Math.round(savingsRatePct)}% savings rate this month`,
    },
    {
      label: "Debt load",
      points: debtPoints,
      max: 40,
      detail: "No tracked debts",
    },
    {
      label: "Emergency fund",
      points: efPoints,
      max: 10,
      detail:
        emergencyFund === null
          ? "No emergency fund configured"
          : `${efMonths.toFixed(1)} months covered (target: 6)`,
    },
  ];

  return { score, grade, factors };
}
