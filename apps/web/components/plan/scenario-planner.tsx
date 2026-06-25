"use client";

import { useEffect, useState, useTransition } from "react";
import { useMediaQuery } from "@/lib/use-media-query";
import { SteppedControls } from "./stepped-controls";
import { useRouter } from "next/navigation";
import { Button, toast } from "@upshot/ui";
import type { PlanningData } from "@/app/(app)/plan/debts/planning-data";
import type { ScenarioInputs } from "@upshot/db";
import {
  previewScenarioAction,
  savePlanningScenarioAction,
  lockPayoffPlanAction,
} from "@/server-actions/planner";
import { toastResult } from "@/lib/toast-result";
import { ConfirmDialog } from "./confirm-dialog";
import { PayoffChart } from "./payoff-chart";
import { RealityHeader } from "./reality-header";
import { OutputsBlock } from "./outputs-block";
import { PayoffMilestones } from "./payoff-milestones";
import { AllocationBlock } from "./allocation-block";
import { StrategyBlock, orderedIncluded } from "./strategy-block";
import { IncomeBlock } from "./income-block";
import { ExpensesBlock } from "./expenses-block";
import { LumpsBlock } from "./lumps-block";
import { Disclosure, PlannerLabel, diffMonths } from "./planner-atoms";
import { DebtPaymentsLine } from "./debt-payments-line";
import type { PlannerPreview } from "./planner-types";

const STRATEGY_LABEL: Record<ScenarioInputs["strategy"], string> = {
  SNOWBALL: "Snowball",
  AVALANCHE: "Avalanche",
  CUSTOM: "Custom",
};

interface ScenarioPlannerProps {
  data: PlanningData;
  mode?: "hypothesis" | "locked-edit";
  seedInputs?: ScenarioInputs | null;
  name?: string;
  onExitLockedEdit?: () => void;
}

function buildLiveSeed(data: PlanningData): ScenarioInputs {
  return {
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
  };
}

