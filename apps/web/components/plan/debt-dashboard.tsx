"use client";

import { useState } from "react";
import { EmptyState, Toaster } from "@upshot/ui";
import type { DebtsData } from "@/app/(app)/plan/debts/data";
import type { PlanningData } from "@/app/(app)/plan/debts/planning-data";
import type { ScenarioInputs } from "@upshot/db";
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

type Editor = { mode: "hypothesis" | "locked-edit"; seed: ScenarioInputs | null; name: string; key: number };

export function DebtDashboard({ data, planning }: { data: DebtsData; planning: PlanningData }) {
  const { rollup } = data;
  const reflectsLocked = planning.lockedPlan != null;
  const lockedStrategyLabel = STRATEGY_LABEL[planning.lockedPlan?.inputs?.strategy ?? planning.strategy] ?? "Snowball";

  const [editor, setEditor] = useState<Editor>({ mode: "hypothesis", seed: null, name: "Untitled scenario", key: 0 });

  const remodel = () => setEditor((e) => ({ mode: "locked-edit", seed: planning.lockedPlan?.inputs ?? null, name: "Tracked plan", key: e.key + 1 }));
  const openScenario = (seed: ScenarioInputs, scenarioName: string) => setEditor((e) => ({ mode: "hypothesis", seed, name: scenarioName, key: e.key + 1 }));
  const exitLockedEdit = () => setEditor((e) => ({ mode: "hypothesis", seed: null, name: "Untitled scenario", key: e.key + 1 }));

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
        <DebtSummary debts={data.debts} rollup={rollup} bnplPlans={data.bnplPlans} reflectsLocked={reflectsLocked} lockedStrategyLabel={lockedStrategyLabel} />
      )}

      {planning.lockedPlan && <LockedPlanBanner locked={planning.lockedPlan} onRemodel={remodel} />}
      {data.debts.length > 0 && (
        <ScenarioPlanner
          key={editor.key}
          data={planning}
          mode={editor.mode}
          seedInputs={editor.seed}
          name={editor.name}
          onExitLockedEdit={exitLockedEdit}
        />
      )}
      <SavedScenariosList scenarios={planning.scenarios} lockedPlan={planning.lockedPlan} onOpen={openScenario} />
      <Toaster />
    </div>
  );
}
