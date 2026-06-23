import { render, screen, act } from "@testing-library/react";
import { test, expect, vi } from "vitest";
import { Toaster, toast } from "./toast";

test("shows a toast in a status region", () => {
  render(<Toaster />);
  act(() => { toast({ title: "Saved as a scenario", tone: "success" }); });
  expect(screen.getByText("Saved as a scenario")).toBeInTheDocument();
  expect(screen.getByRole("status")).toBeInTheDocument();
});

test("auto-dismisses after the timeout", () => {
  vi.useFakeTimers();
  try {
    render(<Toaster />);
    act(() => { toast({ title: "Plan locked in", tone: "locked" }); });
    expect(screen.getByText("Plan locked in")).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(3300); });
    expect(screen.queryByText("Plan locked in")).not.toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
