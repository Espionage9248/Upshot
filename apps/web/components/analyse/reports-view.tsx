"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Stat,
  Money,
  CashflowChart,
  CategoryDonut,
  MoneyFlowSankey,
  InsightCard,
  EmptyState,
  UiSelect,
  type UiSelectOption,
  type UIconKey,
} from "@upshot/ui";
import type { ReportsData } from "@/app/(app)/analyse/data";
import type { YearlyMonth } from "@upshot/core";
import { exportReportCsvAction } from "@/server-actions/export";
import { ExportButton, PrintButton } from "@/components/export-button";

/** Map a MoM delta to a short, AUS-spelt trend label. */
function deltaLabel(delta: ReportsData["deltas"]["income"]): string {
  if (delta.changePct === null) return "no prior period";
  const arrow = delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "–";
  return `${arrow} ${Math.abs(delta.changePct).toFixed(0)}% vs last period`;
}

/**
 * Expense-specific MoM delta: same text as deltaLabel, but coloured to
 * signal up = unfavourable (warn) and down = favourable (income-toned).
 * Returns a ReactNode so Stat can render inline styling without a trendKind prop.
 */
function expenseDeltaNode(delta: ReportsData["deltas"]["expense"]): React.ReactNode {
  const text = deltaLabel(delta);
  if (delta.changePct === null || delta.direction === "flat") return text;
  const color =
    delta.direction === "up"
      ? "var(--expense)"   // increase = unfavourable
      : "var(--income)";  // decrease = favourable
  return <span style={{ color }}>{text}</span>;
}

/**
 * YoY label helper for the yearly view.
 */
function yoyLabel(pct: number): string {
  const arrow = pct > 0 ? "▲" : pct < 0 ? "▼" : "–";
  return `${arrow} ${Math.abs(pct).toFixed(0)}% vs prior year`;
}

/** YoY expense node: increase = warn, decrease = good. */
function yoyExpenseNode(pct: number): React.ReactNode {
  const text = yoyLabel(pct);
  const color = pct > 0 ? "var(--expense)" : pct < 0 ? "var(--income)" : undefined;
  return color ? <span style={{ color }}>{text}</span> : text;
}

/** Insight type → icon key. */
const INSIGHT_ICON: Record<"warning" | "positive" | "info", UIconKey> = {
  warning: "alert",
  positive: "sparkle",
  info: "dot",
};

// ---------------------------------------------------------------------------
// Yearly view helpers
// ---------------------------------------------------------------------------

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabel(ym: string): string {
  const m = Number(ym.slice(5, 7)) - 1;
  return MONTH_LABELS[m] ?? ym;
}

/** Map YearlyMonth to the CashflowChart's CashflowPoint shape. */
function monthToChartPoint(m: YearlyMonth) {
  return {
    date: `${m.month}-01`,
    incomeCents: m.incomeCents,
    expenseCents: m.expensesCents,
    netCents: m.netCents,
  };
}

// ---------------------------------------------------------------------------
// View-mode constants
// ---------------------------------------------------------------------------

