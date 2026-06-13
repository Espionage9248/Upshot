import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { UiSlider } from "./slider";

// jsdom lacks hasPointerCapture + ResizeObserver which Radix Slider uses internally.
// Stub them minimally so tests don't throw.
beforeEach(() => {
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!window.HTMLElement.prototype.setPointerCapture) {
    window.HTMLElement.prototype.setPointerCapture = () => {};
  }
  if (!window.HTMLElement.prototype.releasePointerCapture) {
    window.HTMLElement.prototype.releasePointerCapture = () => {};
  }
  // @radix-ui/react-use-size calls ResizeObserver in a layout effect
  if (typeof window.ResizeObserver === "undefined") {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

describe("UiSlider", () => {
  it("renders with role=slider and reflects aria-valuenow", () => {
    render(
      <UiSlider
        aria-label="Volume"
        defaultValue={[40]}
        min={0}
        max={100}
      />,
    );
    const thumb = screen.getByRole("slider");
    expect(thumb).toBeInTheDocument();
    expect(thumb).toHaveAttribute("aria-valuenow", "40");
  });

  it("reflects aria-valuemin and aria-valuemax from min/max props", () => {
    render(
      <UiSlider
        aria-label="Volume"
        defaultValue={[50]}
        min={10}
        max={90}
      />,
    );
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("aria-valuemin", "10");
    expect(thumb).toHaveAttribute("aria-valuemax", "90");
  });

  it("keyboard ArrowRight increments the value by step", () => {
    render(
      <UiSlider
        aria-label="Volume"
        defaultValue={[50]}
        min={0}
        max={100}
        step={1}
      />,
    );
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("tabindex");
    expect(thumb).toHaveAttribute("aria-valuenow", "50");
    // Radix Slider's arrow-key handler adjusts by `step` independent of pointer
    // geometry, so this works under jsdom (unlike click-to-position).
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(thumb).toHaveAttribute("aria-valuenow", "51");
  });
});
