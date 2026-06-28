// packages/core/src/twoup/settlement.test.ts
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeSettlement } from "./settlement";
import type { TwoUpTxn, Owner } from "./types";

let n = 0;
function txn(owner: Owner, amountCents: number): TwoUpTxn {
  return { id: `t${n++}`, rowHash: `h${n}`, date: "2022-01-01", description: "x", amountCents, owner, category: null };
}

describe("computeSettlement", () => {
  it("with equal contributions and only shared spend, nobody is owed", () => {
    const s = computeSettlement([txn("JAMES", 10000), txn("BRITTNEY", 10000), txn("SHARED", -4000)]);
    expect(s.whoOwedWhomCents).toBe(0);
    expect(s.jamesNetCents).toBe(8000);
    expect(s.brittNetCents).toBe(8000);
  });
  it("a pool-funded personal outflow lowers ONLY that owner's net (V1 sign bug guard)", () => {
    // James funds his own debt from the pool → James should be owed LESS, not more.
    const base = computeSettlement([txn("JAMES", 10000), txn("BRITTNEY", 10000)]);
    const withDebt = computeSettlement([txn("JAMES", 10000), txn("BRITTNEY", 10000), txn("JAMES", -1000)]);
    expect(withDebt.whoOwedWhomCents).toBeLessThan(base.whoOwedWhomCents);
    expect(withDebt.whoOwedWhomCents).toBe(-1000); // (0) - (1000 - 0)
  });
  it("excludes REVERSAL from contributions", () => {
    const s = computeSettlement([txn("JAMES", 10000), txn("REVERSAL", 5000)]);
    expect(s.jamesContribCents).toBe(10000);
    expect(s.unassignedContribCents).toBe(0);
  });

  const amt = fc.integer({ min: 1, max: 5_000_00 });
  it("property: swapping JAMES↔BRITTNEY owners negates whoOwedWhom", () => {
    fc.assert(fc.property(fc.array(fc.tuple(fc.boolean(), fc.boolean(), amt), { maxLength: 30 }), (specs) => {
      const mk = (flip: boolean) => specs.map(([isIn, isJames, a]) => {
        const owner: Owner = isJames !== flip ? "JAMES" : "BRITTNEY";
        return txn(owner, isIn ? a : -a);
      });
      // Using sum-to-zero form to avoid JS −0 / Object.is edge case when both sides are 0.
      const a = computeSettlement(mk(true)).whoOwedWhomCents;
      const b = computeSettlement(mk(false)).whoOwedWhomCents;
      expect(a + b).toBe(0);
    }));
  });
  it("property: whoOwedWhom is independent of the shared-half rounding", () => {
    fc.assert(fc.property(fc.array(amt, { maxLength: 20 }), (outs) => {
      const txns = [txn("JAMES", 10000), txn("BRITTNEY", 10000), ...outs.map((a) => txn("SHARED", -a))];
      const s = computeSettlement(txns);
      expect(s.whoOwedWhomCents).toBe(0); // equal contrib, all shared → always 0 regardless of odd cents
    }));
  });
});
