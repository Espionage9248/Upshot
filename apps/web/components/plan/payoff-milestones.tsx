"use client";

import type { ReactElement } from "react";
import { UIcon } from "@upshot/ui";
import { PlannerLabel, labelMonth } from "./planner-atoms";

const MONO = "var(--font-mono)";

function ramp(i: number): string {
  if (i === 0) return "var(--coral)";
  return `color-mix(in oklch, var(--coral) ${Math.max(28, 64 - i * 26)}%, var(--debt))`;
}

export function PayoffMilestones({
  orderedDebts,
  perDebt,
  strategyLabel,
}: {
  orderedDebts: { id: string; name: string; interestRate: number | null; balanceCents: number }[];
  perDebt: { id: string; clearedMonth: string | null }[];
  strategyLabel: string;
}): ReactElement {
  const total = orderedDebts.reduce((a, d) => a + d.balanceCents, 0) || 1;
  const clearedById = new Map(perDebt.map((p) => [p.id, p.clearedMonth]));

  return (
    <div style={{ borderRadius: "var(--radius-card)", border: "1px solid var(--line)", background: "var(--surface)", padding: 16 }}>
      <PlannerLabel style={{ marginBottom: 12 }}>Debt-free path · {strategyLabel} order</PlannerLabel>
      <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", gap: 2, marginBottom: 14 }}>
        {orderedDebts.map((d, i) => (
          <div key={d.id} title={d.name} style={{ flex: d.balanceCents / total, background: ramp(i) }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {orderedDebts.map((d, i) => {
          const cleared = clearedById.get(d.id) ?? null;
          return (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: ramp(i), flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {d.name}
              </span>
              <span className="tnum" style={{ fontSize: 11.5, color: "var(--text-3)", fontFamily: MONO }}>
                {d.interestRate != null ? (d.interestRate * 100).toFixed(1) : "—"}%
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--coral-text)", minWidth: 86, justifyContent: "flex-end" }}>
                <UIcon name="check" size={12} active />
                <span className="tnum" style={{ fontFamily: MONO }}>{cleared ? labelMonth(cleared) : "—"}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
