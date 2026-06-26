import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoneyFlowSankey } from "./money-flow-sankey";

const CATEGORIES = [
  { label: "Housing", valueCents: 210000 },
  { label: "Groceries", valueCents: 64000 },
];

describe("MoneyFlowSankey", () => {
  it("renders an svg with role=img and aria-label for valid income", () => {
    render(
      <MoneyFlowSankey
        incomeCents={496000}
        categories={CATEGORIES}
        savedCents={77000}
      />,
    );
    const svg = screen.getByRole("img");
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("aria-label")).toBeTruthy();
  });

  it("renders a node rect and link path per category and saved sink", () => {
    const { container } = render(
      <MoneyFlowSankey
        incomeCents={496000}
        categories={CATEGORIES}
        savedCents={77000}
      />,
    );
    // Each category + saved sink should have a rect (node) and a path (link)
    // We have 2 categories + 1 saved = 3 sinks; plus income node + merged node = 5 total nodes
    const rects = container.querySelectorAll("rect[data-node]");
    expect(rects.length).toBeGreaterThanOrEqual(3); // at minimum the sink nodes

    const paths = container.querySelectorAll("path[data-link]");
    // links: 1 (income→merged) + 3 (merged→each sink)
    expect(paths.length).toBeGreaterThanOrEqual(3); // at minimum the merged→sink links
  });

  it("renders category and saved labels in the legend", () => {
    render(
      <MoneyFlowSankey
        incomeCents={496000}
        categories={CATEGORIES}
        savedCents={77000}
      />,
    );
    // Labels appear in both SVG text nodes and legend spans — use getAllByText
    expect(screen.getAllByText("Housing").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Groceries").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Saved").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Income").length).toBeGreaterThanOrEqual(1);
  });

  it("does not throw when categories is empty (all income saved)", () => {
    expect(() =>
      render(
        <MoneyFlowSankey
          incomeCents={100000}
          categories={[]}
          savedCents={100000}
        />,
      ),
    ).not.toThrow();
  });

  it("shows EmptyState when incomeCents is zero", () => {
    render(
      <MoneyFlowSankey
        incomeCents={0}
        categories={CATEGORIES}
        savedCents={0}
      />,
    );
    expect(screen.queryByRole("img")).toBeNull();
    // EmptyState renders a text hint
    expect(screen.getByText(/no income data/i)).toBeTruthy();
  });
});
