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
import type { ExpenseChangeResult, ExpenseChangeSaver } from "@upshot/core";
import { recomputeExpenseChangeAction } from "@/server-actions/forecast";

export interface ExpenseChangePanelProps {
  /** Baseline savers — each prefills a per-saver allocation input (dollars). */
  savers: ExpenseChangeSaver[];
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
 * Expense-change simulator. One allocation input per saver (prefilled from the
 * baseline) → recompute the new total allocated, monthly/yearly impact, and
 * savings-rate before/after. Client component: serialisable props only.
 */
export function ExpenseChangePanel({ savers }: ExpenseChangePanelProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      savers.map((s) => [s.saverId, (s.monthlyAllocationCents / 100).toFixed(2)]),
    ),
  );
  const [result, setResult] = useState<ExpenseChangeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const adjustments: { saverId: string; newAllocationCents: number }[] = [];
    for (const s of savers) {
      const cents = dollarsToCents(amounts[s.saverId] ?? "");
      if (cents === null) {
        setError(`Enter a valid amount for ${s.saverName}.`);
        return;
      }
      adjustments.push({ saverId: s.saverId, newAllocationCents: cents });
    }
    startTransition(async () => {
      const res = await recomputeExpenseChangeAction({ adjustments });
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
          <CardTitle>Expense change — what if</CardTitle>
        </CardHeader>
        <CardBody>
          {savers.length === 0 ? (
            <p style={{ color: "var(--text-2)", fontSize: 13 }}>
              No saver envelopes to adjust yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {savers.map((s) => (
                <div key={s.saverId} style={{ maxWidth: 320 }}>
                  <Input
                    label={s.saverName}
                    aria-label={s.saverName}
                    mono
                    inputMode="decimal"
                    value={amounts[s.saverId] ?? ""}
                    onChange={(e) =>
                      setAmounts((prev) => ({ ...prev, [s.saverId]: e.target.value }))
                    }
                  />
                </div>
              ))}
              {error && (
                <p style={{ color: "var(--expense)", fontSize: 13 }}>{error}</p>
              )}
              <div>
                <Button size="md" onClick={submit} loading={pending}>
                  Recalculate
                </Button>
              </div>
            </div>
          )}
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
                label="New total allocated"
                value={<Money cents={result.newTotalAllocatedCents} kind="neutral" />}
                trend={
                  <>
                    was <Money cents={result.currentTotalAllocatedCents} kind="neutral" size={12} quiet />
                  </>
                }
              />
              <Stat
                label="Monthly impact"
                value={
                  <Money
                    cents={result.monthlyImpactCents}
                    kind={result.monthlyImpactCents < 0 ? "expense" : "saved"}
                  />
                }
              />
              <Stat
                label="Yearly impact"
                value={
                  <Money
                    cents={result.yearlyImpactCents}
                    kind={result.yearlyImpactCents < 0 ? "expense" : "saved"}
                  />
                }
              />
              <Stat
                label="Savings rate"
                value={pct(result.projectedSavingsRate)}
                trend={`was ${pct(result.currentSavingsRate)}`}
              />
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
