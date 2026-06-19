import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { goalConfidence } from "./confidence";

describe("goalConfidence", () => {
  it("is deterministic for a fixed seed", () => {
    const input = {
      currentBalanceCents: 0,
      targetCents: 60_000,
      monthsToTarget: 6,
      historicalNetInflowsCents: [10_000, 12_000, 8_000, 11_000, 9_000, 10_000],
    };
    expect(goalConfidence(input, 42)).toEqual(goalConfidence(input, 42));
  });

  it("returns ~1 when already at target", () => {
    const r = goalConfidence(
      {
        currentBalanceCents: 60_000,
        targetCents: 60_000,
        monthsToTarget: 0,
        historicalNetInflowsCents: [1],
      },
      7,
    );
    expect(r.confidence).toBe(1);
  });

  it("is monotonic in headroom: more starting balance never lowers confidence", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 50_000 }), (extra) => {
        const hist = [5_000, 6_000, 4_000, 5_500, 5_000, 6_000];
        const lo = goalConfidence(
          {
            currentBalanceCents: 0,
            targetCents: 60_000,
            monthsToTarget: 6,
            historicalNetInflowsCents: hist,
          },
          1,
        );
        const hi = goalConfidence(
          {
            currentBalanceCents: extra,
            targetCents: 60_000,
            monthsToTarget: 6,
            historicalNetInflowsCents: hist,
          },
          1,
        );
        return hi.confidence >= lo.confidence;
      }),
    );
  });

  it("yields identical results for identical seeds across arbitrary inputs", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 0, max: 200_000 }),
        fc.integer({ min: 0, max: 12 }),
        fc.array(fc.integer({ min: -10_000, max: 20_000 }), {
          minLength: 0,
          maxLength: 8,
        }),
        fc.integer({ min: 1, max: 2 ** 31 }),
        (currentBalanceCents, targetCents, monthsToTarget, hist, seed) => {
          const input = {
            currentBalanceCents,
            targetCents,
            monthsToTarget,
            historicalNetInflowsCents: hist,
          };
          expect(goalConfidence(input, seed)).toEqual(
            goalConfidence(input, seed),
          );
        },
      ),
    );
  });
});
