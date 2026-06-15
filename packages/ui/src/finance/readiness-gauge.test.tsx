import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ReadinessGauge } from "./readiness-gauge";

describe("ReadinessGauge", () => {
  it("renders the percent text", () => {
    const { getByText } = render(<ReadinessGauge percent={72} />);
    expect(getByText("72%")).toBeTruthy();
  });

  it("renders an SVG with circles for the ring", () => {
    const { container } = render(<ReadinessGauge percent={50} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThanOrEqual(2); // track + arc
  });

  it("renders sub label when provided", () => {
    const { getByText } = render(<ReadinessGauge percent={80} sub="of goal" />);
    expect(getByText("of goal")).toBeTruthy();
  });

  it("clamps percent to 0-100 range", () => {
    // 0% — dashoffset should equal circumference (fully hidden arc)
    const { container: c0 } = render(<ReadinessGauge percent={0} />);
    expect(c0.querySelector("svg")).toBeTruthy();
    // 100% — no error
    const { container: c100 } = render(<ReadinessGauge percent={100} />);
    expect(c100.querySelector("svg")).toBeTruthy();
  });

  it("applies custom size", () => {
    const { container } = render(<ReadinessGauge percent={50} size={120} />);
    const svg = container.querySelector("svg") as SVGElement;
    expect(svg.getAttribute("width")).toBe("120");
    expect(svg.getAttribute("height")).toBe("120");
  });
});
