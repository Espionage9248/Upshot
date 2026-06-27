import { describe, it, expect } from "vitest";
import { momDelta } from "./deltas";

describe("momDelta", () => {
  it("+25% change → changePct≈25, direction=up", () => {
    const result = momDelta(12500, 10000);
    expect(result.changePct).toBeCloseTo(25, 5);
    expect(result.direction).toBe("up");
  });

  it("−10% change → changePct≈−10, direction=down", () => {
    const result = momDelta(9000, 10000);
    expect(result.changePct).toBeCloseTo(-10, 5);
    expect(result.direction).toBe("down");
  });

  it("equal values → changePct===0, direction=flat", () => {
    const result = momDelta(10000, 10000);
    expect(result.changePct).toBe(0);
    expect(result.direction).toBe("flat");
  });

  it("previousCents===0 → changePct===null", () => {
    const result = momDelta(5000, 0);
    expect(result.changePct).toBeNull();
  });

  it("direction=flat when previousCents===0 and current===0", () => {
    const result = momDelta(0, 0);
    expect(result.changePct).toBeNull();
    expect(result.direction).toBe("flat");
  });

  it("currentCents===0 and previousCents>0 → changePct===-100, direction=down", () => {
    const result = momDelta(0, 10000);
    expect(result.changePct).toBeCloseTo(-100, 5);
    expect(result.direction).toBe("down");
  });
});
