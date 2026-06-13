import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UiCheckbox } from "./checkbox";

describe("UiCheckbox", () => {
  it("renders with role=checkbox", () => {
    render(<UiCheckbox aria-label="Accept terms" />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("click toggles aria-checked and fires onCheckedChange", () => {
    const onCheckedChange = vi.fn();
    render(
      <UiCheckbox
        aria-label="Accept terms"
        defaultChecked={false}
        onCheckedChange={onCheckedChange}
      />,
    );
    const cb = screen.getByRole("checkbox");
    expect(cb).toHaveAttribute("aria-checked", "false");
    fireEvent.click(cb);
    expect(cb).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("checked=indeterminate sets aria-checked=mixed", () => {
    render(<UiCheckbox aria-label="Select all" checked="indeterminate" />);
    const cb = screen.getByRole("checkbox");
    expect(cb).toHaveAttribute("aria-checked", "mixed");
  });
});
