// packages/core/src/scenarios/forecast.test.ts
import { describe, it, expect } from "vitest";
import { buildCashflowForecast } from "./forecast";
import type { ForecastInput } from "./types";

const base: ForecastInput = {
  nowISO: "2026-06-01T00:00:00.000Z",
  startBalanceCents: 200_00,
  actualDailyNet: [
    { dateISO: "2026-05-30", netCents: -10_00 },
    { dateISO: "2026-05-31", netCents: 5_00 },
  ],
  salary: null,
  scheduledOutflows: [],
  perPayCycleAllocationCents: 0,
  avgDailyDiscretionaryCents: 0,
  stdDevDailyDiscretionaryCents: 0,
};

describe("buildCashflowForecast", () => {
  it("reconstructs the actual line backwards from the start balance", () => {
    const f = buildCashflowForecast(base, 30);
    // last actual day balance == startBalance; prior day = start - lastNet
    const last = f.actual.at(-1)!;
    const prev = f.actual.at(-2)!;
    expect(last.balanceCents).toBe(200_00);
    expect(prev.balanceCents).toBe(200_00 - 5_00); // 31st net +5 → 30th was 195
  });

  it("flat central line when no events and no drift", () => {
    const f = buildCashflowForecast(base, 30);
    expect(f.projected).toHaveLength(30);
    expect(f.projected.every((d) => d.centralCents === 200_00)).toBe(true);
    expect(f.overdraftRisk).toBe(false);
  });

  it("applies a fortnightly salary inflow on its projected pay-day", () => {
    const f = buildCashflowForecast(
      { ...base, salary: { cadenceDays: 14, amountCents: 1000_00, lastPayISO: "2026-05-25" } },
      30,
    );
    // next pays: 2026-06-08, 2026-06-22 → balance steps up by 1000 each
    const jun8 = f.projected.find((d) => d.dateISO === "2026-06-08")!;
    const jun7 = f.projected.find((d) => d.dateISO === "2026-06-07")!;
    expect(jun8.centralCents - jun7.centralCents).toBe(1000_00);
  });

  it("subtracts daily discretionary drift from the central line", () => {
    const f = buildCashflowForecast({ ...base, avgDailyDiscretionaryCents: 10_00 }, 30);
    expect(f.projected[0]!.centralCents).toBe(200_00 - 10_00);
    expect(f.projected[29]!.centralCents).toBe(200_00 - 10_00 * 30);
  });

  it("lays scheduled outflows on their dates", () => {
    const f = buildCashflowForecast(
      { ...base, scheduledOutflows: [{ dateISO: "2026-06-05", amountCents: 50_00 }] },
      30,
    );
    const d4 = f.projected.find((d) => d.dateISO === "2026-06-04")!;
    const d5 = f.projected.find((d) => d.dateISO === "2026-06-05")!;
    expect(d4.centralCents - d5.centralCents).toBe(50_00);
  });

  it("band half-width is k·σ·√d and widens monotonically", () => {
    const f = buildCashflowForecast({ ...base, stdDevDailyDiscretionaryCents: 10_00, bandK: 1 }, 30);
    const hw = (d: number) => {
      const day = f.projected[d - 1]!;
      return day.highCents - day.centralCents;
    };
    expect(hw(1)).toBe(Math.round(10_00 * Math.sqrt(1)));
    expect(hw(4)).toBe(Math.round(10_00 * Math.sqrt(4)));
    for (let d = 2; d <= 30; d++) expect(hw(d)).toBeGreaterThanOrEqual(hw(d - 1));
  });

  it("flags overdraft risk and reports the lowest day", () => {
    const f = buildCashflowForecast({ ...base, startBalanceCents: 100_00, avgDailyDiscretionaryCents: 10_00 }, 30);
    expect(f.overdraftRisk).toBe(true);
    expect(f.lowestDateISO).toBe(f.projected.at(-1)!.dateISO); // monotonically falling → last day lowest
    expect(f.lowestProjectedCents).toBe(f.projected.at(-1)!.centralCents);
  });

  it("applies income before same-day outflows (no false overdraft)", () => {
    const f = buildCashflowForecast(
      {
        ...base,
        startBalanceCents: 10_00,
        salary: { cadenceDays: 30, amountCents: 1000_00, lastPayISO: "2026-05-08" },
        scheduledOutflows: [{ dateISO: "2026-06-07", amountCents: 900_00 }],
      },
      30,
    );
    // pay-day 2026-06-07 (30d after 05-08 = 06-07): +1000 then -900 → net +100, never negative
    expect(f.overdraftRisk).toBe(false);
  });
});
