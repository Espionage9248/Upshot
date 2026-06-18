/**
 * Saver budget analysis (envelope budgeting).
 *
 * Ported from V1 `BudgetAnalysisService.analyseSaver` / `analyseAllSavers`
 * (reference/v1/backend-src/services/budgetAnalysis.ts) and re-shaped to pure
 * plain-array inputs: the web loader assembles `SaverInput` from repos, this
 * stays fake-free at the unit boundary.
 *
 * Integer cents throughout. Never parseFloat a money value.
 */

export interface SaverTransaction {
  amountCents: number;
  createdAt: string;
  accountId: string;
  transferAccountId?: string;
  isTransfer: boolean;
}

export interface SaverInput {
  account: {
    id: string;
    name: string;
    balanceCents: number;
    monthlyAllocationCents: number;
  };
  /** Target month in `yyyy-MM` form. */
  month: string;
  transactions: SaverTransaction[];
  /** All SAVER account IDs — used to exclude saver-to-saver reallocations. */
  saverAccountIds: Set<string>;
}

export interface SaverMonthHistory {
  month: string;
  allocated: number;
  spent: number;
  variance: number;
}

export interface SaverBudgetAnalysis {
  saverId: string;
  saverName: string;
  currentBalance: number;

  // This month
  monthlyAllocation: number;
  monthlySpending: number;
  variance: number;
  variancePercentage: number;

  // Trend
  trend: "OVERFUNDED" | "UNDERFUNDED" | "OPTIMAL";
  averageMonthlySpending: number; // Last 6 months

  // Historical (most recent complete month first)
  last6Months: SaverMonthHistory[];
}

/** `yyyy-MM` of an ISO timestamp (UTC). */
function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

/** The `yyyy-MM` `n` months before `month` (n >= 1). */
function monthBefore(month: string, n: number): string {
  const year = Number(month.slice(0, 4));
  const mon = Number(month.slice(5, 7)); // 1-12
  // Convert to a 0-based absolute month index, subtract, convert back.
  const idx = year * 12 + (mon - 1) - n;
  const y = Math.floor(idx / 12);
  const m = idx - y * 12 + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** True if a transaction is a saver-to-saver reallocation (excluded from spending). */
function isSaverToSaver(t: SaverTransaction, saverAccountIds: Set<string>): boolean {
  return t.isTransfer && t.transferAccountId !== undefined && saverAccountIds.has(t.transferAccountId);
}

/**
 * Spending for a Saver in a given month: absolute sum of negative-amount
 * transactions, excluding saver-to-saver reallocations. Mirrors V1
 * `calculateMonthlySpending`.
 */
function spendingInMonth(input: SaverInput, month: string): number {
  let total = 0;
  for (const t of input.transactions) {
    if (t.accountId !== input.account.id) continue;
    if (monthOf(t.createdAt) !== month) continue;
    if (t.amountCents >= 0) continue;
    if (isSaverToSaver(t, input.saverAccountIds)) continue;
    total += t.amountCents;
  }
  return Math.abs(total);
}

/**
 * Allocation for the target month from actual incoming transfers, falling back
 * to the static `monthlyAllocationCents`. Mirrors V1 `calculateMonthlyAllocation`.
 */
function allocationForMonth(input: SaverInput): number {
  let incoming = 0;
  for (const t of input.transactions) {
    if (t.accountId !== input.account.id) continue;
    if (monthOf(t.createdAt) !== input.month) continue;
    if (t.isTransfer && t.amountCents > 0) incoming += t.amountCents;
  }
  return incoming > 0 ? incoming : input.account.monthlyAllocationCents;
}

/**
 * Previous 6 complete months (excludes the target month), most recent first.
 * Allocated uses the static `monthlyAllocationCents` (V1 fallback for months
 * with no stored allocation record); spent is computed from transactions.
 */
function historyLast6Months(input: SaverInput): SaverMonthHistory[] {
  const allocated = input.account.monthlyAllocationCents;
  const months: SaverMonthHistory[] = [];
  for (let i = 1; i <= 6; i++) {
    const month = monthBefore(input.month, i);
    const spent = spendingInMonth(input, month);
    months.push({ month, allocated, spent, variance: allocated - spent });
  }
  return months;
}

export function analyseSaver(input: SaverInput): SaverBudgetAnalysis {
  const { account } = input;

  const monthlyAllocation = allocationForMonth(input);
  const monthlySpending = spendingInMonth(input, input.month);

  const variance = monthlyAllocation - monthlySpending;
  const variancePercentage = monthlyAllocation > 0 ? (variance / monthlyAllocation) * 100 : 0;

  let trend: SaverBudgetAnalysis["trend"];
  if (variancePercentage > 20) {
    trend = "OVERFUNDED";
  } else if (variancePercentage < -10) {
    trend = "UNDERFUNDED";
  } else {
    trend = "OPTIMAL";
  }

  const last6Months = historyLast6Months(input);
  const totalSpent = last6Months.reduce((sum, h) => sum + h.spent, 0);
  const averageMonthlySpending = last6Months.length > 0 ? Math.round(totalSpent / last6Months.length) : 0;

  return {
    saverId: account.id,
    saverName: account.name,
    currentBalance: account.balanceCents,
    monthlyAllocation,
    monthlySpending,
    variance,
    variancePercentage,
    trend,
    averageMonthlySpending,
    last6Months,
  };
}

export function analyseAllSavers(inputs: SaverInput[]): SaverBudgetAnalysis[] {
  return inputs.map(analyseSaver);
}
