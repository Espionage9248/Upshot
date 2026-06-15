import { describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { TopBar } from "./top-bar";

describe("TopBar", () => {
  it("renders the title and optional sub", () => {
    const { getByText } = render(<TopBar title="Today" sub="TUESDAY" />);
    expect(getByText("Today")).toBeTruthy();
    expect(getByText("TUESDAY")).toBeTruthy();
  });

  it("omits the sub when not provided", () => {
    const { queryByText } = render(<TopBar title="Money" />);
    expect(queryByText("TUESDAY")).toBeNull();
  });

  it("renders an accessible command-palette trigger button", () => {
    const { getByRole } = render(<TopBar title="Today" />);
    const btn = getByRole("button", { name: /command palette/i });
    expect(btn).toBeTruthy();
    // It is wired but the palette itself is Task 18 — clicking must not throw.
    expect(() => fireEvent.click(btn)).not.toThrow();
  });

  it("renders the bell with an accessible label", () => {
    const { getByRole } = render(<TopBar title="Today" />);
    expect(getByRole("button", { name: /notifications/i })).toBeTruthy();
  });

  it("shows a neutral 'Up to date' pill when no health is provided", () => {
    const { getByText } = render(<TopBar title="Today" />);
    expect(getByText("Up to date")).toBeTruthy();
  });

  it("reflects the mapped sync state from real health (token → Reconnect bank)", () => {
    const { getByText } = render(
      <TopBar
        title="Today"
        health={{
          lastSyncAt: "2026-06-15T07:00:00.000Z",
          lastSyncAgeMs: 60_000,
          lastStatus: "FAILED",
          tokenHealthy: false,
        }}
      />,
    );
    expect(getByText("Reconnect bank")).toBeTruthy();
  });
});
