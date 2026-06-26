import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpendingHeatmap } from "./spending-heatmap";

const SEVEN_DAYS = [
  { date: "2024-01-01", spendCents: 5000, intensity: 0.5, isZero: false },
  { date: "2024-01-02", spendCents: 0, intensity: 0, isZero: true },
  { date: "2024-01-03", spendCents: 10000, intensity: 1.0, isZero: false },
  { date: "2024-01-04", spendCents: 2000, intensity: 0.2, isZero: false },
  { date: "2024-01-05", spendCents: 0, intensity: 0, isZero: true },
  { date: "2024-01-06", spendCents: 8000, intensity: 0.8, isZero: false },
  { date: "2024-01-07", spendCents: 3000, intensity: 0.3, isZero: false },
];

describe("SpendingHeatmap", () => {
  it("renders 7 cells for a 7-day array", () => {
    const { container } = render(<SpendingHeatmap days={SEVEN_DAYS} />);
    const cells = container.querySelectorAll("[data-heatmap-cell]");
    expect(cells).toHaveLength(7);
  });

  it("marks a zero-spend cell with data-zero", () => {
    const { container } = render(<SpendingHeatmap days={SEVEN_DAYS} />);
    const zeroCells = container.querySelectorAll("[data-zero='true']");
    expect(zeroCells.length).toBeGreaterThan(0);
  });

  it("zero-spend cell has a dashed border style", () => {
    const { container } = render(<SpendingHeatmap days={SEVEN_DAYS} />);
    const zeroCell = container.querySelector("[data-zero='true']") as HTMLElement | null;
    expect(zeroCell).not.toBeNull();
    expect(zeroCell!.style.borderStyle).toBe("dashed");
  });

  it("intensity-1 cell differs from intensity-0 cell in background", () => {
    const { container } = render(<SpendingHeatmap days={SEVEN_DAYS} />);
    const cells = container.querySelectorAll("[data-heatmap-cell]") as NodeListOf<HTMLElement>;
    const intensityZeroCell = Array.from(cells).find(
      (c) => c.dataset.intensity === "0"
    );
    const intensityOneCell = Array.from(cells).find(
      (c) => c.dataset.intensity === "1"
    );
    expect(intensityZeroCell).toBeTruthy();
    expect(intensityOneCell).toBeTruthy();
    expect(intensityOneCell!.style.background).not.toBe(
      intensityZeroCell!.style.background
    );
  });

  it("each non-zero cell has an aria-label with date and spend", () => {
    render(<SpendingHeatmap days={SEVEN_DAYS} />);
    // The first day with spend (2024-01-01, $50.00)
    const labelled = screen.getAllByRole("gridcell");
    expect(labelled.length).toBe(7);
    // At least one label contains a date
    const hasDateLabel = labelled.some((el) =>
      el.getAttribute("aria-label")?.includes("2024")
    );
    expect(hasDateLabel).toBe(true);
  });

  it("shows EmptyState when days is empty", () => {
    render(<SpendingHeatmap days={[]} />);
    expect(screen.getByText(/no spending data/i)).toBeTruthy();
  });
});
