/**
 * Sheet tests — jsdom environment.
 *
 * Sheet is built on Radix Dialog, so the same pointer-capture and
 * ResizeObserver stubs apply (applied in this file's beforeAll).
 *
 * What we test:
 *   (1) Trigger click opens the sheet (role="dialog" present)
 *   (2) side="bottom" → content has bottom-anchored + rounded-top classes
 *   (3) side="right" → content has right-anchored classes
 *   (4) side="bottom" → drag handle element is rendered
 *
 * What we stub / route around:
 *   - Same pointer + ResizeObserver stubs as dialog
 *   - jsdom has no layout engine — positional classes are checked as strings,
 *     not visual positions
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "./sheet";

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
});

describe("Sheet", () => {
  it("(1) trigger click opens sheet (role=dialog present)", () => {
    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent side="bottom">
          <SheetTitle>Test Sheet</SheetTitle>
          <p>Sheet body</p>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByText("Open Sheet"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("(2) side=bottom content has bottom-anchored + rounded-top classes", () => {
    render(
      <Sheet defaultOpen>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="bottom">
          <SheetTitle>Bottom Sheet</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    const dialog = screen.getByRole("dialog");
    const cls = dialog.className;
    expect(cls).toContain("bottom-0");
    expect(cls).toContain("inset-x-0");
    // rounded top corners
    expect(cls).toContain("rounded-t-");
  });

  it("(3) side=right content has right-anchored classes", () => {
    render(
      <Sheet defaultOpen>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="right">
          <SheetTitle>Right Sheet</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    const dialog = screen.getByRole("dialog");
    const cls = dialog.className;
    expect(cls).toContain("right-0");
    expect(cls).toContain("inset-y-0");
  });

  it("(4) side=bottom renders the drag handle element", () => {
    render(
      <Sheet defaultOpen>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="bottom">
          <SheetTitle>Bottom Sheet</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    const dialog = screen.getByRole("dialog");
    // drag handle is a decorative div with aria-hidden
    const handle = dialog.querySelector("[aria-hidden='true']");
    expect(handle).not.toBeNull();
  });
});
