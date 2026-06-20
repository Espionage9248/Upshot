import type { ReactNode } from "react";
import { Card, CardBody, CardHeader, CardTitle, Badge, Money, UiProgress } from "@upshot/ui";
import type { DebtDetailData } from "@/app/(app)/plan/debts/[id]/data";
import type { MonthlyPayment } from "@upshot/core";
import { WhatIfControl } from "./what-if-control";

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-AU", {
    month: "short",
    year: "numeric",
  });
}

function utilisationPct(balanceCents: number, limitCents: number | null): number | null {
  if (!limitCents || limitCents <= 0) return null;
  return Math.min(100, Math.round((balanceCents / limitCents) * 100));
}

function PaymentRow({ payment }: { payment: MonthlyPayment }): ReactNode {
  return (
    <tr>
      <td
        style={{
          padding: "6px 8px",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text-2)",
          whiteSpace: "nowrap",
        }}
      >
        {formatMonth(payment.month)}
      </td>
      <td style={{ padding: "6px 8px", textAlign: "right" }}>
        <Money cents={payment.paymentCents} kind="expense" size={12} />
      </td>
      <td style={{ padding: "6px 8px", textAlign: "right" }}>
        <Money cents={payment.principalCents} kind="neutral" size={12} />
      </td>
      <td style={{ padding: "6px 8px", textAlign: "right" }}>
        <Money cents={payment.interestCents} kind="expense" size={12} />
      </td>
      <td style={{ padding: "6px 8px", textAlign: "right" }}>
        <Money cents={payment.remainingBalanceCents} kind="neutral" size={12} />
      </td>
    </tr>
  );
}

/**
 * Debt detail: shows the debt's key stats, utilisation bar (if applicable),
 * payoff timeline table, and the what-if slider.
 * Presentational — data arrives via props; no DB/auth/hooks.
 */
export function DebtDetail({ data }: { data: DebtDetailData }): ReactNode {
  const { debt, schedule, analysis } = data;
  const utilPct = utilisationPct(debt.currentBalanceCents, debt.creditLimitCents ?? null);

  // Show at most 24 months of the breakdown to avoid a huge table.
  const shownMonths = schedule?.monthlyBreakdown.slice(0, 24) ?? [];
  const totalMonths = schedule?.monthlyBreakdown.length ?? 0;
  const truncated = totalMonths > 24;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Overview card */}
      <Card>
        <CardHeader>
          <CardTitle>{debt.name}</CardTitle>
          <Badge tone="neutral">
            {debt.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
          </Badge>
        </CardHeader>
        <CardBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>Balance</span>
                <Money cents={debt.currentBalanceCents} kind="expense" size={20} weight={700} />
              </div>
              {debt.monthlyPaymentCents > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>Monthly payment</span>
                  <Money cents={debt.monthlyPaymentCents} kind="neutral" size={16} weight={600} />
                </div>
              )}
              {debt.interestRate !== null && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>Interest rate</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {(debt.interestRate * 100).toFixed(2)}%
                  </span>
                </div>
              )}
              {schedule && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>Payoff</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-2)",
                    }}
                  >
                    {formatMonth(schedule.payoffMonth)}
                  </span>
                </div>
              )}
              {schedule && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>Total interest</span>
                  <Money cents={schedule.totalInterestCents} kind="expense" size={14} weight={600} />
                </div>
              )}
            </div>

            {/* Utilisation bar for credit-limited debts */}
            {utilPct !== null && (
              <div>
                <UiProgress
                  value={utilPct}
                  max={100}
                  aria-label={`Credit utilisation ${utilPct}%`}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: utilPct > 80 ? "var(--warn)" : "var(--text-3)",
                    marginTop: 3,
                  }}
                >
                  <span>{utilPct}% utilised</span>
                  {debt.creditLimitCents && (
                    <span>
                      of <Money cents={debt.creditLimitCents} kind="neutral" size={11} /> limit
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* What-if slider */}
      {debt.includeInSnowball && (
        <Card>
          <CardHeader>
            <CardTitle>What if I pay extra?</CardTitle>
          </CardHeader>
          <CardBody>
            <WhatIfControl baseAnalysis={analysis} />
          </CardBody>
        </Card>
      )}

      {/* Payoff timeline */}
      {shownMonths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payoff timeline</CardTitle>
          </CardHeader>
          <CardBody>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
                aria-label="Monthly payoff breakdown"
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--line)",
                      color: "var(--text-3)",
                      fontSize: 11,
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "4px 8px", fontWeight: 600 }}>Month</th>
                    <th style={{ padding: "4px 8px", fontWeight: 600, textAlign: "right" }}>Payment</th>
                    <th style={{ padding: "4px 8px", fontWeight: 600, textAlign: "right" }}>Principal</th>
                    <th style={{ padding: "4px 8px", fontWeight: 600, textAlign: "right" }}>Interest</th>
                    <th style={{ padding: "4px 8px", fontWeight: 600, textAlign: "right" }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {shownMonths.map((p) => (
                    <PaymentRow key={p.month} payment={p} />
                  ))}
                </tbody>
              </table>
              {truncated && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    textAlign: "center",
                    paddingTop: 8,
                  }}
                >
                  Showing first 24 of {totalMonths} months
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
