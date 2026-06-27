import { describe, it, expect } from "vitest";
import {
  REPORT_FIXTURE,
  FIXTURE_NOW,
  FIXTURE_TXN_COUNT,
  FIXTURE_TOTAL_INCOME_CENTS,
} from "./fixture";

describe("REPORT_FIXTURE sanity", () => {
  it("has the expected transaction count", () => {
    expect(REPORT_FIXTURE).toHaveLength(FIXTURE_TXN_COUNT);
  });

  it("total salary income matches expected", () => {
    const total = REPORT_FIXTURE
      .filter((tx) => tx.isSalary)
      .reduce((sum, tx) => sum + tx.amountCents, 0);
    expect(total).toBe(FIXTURE_TOTAL_INCOME_CENTS);
  });

  it("FIXTURE_NOW is a valid ISO string", () => {
    expect(() => new Date(FIXTURE_NOW)).not.toThrow();
    expect(FIXTURE_NOW).toBe("2026-03-01T00:00:00.000Z");
  });

  it("has at least one transfer", () => {
    expect(REPORT_FIXTURE.some((tx) => tx.isTransfer)).toBe(true);
  });

  it("has at least one tagged txn", () => {
    expect(REPORT_FIXTURE.some((tx) => tx.tags.length > 0)).toBe(true);
  });

  it("has expenses across at least 3 categories", () => {
    const cats = new Set(
      REPORT_FIXTURE
        .filter((tx) => tx.amountCents < 0 && !tx.isTransfer)
        .map((tx) => tx.categoryId)
        .filter(Boolean),
    );
    expect(cats.size).toBeGreaterThanOrEqual(3);
  });
});
