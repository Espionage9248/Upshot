/**
 * Monthly salary-period report.
 *
 * Pure function — no DB access, no side effects.
 * Integer cents throughout. Never parseFloat a money value.
 * Only savingsRate and percentageOfTotal are ratio floats.
 */

import type { ReportTxn, SalaryPeriod } from "./salary-periods";
import type { CategoryBreakdownItem } from "./category-breakdown";
import { buildCategoryBreakdown } from "./category-breakdown";

// ---------------------------------------------------------------------------
// Exported interfaces
// ---------------------------------------------------------------------------

export interface Insight {
  type: "warning" | "positive" | "info";
  message: string;
}

export interface DebtPaymentBreakdownItem {
  debtId: string;
  debtName: string;
  amountCents: number;
  isAutoTracked: boolean;
}

export interface EnvelopePerformanceItem {
  saverId: string;
  saverName: string;
  allocatedCents: number;
  spentCents: number;
  varianceCents: number;
  variancePercentage: number;
}

export interface MonthlyReport {
  period: SalaryPeriod;
  totalIncomeCents: number;
  salaryIncomeCents: number;
  otherIncomeCents: number;
  totalExpensesCents: number;
  netCents: number;
  categoryBreakdown: CategoryBreakdownItem[];
  envelopePerformance: EnvelopePerformanceItem[];
  totalDebtPaidCents: number;
  debtPaymentBreakdown: DebtPaymentBreakdownItem[];
  savingsRate: number;     // ratio float, 0..1
  insights: Insight[];
}

export interface MonthlyReportInput {
  period: SalaryPeriod;
  txns: ReportTxn[];     // already scoped to [period.start, period.end]
  categoryNames: Map<string, { name: string; parentName: string | null }>;
  envelopePerformance: EnvelopePerformanceItem[];
  debtPaymentBreakdown: DebtPaymentBreakdownItem[];
}

// ---------------------------------------------------------------------------
// Insights derivation
// ---------------------------------------------------------------------------

function buildInsights(
  totalIncomeCents: number,
  netCents: number,
  savingsRate: number,
  categoryBreakdown: CategoryBreakdownItem[],
  envelopePerformance: EnvelopePerformanceItem[],
  expenseTxns: ReportTxn[],
  totalDebtPaidCents: number,
): Insight[] {
  const insights: Insight[] = [];
  const savingsRatePct = savingsRate * 100;

  // Savings rate insights
  if (savingsRatePct >= 20) {
    insights.push({
      type: "positive",
      message: `Great savings rate of ${savingsRatePct.toFixed(0)}% this period.`,
    });
  } else if (netCents < 0) {
    insights.push({
      type: "warning",
      message: `You spent more than you earned this period (net ${savingsRatePct.toFixed(0)}%).`,
    });
  } else if (savingsRatePct < 10) {
    insights.push({
      type: "warning",
      message: `Low savings rate of ${savingsRatePct.toFixed(0)}%. Aim for at least 10-15%.`,
    });
  }

  // Over-budget envelopes
  const overBudget = envelopePerformance.filter((e) => e.varianceCents < 0);
  if (overBudget.length > 0) {
    const names = overBudget.map((e) => e.saverName).join(", ");
    insights.push({ type: "warning", message: `Over budget: ${names}.` });
  }

  // Unused envelopes
  const unused = envelopePerformance.filter(
    (e) => e.allocatedCents > 0 && e.spentCents === 0,
  );
  if (unused.length > 0) {
    const names = unused.map((e) => e.saverName).join(", ");
    insights.push({ type: "info", message: `No spending recorded for: ${names}.` });
  }

  // Largest single expense
  if (expenseTxns.length > 0) {
    const largest = expenseTxns.reduce((max, tx) =>
      Math.abs(tx.amountCents) > Math.abs(max.amountCents) ? tx : max,
    );
    const dollarStr = (Math.abs(largest.amountCents) / 100).toFixed(2);
    insights.push({
      type: "info",
      message: `Largest expense: $${dollarStr}.`,
    });
  }

  // Top spending category
  if (categoryBreakdown.length > 0) {
    const top = categoryBreakdown[0]!;
    const dollarStr = (top.totalCents / 100).toFixed(2);
    insights.push({
      type: "info",
      message: `Top spending category: ${top.categoryName} ($${dollarStr}, ${top.percentageOfTotal.toFixed(0)}% of total).`,
    });
  }

  // Debt payment insights
  if (totalDebtPaidCents > 0 && totalIncomeCents > 0) {
    const debtPaymentRatePct = (totalDebtPaidCents / totalIncomeCents) * 100;
    const debtDollarStr = (totalDebtPaidCents / 100).toFixed(2);

    if (debtPaymentRatePct > 30) {
      insights.push({
        type: "warning",
        message: `Debt payments are ${debtPaymentRatePct.toFixed(0)}% of income. Consider debt consolidation or snowball strategy.`,
      });
    } else if (debtPaymentRatePct > 15) {
      insights.push({
        type: "positive",
        message: `Paid $${debtDollarStr} toward debt this period — good progress!`,
      });
    } else {
      insights.push({
        type: "info",
        message: `Debt payment: $${debtDollarStr} (${debtPaymentRatePct.toFixed(0)}% of income).`,
      });
    }
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildMonthlyReport(input: MonthlyReportInput): MonthlyReport {
  const { period, txns, categoryNames, envelopePerformance, debtPaymentBreakdown } = input;

  // Partition txns: income = positive non-transfer, expense = negative non-transfer.
  // Internal transfers (incoming OR outgoing) are excluded from both — matches
  // yearly.ts; otherwise incoming transfers inflate a pay-period's income.
  const incomeTxns = txns.filter((tx) => tx.amountCents > 0 && !tx.isTransfer);
  const expenseTxns = txns.filter((tx) => tx.amountCents < 0 && !tx.isTransfer);

  // Aggregate income
  const salaryIncomeCents = incomeTxns
    .filter((tx) => tx.isSalary)
    .reduce((sum, tx) => sum + tx.amountCents, 0);
  const otherIncomeCents = incomeTxns
    .filter((tx) => !tx.isSalary)
    .reduce((sum, tx) => sum + tx.amountCents, 0);
  const totalIncomeCents = salaryIncomeCents + otherIncomeCents;

  // Aggregate expenses (absolute)
  const totalExpensesCents = expenseTxns.reduce(
    (sum, tx) => sum + Math.abs(tx.amountCents),
    0,
  );

  const netCents = totalIncomeCents - totalExpensesCents;

  const savingsRate = totalIncomeCents > 0 ? netCents / totalIncomeCents : 0;

  // Category breakdown — pass all txns (buildCategoryBreakdown filters internally)
  const categoryBreakdown = buildCategoryBreakdown(txns, categoryNames);

  // Debt totals from pre-built breakdown
  const totalDebtPaidCents = debtPaymentBreakdown.reduce(
    (sum, d) => sum + d.amountCents,
    0,
  );

  const insights = buildInsights(
    totalIncomeCents,
    netCents,
    savingsRate,
    categoryBreakdown,
    envelopePerformance,
    expenseTxns,
    totalDebtPaidCents,
  );

  return {
    period,
    totalIncomeCents,
    salaryIncomeCents,
    otherIncomeCents,
    totalExpensesCents,
    netCents,
    categoryBreakdown,
    envelopePerformance,
    totalDebtPaidCents,
    debtPaymentBreakdown,
    savingsRate,
    insights,
  };
}
