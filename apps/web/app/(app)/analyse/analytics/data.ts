import { and, asc, eq, inArray } from "drizzle-orm";
import {
  deriveSalaryPeriods,
  calculateBudgetHealth,
  getBehaviouralInsights,
  getSpendingInsights,
  computeNoSpendStreak,
  buildSpendingHeatmap,
  buildTagSummary,
  analyseAllSavers,
  analyseEmergencyFund,
  type ReportTxn,
  type SalaryPeriod,
  type BudgetHealthScore,
  type NoSpendStreak,
  type HeatmapDay,
  type SpendingInsight,
  type BehaviouralInsight,
  type TagSummaryItem,
  type SaverBudgetAnalysis,
  type EmergencyFundAnalysis,
  type SaverInput,
  type SaverTransaction,
} from "@upshot/core";
import { tables, type DbClient } from "@upshot/db";

/**
 * Serializable DTO for the /analyse/analytics surface. Domain data only — never
 * the encryption key, env, or raw error stacks.
 */
export interface AnalyticsData {
  /** Budget health score + factor breakdown. */
  health: BudgetHealthScore;
  /** Per-saver envelope alignment (allocation vs spend). */
  envelopeAlignment: SaverBudgetAnalysis[];
  /** Emergency fund readiness analysis, or null when no EF account exists. */
  emergencyFund: EmergencyFundAnalysis | null;
  /** Behavioural spending patterns (day-of-week, time-of-day, frequency). */
  behaviouralInsights: BehaviouralInsight[];
  /** Current-month vs prior 3-month category spending insights. */
  spendingInsights: SpendingInsight[];
  /** 90-day spending heatmap (one entry per calendar day). */
  heatmap: HeatmapDay[];
  /** No-spend streak stats derived from the 90-day window. */
  streak: NoSpendStreak;
  /** Tag-level expense summary, sorted by spend descending. */
  tagSummary: TagSummaryItem[];
}

/**
 * Server-only loader for the /analyse/analytics surface. Reads the encrypted DB
 * in-process via injected `db` (constructs nothing at module load → preserves
 * the env-free `next build` invariant, stays testable). Returns domain DTOs only.
 *
 * Flow:
 *   1. Load all transactions → ReportTxn[]
 *   2. Derive salary periods → pick the most recent period for budget-health context
 *   3. Load saver accounts → analyseAllSavers → envelopeAlignment
 *   4. Load EF account → analyseEmergencyFund
 *   5. calculateBudgetHealth({ savers, emergencyFund, savingsRate })
 *   6. getBehaviouralInsights + getSpendingInsights (full txn history)
 *   7. buildSpendingHeatmap (90-day window)
 *   8. computeNoSpendStreak (90-day window)
 *   9. buildTagSummary (all-time; sorted)
 *
 * `now` is injected as an ISO string so period derivation is deterministic.
 */
