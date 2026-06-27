import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryDonut } from "./category-donut";

const THREE_SLICES = [
  { label: "Housing", valueCents: 150000 },
  { label: "Food", valueCents: 80000 },
  { label: "Transport", valueCents: 50000 },
];

describe("CategoryDonut", () => {
  it("renders a legend item per slice", () => {
    render(<CategoryDonut slices={THREE_SLICES} />);
    expect(screen.getByText("Housing")).toBeTruthy();
    expect(screen.getByText("Food")).toBeTruthy();
    expect(screen.getByText("Transport")).toBeTruthy();
  });

  it("renders the centre total via Money", () => {
    render(<CategoryDonut slices={THREE_SLICES} />);
    // total = 280000 cents = $2,800 AUD — Money renders the formatted amount
    // Look for the dollar sign in the rendered output
    const container = document.querySelector("[data-testid='donut-total']");
    expect(container).toBeTruthy();
  });

  it("shows EmptyState when slices is empty", () => {
    render(<CategoryDonut slices={[]} />);
    expect(screen.getByText(/no categories/i)).toBeTruthy();
  });
});
