/**
 * Emergency-fund analysis.
 *
 * Ported from V1 `BudgetAnalysisService.analyseEmergencyFund`
 * (reference/v1/backend-src/services/budgetAnalysis.ts) and re-shaped to pure
 * plain inputs. V1 derived its time windows from Prisma date-range queries;
 * here the web loader does the windowing and hands this function the
 * already-aggregated cents (this-month inbound/outbound, rolling 3-month
 * net, and a 6-month expense history), so the unit stays fake-free.
 *
 * Integer cents throughout. Never parseFloat a money value. Intermediate sums
 * stay in cents; rounding happens once on each final derived value.
 */

export interface EmergencyFundAccount {
  id: string;
  name: string;
  balanceCents: number;
  /** Monthly savings goal in cents (0 if not set). */
  monthlyAllocationCents: number;
}

export interface EmergencyFundInput {
  /** The emergency-fund account, or null when none is configured. */
  account: EmergencyFundAccount | null;
  /**
   * Expense totals (positive cents) for each of the last 6 complete calendar
   * months. The average is V1's fixed `total / 6`, so a short or empty array
   * simply yields a lower average (and a 0 average when empty).
   */
  monthlyExpenses: number[];
  /** Absolute cents withdrawn from the fund this calendar month (display only). */
  withdrawalsThisMonthCents: number;
  /** Cents deposited into the fund this calendar month. */
  inboundThisMonthCents: number;
  /** Absolute cents withdrawn from the fund over the rolling last 3 months. */
  outflows3MoCents: number;
  /** Cents deposited into the fund over the rolling last 3 months. */
  inflows3MoCents: number;
}

export interface EmergencyFundAnalysis {
  accountId: string;
  accountName: string;
  currentBalance: number;
  targetBalance: number; // 6 × average monthly expenses
  targetMonths: number; // always 6
  progressPercent: number; // capped at 100
  status: "GOAL_MET" | "BUILDING" | "DEPLETED";
  withdrawalsThisMonth: number;
  topUpNeeded: number; // max(0, target - balance)
  topUpRecommendation: string | null;
  replenishmentNeeded: number; // max(0, outflows3Mo - inflows3Mo)
  monthlyAllocation: number;
  monthlyInboundThisMonth: number;
  savingsShortfallThisMonth: number; // max(0, allocation - inbound)
  savingsOnTrack: boolean; // inbound >= allocation, false when allocation is 0
  readinessScore: number; // 0-100, tiered by months-covered ratio
  readinessTier: "critical" | "building" | "good" | "excellent";
  readinessTips: string[];
}

/** V1 fixed 6-month window divisor. */
const WINDOW_MONTHS = 6;

const fmt = (cents: number): string =>
  `$${Math.round(cents / 100).toLocaleString("en-AU")}`;

export function analyseEmergencyFund(input: EmergencyFundInput): EmergencyFundAnalysis | null {
  const { account } = input;
  if (account === null) return null;

  // Average monthly expenses over the last 6 complete months (V1: total / 6).
  const totalExpenses6Mo = input.monthlyExpenses.reduce((sum, e) => sum + e, 0);
  const avgMonthlyExpenses = totalExpenses6Mo / WINDOW_MONTHS;
  const targetBalance = Math.round(avgMonthlyExpenses * 6);

  const balance = account.balanceCents;

  // Rolling 3-month net outflow — withdrawn and not yet replaced.
  const replenishmentNeeded = Math.max(0, input.outflows3MoCents - input.inflows3MoCents);

  // Monthly savings goal tracking.
  const monthlyAllocation = account.monthlyAllocationCents;
  const monthlyInboundThisMonth = input.inboundThisMonthCents;
  const savingsShortfallThisMonth = Math.max(0, monthlyAllocation - monthlyInboundThisMonth);
  const savingsOnTrack = monthlyAllocation > 0 && monthlyInboundThisMonth >= monthlyAllocation;

  const progressPercent =
    targetBalance > 0 ? Math.min(100, Math.round((balance / targetBalance) * 100)) : 0;

  const topUpNeeded = Math.max(0, targetBalance - balance);

  // Status: DEPLETED when there's a rolling 3-month net withdrawal not yet replaced.
  let status: EmergencyFundAnalysis["status"];
  if (balance >= targetBalance && replenishmentNeeded === 0) {
    status = "GOAL_MET";
  } else if (replenishmentNeeded > 0) {
    status = "DEPLETED";
  } else {
    status = "BUILDING";
  }

  let topUpRecommendation: string | null = null;
  if (replenishmentNeeded > 0) {
    topUpRecommendation = `Add ${fmt(replenishmentNeeded)} to restore what was withdrawn over the last 3 months.`;
  }

  // Readiness score — tiered by months-covered ratio.
  const monthsCovered = avgMonthlyExpenses > 0 ? balance / avgMonthlyExpenses : 0;
  let readinessScore: number;
  if (monthsCovered <= 0) readinessScore = 0;
  else if (monthsCovered < 1) readinessScore = Math.round(monthsCovered * 25);
  else if (monthsCovered < 3) readinessScore = Math.round(25 + ((monthsCovered - 1) / 2) * 40);
  else if (monthsCovered < 6) readinessScore = Math.round(65 + ((monthsCovered - 3) / 3) * 25);
  else readinessScore = 100;

  const readinessTier: EmergencyFundAnalysis["readinessTier"] =
    readinessScore < 25 ? "critical" : readinessScore < 65 ? "building" : readinessScore < 90 ? "good" : "excellent";

  const readinessTips: string[] = [];
  if (readinessTier === "critical") {
    readinessTips.push(`Cover at least 1 month of expenses — target ${fmt(avgMonthlyExpenses)}.`);
  }
  if (topUpRecommendation !== null) {
    readinessTips.push(topUpRecommendation);
  }
  if (!savingsOnTrack && monthlyAllocation > 0) {
    readinessTips.push(`You're ${fmt(savingsShortfallThisMonth)} short of your monthly savings goal.`);
  }
  if (readinessTier === "excellent") {
    readinessTips.push("Fully funded. Consider investing any surplus above 6 months.");
  }

  return {
    accountId: account.id,
    accountName: account.name,
    currentBalance: balance,
    targetBalance,
    targetMonths: 6,
    progressPercent,
    status,
    withdrawalsThisMonth: input.withdrawalsThisMonthCents,
    topUpNeeded,
    topUpRecommendation,
    replenishmentNeeded,
    monthlyAllocation,
    monthlyInboundThisMonth,
    savingsShortfallThisMonth,
    savingsOnTrack,
    readinessScore,
    readinessTier,
    readinessTips,
  };
}
