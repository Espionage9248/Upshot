import { describe, it, expect } from "vitest";
import { monthsUntil } from "./months";

describe("monthsUntil", () => {
  it("is 0 for the same date", () => {
    expect(monthsUntil("2026-06-20", "2026-06-20")).toBe(0);
  });

  it("counts a date exactly N whole months ahead as N", () => {
    expect(monthsUntil("2026-06-20", "2026-12-20")).toBe(6);
    expect(monthsUntil("2026-06-20", "2027-06-20")).toBe(12);
  });

  it("ceils a partial month up to the next whole month", () => {
    // 6 months + 11 days → 7, not 6.
    expect(monthsUntil("2026-06-20", "2026-12-31")).toBe(7);
    // 1 day over a whole month → 1, not 0.
    expect(monthsUntil("2026-06-20", "2026-06-21")).toBe(1);
  });

  it("is 0 for a past target date (never negative)", () => {
    expect(monthsUntil("2026-06-20", "2026-01-01")).toBe(0);
    expect(monthsUntil("2026-06-20", "2026-06-19")).toBe(0);
  });
});
