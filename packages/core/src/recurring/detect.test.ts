import { describe, it, expect } from "vitest";
import { detectRecurring, detectFrequency, nextExpectedDate } from "./detect";
import type { DetectableTransaction } from "./types";

// Build a simple monthly series ~30 days apart
function monthlyTxs(description: string, amountCents: number): DetectableTransaction[] {
  return [
    { description, amountCents, date: "2026-01-05", categoryName: "Bills", accountId: "acc1", isTransfer: false, isSalary: false },
    { description, amountCents, date: "2026-02-05", categoryName: "Bills", accountId: "acc1", isTransfer: false, isSalary: false },
    { description, amountCents, date: "2026-03-05", categoryName: "Bills", accountId: "acc1", isTransfer: false, isSalary: false },
    { description, amountCents, date: "2026-04-05", categoryName: "Bills", accountId: "acc1", isTransfer: false, isSalary: false },
  ];
}

describe("detectRecurring", () => {
  it("detects a 4-charge monthly series and emits positive amountCents magnitude", () => {
    const txs = monthlyTxs("Netflix", -1500);
    const results = detectRecurring(txs, { now: "2026-05-01", existingNonSuggestedPatterns: new Set() });
    expect(results).toHaveLength(1);
    const r = results[0]!;
    expect(r.frequency).toBe("MONTHLY");
    expect(r.amountCents).toBe(1500); // positive magnitude
    expect(r.descriptionPattern).toBe("netflix");
    expect(r.displayName).toBe("Netflix");
    expect(r.firstDate).toBe("2026-01-05");
    expect(r.lastDate).toBe("2026-04-05");
    // nextExpectedDate = 2026-04-05 + 1 month
    expect(r.nextExpectedDate).toBe("2026-05-05");
    expect(r.accountId).toBe("acc1");
  });

  it("returns nothing when fewer than 3 occurrences", () => {
    const txs: DetectableTransaction[] = [
      { description: "Spotify", amountCents: -1000, date: "2026-01-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "Spotify", amountCents: -1000, date: "2026-02-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
    ];
    const results = detectRecurring(txs, { now: "2026-03-01", existingNonSuggestedPatterns: new Set() });
    expect(results).toHaveLength(0);
  });

  it("returns nothing when amounts vary >15% from median for >20% of charges", () => {
    // median is -1500 (cents). One entry is wildly off: 3000 which is 100% off
    // With 4 entries, 1 outlier = 25% > 20% threshold → reject
    const txs: DetectableTransaction[] = [
      { description: "Cable", amountCents: -1500, date: "2026-01-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "Cable", amountCents: -1500, date: "2026-02-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "Cable", amountCents: -1500, date: "2026-03-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "Cable", amountCents: -3000, date: "2026-04-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
    ];
    const results = detectRecurring(txs, { now: "2026-05-01", existingNonSuggestedPatterns: new Set() });
    expect(results).toHaveLength(0);
  });

  it("returns nothing when interval std-dev/median > 0.3 (irregular timing)", () => {
    // Intervals: 5, 30, 60 days — very irregular
    const txs: DetectableTransaction[] = [
      { description: "Irregular", amountCents: -1500, date: "2026-01-01", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "Irregular", amountCents: -1500, date: "2026-01-06", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "Irregular", amountCents: -1500, date: "2026-02-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "Irregular", amountCents: -1500, date: "2026-04-06", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
    ];
    const results = detectRecurring(txs, { now: "2026-05-01", existingNonSuggestedPatterns: new Set() });
    expect(results).toHaveLength(0);
  });

  it("skips patterns already in existingNonSuggestedPatterns", () => {
    const txs = monthlyTxs("Netflix", -1500);
    const results = detectRecurring(txs, {
      now: "2026-05-01",
      existingNonSuggestedPatterns: new Set(["netflix"]),
    });
    expect(results).toHaveLength(0);
  });

  it("excludes transfers", () => {
    const txs: DetectableTransaction[] = [
      { description: "Transfer Out", amountCents: -5000, date: "2026-01-05", categoryName: null, accountId: "acc1", isTransfer: true, isSalary: false },
      { description: "Transfer Out", amountCents: -5000, date: "2026-02-05", categoryName: null, accountId: "acc1", isTransfer: true, isSalary: false },
      { description: "Transfer Out", amountCents: -5000, date: "2026-03-05", categoryName: null, accountId: "acc1", isTransfer: true, isSalary: false },
      { description: "Transfer Out", amountCents: -5000, date: "2026-04-05", categoryName: null, accountId: "acc1", isTransfer: true, isSalary: false },
    ];
    const results = detectRecurring(txs, { now: "2026-05-01", existingNonSuggestedPatterns: new Set() });
    expect(results).toHaveLength(0);
  });

  it("excludes salary", () => {
    const txs: DetectableTransaction[] = [
      { description: "Salary", amountCents: -100000, date: "2026-01-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: true },
      { description: "Salary", amountCents: -100000, date: "2026-02-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: true },
      { description: "Salary", amountCents: -100000, date: "2026-03-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: true },
      { description: "Salary", amountCents: -100000, date: "2026-04-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: true },
    ];
    const results = detectRecurring(txs, { now: "2026-05-01", existingNonSuggestedPatterns: new Set() });
    expect(results).toHaveLength(0);
  });

  it("excludes positive amounts (income transactions)", () => {
    const txs: DetectableTransaction[] = [
      { description: "Income", amountCents: 5000, date: "2026-01-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "Income", amountCents: 5000, date: "2026-02-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "Income", amountCents: 5000, date: "2026-03-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "Income", amountCents: 5000, date: "2026-04-05", categoryName: null, accountId: "acc1", isTransfer: false, isSalary: false },
    ];
    const results = detectRecurring(txs, { now: "2026-05-01", existingNonSuggestedPatterns: new Set() });
    expect(results).toHaveLength(0);
  });

  it("handles case-insensitive grouping — groups 'Netflix' and 'NETFLIX' together", () => {
    const txs: DetectableTransaction[] = [
      { description: "Netflix", amountCents: -1500, date: "2026-01-05", categoryName: "Bills", accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "NETFLIX", amountCents: -1500, date: "2026-02-05", categoryName: "Bills", accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "netflix", amountCents: -1500, date: "2026-03-05", categoryName: "Bills", accountId: "acc1", isTransfer: false, isSalary: false },
      { description: "Netflix", amountCents: -1500, date: "2026-04-05", categoryName: "Bills", accountId: "acc1", isTransfer: false, isSalary: false },
    ];
    const results = detectRecurring(txs, { now: "2026-05-01", existingNonSuggestedPatterns: new Set() });
    expect(results).toHaveLength(1);
    expect(results[0]!.descriptionPattern).toBe("netflix");
  });
});

describe("detectFrequency", () => {
  it("returns WEEKLY for 7-day interval (in 5-9 range)", () => {
    expect(detectFrequency(7)).toBe("WEEKLY");
  });
  it("returns FORTNIGHTLY for 14-day interval (in 12-17 range)", () => {
    expect(detectFrequency(14)).toBe("FORTNIGHTLY");
  });
  it("returns MONTHLY for 30-day interval (in 25-35 range)", () => {
    expect(detectFrequency(30)).toBe("MONTHLY");
  });
  it("returns QUARTERLY for 91-day interval (in 80-100 range)", () => {
    expect(detectFrequency(91)).toBe("QUARTERLY");
  });
  it("returns YEARLY for 365-day interval (in 340-400 range)", () => {
    expect(detectFrequency(365)).toBe("YEARLY");
  });
  it("returns null for unrecognised interval (e.g. 60 days)", () => {
    expect(detectFrequency(60)).toBeNull();
  });
  it("returns null for interval below any range (e.g. 2 days)", () => {
    expect(detectFrequency(2)).toBeNull();
  });
});

describe("nextExpectedDate", () => {
  it("adds 7 days for WEEKLY", () => {
    expect(nextExpectedDate("2026-06-01", "WEEKLY")).toBe("2026-06-08");
  });
  it("adds 14 days for FORTNIGHTLY", () => {
    expect(nextExpectedDate("2026-06-01", "FORTNIGHTLY")).toBe("2026-06-15");
  });
  it("adds 1 month for MONTHLY", () => {
    expect(nextExpectedDate("2026-06-01", "MONTHLY")).toBe("2026-07-01");
  });
  it("adds 3 months for QUARTERLY", () => {
    expect(nextExpectedDate("2026-06-01", "QUARTERLY")).toBe("2026-09-01");
  });
  it("adds 1 year for YEARLY", () => {
    expect(nextExpectedDate("2026-06-01", "YEARLY")).toBe("2027-06-01");
  });
});
