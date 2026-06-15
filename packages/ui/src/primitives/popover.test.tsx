/**
 * Popover tests — jsdom environment.
 *
 * Radix Popover uses @floating-ui for positioning, which requires
 * ResizeObserver and getBoundingClientRect. We stub both.
 *
 * What we test:
 *   (1) Trigger click opens popover content
 *   (2) Content carries the --elev-pop shadow token class
 *   (3) Escape closes the popover (assert open then close)
 *
 * What we stub / route around:
 *   - ResizeObserver (no-op)
 *   - hasPointerCapture / setPointerCapture / releasePointerCapture
 *   - getBoundingClientRect returns a zero-size rect (positioning irrelevant)
 *   - scrollIntoView (no-op)
 *   - Pixel positions are not asserted (jsdom has no layout engine)
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";

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
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  // floating-ui uses getBoundingClientRect for positioning
  if (!window.Element.prototype.getBoundingClientRect) {
    window.Element.prototype.getBoundingClientRect = () =>
      ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => {} } as DOMRect);
  }
});

describe("Popover", () => {
  it("(1) trigger click opens popover content", () => {
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>
          <p>Popover body</p>
        </PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText("Popover body")).toBeNull();
    fireEvent.click(screen.getByText("Open Popover"));
    expect(screen.getByText("Popover body")).toBeInTheDocument();
  });

  it("(2) content has the --elev-pop shadow token class", () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <p>Content</p>
        </PopoverContent>
      </Popover>,
    );

    // Find the popover content container (the styled div wrapping the content)
    const content = screen.getByText("Content").closest("[class]");
    expect(content).not.toBeNull();
    // Walk up to find the element with elev-pop
    let el: HTMLElement | null = content as HTMLElement;
    let found = false;
    while (el) {
      if (el.className && el.className.includes("--elev-pop")) {
        found = true;
        break;
      }
      el = el.parentElement;
    }
    expect(found).toBe(true);
  });

  it("(3) Escape closes the popover", () => {
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>
          <p>Closeable content</p>
        </PopoverContent>
      </Popover>,
    );

    fireEvent.click(screen.getByText("Open Popover"));
    expect(screen.getByText("Closeable content")).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
      code: "Escape",
    });

    expect(screen.queryByText("Closeable content")).toBeNull();
  });
});
