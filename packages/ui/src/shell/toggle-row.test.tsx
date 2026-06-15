import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ToggleRow } from "./toggle-row";

describe("ToggleRow", () => {
  it("renders the label", () => {
    render(<ToggleRow label="Sync on Wi-Fi" />);
    expect(screen.getByText("Sync on Wi-Fi")).toBeInTheDocument();
  });

  it("renders the sub text when provided", () => {
    render(<ToggleRow label="Sync on Wi-Fi" sub="Pause syncing on mobile data" />);
    expect(screen.getByText("Pause syncing on mobile data")).toBeInTheDocument();
  });

  it("does not render sub when omitted", () => {
    render(<ToggleRow label="Sync on Wi-Fi" />);
    expect(screen.queryByText("Pause syncing on mobile data")).toBeNull();
  });

  it("contains a switch with role=switch", () => {
    render(<ToggleRow label="Sync on Wi-Fi" />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("the switch is accessible via the label (aria-label)", () => {
    render(<ToggleRow label="Sync on Wi-Fi" />);
    expect(screen.getByRole("switch", { name: "Sync on Wi-Fi" })).toBeInTheDocument();
  });

  it("calls onCheckedChange when the switch is clicked", () => {
    const onCheckedChange = vi.fn();
    render(<ToggleRow label="Notify me" onCheckedChange={onCheckedChange} defaultChecked={false} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("reflects checked state", () => {
    render(<ToggleRow label="Notify me" checked={true} onCheckedChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "checked");
  });
});
