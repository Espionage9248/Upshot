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

  it("shows 'Synced' and an income-coloured dot when healthy (default)", () => {
    const { getByText, container } = render(<TopBar title="Today" />);
    expect(getByText("Synced")).toBeTruthy();
    const dot = container.querySelector("[data-sync-dot]") as HTMLElement;
    expect(dot.style.background).toContain("var(--income)");
  });

  it("shows 'Sync issue' and a coral dot when unhealthy", () => {
    const { getByText, container } = render(
      <TopBar title="Today" healthy={false} />,
    );
    expect(getByText("Sync issue")).toBeTruthy();
    const dot = container.querySelector("[data-sync-dot]") as HTMLElement;
    expect(dot.style.background).toContain("var(--coral)");
  });
});
