"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Stat,
  Money,
  Button,
  Input,
} from "@upshot/ui";
import type { SalaryChangeResult } from "@upshot/core";
import { recomputeSalaryChangeAction } from "@/server-actions/forecast";

export interface SalaryChangePanelProps {
  /** Baseline current monthly income (cents) — prefills the field as dollars. */
  currentMonthlyIncomeCents: number;
}

/** Parse a dollar string to integer cents; null when not a valid non-negative amount. */
function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}

/** Percentage (already 0..100) to a 1-dp string. */
function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Salary-change simulator. Enter a new monthly income → recompute the income
 * change, savings-rate & DTI before/after, debt-payoff impact, and suggested
 * saver re-allocations. Client component: serialisable props only.
 */
export function SalaryChangePanel({
  currentMonthlyIncomeCents,
}: SalaryChangePanelProps) {
  const [amount, setAmount] = useState(
    (currentMonthlyIncomeCents / 100).toFixed(2),
  );
  const [result, setResult] = useState<SalaryChangeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const cents = dollarsToCents(amount);
    if (cents === null) {
      setError("Enter a valid amount.");
      return;
    }
    startTransition(async () => {
      const res = await recomputeSalaryChangeAction({
        newMonthlyIncomeCents: cents,
      });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setResult(res.data);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Card>
        <CardHeader>
          <CardTitle>Salary change — what if</CardTitle>
        </CardHeader>
        <CardBody>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 200 }}>
              <Input
                label="New monthly income"
                aria-label="New monthly income"
                mono
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={error ?? undefined}
              />
            </div>
            <Button size="md" onClick={submit} loading={pending}>
              Recalculate
            </Button>
          </div>
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Projected impact</CardTitle>
          </CardHeader>
          <CardBody>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 20,
              }}
            >
              <Stat
                label="Income change"
                value={
                  <Money
                    cents={result.incomeChangeCents}
                    kind={result.incomeChangeCents < 0 ? "expense" : "income"}
                  />
                }
                trend={`${result.incomeChangePct >= 0 ? "▲" : "▼"} ${pct(Math.abs(result.incomeChangePct))}`}
              />
              <Stat
                label="Savings rate"
                value={pct(result.projectedSavingsRate)}
                trend={`was ${pct(result.currentSavingsRate)}`}
              />
              <Stat
                label="Debt-to-income"
                value={pct(result.projectedDTI)}
                trend={`was ${pct(result.currentDTI)}`}
              />
              <Stat
                label="Extra monthly freedom"
                value={
                  <Money
                    cents={result.additionalMonthlyFreedomCents}
                    kind="saved"
                  />
                }
              />
            </div>

            {result.debtPayoffImpact && (
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: "1px solid var(--line)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 20,
                }}
              >
                <Stat
                  label="Months saved on debt"
                  value={String(result.debtPayoffImpact.monthsSaved)}
                />
                <Stat
                  label="Interest saved"
                  value={
                    <Money
                      cents={result.debtPayoffImpact.interestSavedCents}
                      kind="saved"
                    />
                  }
                />
                {result.debtPayoffImpact.newDebtFreeMonth && (
                  <Stat
                    label="Debt-free by"
                    value={result.debtPayoffImpact.newDebtFreeMonth}
                  />
                )}
              </div>
            )}

            {result.allocationSuggestions.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 8,
                  }}
                >
                  Suggested saver allocations
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Header */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr",
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
                    <span>Saver</span>
                    <span style={{ textAlign: "right" }}>Now</span>
                    <span style={{ textAlign: "right" }}>Suggested</span>
                    <span style={{ textAlign: "right" }}>Change</span>
                  </div>
                  {result.allocationSuggestions.map((s) => (
                    <div
                      key={s.saverId}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr",
                        gap: 8,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: "var(--text-2)" }}>{s.saverName}</span>
                      <span style={{ textAlign: "right" }}>
                        <Money cents={s.currentAllocationCents} kind="neutral" size={13} />
                      </span>
                      <span style={{ textAlign: "right" }}>
                        <Money cents={s.suggestedAllocationCents} kind="neutral" size={13} />
                      </span>
                      <span style={{ textAlign: "right" }}>
                        <Money
                          cents={s.changeCents}
                          kind={s.changeCents < 0 ? "expense" : "saved"}
                          size={13}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
