"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Segmented, Money } from "@upshot/ui";
import type { DebtsData } from "@/app/(app)/plan/debts/data";
import { setDebtStrategyAction } from "@/server-actions/debts";
import { DebtList } from "./debt-list";

const STRATEGY_OPTIONS = [
  { value: "SNOWBALL", label: "Snowball" },
  { value: "AVALANCHE", label: "Avalanche" },
  { value: "CUSTOM", label: "Custom" },
];

function formatMonth(month: string | null): string {
  if (!month) return "—";
  return new Date(month + "-01").toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

export function DebtDashboard({ data }: { data: DebtsData }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { analysis, rollup } = data;

  function onStrategy(value: string) {
    startTransition(async () => {
      await setDebtStrategyAction(value as DebtsData["strategy"]);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {data.debts.length > 0 && (
        <section aria-label="Debt summary" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "14px 16px", background: "var(--surface-2)", borderRadius: "var(--radius-card)" }}>
          <Stat label="Debt-free" value={formatMonth(analysis.debtFreeMonth)} />
          <Stat label="Total interest" value={<Money cents={analysis.totalInterestPaidCents} kind="expense" size={15} weight={700} />} />
          <Stat label="Payoff order" value={`${analysis.payoffOrder.length} debt${analysis.payoffOrder.length === 1 ? "" : "s"}`} />
        </section>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Payoff strategy</span>
        <Segmented options={STRATEGY_OPTIONS} value={data.strategy} onValueChange={onStrategy} aria-label="Debt payoff strategy" />
      </div>

      {/* TASK 11 SLOT: <WhatIfPanel debts={...} baseAnalysis={analysis} /> goes here */}

      <DebtList data={data} />

      {rollup.activeCount > 0 && (
        <Link href="/plan/installments" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", borderRadius: "var(--radius-card)", border: "1px dashed var(--line)", background: "var(--surface)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>BNPL (managed)</span>
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{rollup.activeCount} active plan{rollup.activeCount === 1 ? "" : "s"} · managed by BNPL tracking →</span>
            </div>
            <Money cents={rollup.remainingCents} kind="expense" size={16} weight={700} />
          </div>
        </Link>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: "var(--text-2)" }}>{value}</span>
    </div>
  );
}
