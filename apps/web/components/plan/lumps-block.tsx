"use client";

import type { ReactElement } from "react";
import type { ScenarioInputs } from "@upshot/db";
import { Button, UIcon } from "@upshot/ui";
import { MoneyInput, addMonths, diffMonths, labelMonth } from "./planner-atoms";

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
  const minMonth = addMonths(startMonth, 1);
  const maxMonth = addMonths(startMonth, 12);

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
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Button
              size="sm"
              variant="secondary"
              aria-label="Earlier one-off payment month"
              disabled={diffMonths(minMonth, l.month) <= 0}
              onClick={() => patchAt(i, { month: addMonths(l.month, -1) })}
              style={{ width: 30, padding: 0 }}
            >
              −
            </Button>
            <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 700, minWidth: 58, textAlign: "center" }}>
              {labelMonth(l.month)}
            </span>
            <Button
              size="sm"
              variant="secondary"
              leadingIcon="plus"
              aria-label="Later one-off payment month"
              disabled={diffMonths(l.month, maxMonth) <= 0}
              onClick={() => patchAt(i, { month: addMonths(l.month, 1) })}
              style={{ width: 30, padding: 0 }}
            />
          </span>
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
