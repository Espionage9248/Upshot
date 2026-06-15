import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UIcon } from "./icon";
import { UICON_KEYS } from "./registry";

describe("UIcon — render", () => {
  it("renders an svg[aria-hidden] for every key in UICON_KEYS at default size 24", () => {
    for (const key of UICON_KEYS) {
      const { container } = render(<UIcon name={key} />);
      const svg = container.querySelector("svg");
      expect(svg, `missing svg for key "${key}"`).not.toBeNull();
      expect(svg?.getAttribute("aria-hidden"), `key "${key}" should be aria-hidden`).toBe("true");
      expect(svg?.getAttribute("width"), `key "${key}" width`).toBe("24");
      expect(svg?.getAttribute("height"), `key "${key}" height`).toBe("24");
    }
  });

  it('<UIcon name="today"/> has stroke-width 1.6 at rest', () => {
    const { container } = render(<UIcon name="today" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("stroke-width")).toBe("1.6");
  });

  it('<UIcon name="today" active/> has stroke-width 1.9', () => {
    const { container } = render(<UIcon name="today" active />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("stroke-width")).toBe("1.9");
  });

  it('<UIcon name="search" label="Search"/> is role="img" with accessible name and NOT aria-hidden', () => {
    render(<UIcon name="search" label="Search" />);
    const img = screen.getByRole("img", { name: "Search" });
    expect(img).not.toBeNull();
    expect(img.getAttribute("aria-hidden")).toBeNull();
  });

  it("round caps and joins are applied", () => {
    const { container } = render(<UIcon name="bell" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("stroke-linecap")).toBe("round");
    expect(svg?.getAttribute("stroke-linejoin")).toBe("round");
  });

  it("custom size prop is applied", () => {
    const { container } = render(<UIcon name="sync" size={16} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("16");
    expect(svg?.getAttribute("height")).toBe("16");
  });

  it("className is forwarded", () => {
    const { container } = render(<UIcon name="sync" className="animate-spin" />);
    const svg = container.querySelector("svg");
    expect(svg?.classList.contains("animate-spin")).toBe(true);
  });
});
