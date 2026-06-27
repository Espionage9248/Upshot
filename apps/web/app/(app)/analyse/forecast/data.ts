import { and, asc, desc, eq, gt, inArray, lt } from "drizzle-orm";
import {
  buildCashflowForecast,
  type CashflowForecast,
  type ForecastInput,
  type ScheduledOutflow,
  type ActualDailyNet,
} from "@upshot/core";
import { tables, type DbClient } from "@upshot/db";
import type { SalaryChangeDebt, SalaryChangeSaver, ExpenseChangeSaver } from "@upshot/core";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ForecastPageData {
  forecast: CashflowForecast;
  salaryBaseline: {
    currentMonthlyIncomeCents: number;
    debts: SalaryChangeDebt[];
    debtStrategy: "SNOWBALL" | "AVALANCHE" | "CUSTOM";
    savers: SalaryChangeSaver[];
    monthlyExpensesCents: number;
    monthlyExplicitSavingsCents: number;
    hasExplicitSavingsAccounts: boolean;
    startMonth: string;
  };
  expenseBaseline: {
    currentIncomeCents: number;
    savers: ExpenseChangeSaver[];
    totalMonthlyDebtCents: number;
    monthlyExplicitSavingsCents: number;
    hasExplicitSavingsAccounts: boolean;
  };
}

// ---------------------------------------------------------------------------
// Frequency → approximate days (for recurring items)
// ---------------------------------------------------------------------------

const FREQUENCY_DAYS: Record<string, number> = {
  WEEKLY: 7,
  FORTNIGHTLY: 14,
  MONTHLY: 30,
  QUARTERLY: 91,
  YEARLY: 365,
};

/** Cap quarterly/yearly recurring items to their first occurrence only. */
const CAP_TO_FIRST = new Set(["QUARTERLY", "YEARLY"]);

const DAY_MS = 86_400_000;
const NINETY_DAYS_MS = 90 * DAY_MS;
const THIRTY_DAYS_MS = 30 * DAY_MS;

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

/**
 * Server-only loader for /analyse/forecast. Takes an injected `db` (nothing
 * constructed at module load → preserves the env-free `next build` invariant).
 * `now` is injected as an ISO string so computations are deterministic.
 */
