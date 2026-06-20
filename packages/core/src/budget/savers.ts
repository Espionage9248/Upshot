/**
 * Saver budget analysis.
 *
 * Two models, branched on whether the saver has a goal:
 *  - GOAL saver (goalTargetCents + goalTargetDate set): progress + status are
 *    measured against the target balance (GOAL_MET / BUILDING) — generalising
 *    V1's emergency-fund target model to any saver.
 *  - ENVELOPE saver (no goal): status is an accumulation TREND over the trailing
 *    6 months (BUILDING / STEADY / DRAWING_DOWN), so a sinking fund that
 *    correctly accrues for a future spend is never mislabelled "overfunded"
 *    (the V1 single-month variance trend did exactly that).
 *
 * The monthly allocation is authoritative when the user set one for the month
 * (storedAllocationCents); else inferred from incoming transfers; else the
 * static monthlyAllocationCents. Spending / variance / history (ported from V1
 * `analyseSaver`) are retained as supporting figures.
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
    /** Real per-saver goal (target amount + ISO date), or null when unset. */
    goalTargetCents: number | null;
    goalTargetDate: string | null;
  };
  /** Target month in `yyyy-MM` form. */
  month: string;
  transactions: SaverTransaction[];
  /** All SAVER account IDs — used to exclude saver-to-saver reallocations. */
  saverAccountIds: Set<string>;
  /**
   * The user's explicit allocation for `month` (the stored budget_allocation
   * row), authoritative when present. Absent/null → fall back to inferred
   * incoming transfers, then the static monthlyAllocationCents.
   */
  storedAllocationCents?: number | null;
}

export interface SaverMonthHistory {
  month: string;
  allocated: number;
  spent: number;
  variance: number;
}

/**
 * GOAL_MET / BUILDING come from a goal saver (balance vs target); BUILDING /
 * STEADY / DRAWING_DOWN come from an envelope saver's 6-month accumulation
 * trend. "BUILDING" is shared: in both it means "accruing toward something".
 */
export type SaverStatus = "GOAL_MET" | "BUILDING" | "STEADY" | "DRAWING_DOWN";

export interface SaverBudgetAnalysis {
  saverId: string;
  saverName: string;
  currentBalance: number;

  // This month
  monthlyAllocation: number;
  monthlySpending: number;
  variance: number;
  variancePercentage: number;

  // Status model
  mode: "goal" | "envelope";
  status: SaverStatus;
  /** balance ÷ target, clamped 0..1 — present only for a goal saver. */
  goalProgress: number | null;
  /** Net flow (in − out) over the trailing 6 months — the envelope trend basis. */
  net6MonthsCents: number;

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
 * Allocation for the target month. The user's explicit allocation wins; else
 * actual incoming transfers; else the static `monthlyAllocationCents`.
 */
function allocationForMonth(input: SaverInput): number {
  if (input.storedAllocationCents != null) return input.storedAllocationCents;
  let incoming = 0;
  for (const t of input.transactions) {
    if (t.accountId !== input.account.id) continue;
    if (monthOf(t.createdAt) !== input.month) continue;
    if (t.isTransfer && t.amountCents > 0) incoming += t.amountCents;
  }
  return incoming > 0 ? incoming : input.account.monthlyAllocationCents;
}

/**
 * Net flow (in − out) over the trailing 6 months INCLUDING the current month,
 * from the saver's own transactions. Positive → accruing, negative → depleting.
 */
function netFlowLast6Months(input: SaverInput): number {
  const window = new Set<string>([input.month]);
  for (let i = 1; i <= 5; i++) window.add(monthBefore(input.month, i));
  let net = 0;
  for (const t of input.transactions) {
    if (t.accountId !== input.account.id) continue;
    if (!window.has(monthOf(t.createdAt))) continue;
    net += t.amountCents;
  }
  return net;
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

/** Envelope-trend dead-band: |net 6-month flow| within this reads as STEADY. */
const STEADY_BAND_CENTS = 5_000;

export function analyseSaver(input: SaverInput): SaverBudgetAnalysis {
  const { account } = input;

  const monthlyAllocation = allocationForMonth(input);
  const monthlySpending = spendingInMonth(input, input.month);

  const variance = monthlyAllocation - monthlySpending;
  const variancePercentage = monthlyAllocation > 0 ? (variance / monthlyAllocation) * 100 : 0;

  const net6MonthsCents = netFlowLast6Months(input);

  const hasGoal = account.goalTargetCents != null && account.goalTargetDate != null;
  let mode: "goal" | "envelope";
  let status: SaverStatus;
  let goalProgress: number | null;
  if (hasGoal) {
    mode = "goal";
    const target = account.goalTargetCents as number;
    goalProgress = target > 0 ? Math.min(1, Math.max(0, account.balanceCents / target)) : 0;
    status = account.balanceCents >= target ? "GOAL_MET" : "BUILDING";
  } else {
    mode = "envelope";
    goalProgress = null;
    status =
      net6MonthsCents > STEADY_BAND_CENTS
        ? "BUILDING"
        : net6MonthsCents < -STEADY_BAND_CENTS
          ? "DRAWING_DOWN"
          : "STEADY";
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
    mode,
    status,
    goalProgress,
    net6MonthsCents,
    averageMonthlySpending,
    last6Months,
  };
}

export function analyseAllSavers(inputs: SaverInput[]): SaverBudgetAnalysis[] {
  return inputs.map(analyseSaver);
}
