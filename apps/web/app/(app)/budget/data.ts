import { and, asc, eq, lt } from "drizzle-orm";
import {
  analyseSaver,
  analyseEmergencyFund,
  goalConfidence,
  type SaverBudgetAnalysis,
  type SaverTransaction,
  type EmergencyFundAnalysis,
  type GoalConfidenceResult,
} from "@upshot/core";
import { DrizzleAccountRepo, tables, type DbClient } from "@upshot/db";

/** Account row as returned by the repo (avoids a direct @upshot/contracts dep in apps/web). */
type Account = Awaited<ReturnType<DrizzleAccountRepo["list"]>>[number];

/** A saver envelope: its core analysis plus an optional goal-confidence result. */
export interface SaverView {
  id: string;
  name: string;
  role: Account["role"];
  analysis: SaverBudgetAnalysis;
  /** Present only when the saver has a monthly allocation (a target to project toward). */
  confidence: GoalConfidenceResult | null;
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

    const analysis = analyseSaver({
      account: {
        id: account.id,
        name: account.name,
        balanceCents: account.balanceCents,
        monthlyAllocationCents: account.monthlyAllocationCents,
      },
      month,
      transactions,
      saverAccountIds,
    });

    // A saver has a "goal/target" only when it has a monthly allocation: project
    // confidence of reaching a 12-month savings goal (12 × allocation) within a
    // year, resampling the saver's own historical monthly net inflows. Seeded by
    // the account id so the result is deterministic across requests.
    let confidence: GoalConfidenceResult | null = null;
    if (account.monthlyAllocationCents > 0) {
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

    savers.push({ id: account.id, name: account.name, role: account.role, analysis, confidence });
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
