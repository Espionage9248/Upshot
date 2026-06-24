import { render, screen, fireEvent } from "@testing-library/react";
import { vi, test, expect } from "vitest";
import type { ScenarioInputs } from "@upshot/db";
import { AllocationBlock } from "./allocation-block";
import type { PlannerPreview } from "./planner-types";

const baseInputs: ScenarioInputs = {
  mode: "FORWARD",
  baseIncomeCents: 496000,
  raise: null,
  discretionaryCents: 54000,
  recurringEdits: [],
  toDebtShareBps: 5000,
  strategy: "AVALANCHE",
  customOrder: null,
  lumpSums: [],
  targetMonth: null,
};
const preview: PlannerPreview = {
  scenario: [], baseline: [], perDebt: [],
  scenarioDebtFree: "2028-02", baselineDebtFree: "2029-08",
  extraPaymentCents: 43000, achievable: true, headroomCents: 80000,
  overHeadroom: false, interestSavedCents: 0, monthsSaved: 0,
};

test("forward mode: shows extra/mo, % of spare and spare/mo; slider patches bps", () => {
  const onPatch = vi.fn();
  render(<AllocationBlock inputs={baseInputs} preview={preview} minimumsCents={39000} startMonth="2026-06" onPatch={onPatch} />);
  expect(screen.getByText(/50% of spare cash/)).toBeInTheDocument();
  expect(screen.getByText(/spare ?\/ ?mo/)).toBeInTheDocument();
  // Money extra 43000c → $430
  expect(screen.getByText(/430/)).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("slider", { name: "Share of spare cash toward debt" }), { key: "ArrowRight" });
  expect(onPatch).toHaveBeenCalled();
});

test("target mode: stepper patches targetMonth; required payment = minimums + extra", () => {
  const onPatch = vi.fn();
  const inputs: ScenarioInputs = { ...baseInputs, mode: "TARGET_DATE", targetMonth: "2027-06" };
  render(<AllocationBlock inputs={inputs} preview={preview} minimumsCents={39000} startMonth="2026-06" onPatch={onPatch} />);
  expect(screen.getByText("You'd need to pay")).toBeInTheDocument();
  // 39000 + 43000 = 82000c → $820
  expect(screen.getByText(/820/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Sooner" }));
  expect(onPatch).toHaveBeenCalledWith({ targetMonth: "2027-05" });
});

test("target mode unreachable shows the warning when overHeadroom", () => {
  const inputs: ScenarioInputs = { ...baseInputs, mode: "TARGET_DATE", targetMonth: "2026-09" };
  const over: PlannerPreview = { ...preview, achievable: false, overHeadroom: true, extraPaymentCents: 120000 };
  render(<AllocationBlock inputs={inputs} preview={over} minimumsCents={39000} startMonth="2026-06" onPatch={vi.fn()} />);
  expect(screen.getByText(/more than your/)).toBeInTheDocument();
});
