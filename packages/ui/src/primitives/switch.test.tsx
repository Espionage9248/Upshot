import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UiSwitch } from "./switch";

describe("UiSwitch", () => {
  it("renders with role=switch", () => {
    render(<UiSwitch aria-label="Enable notifications" />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("click toggles aria-checked from false to true and fires onCheckedChange", () => {
    const onCheckedChange = vi.fn();
    render(
      <UiSwitch
        aria-label="Enable notifications"
        defaultChecked={false}
        onCheckedChange={onCheckedChange}
      />,
    );
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "false");
    fireEvent.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("disabled prop makes the switch disabled", () => {
    render(<UiSwitch aria-label="Enable notifications" disabled />);
    const sw = screen.getByRole("switch");
    // Radix emits data-disabled on the root element when disabled
    expect(sw).toHaveAttribute("data-disabled");
  });
});
