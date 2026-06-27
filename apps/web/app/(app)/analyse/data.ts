import { and, eq, inArray } from "drizzle-orm";
import {
  deriveSalaryPeriods,
  buildMonthlyReport,
  buildYearlyReport,
  buildCashflow,
  momDelta,
  type ReportTxn,
  type SalaryPeriod,
  type MonthlyReport,
  type YearlyReport,
  type CashflowPoint,
  type EnvelopePerformanceItem,
  type DebtPaymentBreakdownItem,
  type MoMDelta,
} from "@upshot/core";
import {
  DrizzleCategoryRepo,
  DrizzleDebtRepo,
  tables,
  type DbClient,
} from "@upshot/db";

/** The three headline MoM deltas the Reports surface shows. */
export interface ReportsDeltas {
  income: MoMDelta;
  expense: MoMDelta;
  net: MoMDelta;
}

/** Report view mode — drives which report type is built and rendered. */
export type ReportView = "month" | "year" | "fy";

/**
 * Serializable DTO for the /analyse Reports surface. Domain data only — never
 * the encryption key, env, or raw error stacks.
 */
export interface ReportsData {
  /** Active view mode. */
  view: ReportView;
  /** All derived salary periods (most-recent-first), for the period switcher. */
  periods: SalaryPeriod[];
  /** The period the report below is built for (clamped into range). */
  selectedIndex: number;
  /** The monthly report for the selected period (month view only). */
  report: MonthlyReport;
  /** Day-bucketed cashflow series scoped to the selected period (month view only). */
  cashflow: CashflowPoint[];
  /** MoM deltas: selected period vs the immediately-previous period (month view only). */
  deltas: ReportsDeltas;
  /** The yearly/FY report (year or fy view only). */
  yearlyReport?: YearlyReport;
  /** The year/FY ending-year in use (year/fy view only). */
  selectedYear?: number;
}

/**
 * Server-only loader for the /analyse Reports surface. Reads the encrypted DB
 * in-process via injected `db` (constructs nothing at module load → preserves
 * the env-free `next build` invariant, stays testable). Returns domain DTOs only.
 *
 * Flow: load txns/categories/savers/debts → map rows to ReportTxn[] →
 * deriveSalaryPeriods → scope to the chosen period → buildMonthlyReport +
 * buildCashflow + MoM deltas (current vs previous period).
 *
 * For year/fy views: loads all txns, calls buildYearlyReport for the chosen year,
 * passing prior-year txns for the YoY comparison.
 *
 * `now` is injected as an ISO string so period derivation is deterministic.
 */