export async function loadForecastData(
  db: DbClient,
  opts: { now: string; horizon: 30 | 60 | 90 },
): Promise<ForecastPageData> {
  const { now, horizon } = opts;
  const nowMs = Date.parse(now);
  const nowDate = now.slice(0, 10);
  const nowMonth = now.slice(0, 7); // "yyyy-MM"

  // ── Step 1: Spending account ─────────────────────────────────────────────
  const spendingAccount = db
    .select({ id: tables.accounts.id, balanceCents: tables.accounts.balanceCents })
    .from(tables.accounts)
    .where(eq(tables.accounts.role, "SPENDING"))
    .get();
  const startBalanceCents = spendingAccount?.balanceCents ?? 0;
  const spendingAccountId = spendingAccount?.id;

  // ── Step 2: Salary cadence ───────────────────────────────────────────────
  // Load the 4 most recent isSalary transactions ordered by createdAt desc
  const salaryTxns = db
    .select({
      amountCents: tables.transactions.amountCents,
      createdAt: tables.transactions.createdAt,
    })
    .from(tables.transactions)
    .where(eq(tables.transactions.isSalary, true))
    .orderBy(desc(tables.transactions.createdAt))
    .limit(4)
    .all();

  let salaryInput: ForecastInput["salary"] = null;
  let currentMonthlyIncomeCents = 0;

  if (salaryTxns.length >= 2) {
    // Compute average gap in days between consecutive salary txns
    const sorted = [...salaryTxns].sort((a, b) =>
      a.createdAt < b.createdAt ? -1 : 1,
    );
    let totalGapMs = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalGapMs +=
        Date.parse(sorted[i]!.createdAt) - Date.parse(sorted[i - 1]!.createdAt);
    }
    const avgGapDays = totalGapMs / DAY_MS / (sorted.length - 1);
    const cadenceDays: 7 | 14 | 30 =
      avgGapDays <= 8 ? 7 : avgGapDays <= 18 ? 14 : 30;

    const avgAmountCents = Math.round(
      salaryTxns.reduce((s, t) => s + t.amountCents, 0) / salaryTxns.length,
    );
    // Most recent createdAt (first in desc-ordered list)
    const lastPayISO = salaryTxns[0]!.createdAt;

    salaryInput = { cadenceDays, amountCents: avgAmountCents, lastPayISO };
    currentMonthlyIncomeCents = Math.round((avgAmountCents * 30) / cadenceDays);
  } else if (salaryTxns.length === 1) {
    // Single txn → assume monthly
    const cadenceDays = 30;
    const amountCents = salaryTxns[0]!.amountCents;
    const lastPayISO = salaryTxns[0]!.createdAt;
    salaryInput = { cadenceDays, amountCents, lastPayISO };
    currentMonthlyIncomeCents = amountCents;
  }

  const payPerCycleCount =
    salaryInput?.cadenceDays === 14 ? 2 : salaryInput?.cadenceDays === 7 ? 4 : 1;

  // ── Step 3: Actual daily net (last 30 days of spending account txns) ─────
  const thirtyAgoISO = new Date(nowMs - THIRTY_DAYS_MS).toISOString().slice(0, 10);

  const actualDailyNet: ActualDailyNet[] = [];

  if (spendingAccountId !== undefined) {
    const recentSpendTxns = db
      .select({
        amountCents: tables.transactions.amountCents,
        createdAt: tables.transactions.createdAt,
      })
      .from(tables.transactions)
      .where(
        and(
          eq(tables.transactions.accountId, spendingAccountId),
          gt(tables.transactions.createdAt, thirtyAgoISO),
          lt(tables.transactions.createdAt, now),
        ),
      )
      .orderBy(asc(tables.transactions.createdAt))
      .all();

    // Bucket by day
    const byDay = new Map<string, number>();
    for (const t of recentSpendTxns) {
      const day = t.createdAt.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + t.amountCents);
    }
    for (const [dateISO, netCents] of [...byDay.entries()].sort()) {
      actualDailyNet.push({ dateISO, netCents });
    }
  }

  // ── Step 4: Scheduled outflows (recurring + debts + installments) ────────
  // Always build for 90-day window; engine filters to the chosen horizon
  const horizonWindowMs = 90 * DAY_MS;

  const scheduledOutflows: ScheduledOutflow[] = [];

  // 4a. Recurring items (ACTIVE only)
  const activeRecurring = db
    .select({
      amountCents: tables.recurringItems.amountCents,
      frequency: tables.recurringItems.frequency,
      nextExpectedDate: tables.recurringItems.nextExpectedDate,
    })
    .from(tables.recurringItems)
    .where(eq(tables.recurringItems.status, "ACTIVE"))
    .all();

  for (const item of activeRecurring) {
    if (!item.nextExpectedDate) continue;
    const freqDays = FREQUENCY_DAYS[item.frequency];
    if (freqDays === undefined) continue;

    const magnitude = Math.abs(item.amountCents);
    let dateMs = Date.parse(item.nextExpectedDate + "T00:00:00.000Z");

    if (CAP_TO_FIRST.has(item.frequency)) {
      // Cap quarterly/yearly to first occurrence within the 90d window
      if (dateMs > nowMs && dateMs <= nowMs + horizonWindowMs) {
        scheduledOutflows.push({
          dateISO: new Date(dateMs).toISOString().slice(0, 10),
          amountCents: magnitude,
        });
      }
    } else {
      // Repeat within the 90-day window
      while (dateMs <= nowMs + horizonWindowMs) {
        if (dateMs > nowMs) {
          scheduledOutflows.push({
            dateISO: new Date(dateMs).toISOString().slice(0, 10),
            amountCents: magnitude,
          });
        }
        dateMs += freqDays * DAY_MS;
      }
    }
  }

  // 4b. Debts (monthly payment from today across 90 days)
  const allDebts = db
    .select({
      id: tables.debts.id,
      currentBalanceCents: tables.debts.currentBalanceCents,
      monthlyPaymentCents: tables.debts.monthlyPaymentCents,
      minimumPaymentCents: tables.debts.minimumPaymentCents,
      interestRate: tables.debts.interestRate,
      includeInSnowball: tables.debts.includeInSnowball,
    })
    .from(tables.debts)
    .all();

  for (const debt of allDebts) {
    if (debt.monthlyPaymentCents <= 0) continue;
    // Project monthly payment occurrences across the 90-day window
    let offset = 30 * DAY_MS; // first payment ~1 month from now
    while (offset <= horizonWindowMs) {
      const dateMs = nowMs + offset;
      if (dateMs <= nowMs + horizonWindowMs) {
        scheduledOutflows.push({
          dateISO: new Date(dateMs).toISOString().slice(0, 10),
          amountCents: debt.monthlyPaymentCents,
        });
      }
      offset += 30 * DAY_MS;
    }
  }

  // 4c. Installment plans (ACTIVE; cap at remaining installments)
  const activePlans = db
    .select({
      installmentCents: tables.installmentPlans.installmentCents,
      totalInstallments: tables.installmentPlans.totalInstallments,
      installmentsPaid: tables.installmentPlans.installmentsPaid,
      frequencyDays: tables.installmentPlans.frequencyDays,
      nextDueDate: tables.installmentPlans.nextDueDate,
    })
    .from(tables.installmentPlans)
    .where(eq(tables.installmentPlans.status, "ACTIVE"))
    .all();

  for (const plan of activePlans) {
    const remaining = plan.totalInstallments - plan.installmentsPaid;
    if (remaining <= 0) continue;
    let dateMs = Date.parse(plan.nextDueDate + "T00:00:00.000Z");
    let count = 0;
    while (count < remaining && dateMs <= nowMs + horizonWindowMs) {
      if (dateMs > nowMs) {
        scheduledOutflows.push({
          dateISO: new Date(dateMs).toISOString().slice(0, 10),
          amountCents: plan.installmentCents,
        });
      }
      dateMs += plan.frequencyDays * DAY_MS;
      count++;
    }
  }

  // ── Step 5: Per-pay-cycle saver allocation ───────────────────────────────
  // Sum current-month budget_allocations across SAVER/ESSENTIALS/EMERGENCY accounts
  const saverAccounts = db
    .select({
      id: tables.accounts.id,
      name: tables.accounts.name,
      role: tables.accounts.role,
      monthlyAllocationCents: tables.accounts.monthlyAllocationCents,
    })
    .from(tables.accounts)
    .where(
      inArray(tables.accounts.role, ["SAVER", "ESSENTIALS", "EMERGENCY"]),
    )
    .all();

  const saverIds = saverAccounts.map((a) => a.id);
  let totalMonthlyAllocationCents = 0;

  if (saverIds.length > 0) {
    const allocRows = db
      .select({
        accountId: tables.budgetAllocations.accountId,
        allocatedCents: tables.budgetAllocations.allocatedCents,
      })
      .from(tables.budgetAllocations)
      .where(
        and(
          eq(tables.budgetAllocations.month, nowMonth),
          inArray(tables.budgetAllocations.accountId, saverIds),
        ),
      )
      .all();
    for (const r of allocRows) {
      totalMonthlyAllocationCents += r.allocatedCents;
    }
    // Fallback: if no allocations this month, use monthlyAllocationCents from accounts
    if (totalMonthlyAllocationCents === 0) {
      for (const a of saverAccounts) {
        totalMonthlyAllocationCents += a.monthlyAllocationCents;
      }
    }
  }

  const perPayCycleAllocationCents = Math.round(
    totalMonthlyAllocationCents / payPerCycleCount,
  );

  // ── Step 6: Discretionary stats (90-day window) ──────────────────────────
  // Non-transfer, non-salary spending-account outflows minus scheduled-outflow amounts
  const ninetyAgoISO = new Date(nowMs - NINETY_DAYS_MS).toISOString().slice(0, 10);

  let avgDailyDiscretionaryCents = 0;
  let stdDevDailyDiscretionaryCents = 0;

  if (spendingAccountId !== undefined && spendingAccountId !== "") {
    const outflowTxns90 = db
      .select({
        amountCents: tables.transactions.amountCents,
        createdAt: tables.transactions.createdAt,
        isTransfer: tables.transactions.isTransfer,
        isSalary: tables.transactions.isSalary,
      })
      .from(tables.transactions)
      .where(
        and(
          eq(tables.transactions.accountId, spendingAccountId),
          gt(tables.transactions.createdAt, ninetyAgoISO),
          lt(tables.transactions.createdAt, now),
        ),
      )
      .orderBy(asc(tables.transactions.createdAt))
      .all();

    // Scheduled outflows in the last 90 days (for double-count avoidance)
    // Build a map of day → scheduled outflow magnitude for the past 90 days
    const scheduledPast90 = new Map<string, number>();
    for (const item of activeRecurring) {
      if (!item.nextExpectedDate) continue;
      const freqDays = FREQUENCY_DAYS[item.frequency];
      if (freqDays === undefined) continue;
      if (CAP_TO_FIRST.has(item.frequency)) continue; // skip quarterly/yearly for simplicity

      // Walk backwards to find occurrences in past 90 days
      // Start from nextExpectedDate and subtract frequency
      let dateMs = Date.parse(item.nextExpectedDate + "T00:00:00.000Z");
      // Also add any that are in the past 90 days before nextExpectedDate
      // Walk back from nextExpectedDate
      let backMs = dateMs - freqDays * DAY_MS;
      while (backMs > nowMs - NINETY_DAYS_MS) {
        if (backMs < nowMs) {
          const key = new Date(backMs).toISOString().slice(0, 10);
          scheduledPast90.set(
            key,
            (scheduledPast90.get(key) ?? 0) + Math.abs(item.amountCents),
          );
        }
        backMs -= freqDays * DAY_MS;
      }
    }
    // Also add debt payments in past 90 days (approximate: monthly from 90 days ago)
    for (const debt of allDebts) {
      if (debt.monthlyPaymentCents <= 0) continue;
      for (let offset = 30 * DAY_MS; offset <= NINETY_DAYS_MS; offset += 30 * DAY_MS) {
        const dateMs = nowMs - offset;
        if (dateMs > nowMs - NINETY_DAYS_MS) {
          const key = new Date(dateMs).toISOString().slice(0, 10);
          scheduledPast90.set(
            key,
            (scheduledPast90.get(key) ?? 0) + debt.monthlyPaymentCents,
          );
        }
      }
    }

    // Bucket daily net discretionary outflows (outflows only, not inflows)
    const byDay90 = new Map<string, number>();
    for (const t of outflowTxns90) {
      if (t.isTransfer || t.isSalary) continue;
      if (t.amountCents >= 0) continue; // only outflows
      const day = t.createdAt.slice(0, 10);
      byDay90.set(day, (byDay90.get(day) ?? 0) + Math.abs(t.amountCents));
    }

    // Subtract scheduled outflows from each day
    const discByDay = new Map<string, number>();
    const windowStart = ninetyAgoISO;
    const windowEnd = nowDate;

    // Fill all 90 days with 0 first
    for (let d = 0; d < 90; d++) {
      const day = new Date(nowMs - (90 - d) * DAY_MS).toISOString().slice(0, 10);
      if (day >= windowStart && day < windowEnd) {
        discByDay.set(day, 0);
      }
    }
    // Apply raw outflows
    for (const [day, amt] of byDay90.entries()) {
      discByDay.set(day, amt);
    }
    // Subtract scheduled
    for (const [day, sched] of scheduledPast90.entries()) {
      const existing = discByDay.get(day) ?? 0;
      discByDay.set(day, Math.max(0, existing - sched));
    }

    const series = [...discByDay.values()];
    if (series.length > 0) {
      const sum = series.reduce((s, v) => s + v, 0);
      const mean = sum / series.length;
      const variance =
        series.reduce((s, v) => s + (v - mean) ** 2, 0) / series.length;

      // CRITICAL: must be integer cents
      avgDailyDiscretionaryCents = Math.round(mean);
      stdDevDailyDiscretionaryCents = Math.round(Math.sqrt(variance));
    }
  }

  // ── Step 7: Build CashflowForecast ──────────────────────────────────────
  const forecastInput: ForecastInput = {
    nowISO: now,
    startBalanceCents,
    actualDailyNet,
    salary: salaryInput,
    scheduledOutflows,
    perPayCycleAllocationCents,
    avgDailyDiscretionaryCents,
    stdDevDailyDiscretionaryCents,
  };

  const forecast = buildCashflowForecast(forecastInput, horizon);

  // ── Step 8: salaryBaseline + expenseBaseline ──────────────────────────────
  const settings = db
    .select({ debtStrategy: tables.appSettings.debtStrategy })
    .from(tables.appSettings)
    .get();
  const debtStrategy = (settings?.debtStrategy ?? "SNOWBALL") as
    | "SNOWBALL"
    | "AVALANCHE"
    | "CUSTOM";

  const snowballDebts: SalaryChangeDebt[] = allDebts
    .filter((d) => d.includeInSnowball)
    .map((d) => ({
      id: d.id,
      currentBalanceCents: d.currentBalanceCents,
      minimumPaymentCents: d.minimumPaymentCents ?? d.monthlyPaymentCents,
      interestRate: d.interestRate,
    }));

  const totalMonthlyDebtCents = allDebts.reduce(
    (s, d) => s + d.monthlyPaymentCents,
    0,
  );

  const saverDTOs: SalaryChangeSaver[] = saverAccounts.map((a) => ({
    saverId: a.id,
    saverName: a.name,
    monthlyAllocationCents: a.monthlyAllocationCents,
  }));

  const expenseSavers: ExpenseChangeSaver[] = saverAccounts.map((a) => ({
    saverId: a.id,
    saverName: a.name,
    monthlyAllocationCents: a.monthlyAllocationCents,
  }));

  const hasExplicitSavingsAccounts = saverAccounts.length > 0;
  const monthlyExplicitSavingsCents = totalMonthlyAllocationCents;
  const monthlyExpensesCents = totalMonthlyAllocationCents;

  const salaryBaseline: ForecastPageData["salaryBaseline"] = {
    currentMonthlyIncomeCents,
    debts: snowballDebts,
    debtStrategy,
    savers: saverDTOs,
    monthlyExpensesCents,
    monthlyExplicitSavingsCents,
    hasExplicitSavingsAccounts,
    startMonth: nowMonth,
  };

  const expenseBaseline: ForecastPageData["expenseBaseline"] = {
    currentIncomeCents: currentMonthlyIncomeCents,
    savers: expenseSavers,
    totalMonthlyDebtCents,
    monthlyExplicitSavingsCents,
    hasExplicitSavingsAccounts,
  };

  return { forecast, salaryBaseline, expenseBaseline };
}
