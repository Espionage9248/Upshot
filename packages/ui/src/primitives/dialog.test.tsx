/**
 * Dialog tests — jsdom environment.
 *
 * Stubs needed for Radix Dialog:
 *   - hasPointerCapture / releasePointerCapture / setPointerCapture: Radix uses
 *     these on elements for focus-related event handling.
 *   - ResizeObserver: Radix may instantiate it for content-size tracking.
 *
 * What we test:
 *   (1) Trigger opens → role="dialog" present + content text visible
 *   (2) Esc closes the dialog
 *   (3) DialogClose button closes the dialog
 *   (4) DialogContent carries the correct styling tokens
 *
 * What we stub / route around:
 *   - Pointer capture APIs (no-op mocks on HTMLElement)
 *   - ResizeObserver (no-op mock)
 *   - Animations / transitions are not tested (jsdom has no animation engine)
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog";

beforeAll(() => {
  // Radix pointer-capture stubs
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!window.HTMLElement.prototype.releasePointerCapture) {
    window.HTMLElement.prototype.releasePointerCapture = () => {};
  }
  if (!window.HTMLElement.prototype.setPointerCapture) {
    window.HTMLElement.prototype.setPointerCapture = () => {};
  }
  // ResizeObserver stub
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

function TestDialog() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Test Dialog</DialogTitle>
        <DialogDescription>Dialog description</DialogDescription>
        <p>Dialog body text</p>
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("(1) trigger click opens dialog — role=dialog present + content visible", () => {
    render(<TestDialog />);
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByText("Open"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog body text")).toBeInTheDocument();
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
  });

  it("(2) Escape closes the dialog", () => {
    render(<TestDialog />);
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
      code: "Escape",
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("(3) DialogClose button closes the dialog", () => {
    render(<TestDialog />);
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close"));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("(4) DialogContent carries the expected styling token classes", () => {
    render(<TestDialog />);
    fireEvent.click(screen.getByText("Open"));

    const dialog = screen.getByRole("dialog");
    const cls = dialog.className;

    // Surface background token
    expect(cls).toContain("--surface");
    // Card radius token
    expect(cls).toContain("--radius-card");
    // Elevation shadow token
    expect(cls).toContain("--elev-3");
  });
});
