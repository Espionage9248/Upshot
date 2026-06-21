"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Money, Segmented, Button } from "@upshot/ui";
import type { PlanningData } from "@/app/(app)/plan/debts/planning-data";
import type { ScenarioInputs } from "@upshot/db";
import {
  previewScenarioAction,
  savePlanningScenarioAction,
  lockPayoffPlanAction,
} from "@/server-actions/planner";
import { PayoffChart } from "./payoff-chart";

const MODE_OPTIONS = [
  { value: "FORWARD", label: "Set extra" },
  { value: "TARGET_DATE", label: "By target date" },
];

const STRATEGY_OPTIONS = [
  { value: "SNOWBALL", label: "Snowball" },
  { value: "AVALANCHE", label: "Avalanche" },
  { value: "CUSTOM", label: "Custom" },
];

function formatMonth(m: string | null): string {
  if (!m) return "—";
  return new Date(m + "-01").toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

/**
 * The included debts in the order the planner should show/use:
 * the explicit customOrder when present (filtered to current included debts,
 * with any newly-added debts appended), else the loaded debt order.
 */
function orderedIncludedDebts(
  debts: { id: string; name: string; includeInSnowball: boolean }[],
  customOrder: string[] | null,
): { id: string; name: string }[] {
  const included = debts.filter((d) => d.includeInSnowball);
  if (!customOrder) return included.map((d) => ({ id: d.id, name: d.name }));
  const byId = new Map(included.map((d) => [d.id, d]));
  const ordered = customOrder.map((id) => byId.get(id)).filter((d): d is typeof included[number] => Boolean(d));
  const seen = new Set(ordered.map((d) => d.id));
  for (const d of included) if (!seen.has(d.id)) ordered.push(d);
  return ordered.map((d) => ({ id: d.id, name: d.name }));
}

export function ScenarioPlanner({ data }: { data: PlanningData }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [inputs, setInputs] = useState<ScenarioInputs>(() => ({
    mode: "FORWARD",
    baseIncomeCents: data.incomeBaseSeedCents,
    raise: null,
    discretionaryCents: data.discretionarySeedCents,
    recurringEdits: data.recurring.map((r) => ({ id: r.id, keep: true, monthlyCentsOverride: null })),
    toDebtShareBps: 5000,
    strategy: data.strategy,
    customOrder: null,
    lumpSums: [],
    targetMonth: null,
  }));

  const [preview, setPreview] = useState<{
    scenario: { month: string; balanceCents: number }[];
    baseline: { month: string; balanceCents: number }[];
    scenarioDebtFree: string | null;
    baselineDebtFree: string | null;
    extraPaymentCents: number;
    achievable: boolean;
    interestSavedCents: number;
    monthsSaved: number;
  } | null>(null);

  // Debounced live preview.
  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await previewScenarioAction(inputs);
        if (!res.ok) return;
        const r = res.data;
        setPreview({
          scenario: r.scenario.curve,
          baseline: r.baseline.curve,
          scenarioDebtFree: r.scenario.debtFreeMonth,
          baselineDebtFree: r.baseline.debtFreeMonth,
          extraPaymentCents: r.extraPaymentCents,
          achievable: r.achievable,
          interestSavedCents: Math.max(0, r.baseline.totalInterestCents - r.scenario.totalInterestCents),
          monthsSaved: Math.max(0, r.baseline.monthsToPayoff - r.scenario.monthsToPayoff),
        });
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [inputs]);

  const expenseCents = useMemo(() => {
    const kept = inputs.recurringEdits
      .filter((e) => e.keep)
      .reduce((s, e) => s + (e.monthlyCentsOverride ?? data.recurring.find((r) => r.id === e.id)?.monthlyCents ?? 0), 0);
    return kept + inputs.discretionaryCents;
  }, [inputs, data.recurring]);

  function patch(p: Partial<ScenarioInputs>) {
    setInputs((prev) => ({ ...prev, ...p }));
  }

  // The included debts in their current planner order (for the CUSTOM reorder list).
  const customDebts = orderedIncludedDebts(data.debts, inputs.customOrder);

  // Move a debt up (dir=-1) or down (dir=+1) in the custom order, persisting the full order.
  function moveDebt(id: string, dir: -1 | 1) {
    const ids = customDebts.map((d) => d.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    patch({ customOrder: ids });
  }

  function onSave() {
    const name = window.prompt("Name this scenario");
    if (!name) return;
    startTransition(async () => {
      await savePlanningScenarioAction({ name, inputs });
      router.refresh();
    });
  }

  function onLock() {
    startTransition(async () => {
      await lockPayoffPlanAction(inputs);
      router.refresh();
    });
  }

  return (
    <section aria-label="Scenario planner" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "14px 16px", background: "var(--surface-2)", borderRadius: "var(--radius-card)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Scenario planner</span>
        <Segmented options={MODE_OPTIONS} value={inputs.mode} onValueChange={(v) => patch({ mode: v as ScenarioInputs["mode"] })} aria-label="Planner mode" />
      </div>

      {/* INCOME */}
      <label style={{ fontSize: 12, color: "var(--text-3)", display: "flex", flexDirection: "column", gap: 4 }}>
        Base monthly income
        <input
          aria-label="Base monthly income"
          inputMode="decimal"
          defaultValue={(data.incomeBaseSeedCents / 100).toString()}
          onChange={(e) => patch({ baseIncomeCents: parseCents(e.target.value) })}
          style={inputStyle}
        />
      </label>

      {/* EXPENSES */}
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>
        Expenses: <Money cents={expenseCents} size={12} weight={700} />/mo
      </div>
      <label style={{ fontSize: 12, color: "var(--text-3)", display: "flex", flexDirection: "column", gap: 4 }}>
        Discretionary spend
        <input
          aria-label="Discretionary spend"
          inputMode="decimal"
          defaultValue={(data.discretionarySeedCents / 100).toString()}
          onChange={(e) => patch({ discretionaryCents: parseCents(e.target.value) })}
          style={inputStyle}
        />
      </label>

      {/* STRATEGY + CUSTOM ORDER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>Payoff strategy</span>
        <Segmented
          options={STRATEGY_OPTIONS}
          value={inputs.strategy}
          onValueChange={(v) => patch({ strategy: v as ScenarioInputs["strategy"] })}
          aria-label="Payoff strategy"
        />
      </div>
      {inputs.strategy === "CUSTOM" && customDebts.length > 0 && (
        <ol aria-label="Custom payoff order" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {customDebts.map((d, i) => (
            <li key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--surface)" }}>
              <span style={{ fontSize: 12.5 }}>{i + 1}. {d.name}</span>
              <span style={{ display: "flex", gap: 4 }}>
                <button type="button" aria-label={`Move ${d.name} up`} disabled={i === 0} onClick={() => moveDebt(d.id, -1)} style={orderBtnStyle}>↑</button>
                <button type="button" aria-label={`Move ${d.name} down`} disabled={i === customDebts.length - 1} onClick={() => moveDebt(d.id, 1)} style={orderBtnStyle}>↓</button>
              </span>
            </li>
          ))}
        </ol>
      )}

      {/* TO DEBT / TARGET DATE */}
      {inputs.mode === "FORWARD" ? (
        <label style={{ fontSize: 12, color: "var(--text-3)", display: "flex", flexDirection: "column", gap: 4 }}>
          To debt: {(inputs.toDebtShareBps / 100).toFixed(0)}% of headroom
          <input
            aria-label="To debt share"
            type="range"
            min={0}
            max={100}
            value={inputs.toDebtShareBps / 100}
            onChange={(e) => patch({ toDebtShareBps: Number(e.target.value) * 100 })}
          />
        </label>
      ) : (
        <label style={{ fontSize: 12, color: "var(--text-3)", display: "flex", flexDirection: "column", gap: 4 }}>
          Target debt-free month
          <input
            aria-label="Target debt-free month"
            type="month"
            onChange={(e) => patch({ targetMonth: e.target.value })}
            style={inputStyle}
          />
        </label>
      )}

      {/* CHART + OUTPUTS */}
      {preview && (
        <>
          <PayoffChart baseline={preview.baseline} scenario={preview.scenario} locked={null} />
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-3)", flexWrap: "wrap" }}>
            <span>Debt-free {formatMonth(preview.scenarioDebtFree)} (was {formatMonth(preview.baselineDebtFree)})</span>
            <span>{preview.monthsSaved} mo saved</span>
            <span>interest saved <Money cents={preview.interestSavedCents} size={12} weight={700} /></span>
            {inputs.mode === "TARGET_DATE" && <span>needs <Money cents={preview.extraPaymentCents} size={12} weight={700} />/mo</span>}
          </div>
          {inputs.mode === "TARGET_DATE" && !preview.achievable && (
            <span style={{ fontSize: 11.5, color: "var(--warn, #c93)" }}>That date isn't reachable even paying everything to debt.</span>
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="secondary" onClick={onSave}>Save as scenario</Button>
        <Button onClick={onLock}>Lock in debt plan</Button>
      </div>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 6,
  padding: "6px 8px",
  background: "var(--surface)",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
};

const orderBtnStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1,
  color: "var(--text-2)",
  background: "var(--surface-2)",
  border: "1px solid var(--line)",
  borderRadius: 5,
  padding: "3px 7px",
  cursor: "pointer",
};

/** Dollar string → integer cents (Global Constraint: never parseFloat). */
function parseCents(raw: string): number {
  const t = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return 0;
  return Math.round(Number(t) * 100);
}
