import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Segmented } from "./segmented";

const OPTIONS = [
  { value: "realtime", label: "Real-time" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
];

describe("Segmented", () => {
  // Radix ToggleGroup type="single" renders items as role="radio" within a radiogroup.
  it("renders all options as radio items", () => {
    render(
      <Segmented options={OPTIONS} defaultValue="realtime" aria-label="Cadence" />,
    );
    expect(screen.getByRole("radio", { name: "Real-time" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Hourly" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Daily" })).toBeInTheDocument();
  });

  it("calls onValueChange when an item is clicked", () => {
    const onValueChange = vi.fn();
    render(
      <Segmented
        options={OPTIONS}
        defaultValue="realtime"
        onValueChange={onValueChange}
        aria-label="Cadence"
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Hourly" }));
    expect(onValueChange).toHaveBeenCalledWith("hourly");
  });

  it("active item has data-state=on and the solid-coral utility classes (round3 fidelity)", () => {
    render(
      <Segmented options={OPTIONS} value="hourly" aria-label="Cadence" />,
    );
    const hourlyBtn = screen.getByRole("radio", { name: "Hourly" });
    // Radix sets data-state=on for the active item
    expect(hourlyBtn).toHaveAttribute("data-state", "on");
    // round3.jsx active segment: solid --coral fill + --on-coral text
    expect(hourlyBtn.className).toContain("data-[state=on]:bg-[var(--coral)]");
    expect(hourlyBtn.className).toContain("data-[state=on]:text-[var(--on-coral)]");
  });

  it("inactive items have data-state=off", () => {
    render(
      <Segmented options={OPTIONS} value="hourly" aria-label="Cadence" />,
    );
    const realtimeBtn = screen.getByRole("radio", { name: "Real-time" });
    expect(realtimeBtn).toHaveAttribute("data-state", "off");
  });

  it("fullWidth: root carries flex + w-full; items carry flex-1", () => {
    render(
      <Segmented options={OPTIONS} defaultValue="realtime" aria-label="Cadence" fullWidth />,
    );
    const root = screen.getByRole("group", { name: "Cadence" });
    expect(root.className).toContain("flex");
    expect(root.className).toContain("w-full");
    // Each item should have flex-1
    const items = screen.getAllByRole("radio");
    for (const item of items) {
      expect(item.className).toContain("flex-1");
    }
  });
});
