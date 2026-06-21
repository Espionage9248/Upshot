"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Money } from "@upshot/ui";
import type { PlanningData } from "@/app/(app)/plan/debts/planning-data";
import { promoteScenarioToPlanAction, deletePlanningScenarioAction } from "@/server-actions/planner";

function formatMonth(m: string | null): string {
  if (!m) return "—";
  return new Date(m + "-01").toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

export function SavedScenariosList({ scenarios }: { scenarios: PlanningData["scenarios"] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (scenarios.length === 0) return null;

  function onLock(id: string) {
    startTransition(async () => {
      await promoteScenarioToPlanAction(id);
      router.refresh();
    });
  }
  function onDelete(id: string) {
    startTransition(async () => {
      await deletePlanningScenarioAction(id);
      router.refresh();
    });
  }

  return (
    <section aria-label="Saved scenarios" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>Saved scenarios</span>
      {scenarios.map((s) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "var(--radius-card)", background: "var(--surface)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
              debt-free {formatMonth(s.debtFreeMonth)} · extra <Money cents={s.extraPaymentCents} size={11.5} weight={700} />/mo
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onLock(s.id)} disabled={pending} style={btnStyle}>Lock</button>
            <button onClick={() => onDelete(s.id)} disabled={pending} style={btnStyle}>Delete</button>
          </div>
        </div>
      ))}
    </section>
  );
}

const btnStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-3)",
  background: "none",
  border: "1px solid var(--line)",
  borderRadius: 6,
  padding: "4px 10px",
  cursor: "pointer",
};
