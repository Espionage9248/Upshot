import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UiProgress } from "./progress";

describe("UiProgress", () => {
  it("renders role=progressbar with aria-valuenow and aria-valuemax", () => {
    render(<UiProgress value={68} max={100} aria-label="Budget used" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute("aria-valuenow", "68");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("indeterminate (no value) has no aria-valuenow and a reduced-motion-safe animation", () => {
    render(<UiProgress aria-label="Loading" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    const indicator = screen.getByTestId("progress-indicator");
    expect(indicator).toHaveClass("animate-pulse");
    expect(indicator).toHaveClass("motion-reduce:animate-none");
  });
});
