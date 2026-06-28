import { describe, it, expect } from "vitest";
import { parseMoneyCents, parseAmountCents, parseStatementDate } from "./parse";

describe("parseMoneyCents", () => {
  it("parses dollars + cents with $ and thousands separators", () => {
    expect(parseMoneyCents("$1,234.56")).toBe(123456);
    expect(parseMoneyCents("$5.00")).toBe(500);
    expect(parseMoneyCents("$0.07")).toBe(7);
  });
  it("honours an explicit sign; bare is positive", () => {
    expect(parseMoneyCents("+$10.00")).toBe(1000);
    expect(parseMoneyCents("-$10.00")).toBe(-1000);
    expect(parseMoneyCents("$10.00")).toBe(1000);
  });
  it("pads a single decimal place", () => {
    expect(parseMoneyCents("$10.5")).toBe(1050);
  });
  it("throws on a non-money token (never NaN)", () => {
    expect(() => parseMoneyCents("Purchase")).toThrow();
  });
});

describe("parseAmountCents (ledger amount column)", () => {
  it("treats a +prefixed token as money IN (positive)", () => {
    expect(parseAmountCents("+$250.00")).toBe(25000);
  });
  it("treats a bare or -prefixed token as money OUT (negative)", () => {
    expect(parseAmountCents("$50.00")).toBe(-5000);
    expect(parseAmountCents("-$50.00")).toBe(-5000);
  });
});

describe("parseStatementDate", () => {
  it("maps 'Tuesday, 14 Mar' + FY year to ISO", () => {
    expect(parseStatementDate("Tuesday, 14 Mar", 2023)).toBe("2023-03-14");
  });
  it("zero-pads day and month", () => {
    expect(parseStatementDate("Friday, 1 May", 2021)).toBe("2021-05-01");
  });
});
