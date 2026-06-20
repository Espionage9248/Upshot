"use client";

import { useState, useTransition } from "react";
import { UiSlider, Money } from "@upshot/ui";
import { whatIfAction } from "@/server-actions/debts";
import type { SnowballAnalysis } from "@upshot/core";

interface WhatIfResult {
  withExtra: SnowballAnalysis;
  base: SnowballAnalysis;
  monthsSaved: number;
  interestSavedCents: number;
}

interface WhatIfControlProps {
  /** The base analysis (no extra payment) from the server. */
  baseAnalysis: SnowballAnalysis;
  /** Max extra payment to show on the slider (defaults to $500). */
  maxExtraDollars?: number;
}

function formatMonths(months: number): string {
  if (months === 0) return "—";
  if (months < 12) return `${months} mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

/**
 * What-if control — a slider that adjusts an extra monthly payment and
 * re-runs the snowball calculation to show months saved + interest saved.
 * Client island: calls whatIfAction (read-only, no DB writes).
 */
export function WhatIfControl({ baseAnalysis, maxExtraDollars = 500 }: WhatIfControlProps) {
  const [extraDollars, setExtraDollars] = useState(0);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [, startTransition] = useTransition();

  function handleSlider(values: number[]) {
    const dollars = values[0] ?? 0;
    setExtraDollars(dollars);

    if (dollars === 0) {
      setResult(null);
      return;
    }

    const extraCents = dollars * 100;
    startTransition(async () => {
      const res = await whatIfAction(extraCents);
      if (res.ok) {
        setResult(res.data);
      }
    });
  }

  const monthsSaved = result?.monthsSaved ?? 0;
  const interestSavedCents = result?.interestSavedCents ?? 0;
  const debtFreeMonth = result?.withExtra.debtFreeMonth ?? baseAnalysis.debtFreeMonth;

  return (
    <section
      aria-label="What-if extra payment"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
            Extra payment per month
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--coral)",
            }}
          >
            {extraDollars === 0 ? "$0" : (
              <Money cents={extraDollars * 100} kind="saved" size={14} weight={700} />
            )}
          </span>
        </div>
        <UiSlider
          value={[extraDollars]}
          onValueChange={handleSlider}
          min={0}
          max={maxExtraDollars}
          step={10}
          aria-label="Extra monthly payment"
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--text-3)",
            marginTop: 4,
          }}
        >
          <span>$0</span>
          <span>${maxExtraDollars}</span>
        </div>
      </div>

      {/* Result panel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          padding: "12px 16px",
          background: "var(--surface-2)",
          borderRadius: "var(--radius-card)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Months saved</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              fontWeight: 700,
              color: monthsSaved > 0 ? "var(--coral)" : "var(--text-3)",
            }}
          >
            {formatMonths(monthsSaved)}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Interest saved</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>
            {interestSavedCents > 0 ? (
              <Money cents={interestSavedCents} kind="saved" size={14} weight={700} />
            ) : (
              <span style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>$0</span>
            )}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Debt-free</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-2)",
            }}
          >
            {debtFreeMonth
              ? new Date(debtFreeMonth + "-01").toLocaleDateString("en-AU", {
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
        </div>
      </div>
    </section>
  );
}
