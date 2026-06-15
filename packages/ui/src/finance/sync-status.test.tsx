import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SyncStatus } from "./sync-status";

describe("SyncStatus", () => {
  it("renders 'Up to date' for healthy state", () => {
    const { getByText } = render(<SyncStatus state="healthy" />);
    expect(getByText("Up to date")).toBeTruthy();
  });

  it("renders 'Syncing…' for syncing state", () => {
    const { getByText } = render(<SyncStatus state="syncing" />);
    expect(getByText("Syncing…")).toBeTruthy();
  });

  it("renders 'Sync failed' for failed state", () => {
    const { getByText } = render(<SyncStatus state="failed" />);
    expect(getByText("Sync failed")).toBeTruthy();
  });

  it("renders 'Reconnect bank' for token state", () => {
    const { getByText } = render(<SyncStatus state="token" />);
    expect(getByText("Reconnect bank")).toBeTruthy();
  });

  it("failed state fill references --expense token", () => {
    const { container } = render(<SyncStatus state="failed" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.style.background).toContain("var(--expense)");
  });

  it("healthy state fill references --income token", () => {
    const { container } = render(<SyncStatus state="healthy" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.style.background).toContain("var(--income)");
  });

  it("token state fill references --warn token", () => {
    const { container } = render(<SyncStatus state="token" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.style.background).toContain("var(--warn)");
  });

  it("syncing state fill references --text-3 token", () => {
    const { container } = render(<SyncStatus state="syncing" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.style.background).toContain("var(--text-3)");
  });

  it("renders a dot element", () => {
    const { container } = render(<SyncStatus state="healthy" />);
    const dot = container.querySelector("[data-dot]");
    expect(dot).toBeTruthy();
  });

  it("accepts a label override", () => {
    const { getByText } = render(<SyncStatus state="healthy" label="Just synced" />);
    expect(getByText("Just synced")).toBeTruthy();
  });
});
