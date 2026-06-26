import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreakIndicator } from "./streak-indicator";

describe("StreakIndicator", () => {
  it("renders the current streak count", () => {
    render(<StreakIndicator currentDays={14} bestDays={30} />);
    expect(screen.getByText("14")).toBeTruthy();
  });

  it("renders the best days text", () => {
    render(<StreakIndicator currentDays={14} bestDays={30} />);
    expect(screen.getByText(/best 30/i)).toBeTruthy();
  });

  it("renders current count 0 without error", () => {
    render(<StreakIndicator currentDays={0} bestDays={0} />);
    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.getByText(/best 0/i)).toBeTruthy();
  });
});
