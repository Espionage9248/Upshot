import { render, screen } from "@testing-library/react";
import { vi, test, expect } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server-actions/debts", () => ({ createDebtAction: vi.fn() }));
vi.mock("@/server-actions/planner", () => ({
  previewScenarioAction: vi.fn(async () => ({ ok: false as const })),
  savePlanningScenarioAction: vi.fn(),
  lockPayoffPlanAction: vi.fn(),
}));

import { DebtDashboard } from "./debt-dashboard";

const data = {
  strategy: "SNOWBALL" as const,
  rollup: { remainingCents: 30000, activeCount: 1, nextDueDate: "2026-06-15" },
  debts: [{ row: { id: "d1", name: "Visa", type: "CREDIT_CARD", currentBalanceCents: 100000, monthlyPaymentCents: 5000, minimumPaymentCents: 5000, interestRate: 0.2, creditLimitCents: 200000 } as never, utilisation: 0.5, effectivePaymentCents: 5000, paymentIsActual: false }],
  analysis: { strategy: "SNOWBALL", payoffOrder: ["d1"], schedules: [], debtFreeMonth: "2027-01", totalInterestPaidCents: 12345, monthsToPayoff: 7 } as never,
};

const planning = {
  startMonth: "2026-06",
  incomeBaseSeedCents: 0,
  discretionarySeedCents: 0,
  recurring: [],
  debts: [{ id: "d1", name: "Visa", currentBalanceCents: 100000, minimumPaymentCents: 5000, effectivePaymentCents: 5000, paymentIsActual: false, interestRate: 0.2, includeInSnowball: true }],
  strategy: "SNOWBALL" as const,
  scenarios: [],
  lockedPlan: null,
};

test("renders DebtSummary and no longer renders the global strategy control", () => {
  render(<DebtDashboard data={data} planning={planning} />);
  // DebtSummary card present.
  expect(screen.getByText("What you owe")).toBeInTheDocument();
  // The global "Debt payoff strategy" Segmented is gone.
  expect(screen.queryByLabelText("Debt payoff strategy")).not.toBeInTheDocument();
  // BNPL management link kept.
  expect(screen.getByText(/BNPL \(managed\)/)).toBeInTheDocument();
});