export async function loadReportsData(
  db: DbClient,
  opts: { periodIndex: number; now: string; view?: ReportView; year?: number },
): Promise<ReportsData> {
  const { now } = opts;
  const view: ReportView = opts.view ?? "month";

  // 1. Categories → id → { name, parentName } map for the breakdown.
  const categories = await new DrizzleCategoryRepo(db).list();
  const catById = new Map(categories.map((c) => [c.id, c]));
  const categoryNames = new Map<string, { name: string; parentName: string | null }>();
  for (const c of categories) {
    const parentName = c.parentId != null ? (catById.get(c.parentId)?.name ?? null) : null;
    categoryNames.set(c.id, { name: c.name, parentName });
  }

  // 2. All transactions → ReportTxn[] (tags joined from transaction_tags; the
  //    tag id IS the tag value in this schema, so it's a usable string label).
  const txns = loadReportTxns(db);

  // 3. Derive salary periods and clamp the requested index into range.
  const periods = deriveSalaryPeriods(txns, now);
  const selectedIndex =
    periods.length === 0 ? 0 : Math.min(Math.max(opts.periodIndex, 0), periods.length - 1);
  const period = periods[selectedIndex] ?? emptyPeriod(now);

  // 4. Always build a monthly report (monthly view uses it; yearly view needs the
  //    period fields for the period switcher to work). Scope txns to the period.
  const periodTxns = scopeToPeriod(txns, period);

  // 5. Envelope performance (savers) + debt payment breakdown for this period.
  const month = period.startDate.slice(0, 7);
  const envelopePerformance = loadEnvelopePerformance(db, month, period);
  const debtPaymentBreakdown = await loadDebtPaymentBreakdown(db, period);

  // 6. Build the monthly report.
  const report = buildMonthlyReport({
    period,
    txns: periodTxns,
    categoryNames,
    envelopePerformance,
    debtPaymentBreakdown,
  });

  // 7. Cashflow series (day buckets) over the period's date range.
  const cashflow = buildCashflow(
    periodTxns,
    period.startDate.slice(0, 10),
    period.endDate.slice(0, 10),
    "day",
  );

  // 8. MoM deltas vs the previous (older) period. Periods are most-recent-first,
  //    so the older period is at selectedIndex + 1.
  const prevPeriod = periods[selectedIndex + 1];
  const deltas = computeDeltas(report, prevPeriod ? scopeToPeriod(txns, prevPeriod) : null);

  // 9. Yearly / financial-year view: build YearlyReport.
  if (view === "year" || view === "fy") {
    const nowDate = new Date(now);
    // Default year: current calendar year (or FY ending year).
    const selectedYear =
      opts.year ??
      (view === "fy"
        ? // FY ending year: if we're in Jul-Dec, the FY ending year = next calendar year;
          // if Jan-Jun, it's the current calendar year.
          nowDate.getUTCMonth() >= 6
          ? nowDate.getUTCFullYear() + 1
          : nowDate.getUTCFullYear()
        : nowDate.getUTCFullYear());

    // Prior-year txns for YoY comparison.
    // Calendar: prior year = selectedYear - 1 (Jan–Dec).
    // FY: prior year ending = selectedYear - 1 (Jul–Jun window).
    const priorYear = selectedYear - 1;
    const previousYearTxns = view === "fy"
      ? txns.filter((tx) => {
          const at = tx.settledAt ?? tx.createdAt;
          const fyStart = `${priorYear - 1}-07-01T00:00:00.000Z`;
          const fyEnd = `${priorYear}-06-30T23:59:59.999Z`;
          return at >= fyStart && at <= fyEnd;
        })
      : txns.filter((tx) => {
          const at = tx.settledAt ?? tx.createdAt;
          return at.startsWith(`${priorYear}-`);
        });

    const yearlyReport = buildYearlyReport(txns, selectedYear, {
      isFinancialYear: view === "fy",
      now,
      categoryNames,
      previousYearTxns: previousYearTxns.length > 0 ? previousYearTxns : undefined,
    });

    return { view, periods, selectedIndex, report, cashflow, deltas, yearlyReport, selectedYear };
  }

  return { view, periods, selectedIndex, report, cashflow, deltas };
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

  // One pass over the join table → tag ids grouped by transaction id.
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

/** Filter txns whose period date (settledAt ?? createdAt) falls within the period. */
function scopeToPeriod(txns: ReportTxn[], period: SalaryPeriod): ReportTxn[] {
  const start = period.startDate;
  const end = period.endDate;
  return txns.filter((tx) => {
    const at = tx.settledAt ?? tx.createdAt;
    return at >= start && at <= end;
  });
}

/**
 * Envelope performance from SAVER accounts. allocatedCents prefers the stored
 * budget_allocations row for the period's month; otherwise the account's
 * monthlyAllocationCents. spentCents = absolute expense outflows from the saver
 * account within the period.
 */
function loadEnvelopePerformance(
  db: DbClient,
  month: string,
  period: SalaryPeriod,
): EnvelopePerformanceItem[] {
  const saverAccounts = db
    .select({
      id: tables.accounts.id,
      name: tables.accounts.name,
      monthlyAllocationCents: tables.accounts.monthlyAllocationCents,
    })
    .from(tables.accounts)
    .where(eq(tables.accounts.role, "SAVER"))
    .all();

  if (saverAccounts.length === 0) return [];

  const saverIds = saverAccounts.map((a) => a.id);

  // Stored allocations for this month, keyed by accountId.
  const allocRows = db
    .select({
      accountId: tables.budgetAllocations.accountId,
      allocatedCents: tables.budgetAllocations.allocatedCents,
    })
    .from(tables.budgetAllocations)
    .where(
      and(
        eq(tables.budgetAllocations.month, month),
        inArray(tables.budgetAllocations.accountId, saverIds),
      ),
    )
    .all();
  const allocByAccount = new Map(allocRows.map((r) => [r.accountId, r.allocatedCents]));

  // Period-scoped spending (expense outflows) per saver account.
  const spendRows = db
    .select({
      accountId: tables.transactions.accountId,
      amountCents: tables.transactions.amountCents,
      isTransfer: tables.transactions.isTransfer,
      settledAt: tables.transactions.settledAt,
      createdAt: tables.transactions.createdAt,
    })
    .from(tables.transactions)
    .where(inArray(tables.transactions.accountId, saverIds))
    .all();

  const spentByAccount = new Map<string, number>();
  for (const r of spendRows) {
    if (r.isTransfer) continue;
    if (r.amountCents >= 0) continue;
    const at = r.settledAt ?? r.createdAt;
    if (at < period.startDate || at > period.endDate) continue;
    spentByAccount.set(r.accountId, (spentByAccount.get(r.accountId) ?? 0) + Math.abs(r.amountCents));
  }

  return saverAccounts.map((a) => {
    const allocatedCents = allocByAccount.get(a.id) ?? a.monthlyAllocationCents;
    const spentCents = spentByAccount.get(a.id) ?? 0;
    const varianceCents = allocatedCents - spentCents;
    const variancePercentage = allocatedCents > 0 ? (varianceCents / allocatedCents) * 100 : 0;
    return {
      saverId: a.id,
      saverName: a.name,
      allocatedCents,
      spentCents,
      varianceCents,
      variancePercentage,
    };
  });
}

/**
 * Debt payment breakdown for the period: debt_payments whose paymentDate falls
 * within [period.start, period.end], grouped by debt. isAutoTracked is true when
 * the payment is linked to a bank transaction (transactionId set).
 */
async function loadDebtPaymentBreakdown(
  db: DbClient,
  period: SalaryPeriod,
): Promise<DebtPaymentBreakdownItem[]> {
  const debts = await new DrizzleDebtRepo(db).list();
  if (debts.length === 0) return [];
  const debtNameById = new Map(debts.map((d) => [d.id, d.name]));

  const payments = db
    .select({
      debtId: tables.debtPayments.debtId,
      amountCents: tables.debtPayments.amountCents,
      transactionId: tables.debtPayments.transactionId,
      paymentDate: tables.debtPayments.paymentDate,
    })
    .from(tables.debtPayments)
    .all();

  const byDebt = new Map<string, { amountCents: number; isAutoTracked: boolean }>();
  for (const p of payments) {
    if (p.paymentDate < period.startDate || p.paymentDate > period.endDate) continue;
    const entry = byDebt.get(p.debtId) ?? { amountCents: 0, isAutoTracked: false };
    entry.amountCents += p.amountCents;
    if (p.transactionId != null) entry.isAutoTracked = true;
    byDebt.set(p.debtId, entry);
  }

  return Array.from(byDebt.entries()).map(([debtId, v]) => ({
    debtId,
    debtName: debtNameById.get(debtId) ?? "Debt",
    amountCents: v.amountCents,
    isAutoTracked: v.isAutoTracked,
  }));
}

/** MoM deltas of the selected report vs the previous period's totals. */
function computeDeltas(report: MonthlyReport, prevTxns: ReportTxn[] | null): ReportsDeltas {
  if (prevTxns === null) {
    const flat: MoMDelta = { changePct: null, direction: "flat" };
    return { income: flat, expense: flat, net: flat };
  }
  const prevIncome = prevTxns
    .filter((t) => t.amountCents > 0 && !t.isTransfer)
    .reduce((s, t) => s + t.amountCents, 0);
  const prevExpense = prevTxns
    .filter((t) => t.amountCents < 0 && !t.isTransfer)
    .reduce((s, t) => s + Math.abs(t.amountCents), 0);
  const prevNet = prevIncome - prevExpense;
  return {
    income: momDelta(report.totalIncomeCents, prevIncome),
    expense: momDelta(report.totalExpensesCents, prevExpense),
    net: momDelta(report.netCents, prevNet),
  };
}

/** A zero, full-now-month period for the (rare) no-data case. */
function emptyPeriod(now: string): SalaryPeriod {
  const month = now.slice(0, 7);
  return {
    index: 0,
    startDate: `${month}-01T00:00:00.000Z`,
    endDate: now,
    salaryAmountCents: 0,
    salaryTransactionId: "",
    label: month,
  };
}