export async function loadAnalyticsData(
  db: DbClient,
  opts: { now: string },
): Promise<AnalyticsData> {
  const { now } = opts;

  // ── 1. All transactions → ReportTxn[] ──────────────────────────────────────
  const txns = loadReportTxns(db);

  // ── 2. Salary periods (most-recent-first) ──────────────────────────────────
  const periods = deriveSalaryPeriods(txns, now);
  const currentPeriod: SalaryPeriod | undefined = periods[0];
  const nowMonth = now.slice(0, 7);

  // ── 3. Saver envelope alignment ────────────────────────────────────────────
  const saverAccounts = db
    .select({
      id: tables.accounts.id,
      name: tables.accounts.name,
      balanceCents: tables.accounts.balanceCents,
      monthlyAllocationCents: tables.accounts.monthlyAllocationCents,
      goalTargetCents: tables.accounts.goalTargetCents,
      goalTargetDate: tables.accounts.goalTargetDate,
      role: tables.accounts.role,
    })
    .from(tables.accounts)
    .where(eq(tables.accounts.role, "SAVER"))
    .all();

  const emergencyAccount = db
    .select({
      id: tables.accounts.id,
      name: tables.accounts.name,
      balanceCents: tables.accounts.balanceCents,
      monthlyAllocationCents: tables.accounts.monthlyAllocationCents,
    })
    .from(tables.accounts)
    .where(eq(tables.accounts.role, "EMERGENCY"))
    .get();

  const allSaverIds = new Set<string>([
    ...saverAccounts.map((a) => a.id),
    ...(emergencyAccount ? [emergencyAccount.id] : []),
  ]);

  // Stored allocations for the current month
  const allocByAccount = new Map<string, number>();
  if (saverAccounts.length > 0) {
    const allocRows = db
      .select({
        accountId: tables.budgetAllocations.accountId,
        allocatedCents: tables.budgetAllocations.allocatedCents,
      })
      .from(tables.budgetAllocations)
      .where(
        and(
          eq(tables.budgetAllocations.month, nowMonth),
          inArray(
            tables.budgetAllocations.accountId,
            saverAccounts.map((a) => a.id),
          ),
        ),
      )
      .all();
    for (const r of allocRows) {
      allocByAccount.set(r.accountId, r.allocatedCents);
    }
  }

  // Build SaverInput[] for each saver account
  const saverInputs: SaverInput[] = saverAccounts.map((a) => {
    const rows = db
      .select({
        amountCents: tables.transactions.amountCents,
        createdAt: tables.transactions.createdAt,
        accountId: tables.transactions.accountId,
        transferAccountId: tables.transactions.transferAccountId,
        isTransfer: tables.transactions.isTransfer,
      })
      .from(tables.transactions)
      .where(eq(tables.transactions.accountId, a.id))
      .all();

    const transactions: SaverTransaction[] = rows.map((r) => ({
      amountCents: r.amountCents,
      createdAt: r.createdAt,
      accountId: r.accountId,
      transferAccountId: r.transferAccountId ?? undefined,
      isTransfer: r.isTransfer,
    }));

    return {
      account: {
        id: a.id,
        name: a.name,
        balanceCents: a.balanceCents,
        monthlyAllocationCents: a.monthlyAllocationCents,
        goalTargetCents: a.goalTargetCents ?? null,
        goalTargetDate: a.goalTargetDate ?? null,
      },
      month: nowMonth,
      transactions,
      saverAccountIds: allSaverIds,
      storedAllocationCents: allocByAccount.get(a.id) ?? null,
    };
  });

  const envelopeAlignment = analyseAllSavers(saverInputs);

  // ── 4. Emergency fund analysis ─────────────────────────────────────────────
  const emergencyFund = analyseEmergencyFund({
    account: emergencyAccount
      ? {
          id: emergencyAccount.id,
          name: emergencyAccount.name,
          balanceCents: emergencyAccount.balanceCents,
          monthlyAllocationCents: emergencyAccount.monthlyAllocationCents,
        }
      : null,
    monthlyExpenses: monthlyExpensesLast6Months(db, nowMonth),
    withdrawalsThisMonthCents: emergencyAccount
      ? fundFlow(db, emergencyAccount.id, "out", nowMonth, nowMonth)
      : 0,
    inboundThisMonthCents: emergencyAccount
      ? fundFlow(db, emergencyAccount.id, "in", nowMonth, nowMonth)
      : 0,
    outflows3MoCents: emergencyAccount
      ? fundFlow(db, emergencyAccount.id, "out", monthBefore(nowMonth, 2), nowMonth)
      : 0,
    inflows3MoCents: emergencyAccount
      ? fundFlow(db, emergencyAccount.id, "in", monthBefore(nowMonth, 2), nowMonth)
      : 0,
  });

  // ── 5. Budget health score ─────────────────────────────────────────────────
  // savingsRate = net / income from the most-recent period's txns; falls back
  // to 0 when no salary period exists (nothing to divide by).
  const savingsRate = computeSavingsRate(txns, currentPeriod);

  const health = calculateBudgetHealth({
    savers: envelopeAlignment,
    emergencyFund,
    savingsRate,
  });

  // ── 6. Behavioural + spending insights ────────────────────────────────────
  const behaviouralInsights = getBehaviouralInsights(txns, now);
  const spendingInsights = getSpendingInsights(txns, now);

  // ── 7. Spending heatmap (90-day window ending at `now`) ───────────────────
  const ninetyDaysAgo = new Date(Date.parse(now) - 89 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const heatmap = buildSpendingHeatmap(txns, ninetyDaysAgo, now.slice(0, 10));

  // ── 8. No-spend streak ────────────────────────────────────────────────────
  const streak = computeNoSpendStreak(txns, now);

  // ── 9. Tag summary (all-time) ─────────────────────────────────────────────
  const tagSummary = buildTagSummary(txns);

  return {
    health,
    envelopeAlignment,
    emergencyFund,
    behaviouralInsights,
    spendingInsights,
    heatmap,
    streak,
    tagSummary,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map every transaction row to a ReportTxn, attaching its tag ids. */
function loadReportTxns(db: DbClient): ReportTxn[] {
  const rows = db
    .select({
      id: tables.transactions.id,
      amountCents: tables.transactions.amountCents,
      isSalary: tables.transactions.isSalary,
      isTransfer: tables.transactions.isTransfer,
      categoryId: tables.transactions.categoryId,
      parentCategoryId: tables.transactions.parentCategoryId,
      settledAt: tables.transactions.settledAt,
      createdAt: tables.transactions.createdAt,
    })
    .from(tables.transactions)
    .all();

  const tagRows = db
    .select({
      transactionId: tables.transactionTags.transactionId,
      tagId: tables.transactionTags.tagId,
    })
    .from(tables.transactionTags)
    .all();

  const tagsByTxn = new Map<string, string[]>();
  for (const t of tagRows) {
    const list = tagsByTxn.get(t.transactionId) ?? [];
    list.push(t.tagId);
    tagsByTxn.set(t.transactionId, list);
  }

  return rows.map((r) => ({
    id: r.id,
    amountCents: r.amountCents,
    isSalary: r.isSalary,
    isTransfer: r.isTransfer,
    categoryId: r.categoryId,
    parentCategoryId: r.parentCategoryId,
    settledAt: r.settledAt,
    createdAt: r.createdAt,
    tags: tagsByTxn.get(r.id) ?? [],
  }));
}

/**
 * Derive a savings rate (0..1) from the current salary period's transactions.
 * savingsRate = (income - expenses) / income, clamped 0..1.
 * Returns 0 when there is no period or no income.
 */
function computeSavingsRate(
  txns: ReportTxn[],
  period: SalaryPeriod | undefined,
): number {
  if (period === undefined) return 0;

  const { startDate, endDate } = period;
  const periodTxns = txns.filter((tx) => {
    const at = tx.settledAt ?? tx.createdAt;
    return at >= startDate && at <= endDate;
  });

  const income = periodTxns
    .filter((t) => t.amountCents > 0 && !t.isTransfer)
    .reduce((s, t) => s + t.amountCents, 0);
  const expenses = periodTxns
    .filter((t) => t.amountCents < 0 && !t.isTransfer)
    .reduce((s, t) => s + Math.abs(t.amountCents), 0);

  if (income === 0) return 0;
  const rate = (income - expenses) / income;
  return Math.min(1, Math.max(0, rate));
}

/**
 * Positive expense cents per prior complete month (last 6), for the EF analyser.
 */
function monthlyExpensesLast6Months(db: DbClient, month: string): number[] {
  const window = new Set<string>();
  for (let i = 1; i <= 6; i++) window.add(monthBefore(month, i));

  const rows = db
    .select({
      amountCents: tables.transactions.amountCents,
      createdAt: tables.transactions.createdAt,
      isTransfer: tables.transactions.isTransfer,
    })
    .from(tables.transactions)
    .all();

  const byMonth = new Map<string, number>();
  for (const r of rows) {
    if (r.isTransfer) continue;
    if (r.amountCents >= 0) continue;
    const m = r.createdAt.slice(0, 7);
    if (!window.has(m)) continue;
    byMonth.set(m, (byMonth.get(m) ?? 0) + Math.abs(r.amountCents));
  }
  return [...window].map((m) => byMonth.get(m) ?? 0);
}

/** Absolute cents in/out of `accountId` over the inclusive month range [from, to]. */
function fundFlow(
  db: DbClient,
  accountId: string,
  dir: "in" | "out",
  from: string,
  to: string,
): number {
  const rows = db
    .select({
      amountCents: tables.transactions.amountCents,
      createdAt: tables.transactions.createdAt,
    })
    .from(tables.transactions)
    .where(eq(tables.transactions.accountId, accountId))
    .orderBy(asc(tables.transactions.createdAt))
    .all();
  let total = 0;
  for (const r of rows) {
    const m = r.createdAt.slice(0, 7);
    if (m < from || m > to) continue;
    if (dir === "in" && r.amountCents > 0) total += r.amountCents;
    if (dir === "out" && r.amountCents < 0) total += Math.abs(r.amountCents);
  }
  return total;
}

/** The `yyyy-MM` `n` months before `month` (n >= 1). */
function monthBefore(month: string, n: number): string {
  const year = Number(month.slice(0, 4));
  const mon = Number(month.slice(5, 7));
  const idx = year * 12 + (mon - 1) - n;
  const y = Math.floor(idx / 12);
  const m = idx - y * 12 + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}
