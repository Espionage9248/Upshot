"use client";

import { useState, useTransition } from "react";
import { UiSelect, UiSlider, Input, Money } from "@upshot/ui";
import { whatIfAction } from "@/server-actions/debts";
import type { SnowballAnalysis } from "@upshot/core";

interface WhatIfResult {
  withChanges: SnowballAnalysis;
  base: SnowballAnalysis;
  monthsSaved: number;
  interestSavedCents: number;
}

// Radix Select.Item disallows empty-string values, so we use a sentinel.
const NONE = "__none__";

function parseRate(value: string): number | null {
  const t = value.trim();
  if (t === "") return null;
  const n = Number(t);
  if (isNaN(n) || n < 0 || n > 100) return null;
  return n / 100;
}

function formatMonths(months: number): string {
  if (months <= 0) return "—";
  if (months < 12) return `${months} mo`;
  const y = Math.floor(months / 12), m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export function WhatIfPanel({ debts, baseAnalysis: _baseAnalysis }: { debts: { id: string; name: string }[]; baseAnalysis: SnowballAnalysis }) {
  const [targetId, setTargetId] = useState(NONE);
  const [extraDollars, setExtraDollars] = useState(0);
  const [refiId, setRefiId] = useState(NONE);
  const [refiRate, setRefiRate] = useState("");
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [, startTransition] = useTransition();

  function recompute(next: Partial<{ extra: number; target: string; rId: string; rRate: string }>) {
    const extra = next.extra ?? extraDollars;
    const target = next.target ?? targetId;
    const rId = next.rId ?? refiId;
    const rRate = next.rRate ?? refiRate;
    const rateOverrides: Record<string, number> = {};
    const parsed = parseRate(rRate);
    if (rId !== NONE && parsed !== null) rateOverrides[rId] = parsed;
    if (extra === 0 && Object.keys(rateOverrides).length === 0) { setResult(null); return; }
    startTransition(async () => {
      const res = await whatIfAction({
        extraPaymentCents: extra * 100,
        extraTargetDebtId: target !== NONE ? target : undefined,
        rateOverrides: Object.keys(rateOverrides).length ? rateOverrides : undefined,
      });
      if (res.ok) setResult(res.data);
    });
  }

  const targetOptions = [{ value: NONE, label: "Follow strategy order" }, ...debts.map((d) => ({ value: d.id, label: d.name }))];
  const refiOptions = [{ value: NONE, label: "Select a debt" }, ...debts.map((d) => ({ value: d.id, label: d.name }))];

  return (
    <section aria-label="What-if simulation" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "14px 16px", background: "var(--surface-2)", borderRadius: "var(--radius-card)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Extra payment per month</span>
        <UiSelect label="Apply to" value={targetId} onValueChange={(v) => { setTargetId(v); recompute({ target: v }); }} options={targetOptions} />
        <UiSlider value={[extraDollars]} onValueChange={(vals) => { const d = vals[0] ?? 0; setExtraDollars(d); recompute({ extra: d }); }} min={0} max={500} step={10} aria-label="Extra monthly payment" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>What if I refinance?</span>
        <UiSelect label="Debt" value={refiId} onValueChange={(v) => { setRefiId(v); recompute({ rId: v }); }} options={refiOptions} />
        <Input label="New interest rate % p.a." mono inputMode="decimal" value={refiRate} onChange={(e) => { setRefiRate(e.target.value); recompute({ rRate: e.target.value }); }} placeholder="e.g. 9.99" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Months saved</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: (result?.monthsSaved ?? 0) > 0 ? "var(--coral)" : "var(--text-3)" }}>{formatMonths(result?.monthsSaved ?? 0)}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Interest saved</span>
          {(result?.interestSavedCents ?? 0) > 0
            ? <Money cents={result!.interestSavedCents} kind="saved" size={15} weight={700} />
            : <span style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 15 }}>$0</span>}
        </div>
      </div>
    </section>
  );
}
