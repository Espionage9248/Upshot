import { render, screen } from "@testing-library/react";
import { vi, test, expect } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server-actions/debts", () => ({ setDebtStrategyAction: vi.fn() }));

import { DebtDashboard } from "./debt-dashboard";

const data = {
  strategy: "SNOWBALL" as const,
  rollup: { remainingCents: 30000, activeCount: 1, nextDueDate: "2026-06-15" },
  debts: [{ row: { id: "d1", name: "Visa", currentBalanceCents: 100000, monthlyPaymentCents: 5000, interestRate: 0.2, creditLimitCents: 200000, type: "CREDIT_CARD" } as never, utilisation: 0.5 }],
  analysis: { strategy: "SNOWBALL", payoffOrder: ["d1"], schedules: [{ debtId: "d1", payoffMonth: "2027-01" }], debtFreeMonth: "2027-01", totalInterestPaidCents: 12345, monthsToPayoff: 7 } as never,
};

test("renders the strategy toggle and the BNPL rollup line", () => {
  render(<DebtDashboard data={data} />);
  expect(screen.getByLabelText("Debt payoff strategy")).toBeInTheDocument();
  expect(screen.getByText(/BNPL \(managed\)/)).toBeInTheDocument();
});
