"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Money } from "@upshot/ui";
import type { PlanningData } from "@/app/(app)/plan/debts/planning-data";
import { unlockPayoffPlanAction } from "@/server-actions/planner";

const DOT: Record<string, string> = { ahead: "var(--saved)", "on-track": "var(--text-2)", behind: "var(--warn, #c93)" };

function formatMonth(m: string | null): string {
  if (!m) return "—";
  return new Date(m + "-01").toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

export function LockedPlanBanner({ locked }: { locked: NonNullable<PlanningData["lockedPlan"]> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onUnlock() {
    startTransition(async () => {
      await unlockPayoffPlanAction();
      router.refresh();
    });
  }

  const slip = locked.slipMonths;
  const slipLabel = slip === 0 ? "on schedule" : slip < 0 ? `▲ ${-slip} mo early` : `▼ ${slip} mo late`;

  return (
    <section
      aria-label="Locked debt plan"
      style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px", background: "var(--surface-2)", borderRadius: "var(--radius-card)" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: DOT[locked.status] }} aria-hidden />
          Locked plan · debt-free {formatMonth(locked.projectedDebtFreeMonth)}
        </span>
        <button onClick={onUnlock} disabled={pending} style={{ fontSize: 12, color: "var(--text-3)", background: "none", border: "1px solid var(--line)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
          Re-model / unlock
        </button>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-3)" }}>
        <span>
          {locked.balanceGapCents >= 0 ? "Ahead by " : "Behind by "}
          <Money cents={Math.abs(locked.balanceGapCents)} size={12} weight={700} />
        </span>
        <span>{slipLabel}</span>
        <span>extra <Money cents={locked.extraPaymentCents} size={12} weight={700} />/mo</span>
      </div>
      {locked.contributionsShortfallCents > 0 && locked.status !== "behind" && (
        <span style={{ fontSize: 11.5, color: "var(--warn, #c93)" }}>
          Behind on contributions this month by <Money cents={locked.contributionsShortfallCents} size={11.5} weight={700} />
        </span>
      )}
      {locked.debtsChangedSinceLock && (
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>Debts changed since lock — re-model?</span>
      )}
    </section>
  );
}
