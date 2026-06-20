import { describe, it, expect } from "vitest";
import { addMonths, monthsBetween } from "./months";

describe("addMonths", () => {
  it("rolls the year over", () => { expect(addMonths("2026-12", 1)).toBe("2027-01"); });
  it("adds within a year", () => { expect(addMonths("2026-06", 3)).toBe("2026-09"); });
});
describe("monthsBetween", () => {
  it("counts forward months", () => { expect(monthsBetween("2026-06", "2026-09")).toBe(3); });
  it("never negative", () => { expect(monthsBetween("2026-09", "2026-06")).toBe(0); });
});
