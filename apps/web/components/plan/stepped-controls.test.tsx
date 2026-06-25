import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SteppedControls } from "./stepped-controls";
import type { ScenarioInputs } from "@upshot/db";
import type { PlanningData } from "@/app/(app)/plan/debts/planning-data";

const inputs: ScenarioInputs = {
  mode: "FORWARD",
  baseIncomeCents: 600000,
  raise: null,
  discretionaryCents: 100000,
  recurringEdits: [],
  toDebtShareBps: 5000,
  strategy: "SNOWBALL",
  customOrder: null,
  lumpSums: [],
  targetMonth: null,
};

const data = {
  startMonth: "2026-06",
  recurring: [],
  incomeBaseSeedCents: 600000,
  discretionarySeedCents: 100000,
  debts: [],
} as unknown as PlanningData;

const debts = [
  { id: "d1", name: "Visa", interestRate: 0.2, balanceCents: 250000, includeInSnowball: true, minimumPaymentCents: 20000 },
];

function setup() {
  return render(
    <SteppedControls inputs={inputs} preview={null} data={data} minimumsCents={20000} debts={debts} onPatch={vi.fn()} />,
  );
}

describe("SteppedControls", () => {
  it("renders five numbered steps", () => {
    setup();
    expect(screen.getByRole("button", { name: /How much/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Payoff order/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /One-off payments/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Income/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Expenses/i })).toBeInTheDocument();
  });

  it("opens exactly one step at a time (step 1 open by default; opening another closes it)", () => {
    setup();
    // step 1 (Allocation) open by default → its mode segmented is present.
    expect(screen.getByRole("button", { name: /How much/i })).toHaveAttribute("aria-expanded", "true");
    // open step 2 → step 1 collapses.
    fireEvent.click(screen.getByRole("button", { name: /Payoff order/i }));
    expect(screen.getByRole("button", { name: /Payoff order/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /How much/i })).toHaveAttribute("aria-expanded", "false");
  });
});
