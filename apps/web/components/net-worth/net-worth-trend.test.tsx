import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NetWorthTrend } from "./net-worth-trend";
import type { TrendPoint } from "@/app/(app)/net-worth/data";

const SERIES: TrendPoint[] = [
  { at: "2026-04", assetsCents: 5300000, debtsCents: 800000, netCents: 4500000 },
  { at: "2026-05", assetsCents: 5500000, debtsCents: 824000, netCents: 4676000 },
];

describe("NetWorthTrend", () => {
  it("renders an SVG with the assets, debts and net paths when given a series", () => {
    const { container } = render(<NetWorthTrend series={SERIES} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    // assets area + line, debts area + line, net line = at least 5 paths.
    expect(container.querySelectorAll("path").length).toBeGreaterThanOrEqual(5);
  });

  it("renders the legend footer totals (assets / debts / net)", () => {
    render(<NetWorthTrend series={SERIES} />);
    expect(screen.getByText(/assets/i)).toBeInTheDocument();
    expect(screen.getByText(/debts/i)).toBeInTheDocument();
    expect(screen.getByText(/^net$/i)).toBeInTheDocument();
  });

  it("renders an EmptyState (no chart) when the series is empty", () => {
    const { container } = render(<NetWorthTrend series={[]} />);
    // the chart svg carries role="img"; the EmptyState icon svg does not.
    expect(container.querySelector('svg[role="img"]')).not.toBeInTheDocument();
    expect(screen.getByText(/no trend yet/i)).toBeInTheDocument();
  });
});
