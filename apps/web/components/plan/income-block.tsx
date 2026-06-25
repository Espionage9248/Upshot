"use client";

import type { ReactElement } from "react";
import type { ScenarioInputs } from "@upshot/db";
import { UiSwitch, Button, UiSlider } from "@upshot/ui";
import { MoneyInput, SeedHint, addMonths, diffMonths, labelMonth } from "./planner-atoms";

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

  const toggle = (on: boolean): void => {
    if (on) onPatch({ raise: { toCents: inputs.baseIncomeCents + 50000, fromMonth: m3, toDebtBps: inputs.toDebtShareBps } });
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
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 9 }}>
              {/* row 1: to <input> from <stepper> */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
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
                {(() => {
                  const minMonth = addMonths(startMonth, 1);
                  const maxMonth = addMonths(startMonth, 12);
                  const atMin = diffMonths(minMonth, raise.fromMonth) <= 0;
                  const atMax = diffMonths(raise.fromMonth, maxMonth) <= 0;
                  return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label="Earlier raise month"
                        disabled={atMin}
                        onClick={() => onPatch({ raise: { ...raise, fromMonth: addMonths(raise.fromMonth, -1) } })}
                        style={{ width: 34, padding: 0 }}
                      >
                        −
                      </Button>
                      <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, minWidth: 64, textAlign: "center" }}>
                        {labelMonth(raise.fromMonth)}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        leadingIcon="plus"
                        aria-label="Later raise month"
                        disabled={atMax}
                        onClick={() => onPatch({ raise: { ...raise, fromMonth: addMonths(raise.fromMonth, 1) } })}
                        style={{ width: 34, padding: 0 }}
                      />
                    </span>
                  );
                })()}
              </div>
              {/* row 2 (sibling): share-of-raise slider */}
              {inputs.mode === "FORWARD" && (() => {
                const raiseDeltaCents = Math.max(0, raise.toCents - inputs.baseIncomeCents);
                const raiseBps = raise.toDebtBps ?? inputs.toDebtShareBps;
                const raiseToDebtCents = Math.floor((raiseDeltaCents * raiseBps) / 10000);
                const pctRaise = Math.round(raiseBps / 100);
                return (
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: "var(--text-2)" }}>
                      <span>
                        Of your{" "}
                        <b className="tnum" style={{ fontFamily: "var(--font-mono)" }}>
                          ${Math.round(raiseDeltaCents / 100).toLocaleString()}
                        </b>
                        /mo raise, send {pctRaise}% to debt
                      </span>
                      <span className="tnum" style={{ fontFamily: "var(--font-mono)", color: "var(--coral-text)", fontWeight: 700 }}>
                        +${Math.round(raiseToDebtCents / 100).toLocaleString()}
                      </span>
                    </div>
                    <UiSlider
                      value={[pctRaise]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => onPatch({ raise: { ...raise, toDebtBps: (v ?? 0) * 100 } })}
                      aria-label="Share of pay rise toward debt"
                    />
                  </div>
                );
              })()}
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
