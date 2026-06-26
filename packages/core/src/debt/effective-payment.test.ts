import { describe, it, expect } from "vitest";
import { effectiveDebtPaymentCents } from "./effective-payment";

describe("effectiveDebtPaymentCents", () => {
  it("returns the actual payment when present (even if a minimum is also set)", () => {
    expect(
      effectiveDebtPaymentCents({ actualPaymentCents: 7300, minimumPaymentCents: 5000, monthlyPaymentCents: 20000 }),
    ).toBe(7300);
  });

  it("returns the actual payment when it is zero (zero is a real matched amount, not absent)", () => {
    expect(
      effectiveDebtPaymentCents({ actualPaymentCents: 0, minimumPaymentCents: 5000, monthlyPaymentCents: 20000 }),
    ).toBe(0);
  });

  it("falls back to the typed minimum when there is no actual payment", () => {
    expect(
      effectiveDebtPaymentCents({ actualPaymentCents: null, minimumPaymentCents: 5000, monthlyPaymentCents: 20000 }),
    ).toBe(5000);
  });

  it("falls back to monthlyPayment when minimum is null and there is no actual payment", () => {
    expect(
      effectiveDebtPaymentCents({ actualPaymentCents: null, minimumPaymentCents: null, monthlyPaymentCents: 20000 }),
    ).toBe(20000);
  });
});
