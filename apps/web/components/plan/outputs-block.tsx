"use client";

import type { ReactElement } from "react";
import { Money } from "@upshot/ui";
import { PlannerLabel, labelMonth } from "./planner-atoms";

const MONO = "var(--font-mono)";

export function OutputsBlock({
  scenarioDebtFreeMonth,
  baselineDebtFreeMonth,
  monthsSaved,
  interestSavedCents,
}: {
  scenarioDebtFreeMonth: string | null;
  baselineDebtFreeMonth: string | null;
  monthsSaved: number;
  interestSavedCents: number;
}): ReactElement {
  const free = scenarioDebtFreeMonth ? labelMonth(scenarioDebtFreeMonth) : "—";
  const base = baselineDebtFreeMonth ? labelMonth(baselineDebtFreeMonth) : "—";
  return (
    <div>
      <PlannerLabel style={{ marginBottom: 10 }}>If you commit to this</PlannerLabel>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span className="tnum" style={{ fontSize: 40, fontWeight: 700, fontFamily: MONO, letterSpacing: "-0.03em", color: "var(--coral-text)" }}>
          {free}
        </span>
        <span style={{ fontSize: 13, color: "var(--text-3)" }}>debt-free</span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
        vs <span style={{ textDecoration: "line-through" }}>{base}</span> doing nothing
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <div style={{ flex: 1, padding: "12px 14px", borderRadius: "var(--radius-data)", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span className="tnum" style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO, color: "var(--income)" }}>{monthsSaved}</span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>mo</span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>sooner</div>
        </div>
        <div style={{ flex: 1, padding: "12px 14px", borderRadius: "var(--radius-data)", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          <Money cents={interestSavedCents} kind="saved" size={20} weight={700} showCents={false} />
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>interest saved</div>
        </div>
      </div>
    </div>
  );
}
