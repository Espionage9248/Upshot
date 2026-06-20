import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle, Badge, Money, UiProgress, EmptyState } from "@upshot/ui";
import type { DebtsData, DebtRow } from "@/app/(app)/plan/debts/data";
import type { SnowballAnalysis } from "@upshot/core";
import { DebtFormDialog } from "./debt-form-dialog";

function payoffMonthForDebt(analysis: SnowballAnalysis, debtId: string): string | null {
  const schedule = analysis.schedules.find((s) => s.debtId === debtId);
  return schedule?.payoffMonth ?? null;
}

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

function utilisationTone(u: number): "saved" | "warn" | "neutral" {
  if (u > 0.8) return "warn";
  if (u > 0.5) return "neutral";
  return "saved";
}

function DebtCard({
  row,
  utilisation,
  analysis,
}: {
  row: DebtRow;
  utilisation: number | null;
  analysis: SnowballAnalysis;
}): ReactNode {
  const payoffMonth = payoffMonthForDebt(analysis, row.id);
  const utilisationPct = utilisation !== null ? Math.round(utilisation * 100) : null;

  return (
    <Link href={`/plan/debts/${row.id}`} style={{ textDecoration: "none" }}>
      <Card>
        <CardHeader>
          <CardTitle>{row.name}</CardTitle>
          {row.type && (
            <Badge tone="neutral">
              {row.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          )}
        </CardHeader>
        <CardBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {/* Balance row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <Money cents={row.currentBalanceCents} kind="expense" size={18} weight={700} />
              {row.monthlyPaymentCents > 0 && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--text-3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Money cents={row.monthlyPaymentCents} kind="neutral" size={12} />/mo
                </span>
              )}
            </div>

            {/* Utilisation bar — credit cards / overdrafts with a limit */}
            {utilisation !== null && (
              <div>
                <UiProgress
                  value={utilisationPct ?? 0}
                  max={100}
                  aria-label={`Credit utilisation ${utilisationPct}%`}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: utilisationTone(utilisation) === "warn" ? "var(--warn)" : "var(--text-3)",
                    marginTop: 3,
                  }}
                >
                  <span>{utilisationPct}% used</span>
                  {row.creditLimitCents && (
                    <span>
                      limit <Money cents={row.creditLimitCents} kind="neutral" size={11} />
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Payoff estimate */}
            {payoffMonth && (
              <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                Estimated payoff{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>
                  {formatMonth(payoffMonth)}
                </span>
              </div>
            )}

            {/* Interest rate */}
            {row.interestRate !== null && (
              <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                {(row.interestRate * 100).toFixed(2)}% p.a.
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

export function DebtList({ data }: { data: DebtsData }): ReactNode {
  return (
    <section aria-label="Debts">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <DebtFormDialog />
      </div>
      {data.debts.length === 0 ? (
        <EmptyState
          icon="card"
          title="No debts tracked"
          hint="Add a debt to start tracking your payoff progress."
          action={<DebtFormDialog />}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {data.debts.map(({ row, utilisation }) => (
            <DebtCard
              key={row.id}
              row={row}
              utilisation={utilisation}
              analysis={data.analysis}
            />
          ))}
        </div>
      )}
    </section>
  );
}
