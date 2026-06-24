import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import { PayoffChart } from "./payoff-chart";

const scenario = [
  { month: "2026-06", balanceCents: 1304000 },
  { month: "2026-12", balanceCents: 800000 },
  { month: "2027-06", balanceCents: 200000 },
  { month: "2028-02", balanceCents: 0 },
];
const baseline = [
  { month: "2026-06", balanceCents: 1304000 },
  { month: "2027-06", balanceCents: 900000 },
  { month: "2028-06", balanceCents: 500000 },
  { month: "2029-08", balanceCents: 0 },
];

test("renders an svg with TODAY divider, DEBT-FREE flag and a $ tick label", () => {
  render(
    <PayoffChart
      startMonth="2026-06"
      scenario={scenario}
      baseline={baseline}
      scenarioDebtFreeMonth="2028-02"
      baselineDebtFreeMonth="2029-08"
    />,
  );
  expect(screen.getByLabelText("Projected debt balance over time")).toBeInTheDocument();
  expect(screen.getByText("TODAY")).toBeInTheDocument();
  expect(screen.getByText("DEBT-FREE")).toBeInTheDocument();
  // a nice-tick dollar label (e.g. "$0")
  expect(screen.getByText("$0")).toBeInTheDocument();
});

test("empty curves do not crash", () => {
  render(
    <PayoffChart
      startMonth="2026-06"
      scenario={[]}
      baseline={[]}
      scenarioDebtFreeMonth={null}
      baselineDebtFreeMonth={null}
    />,
  );
  expect(screen.getByLabelText("Projected debt balance over time")).toBeInTheDocument();
});
