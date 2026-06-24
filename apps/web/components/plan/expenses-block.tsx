"use client";

import type { ReactElement } from "react";
import type { ScenarioInputs } from "@upshot/db";
import { Money } from "@upshot/ui";
import { MoneyInput, SeedHint } from "./planner-atoms";

type Recurring = { id: string; name: string; monthlyCents: number; kind: string };
type Edit = ScenarioInputs["recurringEdits"][number];

export function ExpensesBlock({
  inputs,
  recurring,
  discretionarySeedCents,
  onPatch,
}: {
  inputs: ScenarioInputs;
  recurring: Recurring[];
  discretionarySeedCents: number;
  onPatch: (p: Partial<ScenarioInputs>) => void;
}): ReactElement {
  void discretionarySeedCents; // reserved for future SeedHint comparison logic
  const editOf = (id: string): Edit =>
    inputs.recurringEdits.find((e) => e.id === id) ?? { id, keep: true, monthlyCentsOverride: null };

  const patchEdit = (id: string, next: Partial<Edit>): void => {
    const exists = inputs.recurringEdits.some((e) => e.id === id);
    const edits = exists
      ? inputs.recurringEdits.map((e) => (e.id === id ? { ...e, ...next } : e))
      : [...inputs.recurringEdits, { id, keep: true, monthlyCentsOverride: null, ...next }];
    onPatch({ recurringEdits: edits });
  };

  const keptCents =
    recurring.reduce((sum, r) => {
      const e = editOf(r.id);
      return e.keep ? sum + (e.monthlyCentsOverride ?? r.monthlyCents) : sum;
    }, 0) + inputs.discretionaryCents;

  return (
    <div>
      {recurring.map((r) => {
        const e = editOf(r.id);
        const amt = e.monthlyCentsOverride ?? r.monthlyCents;
        const cut = !e.keep;
        return (
          <div
            key={r.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: "1px solid var(--line-soft)",
              opacity: cut ? 0.5 : 1,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, textDecoration: cut ? "line-through" : "none" }}>
                {r.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>{r.kind.toLowerCase()}</div>
            </div>
            <MoneyInput
              valueCents={amt}
              onCents={(c) => patchEdit(r.id, { monthlyCentsOverride: c })}
              width={104}
              size="sm"
              disabled={cut}
              aria-label={`${r.name} amount`}
            />
            <button
              type="button"
              aria-label={`${cut ? "Keep" : "Cut"} ${r.name}`}
              onClick={() => patchEdit(r.id, { keep: cut })}
              style={{
                width: 64,
                height: 30,
                borderRadius: "var(--radius-data)",
                border: "1px solid var(--line)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                background: cut ? "color-mix(in oklch, var(--income) 14%, transparent)" : "var(--surface-2)",
                color: cut ? "var(--income)" : "var(--text-3)",
              }}
            >
              {cut ? "Cut ✓" : "Keep"}
            </button>
          </div>
        );
      })}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "11px 0",
          borderBottom: "1px solid var(--line-soft)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Everyday discretionary</div>
          <SeedHint>6-month average — edit it</SeedHint>
        </div>
        <MoneyInput
          valueCents={inputs.discretionaryCents}
          onCents={(c) => onPatch({ discretionaryCents: c })}
          width={104}
          size="sm"
          aria-label="Everyday discretionary"
        />
        <span style={{ width: 64 }} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          paddingTop: 12,
        }}
      >
        <span style={{ fontSize: 12.5, color: "var(--text-2)", fontWeight: 600 }}>Monthly spend kept</span>
        <Money cents={keptCents} kind="expense" size={15} weight={700} showCents={false} />
      </div>
    </div>
  );
}
