import { describe, expect, it } from "vitest";
import { inferRecurringKind } from "./kind";

describe("inferRecurringKind", () => {
  it("classifies utility/bill categories as BILL", () => {
    expect(inferRecurringKind("Utilities", null)).toBe("BILL");
    expect(inferRecurringKind("Electricity", null)).toBe("BILL");
    expect(inferRecurringKind("Internet", null)).toBe("BILL");
    expect(inferRecurringKind("Home Insurance", null)).toBe("BILL");
    expect(inferRecurringKind("Rent", null)).toBe("BILL");
  });

  it("classifies bill-like merchants as BILL when category is uninformative", () => {
    expect(inferRecurringKind(null, "Origin Energy")).toBe("BILL");
    expect(inferRecurringKind("Other", "Telstra Mobile")).toBe("BILL");
  });

  it("defaults to SUBSCRIPTION for streaming/other", () => {
    expect(inferRecurringKind("Entertainment", "Netflix")).toBe("SUBSCRIPTION");
    expect(inferRecurringKind(null, "Patreon")).toBe("SUBSCRIPTION");
    expect(inferRecurringKind(null, null)).toBe("SUBSCRIPTION");
  });

  it("is case-insensitive", () => {
    expect(inferRecurringKind("ELECTRICITY", null)).toBe("BILL");
    expect(inferRecurringKind(null, "origin GAS")).toBe("BILL");
  });
});
