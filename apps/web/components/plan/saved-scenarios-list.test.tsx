import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, it, expect, describe } from "vitest";

vi.mock("@/server-actions/planner", () => ({
  promoteScenarioToPlanAction: vi.fn(async () => ({ ok: true, data: undefined })),
  deletePlanningScenarioAction: vi.fn(async () => ({ ok: true, data: undefined })),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { SavedScenariosList } from "./saved-scenarios-list";
import type { ScenarioInputs } from "@upshot/db";

const baseInputs: ScenarioInputs = {
  mode: "FORWARD",
  baseIncomeCents: 600000,
  raise: null,
  discretionaryCents: 50000,
  recurringEdits: [],
  toDebtShareBps: 5000,
  strategy: "AVALANCHE",
  customOrder: null,
  lumpSums: [],
  targetMonth: null,
};

it("shows the empty well with no scenarios and no locked plan", () => {
  render(<SavedScenariosList scenarios={[]} lockedPlan={null} onOpen={() => {}} />);
  expect(screen.getByText(/No saved scenarios/i)).toBeInTheDocument();
});

it("renders a card per scenario", () => {
  const scenarios = [
    { id: "a", name: "Aggressive", debtFreeMonth: "2028-02", extraPaymentCents: 10000, interestSavedCents: 250000, monthsSaved: 4, inputs: baseInputs },
  ];
  render(<SavedScenariosList scenarios={scenarios} lockedPlan={null} onOpen={() => {}} />);
  expect(screen.getByText("Aggressive")).toBeInTheDocument();
});

it("renders locked card when lockedPlan is present", () => {
  const lockedPlan = {
    lockedAt: "2026-01-01T00:00:00Z",
    extraPaymentCents: 40000,
    projectedDebtFreeMonth: "2028-06",
    expectedBalanceCents: 500000,
    currentBalanceCents: 580000,
    status: "on-track" as const,
    balanceGapCents: 0,
    slipMonths: 0,
    contributionsShortfallCents: 0,
    lockBalanceCents: 1000000,
    projectedCurve: [],
    inputs: baseInputs,
  };
  render(<SavedScenariosList scenarios={[]} lockedPlan={lockedPlan} onOpen={() => {}} />);
  expect(screen.getByText("Tracked plan")).toBeInTheDocument();
  expect(screen.getByText("LOCKED")).toBeInTheDocument();
});

it("calls onOpen with inputs and name when Open is clicked on a what-if card", () => {
  const onOpen = vi.fn();
  const scenarios = [
    { id: "a", name: "Aggressive", debtFreeMonth: "2028-02", extraPaymentCents: 10000, interestSavedCents: 250000, monthsSaved: 4, inputs: baseInputs },
  ];
  render(<SavedScenariosList scenarios={scenarios} lockedPlan={null} onOpen={onOpen} />);
  fireEvent.click(screen.getAllByRole("button", { name: /Open/i })[0]!);
  expect(onOpen).toHaveBeenCalledWith(baseInputs, "Aggressive");
});

it("does not show Delete button on locked card", () => {
  const lockedPlan = {
    lockedAt: "2026-01-01T00:00:00Z",
    extraPaymentCents: 40000,
    projectedDebtFreeMonth: "2028-06",
    expectedBalanceCents: 500000,
    currentBalanceCents: 580000,
    status: "on-track" as const,
    balanceGapCents: 0,
    slipMonths: 0,
    contributionsShortfallCents: 0,
    lockBalanceCents: 1000000,
    projectedCurve: [],
    inputs: baseInputs,
  };
  render(<SavedScenariosList scenarios={[]} lockedPlan={lockedPlan} onOpen={() => {}} />);
  expect(screen.queryByRole("button", { name: /Delete/i })).not.toBeInTheDocument();
});

describe("locked card with null inputs", () => {
  it("disables Open on the locked card when inputs is null", () => {
    const lockedPlan = {
      lockedAt: "2026-01-01T00:00:00Z",
      extraPaymentCents: 40000,
      projectedDebtFreeMonth: "2028-06",
      expectedBalanceCents: 500000,
      currentBalanceCents: 580000,
      status: "on-track" as const,
      balanceGapCents: 0,
      slipMonths: 0,
      contributionsShortfallCents: 0,
      lockBalanceCents: 1000000,
      projectedCurve: [],
      inputs: null,
    };
    render(<SavedScenariosList scenarios={[]} lockedPlan={lockedPlan} onOpen={() => {}} />);
    const openBtn = screen.getByRole("button", { name: /Re-model from the banner/i });
    expect(openBtn).toBeDisabled();
  });
});

it("calls delete action on Delete click (no confirm dialog)", async () => {
  const { deletePlanningScenarioAction } = await import("@/server-actions/planner");
  const scenarios = [
    { id: "a", name: "Aggressive", debtFreeMonth: "2028-02", extraPaymentCents: 10000, interestSavedCents: 250000, monthsSaved: 4, inputs: baseInputs },
  ];
  render(<SavedScenariosList scenarios={scenarios} lockedPlan={null} onOpen={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
  await waitFor(() => {
    expect(deletePlanningScenarioAction).toHaveBeenCalledWith("a");
  });
});

it("shows promote confirm dialog on Promote click", () => {
  const scenarios = [
    { id: "a", name: "Aggressive", debtFreeMonth: "2028-02", extraPaymentCents: 10000, interestSavedCents: 250000, monthsSaved: 4, inputs: baseInputs },
  ];
  render(<SavedScenariosList scenarios={scenarios} lockedPlan={null} onOpen={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /Promote/i }));
  expect(screen.getByText("Make this your tracked plan?")).toBeInTheDocument();
});
