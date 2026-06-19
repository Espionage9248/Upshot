import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { SaverView } from "@/app/(app)/budget/data";
import { SaverCard } from "./saver-card";

function makeSaver(overrides: Partial<SaverView> = {}): SaverView {
  return {
    id: "acc-groceries",
    name: "Groceries",
    role: "SAVER",
    analysis: {
      saverId: "acc-groceries",
      saverName: "Groceries",
      currentBalance: 18600,
      monthlyAllocation: 60000,
      monthlySpending: 41400,
      variance: 18600,
      variancePercentage: 31,
      trend: "OVERFUNDED",
      averageMonthlySpending: 40000,
      last6Months: [],
    },
    confidence: { confidence: 0.92, band: "high" },
    goal: null,
    ...overrides,
  };
}

describe("SaverCard", () => {
  it("renders the saver name and balance vs allocation", () => {
    render(<SaverCard saver={makeSaver()} />);
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getAllByText(/\$186/).length).toBeGreaterThan(0);
    expect(screen.getByText(/\/ \$600/)).toBeInTheDocument();
  });

  it("renders the trend badge", () => {
    render(<SaverCard saver={makeSaver()} />);
    expect(screen.getByText("Overfunded")).toBeInTheDocument();
  });

  it("renders the underfunded trend label", () => {
    render(<SaverCard saver={makeSaver({ analysis: { ...makeSaver().analysis, trend: "UNDERFUNDED" } })} />);
    expect(screen.getByText("Underfunded")).toBeInTheDocument();
  });

  it("renders the Confidence ring when a confidence result is present", () => {
    render(<SaverCard saver={makeSaver()} />);
    // band "high" → "on" segment active
    const active = document.querySelector('[data-segment][data-active="true"]');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain("On track");
  });

  it("omits the Confidence ring when confidence is null", () => {
    render(<SaverCard saver={makeSaver({ confidence: null })} />);
    expect(document.querySelector("[data-segment]")).toBeNull();
  });

  it("surfaces the real goal target and date when a goal is present", () => {
    render(<SaverCard saver={makeSaver({ goal: { targetCents: 500000, targetDate: "2027-01-01" } })} />);
    expect(screen.getByText(/Goal/)).toHaveTextContent("Goal $5,000 by Jan 2027");
  });

  it("does not render a goal line when no goal is present", () => {
    render(<SaverCard saver={makeSaver({ goal: null })} />);
    expect(screen.queryByText(/^Goal/)).toBeNull();
  });

  it("renders an over (negative) balance with the warn bar", () => {
    render(
      <SaverCard
        saver={makeSaver({
          analysis: { ...makeSaver().analysis, currentBalance: -2200, variance: -2200, trend: "UNDERFUNDED" },
        })}
      />,
    );
    const bar = screen.getByTestId("saver-bar").firstElementChild as HTMLElement;
    expect(bar.style.width).toBe("100%");
    expect(bar.style.background).toContain("var(--warn)");
  });
});
