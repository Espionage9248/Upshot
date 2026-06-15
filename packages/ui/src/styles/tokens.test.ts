// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(fileURLToPath(new URL("./tokens.css", import.meta.url)), "utf8");

describe("design tokens — contract fidelity", () => {
  it("declares the dark custom-variant (class-based, not media)", () => {
    expect(css).toContain("@custom-variant dark (&:where(.dark, .dark *))");
  });
  it("anchors the brand to Up Sunset Orange in both modes", () => {
    expect(css.match(/--coral:\s*#ff705c/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
  it("uses the lifted focus colour in dark", () => {
    expect(css).toContain("#ff8473");
  });
  it("keeps the radius + money type scale exact", () => {
    expect(css).toContain("--radius-card: 18px");
    expect(css).toContain("--radius-data: 9px");
    expect(css).toContain("--text-money-xl: 2.875rem");
  });
  it("declares the finance semantic + viz token names", () => {
    for (const t of ["--income","--expense","--transfer","--saved","--debt","--warn","--proj","--viz-1","--viz-7"]) {
      expect(css).toContain(t);
    }
  });
  it("ships the .tnum tabular-figures helper and reduced-motion guard", () => {
    expect(css).toContain(".tnum");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});
