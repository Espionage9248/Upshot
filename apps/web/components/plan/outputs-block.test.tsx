import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import { OutputsBlock } from "./outputs-block";

test("shows debt-free month, struck baseline, months saved and interest saved", () => {
  render(
    <OutputsBlock
      scenarioDebtFreeMonth="2028-02"
      baselineDebtFreeMonth="2029-08"
      monthsSaved={18}
      interestSavedCents={64000}
    />,
  );
  expect(screen.getByText(/Feb '28/)).toBeInTheDocument();
  expect(screen.getByText(/Aug '29/)).toBeInTheDocument();
  expect(screen.getByText("18")).toBeInTheDocument();
  expect(screen.getByText("interest saved")).toBeInTheDocument();
  // Money kind=saved renders +$640.00
  expect(screen.getByText(/640/)).toBeInTheDocument();
});

test("handles a null debt-free month gracefully", () => {
  render(
    <OutputsBlock scenarioDebtFreeMonth={null} baselineDebtFreeMonth={null} monthsSaved={0} interestSavedCents={0} />,
  );
  expect(screen.getByText("If you commit to this")).toBeInTheDocument();
});
