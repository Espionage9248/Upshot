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
      mode: "envelope",
      status: "BUILDING",
      goalProgress: null,
      net6MonthsCents: 30000,
      averageMonthlySpending: 40000,
      last6Months: [],
    },
    confidence: { confidence: 0.92, band: "high" },
    goal: null,
    ...overrides,
  };
}

/** A goal-mode analysis (balance vs target). */
function goalAnalysis(extra: Partial<SaverView["analysis"]> = {}): SaverView["analysis"] {
  return { ...makeSaver().analysis, mode: "goal", status: "BUILDING", goalProgress: 0.5, ...extra };
}

describe("SaverCard", () => {
  it("renders the saver name and (for an envelope saver) balance vs allocation", () => {
    render(<SaverCard saver={makeSaver()} />);
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getAllByText(/\$186/).length).toBeGreaterThan(0);
    expect(screen.getByText(/\/ \$600/)).toBeInTheDocument();
  });

  it("renders the accumulation-trend badge for an envelope saver", () => {
    render(<SaverCard saver={makeSaver()} />);
    expect(screen.getByText("Building")).toBeInTheDocument();
  });

  it("renders the drawing-down status", () => {
    render(<SaverCard saver={makeSaver({ analysis: { ...makeSaver().analysis, status: "DRAWING_DOWN" } })} />);
    expect(screen.getByText("Drawing down")).toBeInTheDocument();
  });

  it("renders the Confidence ring when a confidence result is present", () => {
    render(<SaverCard saver={makeSaver()} />);
    const active = document.querySelector('[data-segment][data-active="true"]');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain("On track");
  });

  it("omits the Confidence ring when confidence is null", () => {
    render(<SaverCard saver={makeSaver({ confidence: null })} />);
    expect(document.querySelector("[data-segment]")).toBeNull();
  });

  it("surfaces the real goal target and date when a goal is present", () => {
    render(
      <SaverCard
        saver={makeSaver({ analysis: goalAnalysis(), goal: { targetCents: 500000, targetDate: "2027-01-01" } })}
      />,
    );
    expect(screen.getByText(/Goal/)).toHaveTextContent("Goal $5,000 by Jan 2027");
  });

  it("does not render a goal line when no goal is present", () => {
    render(<SaverCard saver={makeSaver({ goal: null })} />);
    expect(screen.queryByText(/^Goal/)).toBeNull();
  });

  it("renders a balance/target progress bar for a goal saver (width = goalProgress)", () => {
    render(<SaverCard saver={makeSaver({ analysis: goalAnalysis({ goalProgress: 0.5 }) })} />);
    const bar = screen.getByTestId("saver-bar").firstElementChild as HTMLElement;
    expect(bar.style.width).toBe("50%");
  });

  it("shows 'Goal met' and a full bar when the target is reached", () => {
    render(<SaverCard saver={makeSaver({ analysis: goalAnalysis({ status: "GOAL_MET", goalProgress: 1 }) })} />);
    expect(screen.getByText("Goal met")).toBeInTheDocument();
    const bar = screen.getByTestId("saver-bar").firstElementChild as HTMLElement;
    expect(bar.style.width).toBe("100%");
  });

  it("renders NO progress bar for an envelope saver (no target to progress toward)", () => {
    render(<SaverCard saver={makeSaver()} />);
    expect(screen.queryByTestId("saver-bar")).toBeNull();
  });

  // --- 6-month breakdown ---
  it("renders a month label for each entry in last6Months", () => {
    const analysis = {
      ...makeSaver().analysis,
      last6Months: [
        { month: "2026-05", allocated: 60000, spent: 40000, variance: 20000 },
        { month: "2026-04", allocated: 60000, spent: 55000, variance: 5000 },
        { month: "2026-03", allocated: 60000, spent: 62000, variance: -2000 },
      ],
    };
    render(<SaverCard saver={makeSaver({ analysis })} />);
    // Should show short month labels (oldest-to-newest left-to-right)
    expect(screen.getByTestId("saver-month-history")).toBeInTheDocument();
    expect(screen.getAllByTestId("saver-month-row").length).toBe(3);
  });

  it("renders variance via Money for each month row", () => {
    const analysis = {
      ...makeSaver().analysis,
      last6Months: [
        { month: "2026-05", allocated: 60000, spent: 40000, variance: 20000 },
      ],
    };
    render(<SaverCard saver={makeSaver({ analysis })} />);
    // Variance of 20000 cents = $200 saved
    expect(screen.getByTestId("saver-month-variance")).toBeInTheDocument();
  });

  it("omits the 6-month section when last6Months is empty", () => {
    render(<SaverCard saver={makeSaver()} />);
    expect(screen.queryByTestId("saver-month-history")).toBeNull();
  });
});
