import { and, asc, eq, lt } from "drizzle-orm";
import {
  analyseSaver,
  analyseEmergencyFund,
  goalConfidence,
  monthsUntil,
  type SaverBudgetAnalysis,
  type SaverTransaction,
  type EmergencyFundAnalysis,
  type GoalConfidenceResult,
} from "@upshot/core";
import { DrizzleAccountRepo, tables, type DbClient } from "@upshot/db";

/** Account row as returned by the repo (avoids a direct @upshot/contracts dep in apps/web). */
type Account = Awaited<ReturnType<DrizzleAccountRepo["list"]>>[number];

/** A real user-entered saver goal: target amount and the date to reach it by. */
export interface SaverGoal {
  targetCents: number;
  targetDate: string;
}

/** A saver envelope: its core analysis plus an optional goal-confidence result. */
export interface SaverView {
  id: string;
  name: string;
  role: Account["role"];
  analysis: SaverBudgetAnalysis;
  /** Present when the saver has a real goal OR a monthly allocation (a target to project toward). */
  confidence: GoalConfidenceResult | null;
  /** The real user-entered goal, when set; null when only the allocation heuristic applies. */
  goal: SaverGoal | null;
}

export interface BudgetData {
  /** The `yyyy-MM` the board is showing (derived from `now`). */
  month: string;
  savers: SaverView[];
  emergencyFund: EmergencyFundAnalysis | null;
}

