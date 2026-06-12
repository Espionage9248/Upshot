import { describe, expect, it } from "vitest";
import { matchConditionSchema, matchActionSchema } from "./match-rule";

describe("match rule pieces", () => {
  it("accepts an amount-tolerance condition", () => {
    const c = matchConditionSchema.parse({
      id: "c1", ruleId: "r1", field: "description", mode: "exact", value: "patreon",
      amountCents: 1500, toleranceCents: 100, currency: "USD",
    });
    expect(c.currency).toBe("USD");
  });
  it("rejects an unknown action type", () => {
    expect(() =>
      matchActionSchema.parse({ id: "a1", ruleId: "r1", type: "DO_MAGIC", value: null, targetId: null }),
    ).toThrow();
  });
});
