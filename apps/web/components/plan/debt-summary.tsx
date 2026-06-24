"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { Money, UIcon, Card, type UIconKey } from "@upshot/ui";
import type { DebtRow } from "@/app/(app)/plan/debts/data";
import { PlannerLabel } from "./planner-atoms";
import { DebtFormDialog } from "./debt-form-dialog";

const MONO = "var(--font-mono)";

function typeIcon(type: string | null | undefined): UIconKey {
  if (type === "CREDIT_CARD") return "card";
  if (type === "CAR") return "flame";
  if (type === "BNPL") return "bnpl";
  return "scale";
}

function utilColour(u: number): string {
  return u > 0.8 ? "var(--warn)" : u > 0.5 ? "var(--debt)" : "var(--income)";
}

function Utilisation({ pct, limitCents }: { pct: number; limitCents: number }): ReactElement {
  const clamped = Math.min(1, Math.max(0, pct));
  return (
    <div>
      <div style={{ height: 5, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden", position: "relative" }}>
        <div style={{ width: clamped * 100 + "%", height: "100%", borderRadius: 999, background: utilColour(clamped) }} />
        <div style={{ position: "absolute", top: -1.5, bottom: -1.5, left: "80%", width: 1.5, background: "var(--text-3)", opacity: 0.5 }} />
      </div>
      <div className="tnum" style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4, fontFamily: MONO }}>
        {Math.round(clamped * 100)}% of ${Math.round(limitCents / 100).toLocaleString()}
      </div>
    </div>
  );
}

export function DebtSummary({
  debts,
  rollup,
  reflectsLocked,
  lockedStrategyLabel,
}: {
  debts: { row: DebtRow; utilisation: number | null }[];
  rollup: { remainingCents: number; activeCount: number; nextDueDate: string | null };
  reflectsLocked: boolean;
  lockedStrategyLabel: string;
}): ReactElement {
  const totalCents = debts.reduce((s, d) => s + d.row.currentBalanceCents, 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
      <Card className="p-0">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px 13px", borderBottom: "1px solid var(--line)" }}>
          <div>
            <PlannerLabel>What you owe</PlannerLabel>
            <div className="tnum" style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO, marginTop: 4 }}>
              <Money cents={totalCents} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {reflectsLocked && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "var(--coral-text)" }}>
                <UIcon name="lock" size={13} /> Clearing by {lockedStrategyLabel}
              </span>
            )}
            <DebtFormDialog />
          </div>
        </div>
        {debts.map(({ row, utilisation }, i) => {
          const minCents = row.minimumPaymentCents ?? row.monthlyPaymentCents;
          return (
            <Link
              key={row.id}
              href={`/plan/debts/${row.id}`}
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: i === debts.length - 1 ? "none" : "1px solid var(--line-soft)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)", flexShrink: 0 }}>
                  <UIcon name={typeIcon(row.type)} size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{row.name}</div>
                  <div className="tnum" style={{ fontSize: 11, color: "var(--text-3)", fontFamily: MONO }}>
                    {row.interestRate != null ? (row.interestRate * 100).toFixed(1) : "—"}% APR · min ${Math.round(minCents / 100).toLocaleString()}/mo
                  </div>
                </div>
                <div style={{ width: 150, flexShrink: 0 }}>
                  {row.creditLimitCents != null && utilisation != null && (
                    <Utilisation pct={utilisation} limitCents={row.creditLimitCents} />
                  )}
                </div>
                <div className="tnum" style={{ fontSize: 15, fontWeight: 700, fontFamily: MONO, minWidth: 70, textAlign: "right" }}>
                  <Money cents={row.currentBalanceCents} />
                </div>
              </div>
            </Link>
          );
        })}
      </Card>

      <Card className="p-0">
        <div style={{ padding: "15px 18px 13px", borderBottom: "1px solid var(--line)" }}>
          <PlannerLabel>Buy now, pay later</PlannerLabel>
          <div className="tnum" style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO, marginTop: 4 }}>
            <Money cents={rollup.remainingCents} />
            <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 400 }}> remaining</span>
          </div>
        </div>
        <div style={{ padding: "13px 18px", fontSize: 11.5, color: "var(--text-3)" }}>
          {rollup.activeCount > 0 ? (
            <span>
              {rollup.activeCount} active plan{rollup.activeCount === 1 ? "" : "s"}
              {rollup.nextDueDate ? ` · next due ${rollup.nextDueDate}` : ""}
            </span>
          ) : (
            <span>No BNPL plans tracked.</span>
          )}
        </div>
      </Card>
    </div>
  );
}