/** `yyyy-MM` of a Date (UTC). */
function monthOf(d: Date): string {
  return d.toISOString().slice(0, 7);
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

/** Stable 32-bit seed from a string id, so goalConfidence is deterministic per saver. */
function seedFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Server-only loader for the Budget room. Reads the encrypted DB in-process via
 * injected `db` (constructs nothing at module load → preserves the env-free
 * `next build` invariant, stays testable). Returns domain data only.
 *
 * The two windowing carry-forwards from the A2/A3 reviews live here:
 *   1. analyseSaver counts EVERY in-month transfer regardless of "now", so the
 *      loader bounds each saver's transactions to the month UP TO `now` —
 *      future-dated current-month rows are dropped (`createdAt < nowIso`).
 *   2. analyseEmergencyFund owns no windowing and wants POSITIVE expense cents,
 *      so the loader sums `Math.abs()` of expense outflows per prior complete
 *      month (last 6) and shapes the this-month / 3-month fund windows itself.
 */
export async function loadBudgetData(db: DbClient, now: Date = new Date()): Promise<BudgetData> {
  const month = monthOf(now);
  const nowIso = now.toISOString();

  const accountRepo = new DrizzleAccountRepo(db);
  const accounts = await accountRepo.list();

  // Savers = SAVER-role accounts; the EMERGENCY account is handled separately.
  const saverAccounts = accounts.filter((a) => a.role === "SAVER");
  const emergencyAccount = accounts.find((a) => a.role === "EMERGENCY") ?? null;

  // saver-to-saver reallocations are excluded from spending — needs the set of
  // ALL saver-like account ids (savers + the emergency fund).
  const saverAccountIds = new Set<string>([
    ...saverAccounts.map((a) => a.id),
    ...(emergencyAccount ? [emergencyAccount.id] : []),
  ]);

  const savers: SaverView[] = [];
  for (const account of saverAccounts) {
    // Carry-forward 1: bound the window to rows created before `now`. analyseSaver
    // self-filters by month, so we only need to drop the future tail here.
    const rows = db
      .select({
        amountCents: tables.transactions.amountCents,
        createdAt: tables.transactions.createdAt,
        accountId: tables.transactions.accountId,
        transferAccountId: tables.transactions.transferAccountId,
        isTransfer: tables.transactions.isTransfer,
      })
      .from(tables.transactions)
      .where(
        and(
          eq(tables.transactions.accountId, account.id),
          lt(tables.transactions.createdAt, nowIso),
        ),
      )
      .all();

    const transactions: SaverTransaction[] = rows.map((r) => ({
      amountCents: r.amountCents,
      createdAt: r.createdAt,
      accountId: r.accountId,
      transferAccountId: r.transferAccountId ?? undefined,
      isTransfer: r.isTransfer,
    }));

    // Option A: a user-set allocation for THIS month (the budget_allocations row)
    // is authoritative over inferred incoming transfers.
    const storedAllocation = db
      .select({ allocatedCents: tables.budgetAllocations.allocatedCents })
      .from(tables.budgetAllocations)
      .where(
        and(
          eq(tables.budgetAllocations.accountId, account.id),
          eq(tables.budgetAllocations.month, month),
        ),
      )
      .get();

    const analysis = analyseSaver({
      account: {
        id: account.id,
        name: account.name,
        balanceCents: account.balanceCents,
        monthlyAllocationCents: account.monthlyAllocationCents,
        goalTargetCents: account.goalTargetCents,
        goalTargetDate: account.goalTargetDate,
      },
      month,
      transactions,
      saverAccountIds,
      storedAllocationCents: storedAllocation?.allocatedCents ?? null,
    });

    // Project confidence of reaching a target, resampling the saver's own
    // historical monthly net inflows. Seeded by the account id so the result is
    // deterministic across requests. Prefer the real user-entered goal (target
    // amount + derived months-to-target); otherwise fall back to the 12-month
    // allocation heuristic. A saver with neither has no target to project.
    let confidence: GoalConfidenceResult | null = null;
    let goal: SaverGoal | null = null;
    if (account.goalTargetCents != null && account.goalTargetDate != null) {
      // Real user-entered goal: target amount + derived months-to-target.
      const monthsToTarget = Math.max(1, monthsUntil(nowIso.slice(0, 10), account.goalTargetDate));
      confidence = goalConfidence(
        {
          currentBalanceCents: account.balanceCents,
          targetCents: account.goalTargetCents,
          monthsToTarget,
          historicalNetInflowsCents: netInflowsLast6Months(transactions, month),
        },
        seedFromId(account.id),
      );
      goal = { targetCents: account.goalTargetCents, targetDate: account.goalTargetDate };
    } else if (account.monthlyAllocationCents > 0) {
      // Fallback heuristic (unchanged): 12 × monthly allocation over 12 months.
      confidence = goalConfidence(
        {
          currentBalanceCents: account.balanceCents,
          targetCents: account.monthlyAllocationCents * 12,
          monthsToTarget: 12,
          historicalNetInflowsCents: netInflowsLast6Months(transactions, month),
        },
        seedFromId(account.id),
      );
    }

    savers.push({ id: account.id, name: account.name, role: account.role, analysis, confidence, goal });
  }

  const emergencyFund = analyseEmergencyFund({
    account: emergencyAccount
      ? {
          id: emergencyAccount.id,
          name: emergencyAccount.name,
          balanceCents: emergencyAccount.balanceCents,
          monthlyAllocationCents: emergencyAccount.monthlyAllocationCents,
        }
      : null,
    monthlyExpenses: monthlyExpensesLast6Months(db, month),
    withdrawalsThisMonthCents: emergencyAccount
      ? fundFlow(db, emergencyAccount.id, "out", month, month)
      : 0,
    inboundThisMonthCents: emergencyAccount
      ? fundFlow(db, emergencyAccount.id, "in", month, month)
      : 0,
    outflows3MoCents: emergencyAccount
      ? fundFlow(db, emergencyAccount.id, "out", monthBefore(month, 2), month)
      : 0,
    inflows3MoCents: emergencyAccount
      ? fundFlow(db, emergencyAccount.id, "in", monthBefore(month, 2), month)
      : 0,
  });

  return { month, savers, emergencyFund };
}

/**
 * Per-month signed net inflow (most-recent-last) over the 6 complete months
 * before `month`, from a saver's own transactions. Drives the confidence
 * resampler with the saver's real history.
 */
function netInflowsLast6Months(transactions: SaverTransaction[], month: string): number[] {
  const series: number[] = [];
  for (let i = 6; i >= 1; i--) {
    const m = monthBefore(month, i);
    let net = 0;
    for (const t of transactions) {
      if (t.createdAt.slice(0, 7) === m) net += t.amountCents;
    }
    series.push(net);
  }
  return series;
}

/**
 * Carry-forward 2: POSITIVE expense cents per prior complete month (last 6).
 * analyseEmergencyFund sums the array then divides by a fixed 6, so the order is
 * irrelevant. Expenses are negative-amount, non-transfer rows across all
 * accounts; each month's outflow total is `Math.abs()`'d to a positive figure.
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
