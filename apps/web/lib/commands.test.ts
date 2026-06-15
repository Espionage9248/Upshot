import { describe, expect, it } from "vitest";
import {
  buildResults,
  groupResults,
  moveActiveIndex,
  roomForDigit,
} from "./commands";

describe("buildResults", () => {
  it("returns the full list (rooms then actions) for an empty query", () => {
    const all = buildResults("");
    // 5 rooms + 3 actions
    expect(all).toHaveLength(8);
    // Go-to group comes first, then Actions.
    expect(all.slice(0, 5).every((c) => c.kind === "go-to")).toBe(true);
    expect(all.slice(5).every((c) => c.kind === "action")).toBe(true);
    expect(all[0]?.label).toBe("Today");
    expect(all[4]?.label).toBe("Analyze");
  });

  it("treats a whitespace-only query as empty", () => {
    expect(buildResults("   ")).toHaveLength(8);
  });

  it("filters to Money on a partial label match", () => {
    const r = buildResults("mon");
    expect(r).toHaveLength(1);
    expect(r[0]?.label).toBe("Money");
    expect(r[0]?.href).toBe("/money");
  });

  it("is case-insensitive", () => {
    expect(buildResults("MONEY")).toHaveLength(1);
    expect(buildResults("money")[0]?.label).toBe("Money");
  });

  it("matches action labels too", () => {
    const r = buildResults("deductible");
    expect(r).toHaveLength(1);
    expect(r[0]?.kind).toBe("action");
  });

  it("returns an empty list when nothing matches", () => {
    expect(buildResults("zzzznope")).toEqual([]);
  });
});

describe("groupResults", () => {
  it("preserves Go-to-before-Actions order with grouped items", () => {
    const groups = groupResults(buildResults(""));
    expect(groups.map((g) => g.group)).toEqual(["Go to", "Actions"]);
    expect(groups[0]?.items).toHaveLength(5);
    expect(groups[1]?.items).toHaveLength(3);
  });

  it("omits a group with no matching items", () => {
    const groups = groupResults(buildResults("mon"));
    expect(groups.map((g) => g.group)).toEqual(["Go to"]);
  });
});

describe("roomForDigit", () => {
  it("maps 1..5 to room hrefs", () => {
    expect(roomForDigit(1)).toBe("/today");
    expect(roomForDigit(2)).toBe("/money");
    expect(roomForDigit(3)).toBe("/budget");
    expect(roomForDigit(4)).toBe("/plan");
    expect(roomForDigit(5)).toBe("/analyze");
  });

  it("returns undefined out of range", () => {
    expect(roomForDigit(0)).toBeUndefined();
    expect(roomForDigit(6)).toBeUndefined();
  });
});

describe("moveActiveIndex", () => {
  it("moves down and up within bounds", () => {
    expect(moveActiveIndex(0, "ArrowDown", 3)).toBe(1);
    expect(moveActiveIndex(2, "ArrowUp", 3)).toBe(1);
  });

  it("wraps down from the last row to the first", () => {
    expect(moveActiveIndex(2, "ArrowDown", 3)).toBe(0);
  });

  it("wraps up from the first row to the last", () => {
    expect(moveActiveIndex(0, "ArrowUp", 3)).toBe(2);
  });

  it("returns -1 for an empty list", () => {
    expect(moveActiveIndex(0, "ArrowDown", 0)).toBe(-1);
    expect(moveActiveIndex(0, "ArrowUp", 0)).toBe(-1);
  });
});
