"use client";

import type { ReactElement } from "react";
import type { ScenarioInputs } from "@upshot/db";
import { UiSwitch, Segmented } from "@upshot/ui";
import { MoneyInput, SeedHint, addMonths, labelMonth } from "./planner-atoms";

export function IncomeBlock({
  inputs,
  incomeSeedCents,
  startMonth,
  onPatch,
}: {
  inputs: ScenarioInputs;
  incomeSeedCents: number;
  startMonth: string;
  onPatch: (p: Partial<ScenarioInputs>) => void;
}): ReactElement {
  void incomeSeedCents; // reserved for future SeedHint comparison logic
  const raise = inputs.raise;
  const m3 = addMonths(startMonth, 3);
  const m6 = addMonths(startMonth, 6);

  const toggle = (on: boolean): void => {
    if (on) onPatch({ raise: { toCents: inputs.baseIncomeCents + 50000, fromMonth: m3 } });
    else onPatch({ raise: null });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, color: "var(--text-2)" }}>Base monthly income</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MoneyInput
            valueCents={inputs.baseIncomeCents}
            onCents={(c) => onPatch({ baseIncomeCents: c })}
            width={150}
            suffix="/mo"
            aria-label="Base monthly income"
          />
          <SeedHint>detected from salary deposits</SeedHint>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "12px 0 0",
          borderTop: "1px solid var(--line-soft)",
        }}
      >
        <UiSwitch checked={raise != null} onCheckedChange={toggle} aria-label="Model a pay rise" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Model a pay rise</div>
          {raise ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 9,
                flexWrap: "wrap",
                fontSize: 12.5,
                color: "var(--text-2)",
              }}
            >
              <span>to</span>
              <MoneyInput
                valueCents={raise.toCents}
                onCents={(c) => onPatch({ raise: { ...raise, toCents: c } })}
                width={120}
                size="sm"
                aria-label="Raised income"
              />
              <span>from</span>
              <Segmented
                value={raise.fromMonth}
                onValueChange={(v) => onPatch({ raise: { ...raise, fromMonth: v } })}
                options={[
                  { value: m3, label: labelMonth(m3) },
                  { value: m6, label: labelMonth(m6) },
                ]}
                aria-label="Raise start month"
              />
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
              Off — modelling your current income
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
