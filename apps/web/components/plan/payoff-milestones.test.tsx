import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import { PayoffMilestones } from "./payoff-milestones";

const ordered = [
  { id: "visa", name: "Visa", interestRate: 0.189, balanceCents: 200000 },
  { id: "car", name: "Car loan", interestRate: 0.031, balanceCents: 624000 },
];
const perDebt = [
  { id: "visa", clearedMonth: "2027-01" },
  { id: "car", clearedMonth: null },
];

test("renders the strategy label, each debt name, apr% and the cleared month", () => {
  render(<PayoffMilestones orderedDebts={ordered} perDebt={perDebt} strategyLabel="Avalanche" />);
  expect(screen.getByText(/Avalanche order/)).toBeInTheDocument();
  expect(screen.getByText("Visa")).toBeInTheDocument();
  expect(screen.getByText("18.9%")).toBeInTheDocument();
  expect(screen.getByText(/Jan '27/)).toBeInTheDocument();
});

test("a null clearedMonth falls back to a dash", () => {
  render(<PayoffMilestones orderedDebts={ordered} perDebt={perDebt} strategyLabel="Snowball" />);
  expect(screen.getByText("—")).toBeInTheDocument();
});
