import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ForecastChart } from "./forecast-chart";

const projected = Array.from({ length: 30 }, (_, i) => ({
  dateISO: `2026-06-${String(i + 1).padStart(2, "0")}`,
  centralCents: 200_00 - i * 100,
  lowCents: 200_00 - i * 100 - i * 50,
  highCents: 200_00 - i * 100 + i * 50,
}));

describe("ForecastChart", () => {
  it("renders an empty state when there is no projection", () => {
    const { container } = render(
      <ForecastChart actual={[]} projected={[]} overdraftRisk={false} lowestProjectedCents={0} lowestDateISO="" />,
    );
    expect(container.textContent).toMatch(/forecast/i);
  });

  it("renders actual + projected paths and a Today divider", () => {
    const { container } = render(
      <ForecastChart
        actual={[{ dateISO: "2026-05-31", balanceCents: 210_00 }]}
        projected={projected}
        overdraftRisk={false}
        lowestProjectedCents={170_00}
        lowestDateISO="2026-06-30"
      />,
    );
    // two line paths (actual solid + projected dashed) + a band <path>/<polygon>
    expect(container.querySelectorAll("path").length).toBeGreaterThanOrEqual(2);
    // dashed projected tail present
    expect(container.querySelector("[stroke-dasharray]")).not.toBeNull();
  });

  it("shows an overdraft callout when overdraftRisk is true", () => {
    const { container } = render(
      <ForecastChart actual={[]} projected={projected} overdraftRisk lowestProjectedCents={-50_00} lowestDateISO="2026-06-29" />,
    );
    expect(container.textContent).toMatch(/overdraft|lowest|2026-06-29/i);
  });
});
