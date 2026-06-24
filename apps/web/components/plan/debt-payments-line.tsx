"use client";

import type { ReactElement } from "react";
import { Money } from "@upshot/ui";

/**
 * Read-only single lump-sum line for the planner budget: "Debt payments — $X/mo"
 * where X = Σ effectivePaymentCents over included debts. This is exactly the sum
 * the engine reserves (spec §6/§7), so the spare-cash maths is transparent.
 */
export function DebtPaymentsLine({
  debts,
}: {
  debts: { effectivePaymentCents: number; includeInSnowball: boolean }[];
}): ReactElement | null {
  const totalCents = debts
    .filter((d) => d.includeInSnowball)
    .reduce((sum, d) => sum + d.effectivePaymentCents, 0);

  if (totalCents === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        padding: "11px 0",
        borderBottom: "1px solid var(--line-soft)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Debt payments</div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>Reserved from spare cash · managed on each debt</div>
      </div>
      <Money cents={totalCents} kind="expense" size={15} weight={700} showCents={false} />
      <span style={{ fontSize: 11.5, color: "var(--text-3)", marginLeft: 6 }}>/mo</span>
    </div>
  );
}
