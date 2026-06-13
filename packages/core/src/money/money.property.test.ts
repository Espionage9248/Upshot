import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { Money } from "./money";

const safeCents = fc.integer({ min: -1_000_000_000, max: 1_000_000_000 });

describe("Money property tests", () => {
  it("round-trips cents -> toDecimalString -> fromUpAmount with no cent loss", () => {
    fc.assert(
      fc.property(safeCents, (cents) => {
        const m = Money.fromCents(cents);
        expect(Money.fromUpAmount(m.toDecimalString()).cents).toBe(cents);
      }),
    );
  });

  it("never invents or loses a cent across add/subtract", () => {
    fc.assert(
      fc.property(safeCents, safeCents, (a, b) => {
        const ma = Money.fromCents(a);
        const mb = Money.fromCents(b);
        expect(ma.add(mb).subtract(mb).equals(ma)).toBe(true);
      }),
    );
  });

  it("toDecimalString -> fromUpAmount -> toDecimalString is idempotent", () => {
    fc.assert(
      fc.property(safeCents, (cents) => {
        const s = Money.fromCents(cents).toDecimalString();
        expect(Money.fromUpAmount(s).toDecimalString()).toBe(s);
      }),
    );
  });
});
