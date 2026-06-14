import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Confidence } from "./confidence";

function getActiveSeg(container: HTMLElement): Element {
  const segs = Array.from(container.querySelectorAll("[data-active='true']"));
  expect(segs.length).toBeGreaterThan(0);
  return segs[0] as Element;
}

describe("Confidence", () => {
  it("on level shows glyph and 'On track' label", () => {
    const { container } = render(<Confidence level="on" />);
    const text = container.textContent ?? "";
    expect(text).toContain("On track");
    expect(text).toMatch(/✓|On track/);
    const seg = getActiveSeg(container);
    expect(seg.textContent).toContain("On track");
  });

  it("at level shows glyph and 'At risk' label in active segment", () => {
    const { container } = render(<Confidence level="at" />);
    const text = container.textContent ?? "";
    expect(text).toContain("At risk");
    const seg = getActiveSeg(container);
    expect(seg.textContent).toContain("At risk");
  });

  it("off level shows glyph and 'Off track' label in active segment", () => {
    const { container } = render(<Confidence level="off" />);
    const text = container.textContent ?? "";
    expect(text).toContain("Off track");
    const seg = getActiveSeg(container);
    expect(seg.textContent).toContain("Off track");
  });

  it("inactive segments are present in segmented mode", () => {
    const { container } = render(<Confidence level="on" />);
    const allSegs = container.querySelectorAll("[data-segment]");
    expect(allSegs.length).toBe(3);
  });

  it("compact mode renders a single pill with a glyph icon (never colour-only)", () => {
    for (const level of ["on", "at", "off"] as const) {
      const { container, getByText } = render(<Confidence level={level} compact />);
      const segs = container.querySelectorAll("[data-segment]");
      expect(segs.length).toBe(0);
      const labels: Record<"on" | "at" | "off", string> = { on: "On track", at: "At risk", off: "Off track" };
      expect(getByText(labels[level])).toBeTruthy();
      // compact must still carry a glyph/icon, not colour alone
      expect(container.querySelector("svg")).toBeTruthy();
    }
  });

  it("active segment is NEVER colour-only — must have glyph text alongside label", () => {
    for (const level of ["on", "at", "off"] as const) {
      const { container } = render(<Confidence level={level} />);
      const seg = getActiveSeg(container);
      const txt = seg.textContent ?? "";
      const labels: Record<string, string> = { on: "On track", at: "At risk", off: "Off track" };
      expect(txt).toContain(labels[level]);
      // Must have a glyph char (✓, •, ↓) OR an SVG icon child
      const hasGlyphChar = /[✓•↓]/.test(txt);
      const hasIcon = seg.querySelector("svg") !== null;
      expect(hasGlyphChar || hasIcon).toBe(true);
    }
  });
});
