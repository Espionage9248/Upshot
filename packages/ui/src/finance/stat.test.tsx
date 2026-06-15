import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Stat } from "./stat";

describe("Stat", () => {
  it("renders label and value", () => {
    const { getByText } = render(<Stat label="Saved" value="$4,500" />);
    expect(getByText("Saved")).toBeTruthy();
    expect(getByText("$4,500")).toBeTruthy();
  });

  it("renders trend when provided", () => {
    const { getByText } = render(
      <Stat label="Spent" value="$200" trend="▲ 12% MoM" />,
    );
    expect(getByText("▲ 12% MoM")).toBeTruthy();
  });

  it("value area uses --font-mono", () => {
    const { container } = render(<Stat label="Balance" value="$1,000" />);
    const valueEl = container.querySelector("[data-value]") as HTMLElement;
    expect(valueEl).toBeTruthy();
    expect(valueEl.style.fontFamily).toContain("--font-mono");
  });

  it("renders inline SVG polyline when spark is provided", () => {
    const { container } = render(
      <Stat label="Trend" value="$500" spark={[10, 20, 15, 25, 18]} />,
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelector("polyline")).toBeTruthy();
  });

  it("omits SVG when spark is not provided", () => {
    const { container } = render(<Stat label="Trend" value="$500" />);
    expect(container.querySelector("svg")).toBeNull();
  });
});
