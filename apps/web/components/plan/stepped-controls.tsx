"use client";

import { useState, type ReactElement } from "react";
import type { ScenarioInputs } from "@upshot/db";
import type { PlanningData } from "@/app/(app)/plan/debts/planning-data";
import type { PlannerPreview } from "./planner-types";
import { Disclosure } from "./planner-atoms";
import { AllocationBlock } from "./allocation-block";
import { StrategyBlock } from "./strategy-block";
import { LumpsBlock } from "./lumps-block";
import { IncomeBlock } from "./income-block";
import { ExpensesBlock } from "./expenses-block";
import { DebtPaymentsLine } from "./debt-payments-line";

type Step = 1 | 2 | 3 | 4 | 5;

interface SteppedControlsProps {
  inputs: ScenarioInputs;
  preview: PlannerPreview | null;
  data: PlanningData;
  minimumsCents: number;
  debts: { id: string; name: string; interestRate: number | null; balanceCents: number; includeInSnowball: boolean; minimumPaymentCents: number }[];
  onPatch: (p: Partial<ScenarioInputs>) => void;
}

export function SteppedControls({ inputs, preview, data, minimumsCents, debts, onPatch }: SteppedControlsProps): ReactElement {
  const [openStep, setOpenStep] = useState<Step | null>(1);
  const toggle = (s: Step) => setOpenStep((cur) => (cur === s ? null : s));

  return (
    <div className="stepped-controls" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <DebtPaymentsLine debts={data.debts} />
      <Disclosure n={1} title="How much, by when" open={openStep === 1} onToggle={() => toggle(1)}>
        <AllocationBlock inputs={inputs} preview={preview} minimumsCents={minimumsCents} startMonth={data.startMonth} onPatch={onPatch} />
      </Disclosure>
      <Disclosure n={2} title="Payoff order" open={openStep === 2} onToggle={() => toggle(2)}>
        <StrategyBlock inputs={inputs} debts={debts} onPatch={onPatch} />
      </Disclosure>
      <Disclosure n={3} title="One-off payments" open={openStep === 3} onToggle={() => toggle(3)}>
        <LumpsBlock inputs={inputs} startMonth={data.startMonth} onPatch={onPatch} />
      </Disclosure>
      <Disclosure n={4} title="Income" open={openStep === 4} onToggle={() => toggle(4)}>
        <IncomeBlock inputs={inputs} incomeSeedCents={data.incomeBaseSeedCents} startMonth={data.startMonth} onPatch={onPatch} />
      </Disclosure>
      <Disclosure n={5} title="Expenses to keep or cut" open={openStep === 5} onToggle={() => toggle(5)}>
        <ExpensesBlock inputs={inputs} recurring={data.recurring} discretionarySeedCents={data.discretionarySeedCents} onPatch={onPatch} />
      </Disclosure>
    </div>
  );
}
