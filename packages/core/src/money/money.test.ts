import { describe, expect, it } from "vitest";
import { Money } from "./money";

describe("Money.fromUpAmount", () => {
  it("parses a negative two-decimal string to cents", () => {
    expect(Money.fromUpAmount("-59.99").cents).toBe(-5999);
  });
  it("parses a positive value", () => {
    expect(Money.fromUpAmount("12.30").cents).toBe(1230);
  });
  it("pads a single decimal place", () => {
    expect(Money.fromUpAmount("12.3").cents).toBe(1230);
  });
  it("parses a whole number with no decimal point", () => {
    expect(Money.fromUpAmount("1000").cents).toBe(100000);
  });
  it("treats negative zero as zero", () => {
    expect(Money.fromUpAmount("-0.00").cents).toBe(0);
  });
  it("defaults to AUD and accepts an override", () => {
    expect(Money.fromUpAmount("1.00").currency).toBe("AUD");
    expect(Money.fromUpAmount("1.00", "USD").currency).toBe("USD");
  });
  it("rejects more than two decimal places", () => {
    expect(() => Money.fromUpAmount("12.345")).toThrow(RangeError);
  });
  it("rejects non-numeric input", () => {
    expect(() => Money.fromUpAmount("abc")).toThrow(RangeError);
  });
});

describe("Money.fromCents", () => {
  it("rejects non-integers", () => {
    expect(() => Money.fromCents(10.5)).toThrow(RangeError);
  });
  it("collapses negative zero to zero", () => {
    expect(Object.is(Money.fromCents(-0).cents, 0)).toBe(true);
  });
});

describe("arithmetic", () => {
  it("adds and subtracts within a currency", () => {
    const a = Money.fromCents(100);
    const b = Money.fromCents(250);
    expect(a.add(b).cents).toBe(350);
    expect(b.subtract(a).cents).toBe(150);
  });
  it("negates and abs", () => {
    expect(Money.fromCents(-500).negate().cents).toBe(500);
    expect(Money.fromCents(-500).abs().cents).toBe(500);
  });
  it("multiplies by an integer scalar only", () => {
    expect(Money.fromCents(100).multiply(3).cents).toBe(300);
    expect(() => Money.fromCents(100).multiply(1.5)).toThrow(RangeError);
  });
  it("refuses to mix currencies", () => {
    expect(() => Money.fromCents(1, "AUD").add(Money.fromCents(1, "USD"))).toThrow(TypeError);
  });
});

describe("formatting", () => {
  it("renders AUD with grouping and sign", () => {
    expect(Money.fromCents(123456).format()).toBe("$1,234.56");
    expect(Money.fromCents(-123456).format()).toBe("-$1,234.56");
    expect(Money.fromCents(0).format()).toBe("$0.00");
  });
  it("round-trips through toDecimalString", () => {
    expect(Money.fromCents(-5999).toDecimalString()).toBe("-59.99");
    expect(Money.fromCents(0).toDecimalString()).toBe("0.00");
  });
});
