import { render, screen, fireEvent } from "@testing-library/react";
import { vi, test, expect } from "vitest";
import type { ScenarioInputs } from "@upshot/db";
import { ExpensesBlock } from "./expenses-block";

const recurring = [
  { id: "rent", name: "Rent", monthlyCents: 165000, kind: "BILL" },
  { id: "subs", name: "Subscriptions", monthlyCents: 12200, kind: "SUBSCRIPTION" },
];
const base: ScenarioInputs = {
  mode: "FORWARD", baseIncomeCents: 0, raise: null, discretionaryCents: 54000,
  recurringEdits: [
    { id: "rent", keep: true, monthlyCentsOverride: null },
    { id: "subs", keep: true, monthlyCentsOverride: null },
  ],
  toDebtShareBps: 5000, strategy: "AVALANCHE", customOrder: null, lumpSums: [], targetMonth: null,
};

test("cutting a row flips keep to false", () => {
  const onPatch = vi.fn();
  render(<ExpensesBlock inputs={base} recurring={recurring} discretionarySeedCents={54000} onPatch={onPatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Cut Subscriptions" }));
  expect(onPatch).toHaveBeenCalledWith({
    recurringEdits: [
      { id: "rent", keep: true, monthlyCentsOverride: null },
      { id: "subs", keep: false, monthlyCentsOverride: null },
    ],
  });
});

test("overriding an amount patches monthlyCentsOverride", () => {
  const onPatch = vi.fn();
  render(<ExpensesBlock inputs={base} recurring={recurring} discretionarySeedCents={54000} onPatch={onPatch} />);
  fireEvent.change(screen.getByLabelText("Rent amount"), { target: { value: "1700" } });
  expect(onPatch).toHaveBeenCalledWith({
    recurringEdits: [
      { id: "rent", keep: true, monthlyCentsOverride: 170000 },
      { id: "subs", keep: true, monthlyCentsOverride: null },
    ],
  });
});

test("monthly spend kept total = kept recurring + discretionary", () => {
  render(<ExpensesBlock inputs={base} recurring={recurring} discretionarySeedCents={54000} onPatch={vi.fn()} />);
  // 165000 + 12200 + 54000 = 231200c → $2,312
  expect(screen.getByText(/2,312/)).toBeInTheDocument();
});
