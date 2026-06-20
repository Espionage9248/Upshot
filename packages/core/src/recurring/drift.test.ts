import { describe, it, expect } from "vitest";
import { priceDrift, findOverlaps } from "./drift";

describe("priceDrift", () => {
  it("detects a price increase as changed", () => {
    const result = priceDrift(
      { amountCents: 1500, lastAmountCents: 1500 },
      1700,
    );
    expect(result.changed).toBe(true);
    expect(result.previousAmountCents).toBe(1500);
    expect(result.newAmountCents).toBe(1700);
  });

  it("detects a price decrease as changed", () => {
    const result = priceDrift(
      { amountCents: 2000, lastAmountCents: 2000 },
      1800,
    );
    expect(result.changed).toBe(true);
    expect(result.newAmountCents).toBe(1800);
    expect(result.previousAmountCents).toBe(2000);
  });

  it("returns changed:false when charge equals current amount", () => {
    const result = priceDrift(
      { amountCents: 1500, lastAmountCents: 1500 },
      1500,
    );
    expect(result.changed).toBe(false);
    expect(result.newAmountCents).toBe(1500);
    expect(result.previousAmountCents).toBe(1500);
  });

  it("handles null lastAmountCents — treats current as previous", () => {
    const result = priceDrift(
      { amountCents: 1500, lastAmountCents: null },
      1700,
    );
    expect(result.changed).toBe(true);
    expect(result.previousAmountCents).toBeNull();
    expect(result.newAmountCents).toBe(1700);
  });

  it("with tolerance 0.001 — ignores 1-cent rounding difference", () => {
    // 1499 vs 1500 = 0.067% difference — below 0.1% tolerance
    const result = priceDrift(
      { amountCents: 1500, lastAmountCents: 1500 },
      1501,
      0.001,
    );
    // 1 cent difference / 1500 = 0.000667, which is < 0.001 tolerance
    expect(result.changed).toBe(false);
  });

  it("with tolerance 0.001 — still detects real price change", () => {
    // 1500 vs 1600 = 6.7% difference — above 0.1% tolerance
    const result = priceDrift(
      { amountCents: 1500, lastAmountCents: 1500 },
      1600,
      0.001,
    );
    expect(result.changed).toBe(true);
  });

  it("default tolerance 0.0 — any difference triggers change", () => {
    const result = priceDrift(
      { amountCents: 1500, lastAmountCents: 1500 },
      1501,
    );
    expect(result.changed).toBe(true);
  });
});

describe("findOverlaps", () => {
  it("groups two items sharing the same category into one OverlapGroup", () => {
    const items = [
      { id: "a", category: "Streaming", merchant: null },
      { id: "b", category: "Streaming", merchant: null },
      { id: "c", category: "Music", merchant: null },
    ];
    const groups = findOverlaps(items);
    // Only the Streaming pair forms a group (size >= 2)
    expect(groups).toHaveLength(1);
    expect(groups[0]!.itemIds).toContain("a");
    expect(groups[0]!.itemIds).toContain("b");
    expect(groups[0]!.itemIds).not.toContain("c");
  });

  it("groups two items sharing the same merchant into one OverlapGroup", () => {
    const items = [
      { id: "a", category: null, merchant: "Apple" },
      { id: "b", category: null, merchant: "Apple" },
      { id: "c", category: null, merchant: "Google" },
    ];
    const groups = findOverlaps(items);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.itemIds).toContain("a");
    expect(groups[0]!.itemIds).toContain("b");
  });

  it("excludes singletons — items with unique category+merchant", () => {
    const items = [
      { id: "a", category: "Streaming", merchant: "Netflix" },
      { id: "b", category: "Gaming", merchant: "Steam" },
    ];
    const groups = findOverlaps(items);
    expect(groups).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    expect(findOverlaps([])).toHaveLength(0);
  });

  it("groups three items sharing the same category", () => {
    const items = [
      { id: "a", category: "Streaming", merchant: null },
      { id: "b", category: "Streaming", merchant: null },
      { id: "c", category: "Streaming", merchant: null },
    ];
    const groups = findOverlaps(items);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.itemIds).toHaveLength(3);
  });

  it("an item with null category and null merchant is not grouped", () => {
    const items = [
      { id: "a", category: null, merchant: null },
      { id: "b", category: null, merchant: null },
    ];
    // null/null items should not form overlap groups
    const groups = findOverlaps(items);
    expect(groups).toHaveLength(0);
  });
});
