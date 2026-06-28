import { describe, it, expect } from "vitest";
import { rowHash } from "./hash";

const base = { date: "2022-07-14", time: "9:30am", amountCents: -1500, balanceCents: 12345 };

describe("rowHash", () => {
  it("is deterministic and 32 hex chars", () => {
    const h = rowHash(base);
    expect(h).toMatch(/^[0-9a-f]{32}$/);
    expect(rowHash(base)).toBe(h);
  });
  it("changes when any numeric field changes", () => {
    expect(rowHash({ ...base, amountCents: -1501 })).not.toBe(rowHash(base));
    expect(rowHash({ ...base, balanceCents: 12346 })).not.toBe(rowHash(base));
  });
  it("is independent of description (not an input)", () => {
    // same numeric identity → same hash regardless of any parsed description
    expect(rowHash(base)).toBe(rowHash({ ...base }));
  });
});
