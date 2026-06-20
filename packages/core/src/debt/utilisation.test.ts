import { it, expect } from "vitest";
import { utilisation } from "./utilisation";
it("ratio of balance to limit", () => { expect(utilisation(50000, 200000)).toBeCloseTo(0.25); });
it("null when no limit", () => { expect(utilisation(50000, null)).toBeNull(); });
it("null-safe on zero limit", () => { expect(utilisation(50000, 0)).toBeNull(); });
