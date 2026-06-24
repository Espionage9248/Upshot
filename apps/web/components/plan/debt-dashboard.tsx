"use client";

import Link from "next/link";
import { Money, EmptyState } from "@upshot/ui";
import type { DebtsData } from "@/app/(app)/plan/debts/data";
import type { PlanningData } from "@/app/(app)/plan/debts/planning-data";
import { DebtSummary } from "./debt-summary";
import { DebtFormDialog } from "./debt-form-dialog";
import { LockedPlanBanner } from "./locked-plan-banner";
import { ScenarioPlanner } from "./scenario-planner";
import { SavedScenariosList } from "./saved-scenarios-list";

const STRATEGY_LABEL: Record<string, string> = {
  SNOWBALL: "Snowball",
  AVALANCHE: "Avalanche",
  CUSTOM: "Custom",
};

export function DebtDashboard({ data, planning }: { data: DebtsData; planning: PlanningData }) {
  const { rollup } = data;
  const reflectsLocked = planning.lockedPlan != null;
  const lockedStrategyLabel = STRATEGY_LABEL[planning.lockedPlan?.inputs?.strategy ?? planning.strategy] ?? "Snowball";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {data.debts.length === 0 ? (
        <EmptyState
          icon="card"
          title="No debts tracked"
          hint="Add a debt to start tracking your payoff progress."
          action={<DebtFormDialog />}
        />
      ) : (
        <DebtSummary debts={data.debts} rollup={rollup} reflectsLocked={reflectsLocked} lockedStrategyLabel={lockedStrategyLabel} />
      )}

      {planning.lockedPlan && <LockedPlanBanner locked={planning.lockedPlan} />}
      {data.debts.length > 0 && <ScenarioPlanner data={planning} />}
      <SavedScenariosList scenarios={planning.scenarios} />

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
