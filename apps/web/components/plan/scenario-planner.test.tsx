import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, test, expect, beforeEach } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const previewScenarioAction = vi.fn();
const savePlanningScenarioAction = vi.fn();
const lockPayoffPlanAction = vi.fn();
vi.mock("@/server-actions/planner", () => ({
  previewScenarioAction: (...a: unknown[]) => previewScenarioAction(...a),
  savePlanningScenarioAction: (...a: unknown[]) => savePlanningScenarioAction(...a),
  lockPayoffPlanAction: (...a: unknown[]) => lockPayoffPlanAction(...a),
}));

import { ScenarioPlanner } from "./scenario-planner";
import type { PlanningData } from "@/app/(app)/plan/debts/planning-data";

const data: PlanningData = {
  startMonth: "2026-06",
  incomeBaseSeedCents: 496000,
  discretionarySeedCents: 54000,
  recurring: [{ id: "rent", name: "Rent", monthlyCents: 165000, kind: "BILL" }],
  debts: [{ id: "d1", name: "Visa", currentBalanceCents: 200000, minimumPaymentCents: 6000, interestRate: 0.189, includeInSnowball: true }],
  strategy: "AVALANCHE",
  scenarios: [],
  lockedPlan: null,
};

beforeEach(() => {
  refresh.mockClear();
  previewScenarioAction.mockClear();
  savePlanningScenarioAction.mockClear();
  lockPayoffPlanAction.mockClear();
  previewScenarioAction.mockResolvedValue({
    ok: true,
    data: {
      scenario: {
        debtFreeMonth: "2028-02",
        monthsToPayoff: 20,
        totalInterestCents: 100000,
        curve: [{ month: "2026-06", balanceCents: 1304000 }, { month: "2028-02", balanceCents: 0 }],
        perDebt: [{ id: "d1", clearedMonth: "2028-02" }],
      },
      baseline: {
        debtFreeMonth: "2029-08",
        monthsToPayoff: 38,
        totalInterestCents: 214000,
        curve: [{ month: "2026-06", balanceCents: 1304000 }, { month: "2029-08", balanceCents: 0 }],
        perDebt: [],
      },
      extraPaymentCents: 43000,
      achievable: true,
      headroomCents: 80000,
      overHeadroom: false,
    },
  });
  savePlanningScenarioAction.mockResolvedValue("id1");
  lockPayoffPlanAction.mockResolvedValue(undefined);
});

test("renders the planner region with the hypothesis frame and composes children", async () => {
  render(<ScenarioPlanner data={data} />);
  expect(screen.getByRole("region", { name: "Scenario planner" })).toBeInTheDocument();
  expect(screen.getByText("What-if · not committed")).toBeInTheDocument();
  // children present
  expect(screen.getByText("If you commit to this")).toBeInTheDocument();
  expect(screen.getByText("Allocation")).toBeInTheDocument();
  expect(screen.getByText("Payoff order")).toBeInTheDocument();
  expect(screen.getByText("Budget assumptions")).toBeInTheDocument();
  // debounced preview eventually computes → outputs show the debt-free month
  await waitFor(() => expect(previewScenarioAction).toHaveBeenCalled(), { timeout: 1500 });
  await waitFor(() => expect(screen.getAllByText(/Feb '28/).length).toBeGreaterThan(0));
});

test("locked-edit mode shows the tracked-plan pill and Update primary", () => {
  render(<ScenarioPlanner data={data} mode="locked-edit" />);
  expect(screen.getByText("Editing your tracked plan")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Update locked plan/ })).toBeInTheDocument();
});

test("Save invokes savePlanningScenarioAction; Lock invokes lockPayoffPlanAction", async () => {
  vi.spyOn(window, "prompt").mockReturnValue("My scenario");
  render(<ScenarioPlanner data={data} />);
  fireEvent.click(screen.getByRole("button", { name: /Save as scenario/ }));
  await waitFor(() => expect(savePlanningScenarioAction).toHaveBeenCalledWith({ name: "My scenario", inputs: expect.anything() }));
  fireEvent.click(screen.getByRole("button", { name: /Lock in this plan/ }));
  await waitFor(() => expect(lockPayoffPlanAction).toHaveBeenCalled());
});
