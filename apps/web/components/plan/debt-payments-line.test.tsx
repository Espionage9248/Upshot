import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import { DebtPaymentsLine } from "./debt-payments-line";

test("renders the summed effective debt payments of included debts as a read-only line", () => {
  render(
    <DebtPaymentsLine
      debts={[
        { effectivePaymentCents: 7300, includeInSnowball: true },
        { effectivePaymentCents: 6000, includeInSnowball: true },
        { effectivePaymentCents: 99999, includeInSnowball: false }, // excluded
      ]}
    />,
  );
  // $133.00 = 13300 cents
  expect(screen.getByText(/133/)).toBeInTheDocument();
  expect(screen.getByText("Debt payments")).toBeInTheDocument();
  // read-only: no inputs, no buttons
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("renders nothing when no included debts have a payment", () => {
  const { container } = render(<DebtPaymentsLine debts={[{ effectivePaymentCents: 0, includeInSnowball: false }]} />);
  expect(container.firstChild).toBeNull();
});
