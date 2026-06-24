"use client";

import type { ReactElement } from "react";
import type { ScenarioInputs } from "@upshot/db";
import { Segmented, UIcon } from "@upshot/ui";
import { MoneyInput, addMonths, labelMonth } from "./planner-atoms";

type Lump = ScenarioInputs["lumpSums"][number];

export function LumpsBlock({
  inputs,
  startMonth,
  onPatch,
}: {
  inputs: ScenarioInputs;
  startMonth: string;
  onPatch: (p: Partial<ScenarioInputs>) => void;
}): ReactElement {
  const lumps = inputs.lumpSums;
  const monthOpts = [3, 6, 9, 12].map((n) => {
    const ym = addMonths(startMonth, n);
    return { value: ym, label: labelMonth(ym) };
  });

  const add = (): void => onPatch({ lumpSums: [...lumps, { amountCents: 100000, month: addMonths(startMonth, 6), targetDebtId: null }] });
  const remove = (i: number): void => onPatch({ lumpSums: lumps.filter((_, j) => j !== i) });
  const patchAt = (i: number, next: Partial<Lump>): void => onPatch({ lumpSums: lumps.map((l, j) => (j === i ? { ...l, ...next } : l)) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {lumps.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>No one-off payments yet — a tax refund or bonus shortens the curve.</div>
      )}
      {lumps.map((l, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: "var(--radius-data)", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          <span style={{ color: "var(--coral-text)", display: "flex" }}>
            <UIcon name="flame" size={16} />
          </span>
          <MoneyInput valueCents={l.amountCents} onCents={(c) => patchAt(i, { amountCents: c })} width={104} size="sm" aria-label="One-off payment amount" />
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>in</span>
          <Segmented value={l.month} onValueChange={(v) => patchAt(i, { month: v })} options={monthOpts} aria-label="One-off payment month" />
          <div style={{ flex: 1 }} />
          <button type="button" onClick={() => remove(i)} aria-label="Remove one-off payment" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4, display: "flex" }}>
            <UIcon name="x" size={15} />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} style={{ display: "inline-flex", alignItems: "center", gap: 7, alignSelf: "flex-start", background: "none", border: "none", color: "var(--coral-text)", cursor: "pointer", fontSize: 12.5, fontWeight: 700, padding: "4px 0" }}>
        <UIcon name="plus" size={15} /> Add a one-off payment
      </button>
    </div>
  );
}
