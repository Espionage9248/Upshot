import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CashflowChart } from "./cashflow-chart";

const THREE_POINTS = [
  { date: "2025-01", incomeCents: 500000, expenseCents: 350000, netCents: 150000 },
  { date: "2025-02", incomeCents: 520000, expenseCents: 400000, netCents: 120000 },
  { date: "2025-03", incomeCents: 480000, expenseCents: 320000, netCents: 160000 },
];

describe("CashflowChart", () => {
  it("renders an svg with role=img and aria-label", () => {
    const { container } = render(<CashflowChart points={THREE_POINTS} />);
    const svg = container.querySelector("svg[role='img']");
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute("aria-label")).toBeTruthy();
  });

  it("renders without throwing for 3 points", () => {
    expect(() => render(<CashflowChart points={THREE_POINTS} />)).not.toThrow();
  });

  it("shows EmptyState when points is empty", () => {
    render(<CashflowChart points={[]} />);
    expect(screen.getByText(/no cashflow/i)).toBeTruthy();
  });
});
