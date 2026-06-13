import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders with aria-hidden=true", () => {
    render(<Skeleton data-testid="skel" />);
    // aria-hidden removes the element from the a11y tree; query via testid
    expect(screen.getByTestId("skel")).toHaveAttribute("aria-hidden", "true");
  });

  it("carries the shimmer animation class, paused under reduced motion", () => {
    render(<Skeleton data-testid="skel" />);
    const el = screen.getByTestId("skel");
    expect(el).toHaveClass("animate-pulse");
    expect(el).toHaveClass("motion-reduce:animate-none");
  });

  it("merges a caller-supplied className", () => {
    render(<Skeleton data-testid="skel" className="h-4 w-32 rounded-full" />);
    const el = screen.getByTestId("skel");
    expect(el).toHaveClass("h-4");
    expect(el).toHaveClass("w-32");
    expect(el).toHaveClass("rounded-full");
  });
});