const VIEW_OPTIONS: UiSelectOption[] = [
  { value: "month", label: "Pay period" },
  { value: "year", label: "Calendar year" },
  { value: "fy", label: "Financial year" },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ReportsView({ data }: { data: ReportsData }) {
  const router = useRouter();
  const { report, cashflow, deltas, periods, selectedIndex, view, yearlyReport, selectedYear } =
    data;

  const periodOptions: UiSelectOption[] = periods.map((p) => ({
    value: String(p.index),
    label: p.label,
  }));

  const donutSlices = report.categoryBreakdown.map((c) => ({
    label: c.categoryName,
    valueCents: c.totalCents,
  }));

  // Sankey: income source → expense category sinks + a "saved" sink (net, when positive).
  const savedCents = report.netCents > 0 ? report.netCents : 0;

  const hasData = report.totalIncomeCents > 0 || report.totalExpensesCents > 0;

  // Derive available years for the year selector (last 5 calendar years).
  const nowYear = new Date().getUTCFullYear();
  const yearOptions: UiSelectOption[] = Array.from({ length: 5 }, (_, i) => {
    const y = nowYear - i;
    return { value: String(y), label: String(y) };
  });
  // FY options: FY ending year, last 5.
  const fyOptions: UiSelectOption[] = Array.from({ length: 5 }, (_, i) => {
    const y = nowYear - i;
    return { value: String(y), label: `FY${y}` };
  });

  function onViewChange(v: string) {
    // When switching to year/fy, default to current year; preserve period for month.
    if (v === "month") {
      router.push(`/analyse?view=month&period=${selectedIndex}`);
    } else if (v === "year") {
      router.push(`/analyse?view=year&year=${selectedYear ?? nowYear}`);
    } else {
      router.push(`/analyse?view=fy&year=${selectedYear ?? nowYear}`);
    }
  }

  function onYearChange(y: string) {
    router.push(`/analyse?view=${view}&year=${y}`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* View-mode selector + period/year switcher */}
      <Card>
        <CardHeader>
          <CardTitle>Report mode</CardTitle>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ minWidth: 200 }}>
              <UiSelect
                aria-label="Select report mode"
                value={view}
                options={VIEW_OPTIONS}
                onValueChange={onViewChange}
              />
            </div>
            {view === "month" && (
              <div style={{ minWidth: 220 }}>
                <UiSelect
                  aria-label="Select pay period"
                  value={String(selectedIndex)}
                  options={periodOptions}
                  onValueChange={(v) => router.push(`/analyse?view=month&period=${v}`)}
                />
              </div>
            )}
            {view === "year" && (
              <div style={{ minWidth: 120 }}>
                <UiSelect
                  aria-label="Select year"
                  value={String(selectedYear ?? nowYear)}
                  options={yearOptions}
                  onValueChange={onYearChange}
                />
              </div>
            )}
            {view === "fy" && (
              <div style={{ minWidth: 140 }}>
                <UiSelect
                  aria-label="Select financial year"
                  value={String(selectedYear ?? nowYear)}
                  options={fyOptions}
                  onValueChange={onYearChange}
                />
              </div>
            )}
            <ExportButton
              onExport={() =>
                exportReportCsvAction({
                  view,
                  periodIndex: selectedIndex,
                  year: selectedYear,
                })
              }
            />
            <PrintButton />
          </div>
        </CardHeader>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* MONTHLY VIEW                                                          */}
      {/* ------------------------------------------------------------------ */}
      {view === "month" && (
        <>
          {!hasData ? (
            <Card>
              <CardBody>
                <EmptyState
                  icon="trend"
                  title="No activity this period"
                  hint="Once transactions land in this pay period, your income, spending and category breakdown will appear here."
                />
              </CardBody>
            </Card>
          ) : (
            <>
              {/* Headline stats with MoM deltas */}
              <Card>
                <CardBody>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: 20,
                    }}
                  >
                    <Stat
                      label="Income"
                      value={<Money cents={report.totalIncomeCents} kind="income" />}
                      trend={deltaLabel(deltas.income)}
                    />
                    {/* Expenses: an increase is unfavourable — warn-toned delta node */}
                    <Stat
                      label="Expenses"
                      value={<Money cents={report.totalExpensesCents} kind="expense" />}
                      trend={expenseDeltaNode(deltas.expense)}
                    />
                    <Stat
                      label="Net"
                      value={<Money cents={report.netCents} kind={report.netCents < 0 ? "debt" : "saved"} />}
                      trend={deltaLabel(deltas.net)}
                    />
                    <Stat
                      label="Savings rate"
                      value={`${(report.savingsRate * 100).toFixed(0)}%`}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Cashflow over the period */}
              <Card>
                <CardHeader>
                  <CardTitle>Cashflow</CardTitle>
                </CardHeader>
                <CardBody>
                  {cashflow.length > 0 ? (
                    <CashflowChart points={cashflow} />
                  ) : (
                    <EmptyState icon="trend" title="No daily cashflow yet" />
                  )}
                </CardBody>
              </Card>

              {/* Category breakdown donut */}
              <Card>
                <CardHeader>
                  <CardTitle>Where it went</CardTitle>
                </CardHeader>
                <CardBody>
                  {donutSlices.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
                      <CategoryDonut slices={donutSlices} />
                      <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 6 }}>
                        {report.categoryBreakdown.map((c) => (
                          <div
                            key={c.categoryName}
                            style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
                          >
                            <span style={{ color: "var(--text-2)" }}>{c.categoryName}</span>
                            <Money cents={c.totalCents} kind="expense" size={13} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState icon="wallet" title="No categorised spending this period" />
                  )}
                </CardBody>
              </Card>

              {/* Money flow */}
              <Card>
                <CardHeader>
                  <CardTitle>Money flow</CardTitle>
                </CardHeader>
                <CardBody>
                  <MoneyFlowSankey
                    incomeCents={report.totalIncomeCents}
                    categories={donutSlices}
                    savedCents={savedCents}
                  />
                </CardBody>
              </Card>

              {/* Envelope performance */}
              {report.envelopePerformance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Saver envelopes</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {report.envelopePerformance.map((e) => (
                        <div
                          key={e.saverId}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 13,
                          }}
                        >
                          <span style={{ color: "var(--text-2)" }}>{e.saverName}</span>
                          <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <span style={{ color: "var(--text-3)", fontSize: 12 }}>
                              <Money cents={e.spentCents} kind="expense" size={12} quiet /> of{" "}
                              <Money cents={e.allocatedCents} kind="neutral" size={12} quiet />
                            </span>
                            <Money
                              cents={e.varianceCents}
                              kind={e.varianceCents < 0 ? "debt" : "saved"}
                              size={13}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Debt payments */}
              {report.debtPaymentBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Debt payments</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {report.debtPaymentBreakdown.map((d) => (
                        <div
                          key={d.debtId}
                          style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
                        >
                          <span style={{ color: "var(--text-2)" }}>{d.debtName}</span>
                          <Money cents={d.amountCents} kind="debt" size={13} />
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Insights */}
              {report.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Insights</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {report.insights.map((ins, i) => (
                        <InsightCard key={i} icon={INSIGHT_ICON[ins.type]}>
                          {ins.message}
                        </InsightCard>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* YEARLY / FINANCIAL-YEAR VIEW                                          */}
      {/* ------------------------------------------------------------------ */}
      {(view === "year" || view === "fy") && yearlyReport && (
        <>
          {yearlyReport.totalIncomeCents === 0 && yearlyReport.totalExpensesCents === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  icon="trend"
                  title="No activity this period"
                  hint="Once transactions are recorded for this year, your income, spending and trends will appear here."
                />
              </CardBody>
            </Card>
          ) : (
            <>
              {/* Headline stats with YoY deltas */}
              <Card>
                <CardBody>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: 20,
                    }}
                  >
                    <Stat
                      label="Total income"
                      value={<Money cents={yearlyReport.totalIncomeCents} kind="income" />}
                      trend={
                        yearlyReport.previousYearComparison
                          ? yoyLabel(yearlyReport.previousYearComparison.incomeChangePct)
                          : "no prior year"
                      }
                    />
                    {/* Expenses: increase = unfavourable — warn-toned node */}
                    <Stat
                      label="Total expenses"
                      value={<Money cents={yearlyReport.totalExpensesCents} kind="expense" />}
                      trend={
                        yearlyReport.previousYearComparison
                          ? yoyExpenseNode(yearlyReport.previousYearComparison.expenseChangePct)
                          : "no prior year"
                      }
                    />
                    <Stat
                      label="Net"
                      value={
                        <Money
                          cents={yearlyReport.netCents}
                          kind={yearlyReport.netCents < 0 ? "debt" : "saved"}
                        />
                      }
                      trend={
                        yearlyReport.previousYearComparison
                          ? (() => {
                              const nc = yearlyReport.previousYearComparison.netChangeCents;
                              const arrow = nc > 0 ? "▲" : nc < 0 ? "▼" : "–";
                              return `${arrow} $${(Math.abs(nc) / 100).toFixed(0)} vs prior year`;
                            })()
                          : "no prior year"
                      }
                    />
                    <Stat
                      label="Monthly avg income"
                      value={<Money cents={yearlyReport.averageMonthlyIncomeCents} kind="income" />}
                    />
                    <Stat
                      label="Monthly avg expenses"
                      value={<Money cents={yearlyReport.averageMonthlyExpensesCents} kind="expense" />}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Monthly breakdown chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly cashflow</CardTitle>
                </CardHeader>
                <CardBody>
                  <CashflowChart points={yearlyReport.monthlyBreakdown.map(monthToChartPoint)} />
                </CardBody>
              </Card>

              {/* Monthly breakdown table */}
              <Card>
                <CardHeader>
                  <CardTitle>Month by month</CardTitle>
                </CardHeader>
                <CardBody>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {/* Header */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "80px 1fr 1fr 1fr",
                        gap: 8,
                        fontSize: 11,
                        color: "var(--text-3)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        paddingBottom: 4,
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <span>Month</span>
                      <span style={{ textAlign: "right" }}>Income</span>
                      <span style={{ textAlign: "right" }}>Expenses</span>
                      <span style={{ textAlign: "right" }}>Net</span>
                    </div>
                    {yearlyReport.monthlyBreakdown.map((m) => {
                      const hasActivity = m.incomeCents > 0 || m.expensesCents > 0;
                      return (
                        <div
                          key={m.month}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "80px 1fr 1fr 1fr",
                            gap: 8,
                            fontSize: 13,
                            opacity: hasActivity ? 1 : 0.35,
                          }}
                        >
                          <span style={{ color: "var(--text-2)" }}>{monthLabel(m.month)}</span>
                          <span style={{ textAlign: "right" }}>
                            {hasActivity ? <Money cents={m.incomeCents} kind="income" size={13} /> : <span style={{ color: "var(--text-3)" }}>—</span>}
                          </span>
                          <span style={{ textAlign: "right" }}>
                            {hasActivity ? <Money cents={m.expensesCents} kind="expense" size={13} /> : <span style={{ color: "var(--text-3)" }}>—</span>}
                          </span>
                          <span style={{ textAlign: "right" }}>
                            {hasActivity ? (
                              <Money cents={m.netCents} kind={m.netCents < 0 ? "debt" : "saved"} size={13} />
                            ) : (
                              <span style={{ color: "var(--text-3)" }}>—</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>

              {/* Category breakdown */}
              {yearlyReport.categoryBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Where it went</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
                      <CategoryDonut
                        slices={yearlyReport.categoryBreakdown.map((c) => ({
                          label: c.categoryName,
                          valueCents: c.totalCents,
                        }))}
                      />
                      <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 6 }}>
                        {yearlyReport.categoryBreakdown.map((c) => (
                          <div
                            key={c.categoryName}
                            style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
                          >
                            <span style={{ color: "var(--text-2)" }}>{c.categoryName}</span>
                            <Money cents={c.totalCents} kind="expense" size={13} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Insights */}
              {yearlyReport.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Insights</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {yearlyReport.insights.map((ins, i) => (
                        <InsightCard key={i} icon={INSIGHT_ICON[ins.type]}>
                          {ins.message}
                        </InsightCard>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
