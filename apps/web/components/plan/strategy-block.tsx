"use client";

import type { ReactElement } from "react";
import type { ScenarioInputs } from "@upshot/db";
import { Segmented, UIcon } from "@upshot/ui";

const MONO = "var(--font-mono)";

type Debt = { id: string; name: string; interestRate: number | null; balanceCents: number; includeInSnowball: boolean };

const DESC: Record<ScenarioInputs["strategy"], string> = {
  SNOWBALL: "Smallest balance first — quick wins build momentum.",
  AVALANCHE: "Highest interest first — saves you the most money.",
  CUSTOM: "Your own order — rank which debt clears first.",
};

const STRATEGY_OPTIONS = [
  { value: "SNOWBALL", label: "Snowball" },
  { value: "AVALANCHE", label: "Avalanche" },
  { value: "CUSTOM", label: "Custom" },
];

/** Included debts in display order for the chosen strategy. */
export function orderedIncluded(debts: Debt[], strategy: ScenarioInputs["strategy"], customOrder: string[] | null): Debt[] {
  const included = debts.filter((d) => d.includeInSnowball);
  if (strategy === "SNOWBALL") return [...included].sort((a, b) => a.balanceCents - b.balanceCents);
  if (strategy === "AVALANCHE") return [...included].sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0));
  // CUSTOM
  if (!customOrder) return included;
  const byId = new Map(included.map((d) => [d.id, d]));
  const ordered = customOrder.map((id) => byId.get(id)).filter((d): d is Debt => Boolean(d));
  const seen = new Set(ordered.map((d) => d.id));
  for (const d of included) if (!seen.has(d.id)) ordered.push(d);
  return ordered;
}

function ReorderList({ inputs, debts, onPatch }: { inputs: ScenarioInputs; debts: Debt[]; onPatch: (p: Partial<ScenarioInputs>) => void }): ReactElement {
  const items = orderedIncluded(debts, "CUSTOM", inputs.customOrder);
  const ids = items.map((d) => d.id);
  const move = (i: number, dir: -1 | 1): void => {
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    // `move` already guards j in range, so non-null assertions are safe here.
    const a = next[i]!, b = next[j]!;
    next[i] = b; next[j] = a;
    onPatch({ customOrder: next });
  };
  return (
    <div role="list" aria-label="Custom payoff order" style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
      {items.map((d, i) => (
        <div key={d.id} role="listitem" style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: "var(--radius-data)", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          <span style={{ color: "var(--text-3)", cursor: "grab", display: "flex" }} aria-hidden="true">
            <UIcon name="drag" size={16} />
          </span>
          <span className="tnum" style={{ width: 18, height: 18, borderRadius: 6, background: "var(--coral-dim)", color: "var(--coral-text)", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO }}>
            {i + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
            <div className="tnum" style={{ fontSize: 11, color: "var(--text-3)", fontFamily: MONO }}>
              ${Math.round(d.balanceCents / 100).toLocaleString()} · {d.interestRate != null ? (d.interestRate * 100).toFixed(1) : "—"}% APR
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${d.name} up`} style={btn(i === 0)}>
              <UIcon name="up" size={12} active />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${d.name} down`} style={btn(i === items.length - 1)}>
              <UIcon name="down" size={12} active />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function btn(disabled: boolean): React.CSSProperties {
  return {
    width: 26,
    height: 18,
    borderRadius: 5,
    border: "1px solid var(--line)",
    background: "var(--surface)",
    color: "var(--text-2)",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.35 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

export function StrategyBlock({ inputs, debts, onPatch }: { inputs: ScenarioInputs; debts: Debt[]; onPatch: (p: Partial<ScenarioInputs>) => void }): ReactElement {
  return (
    <div>
      <Segmented
        options={STRATEGY_OPTIONS}
        value={inputs.strategy}
        onValueChange={(v) => onPatch({ strategy: v as ScenarioInputs["strategy"] })}
        aria-label="Payoff strategy"
        fullWidth
      />
      <div
        style={{
          minHeight: 80,
          transition: "opacity var(--duration-base) var(--ease-out)",
        }}
      >
        <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 10, lineHeight: 1.45 }}>{DESC[inputs.strategy]}</div>
        {inputs.strategy === "CUSTOM" ? (
          <ReorderList inputs={inputs} debts={debts} onPatch={onPatch} />
        ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
          {orderedIncluded(debts, inputs.strategy, inputs.customOrder).map((d, i) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
              <span className="tnum" style={{ width: 17, height: 17, borderRadius: 5, background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--text-3)", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO }}>
                {i + 1}
              </span>
              <span style={{ flex: 1, color: "var(--text-2)" }}>{d.name}</span>
              <span className="tnum" style={{ fontSize: 11.5, color: "var(--text-3)", fontFamily: MONO }}>
                {d.interestRate != null ? (d.interestRate * 100).toFixed(1) : "—"}%
              </span>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