export function ScenarioPlanner({ data, mode = "hypothesis", seedInputs = null, name, onExitLockedEdit }: ScenarioPlannerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const isDesktop = useMediaQuery("(min-width: 640px)", true);

  const [inputs, setInputs] = useState<ScenarioInputs>(() => seedInputs ?? buildLiveSeed(data));

  const headerName = name ?? (mode === "hypothesis" ? "Untitled scenario" : "Tracked plan");

  const [preview, setPreview] = useState<PlannerPreview | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await previewScenarioAction(inputs);
        if (!res.ok) return;
        const r = res.data;
        setPreview({
          scenario: r.scenario.curve,
          baseline: r.baseline.curve,
          perDebt: r.scenario.perDebt,
          scenarioDebtFree: r.scenario.debtFreeMonth,
          baselineDebtFree: r.baseline.debtFreeMonth,
          extraPaymentCents: r.extraPaymentCents,
          raisedExtraPaymentCents: r.raisedExtraPaymentCents,
          achievable: r.achievable,
          headroomCents: r.headroomCents,
          overHeadroom: r.overHeadroom,
          interestSavedCents: Math.max(0, r.baseline.totalInterestCents - r.scenario.totalInterestCents),
          monthsSaved: Math.max(0, r.baseline.monthsToPayoff - r.scenario.monthsToPayoff),
        });
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [inputs]);

  function patch(p: Partial<ScenarioInputs>) {
    setInputs((prev) => ({ ...prev, ...p }));
  }

  // included debts (with engine fields) for milestones + strategy + minimums.
  const debtsWithFields = data.debts.map((d) => ({
    id: d.id,
    name: d.name,
    interestRate: d.interestRate,
    balanceCents: d.currentBalanceCents,
    includeInSnowball: d.includeInSnowball,
    minimumPaymentCents: d.minimumPaymentCents,
  }));
  const includedDebts = debtsWithFields.filter((d) => d.includeInSnowball);
  const minimumsCents = includedDebts.reduce((s, d) => s + d.minimumPaymentCents, 0);
  const orderedDebts = orderedIncluded(debtsWithFields, inputs.strategy, inputs.customOrder).map((d) => ({
    id: d.id,
    name: d.name,
    interestRate: d.interestRate,
    balanceCents: d.balanceCents,
  }));

  // lump notch for the chart: first lump → month index from startMonth.
  const firstLump = inputs.lumpSums[0];
  const lump =
    firstLump != null
      ? { monthIndex: diffMonths(data.startMonth, firstLump.month), amountCents: firstLump.amountCents }
      : null;

  // disclosure open state (workspace: independent toggles).
  const [open, setOpen] = useState<{ income: boolean; expenses: boolean; lumps: boolean }>({ income: false, expenses: false, lumps: false });
  const toggle = (k: keyof typeof open) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const [lockOpen, setLockOpen] = useState(false);
  const [lockPending, startLockTransition] = useTransition();

  function onSave() {
    const name = window.prompt("Name this scenario");
    if (!name) return;
    startTransition(async () => {
      const res = await savePlanningScenarioAction({ name, inputs });
      toastResult(res, { tone: "success", title: "Scenario saved", body: name }, { tone: "warn", title: "Couldn't save" });
      router.refresh();
    });
  }

  function handleLockClick() {
    if (preview && preview.achievable === false) {
      toast({ tone: "warn", title: "Couldn't reach that date", body: "Pick a later month or add more to the monthly amount." });
      return;
    }
    setLockOpen(true);
  }

  function doLock() {
    startLockTransition(async () => {
      const res = await lockPayoffPlanAction(inputs);
      toastResult(res, { tone: "locked", title: "Plan locked", body: "Now tracking against this curve." }, { tone: "warn", title: "Couldn't lock the plan" });
      setLockOpen(false);
      router.refresh();
    });
  }

  function onUpdate() {
    startTransition(async () => {
      const res = await lockPayoffPlanAction(inputs);
      toastResult(res, { tone: "locked", title: "Plan updated" }, { tone: "warn", title: "Couldn't update the plan" });
      router.refresh();
      onExitLockedEdit?.();
    });
  }

  const frameStyle: React.CSSProperties =
    mode === "hypothesis"
      ? { border: "1px solid var(--line)", boxShadow: "var(--elev-1)", borderTop: "3px dashed color-mix(in oklch, var(--coral) 55%, transparent)" }
      : { border: "1px solid color-mix(in oklch, var(--coral) 40%, transparent)", boxShadow: "var(--elev-2)", borderTop: "3px solid var(--coral)" };

  const expSummary = `$${Math.round(
    (inputs.recurringEdits.filter((e) => e.keep).reduce((s, e) => s + (e.monthlyCentsOverride ?? data.recurring.find((r) => r.id === e.id)?.monthlyCents ?? 0), 0) +
      inputs.discretionaryCents) /
      100,
  ).toLocaleString()}/mo`;
  const incSummary = inputs.raise ? "Raise on" : `$${Math.round(inputs.baseIncomeCents / 100).toLocaleString()}/mo`;
  const lumpSummary = inputs.lumpSums.length ? `${inputs.lumpSums.length} planned` : "None";

  return (
    <section aria-label="Scenario planner" style={{ background: "var(--surface)", borderRadius: "var(--radius-card)", padding: 22, ...frameStyle }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <RealityHeader mode={mode} name={headerName} dirty />
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {mode === "locked-edit" && onExitLockedEdit && (
            <Button variant="ghost" onClick={onExitLockedEdit}>Stop editing</Button>
          )}
          <Button variant="ghost" leadingIcon="tag" onClick={onSave}>Save as scenario</Button>
          <Button variant="primary" leadingIcon="lock" onClick={mode === "hypothesis" ? handleLockClick : onUpdate}>
            {mode === "hypothesis" ? "Lock in this plan" : "Update locked plan"}
          </Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1.32fr 1fr" : "1fr", gap: 22, alignItems: "start" }}>
        {/* LEFT — result + chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <OutputsBlock
            scenarioDebtFreeMonth={preview?.scenarioDebtFree ?? null}
            baselineDebtFreeMonth={preview?.baselineDebtFree ?? null}
            monthsSaved={preview?.monthsSaved ?? 0}
            interestSavedCents={preview?.interestSavedCents ?? 0}
          />
          <div style={{ borderRadius: "var(--radius-card)", border: "1px solid var(--line)", background: "var(--surface)", padding: 16 }}>
            <PayoffChart
              startMonth={data.startMonth}
              scenario={preview?.scenario ?? []}
              baseline={preview?.baseline ?? []}
              scenarioDebtFreeMonth={preview?.scenarioDebtFree ?? null}
              baselineDebtFreeMonth={preview?.baselineDebtFree ?? null}
              lump={lump}
              raise={inputs.raise}
              height={isDesktop ? 320 : 190}
              compact={!isDesktop}
              loading={preview === null}
              lockedCurve={mode === "locked-edit" ? (data.lockedPlan?.projectedCurve ?? null) : null}
              {...(mode === "locked-edit" && data.lockedPlan
                ? { youAreHere: { month: data.startMonth, balanceCents: data.lockedPlan.currentBalanceCents } }
                : {})}
            />
          </div>
          <PayoffMilestones orderedDebts={orderedDebts} perDebt={preview?.perDebt ?? []} strategyLabel={STRATEGY_LABEL[inputs.strategy]} />
        </div>

        {/* RIGHT — controls (Workspace on desktop, Stepped on mobile) */}
        {isDesktop ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: 16, borderRadius: "var(--radius-data)", border: "1px solid var(--line)", background: "var(--surface)" }}>
              <PlannerLabel style={{ marginBottom: 12 }}>Allocation</PlannerLabel>
              <AllocationBlock inputs={inputs} preview={preview} minimumsCents={minimumsCents} startMonth={data.startMonth} onPatch={patch} />
            </div>
            <div style={{ padding: 16, borderRadius: "var(--radius-data)", border: "1px solid var(--line)", background: "var(--surface)" }}>
              <PlannerLabel style={{ marginBottom: 12 }}>Payoff order</PlannerLabel>
              <StrategyBlock inputs={inputs} debts={debtsWithFields} onPatch={patch} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 2px" }}>
              <PlannerLabel style={{ margin: 0 }}>Budget assumptions</PlannerLabel>
              <span style={{ flex: 1, height: 1, background: "var(--line-soft)" }} />
            </div>
            <DebtPaymentsLine debts={data.debts} />
            <Disclosure icon="wallet" title="Income" summary={incSummary} open={open.income} onToggle={() => toggle("income")}>
              <IncomeBlock inputs={inputs} incomeSeedCents={data.incomeBaseSeedCents} startMonth={data.startMonth} onPatch={patch} />
            </Disclosure>
            <Disclosure icon="ledger" title="Expenses to keep or cut" summary={expSummary} open={open.expenses} onToggle={() => toggle("expenses")}>
              <ExpensesBlock inputs={inputs} recurring={data.recurring} discretionarySeedCents={data.discretionarySeedCents} onPatch={patch} />
            </Disclosure>
            <Disclosure icon="flame" title="One-off payments" summary={lumpSummary} open={open.lumps} onToggle={() => toggle("lumps")}>
              <LumpsBlock inputs={inputs} startMonth={data.startMonth} onPatch={patch} />
            </Disclosure>
          </div>
        ) : (
          <SteppedControls
            inputs={inputs}
            preview={preview}
            data={data}
            minimumsCents={minimumsCents}
            debts={debtsWithFields}
            onPatch={patch}
          />
        )}
      </div>
      {!isDesktop && (
        <div
          role="group"
          aria-label="Plan actions"
          style={{
            position: "sticky",
            bottom: 0,
            marginTop: 16,
            marginInline: -22,
            marginBottom: -22,
            padding: "12px 16px",
            display: "flex",
            gap: 9,
            background: "var(--surface)",
            borderTop: "1px solid var(--line)",
            boxShadow: "var(--elev-1)",
            zIndex: 2,
          }}
        >
          <Button variant="ghost" leadingIcon="tag" onClick={onSave} style={{ flex: 1 }}>Save</Button>
          <Button variant="primary" leadingIcon="lock" onClick={mode === "hypothesis" ? handleLockClick : onUpdate} style={{ flex: 1 }}>
            {mode === "hypothesis" ? "Lock in" : "Update"}
          </Button>
        </div>
      )}
      <ConfirmDialog kind="lock" open={lockOpen} onOpenChange={setLockOpen} onConfirm={doLock} pending={lockPending} />
    </section>
  );
}
