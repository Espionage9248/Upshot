import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { CommandPalette } from "./command-palette";

function openPalette() {
  act(() => {
    window.dispatchEvent(new Event("upshot:open-command-palette"));
  });
}

afterEach(() => {
  push.mockClear();
  vi.useRealTimers();
});

describe("CommandPalette", () => {
  it("renders nothing visible when closed", () => {
    render(<CommandPalette />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens on the custom event and shows the Go-to rooms", () => {
    render(<CommandPalette />);
    openPalette();
    expect(screen.getByRole("dialog")).toBeTruthy();
    for (const label of ["Today", "Money", "Budget", "Plan", "Analyse"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("filters rows as the query changes", () => {
    render(<CommandPalette />);
    openPalette();
    const input = screen.getByLabelText("Search or jump to a room");
    fireEvent.change(input, { target: { value: "mon" } });
    expect(screen.getByText("Money")).toBeTruthy();
    expect(screen.queryByText("Today")).toBeNull();
  });

  it("ArrowDown moves the active row", () => {
    render(<CommandPalette />);
    openPalette();
    const dialog = screen.getByRole("dialog");
    // First row active on open.
    expect(screen.getByText("Today").closest("button")).toHaveAttribute(
      "data-active",
      "true",
    );
    fireEvent.keyDown(dialog, { key: "ArrowDown" });
    expect(screen.getByText("Money").closest("button")).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByText("Today").closest("button")).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  it("selecting a go-to row pushes the route", () => {
    render(<CommandPalette />);
    openPalette();
    fireEvent.click(screen.getByText("Budget"));
    expect(push).toHaveBeenCalledWith("/budget");
  });

  it("Enter selects the active row", () => {
    render(<CommandPalette />);
    openPalette();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/today");
  });

  it("selecting an action shows a toast and does NOT push", () => {
    render(<CommandPalette />);
    openPalette();
    fireEvent.click(screen.getByText("Flag as deductible"));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText(/coming soon/i)).toBeTruthy();
  });
});
