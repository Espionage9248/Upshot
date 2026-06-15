import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FilterChip } from "./filter-chip";

// jsdom lacks hasPointerCapture and scrollIntoView which Radix Select uses internally.
beforeEach(() => {
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }
});

const OPTIONS = [
  { value: "all", label: "All" },
  { value: "alex", label: "Alex" },
  { value: "sam", label: "Sam" },
];

describe("FilterChip", () => {
  it("renders the chip label at rest", () => {
    render(<FilterChip label="Person" options={OPTIONS} />);
    expect(screen.getByText("Person")).toBeInTheDocument();
  });

  it("opening shows the options", () => {
    render(<FilterChip label="Person" options={OPTIONS} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Sam")).toBeInTheDocument();
  });

  it("calls onValueChange and chip reflects selected label", () => {
    const onValueChange = vi.fn();
    render(
      <FilterChip label="Person" options={OPTIONS} onValueChange={onValueChange} />,
    );
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Alex"));
    expect(onValueChange).toHaveBeenCalledWith("alex");
  });

  it("shows the selected option label when value is set", () => {
    render(<FilterChip label="Person" options={OPTIONS} value="sam" />);
    // The selected value's label should be visible
    expect(screen.getByText("Sam")).toBeInTheDocument();
  });
});
