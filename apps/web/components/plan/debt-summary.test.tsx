import { render, screen } from "@testing-library/react";
import { vi, test, expect } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server-actions/debts", () => ({ createDebtAction: vi.fn() }));

import { DebtSummary } from "./debt-summary";

const debts = [
  {
    row: {
      id: "visa", name: "Visa", type: "CREDIT_CARD",
      currentBalanceCents: 200000, monthlyPaymentCents: 6000, minimumPaymentCents: 6000,
      interestRate: 0.189, creditLimitCents: 250000,
    } as never,
    utilisation: 0.8,
    effectivePaymentCents: 7300, // actual last payment, overrides the 6000 typed min
    paymentIsActual: true,
  },
  {
    row: {
      id: "car", name: "Car loan", type: "CAR",
      currentBalanceCents: 624000, monthlyPaymentCents: 19500, minimumPaymentCents: 19500,
      interestRate: 0.031, creditLimitCents: null,
    } as never,
    utilisation: null,
    effectivePaymentCents: 19500, // no actual → typed min
    paymentIsActual: false,
  },
];

test("renders the total, per-debt rows linking to detail, and the Add debt affordance", () => {
  render(<DebtSummary debts={debts} rollup={{ remainingCents: 14600, activeCount: 2, nextDueDate: "2026-07-06" }} reflectsLocked={false} lockedStrategyLabel="Avalanche" />);
  // total $8,240
  expect(screen.getByText(/8,240/)).toBeInTheDocument();
  expect(screen.getByText("Visa")).toBeInTheDocument();
  expect(screen.getByText(/18.9% APR/)).toBeInTheDocument();
  // Visa shows the actual last payment ($73.00) labelled "actual"; Car shows the typed min labelled "min".
  expect(screen.getByText(/73 · actual/)).toBeInTheDocument();
  expect(screen.getByText(/195 · min/)).toBeInTheDocument();
  const link = screen.getByRole("link", { name: /Visa/ });
  expect(link).toHaveAttribute("href", "/plan/debts/visa");
  // DebtFormDialog default trigger
  expect(screen.getByRole("button", { name: "Add debt" })).toBeInTheDocument();
  // BNPL card
  expect(screen.getByText("Buy now, pay later")).toBeInTheDocument();
});

test("shows the Clearing-by label only when reflectsLocked", () => {
  const { rerender } = render(<DebtSummary debts={debts} rollup={{ remainingCents: 0, activeCount: 0, nextDueDate: null }} reflectsLocked={false} lockedStrategyLabel="Snowball" />);
  expect(screen.queryByText(/Clearing by/)).not.toBeInTheDocument();
  rerender(<DebtSummary debts={debts} rollup={{ remainingCents: 0, activeCount: 0, nextDueDate: null }} reflectsLocked lockedStrategyLabel="Snowball" />);
  expect(screen.getByText("Clearing by Snowball")).toBeInTheDocument();
});

test("renders utilisation bar only for debts with a credit limit", () => {
  render(<DebtSummary debts={debts} rollup={{ remainingCents: 0, activeCount: 0, nextDueDate: null }} reflectsLocked={false} lockedStrategyLabel="Avalanche" />);
  // Visa has creditLimitCents → bar text "80% of $2,500"
  expect(screen.getByText(/80% of \$2,500/)).toBeInTheDocument();
  // Car loan has no creditLimitCents → no "% of" text for car
  const bars = screen.getAllByText(/% of \$/);
  expect(bars).toHaveLength(1);
});

test("renders BNPL rollup summary", () => {
  render(<DebtSummary debts={[]} rollup={{ remainingCents: 45000, activeCount: 3, nextDueDate: "2026-08-01" }} reflectsLocked={false} lockedStrategyLabel="Avalanche" />);
  expect(screen.getByText(/450/)).toBeInTheDocument();
  expect(screen.getByText(/3 active plans/)).toBeInTheDocument();
  expect(screen.getByText(/next due 2026-08-01/)).toBeInTheDocument();
});
