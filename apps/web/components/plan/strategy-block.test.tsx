import { render, screen, fireEvent } from "@testing-library/react";
import { vi, test, expect } from "vitest";
import type { ScenarioInputs } from "@upshot/db";
import { StrategyBlock } from "./strategy-block";

const debts = [
  { id: "visa", name: "Visa", interestRate: 0.189, balanceCents: 200000, includeInSnowball: true },
  { id: "car", name: "Car loan", interestRate: 0.031, balanceCents: 624000, includeInSnowball: true },
];
const base: ScenarioInputs = {
  mode: "FORWARD", baseIncomeCents: 0, raise: null, discretionaryCents: 0, recurringEdits: [],
  toDebtShareBps: 5000, strategy: "AVALANCHE", customOrder: null, lumpSums: [], targetMonth: null,
};

test("changing strategy patches inputs and shows the description", () => {
  const onPatch = vi.fn();
  render(<StrategyBlock inputs={base} debts={debts} onPatch={onPatch} />);
  expect(screen.getByText(/Highest interest first/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: "Snowball" }));
  expect(onPatch).toHaveBeenCalledWith({ strategy: "SNOWBALL" });
});

test("custom strategy shows a reorder list; moving down patches customOrder", () => {
  const onPatch = vi.fn();
  const custom: ScenarioInputs = { ...base, strategy: "CUSTOM", customOrder: ["visa", "car"] };
  render(<StrategyBlock inputs={custom} debts={debts} onPatch={onPatch} />);
  const list = screen.getByRole("list", { name: "Custom payoff order" });
  expect(list).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Move Visa down" }));
  expect(onPatch).toHaveBeenCalledWith({ customOrder: ["car", "visa"] });
});

test("reorder end buttons are disabled at the boundaries", () => {
  const custom: ScenarioInputs = { ...base, strategy: "CUSTOM", customOrder: ["visa", "car"] };
  render(<StrategyBlock inputs={custom} debts={debts} onPatch={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Move Visa up" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Move Car loan down" })).toBeDisabled();
});
