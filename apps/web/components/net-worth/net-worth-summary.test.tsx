import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NetWorthSummary } from "./net-worth-summary";

describe("NetWorthSummary", () => {
  it("renders the total net worth in dollars", () => {
    render(<NetWorthSummary totalCents={4676000} />);
    // $46,760 — mono money, no cents on the hero figure.
    expect(screen.getByText(/\$46,760/)).toBeInTheDocument();
  });

  it("shows the eyebrow label", () => {
    render(<NetWorthSummary totalCents={0} />);
    expect(screen.getByText(/total net worth/i)).toBeInTheDocument();
  });
});
