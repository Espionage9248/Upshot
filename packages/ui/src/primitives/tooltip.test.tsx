/**
 * Tooltip tests — jsdom environment.
 *
 * Radix Tooltip renders content text twice:
 *   1. In the visible styled div (data-state=instant-open/delayed-open)
 *   2. In a visually-hidden <span role="tooltip"> for a11y
 * We use getByRole("tooltip") to query the accessible element, which
 * is always present once the tooltip is open.
 *
 * jsdom limitations:
 *   - No layout engine, so tooltip positioning is not tested.
 *   - Radix Tooltip requires ResizeObserver and pointer stubs.
 *
 * What we test:
 *   (1) Tooltip renders its trigger child without throwing
 *   (2) Focus on the trigger shows the tooltip (role="tooltip" present)
 *   (3) Blur on the trigger hides the tooltip (role="tooltip" gone)
 *   (4) The tooltip content div carries the --elev-pop class
 *
 * What we stub / route around:
 *   - ResizeObserver (no-op)
 *   - Pointer-capture APIs (no-op)
 *   - Pixel positions not asserted
 *   - We use delayDuration={0} in tests to skip the 150ms open delay
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import { Tooltip } from "./tooltip";

beforeAll(() => {
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!window.HTMLElement.prototype.releasePointerCapture) {
    window.HTMLElement.prototype.releasePointerCapture = () => {};
  }
  if (!window.HTMLElement.prototype.setPointerCapture) {
    window.HTMLElement.prototype.setPointerCapture = () => {};
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!window.Element.prototype.getBoundingClientRect) {
    window.Element.prototype.getBoundingClientRect = () =>
      ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => {} } as DOMRect);
  }
});

describe("Tooltip", () => {
  it("(1) renders its trigger child without throwing", () => {
    render(
      <Tooltip content="Helpful tip" delayDuration={0}>
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("(2) focus on trigger shows tooltip — role=tooltip present", async () => {
    render(
      <Tooltip content="Helpful tip" delayDuration={0}>
        <button>Hover me</button>
      </Tooltip>,
    );

    // Before focus: Radix may or may not have mounted the tooltip
    const trigger = screen.getByText("Hover me");
    await act(async () => {
      fireEvent.focus(trigger);
    });

    // The visually-hidden role="tooltip" span appears when the tooltip is open
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Helpful tip");
  });

  it("(3) blur on trigger hides the tooltip", async () => {
    render(
      <Tooltip content="Blur tip" delayDuration={0}>
        <button>Trigger</button>
      </Tooltip>,
    );

    const trigger = screen.getByText("Trigger");
    await act(async () => {
      fireEvent.focus(trigger);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await act(async () => {
      fireEvent.blur(trigger);
    });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("(4) tooltip content div carries the --elev-pop class when open", async () => {
    render(
      <Tooltip content="Token check" delayDuration={0}>
        <button>Check</button>
      </Tooltip>,
    );

    await act(async () => {
      fireEvent.focus(screen.getByText("Check"));
    });

    // The styled content div is the parent of the role="tooltip" span
    const tooltipSpan = screen.getByRole("tooltip");
    const contentDiv = tooltipSpan.parentElement;
    expect(contentDiv).not.toBeNull();
    expect(contentDiv!.className).toContain("--elev-pop");
  });
});
