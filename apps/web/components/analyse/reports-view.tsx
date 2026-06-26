"use client";

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

/** Map a MoM delta to a short, AUS-spelt trend label. */
function deltaLabel(delta: ReportsData["deltas"]["income"]): string {
  if (delta.changePct === null) return "no prior period";
  const arrow = delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "–";
  return `${arrow} ${Math.abs(delta.changePct).toFixed(0)}% vs last period`;
}

/** Insight type → icon key. */
const INSIGHT_ICON: Record<"warning" | "positive" | "info", UIconKey> = {
  warning: "alert",
  positive: "sparkle",
  info: "dot",
};

export function ReportsView({ data }: { data: ReportsData }) {
  const router = useRouter();
  const { report, cashflow, deltas, periods, selectedIndex } = data;

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Period switcher */}
      <Card>
        <CardHeader>
          <CardTitle>Pay period</CardTitle>
          <div style={{ minWidth: 220 }}>
            <UiSelect
              aria-label="Select pay period"
              value={String(selectedIndex)}
              options={periodOptions}
              onValueChange={(v) => router.push(`/analyse?period=${v}`)}
            />
          </div>
        </CardHeader>
      </Card>

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
                <Stat
                  label="Expenses"
                  value={<Money cents={report.totalExpensesCents} kind="expense" />}
                  trend={deltaLabel(deltas.expense)}
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
    </div>
  );
}
