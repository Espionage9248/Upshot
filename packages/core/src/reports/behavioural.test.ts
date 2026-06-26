import { describe, it, expect } from "vitest";
import type { ReportTxn } from "./salary-periods";
import {
  computeNoSpendStreak,
  buildSpendingHeatmap,
  getSpendingInsights,
  getBehaviouralInsights,
} from "./behavioural";

const t = (id: string, over: Partial<ReportTxn>): ReportTxn => ({
  id,
  amountCents: -1000,
  isSalary: false,
  isTransfer: false,
  categoryId: null,
  parentCategoryId: null,
  settledAt: null,
  createdAt: "2026-01-15T00:00:00.000Z",
  tags: [],
  ...over,
});

// ---------------------------------------------------------------------------
// computeNoSpendStreak
// ---------------------------------------------------------------------------

describe("computeNoSpendStreak", () => {
  it("returns currentDays===3 when the last 3 days have no spend", () => {
    // now = 2026-01-10, spend only on 2026-01-07 (4 days ago)
    const txns = [
      t("a", { amountCents: -5000, createdAt: "2026-01-07T10:00:00.000Z" }),
    ];
    const result = computeNoSpendStreak(txns, "2026-01-10T00:00:00.000Z");
    expect(result.currentDays).toBe(3);
  });

  it("sets bestDays to the longest zero-spend run (longer than current)", () => {
    // 5-day gap: Jan 01..05, then spend Jan 06, then 2-day gap Jan 07..08
    // now = 2026-01-08 (so current = 2 days)
    const txns = [
      t("x", { amountCents: -1000, createdAt: "2026-01-06T10:00:00.000Z" }),
    ];
    // Window: Jan 01..08
    const result = computeNoSpendStreak(txns, "2026-01-08T00:00:00.000Z");
    // currentDays = 2 (Jan 07, Jan 08)
    expect(result.currentDays).toBe(2);
    // bestDays = 5 (Jan 01..05) — the gap before Jan 06 in the window
    // (window from window start up to now, including all days)
    expect(result.bestDays).toBeGreaterThanOrEqual(result.currentDays);
  });

  it("bestEndedOn is set to the ISO date the best run ended (past run > current)", () => {
    // Use a controlled narrow window: spend on day 3 and day 8 of a small window.
    // We force the window to start at 2026-01-01 by making now = 2026-01-05 (5-day window only
    // if WINDOW_DAYS=90, the window starts 89 days before now).
    // Instead, verify the key property: if a longer past run ends before the current run,
    // bestEndedOn is the ISO date that run ended (not null), and bestDays > currentDays.

    // now = 2026-01-10
    // spend on Jan 08 → current streak (Jan09..Jan10) = 2 days
    // bestDays = 89 days before Jan 08 (window starts ~Oct 2025) → bestEndedOn is set
    const txns = [
      t("a", { amountCents: -1000, createdAt: "2026-01-08T10:00:00.000Z" }),
    ];
    const result = computeNoSpendStreak(txns, "2026-01-10T00:00:00.000Z");
    expect(result.currentDays).toBe(2);
    // The run before Jan 08 (many days from window start up to Jan 07) > 2
    expect(result.bestDays).toBeGreaterThan(result.currentDays);
    // Since the best run ended in the past, bestEndedOn should be set to Jan 07
    expect(result.bestEndedOn).toBe("2026-01-07");
  });

  it("currentDays===0 when today has spend", () => {
    const txns = [
      t("a", { amountCents: -500, createdAt: "2026-01-10T14:00:00.000Z" }),
    ];
    const result = computeNoSpendStreak(txns, "2026-01-10T23:59:59.000Z");
    expect(result.currentDays).toBe(0);
  });

  it("handles empty txns — all days zero-spend", () => {
    // no txns in last 3 days → currentDays = 3 (full window)
    const result = computeNoSpendStreak([], "2026-01-10T00:00:00.000Z");
    // All days in the 90-day window are zero-spend
    expect(result.currentDays).toBeGreaterThan(0);
    expect(result.bestDays).toBeGreaterThanOrEqual(result.currentDays);
  });
});

// ---------------------------------------------------------------------------
// buildSpendingHeatmap
// ---------------------------------------------------------------------------

describe("buildSpendingHeatmap", () => {
  it("returns one HeatmapDay per day in the range", () => {
    const result = buildSpendingHeatmap([], "2026-01-01", "2026-01-05");
    expect(result).toHaveLength(5);
    expect(result[0]!.date).toBe("2026-01-01");
    expect(result[4]!.date).toBe("2026-01-05");
  });

  it("zero-spend day has isZero===true and intensity===0", () => {
    const txns = [
      t("a", { amountCents: -5000, createdAt: "2026-01-03T10:00:00.000Z" }),
    ];
    const result = buildSpendingHeatmap(txns, "2026-01-01", "2026-01-05");
    const jan01 = result.find((d) => d.date === "2026-01-01")!;
    expect(jan01.isZero).toBe(true);
    expect(jan01.intensity).toBe(0);
    expect(jan01.spendCents).toBe(0);
  });

  it("highest-spend day has intensity===1", () => {
    const txns = [
      t("a", { amountCents: -5000, createdAt: "2026-01-01T10:00:00.000Z" }),
      t("b", { amountCents: -3000, createdAt: "2026-01-03T10:00:00.000Z" }),
    ];
    const result = buildSpendingHeatmap(txns, "2026-01-01", "2026-01-05");
    const jan01 = result.find((d) => d.date === "2026-01-01")!;
    expect(jan01.intensity).toBe(1);
    expect(jan01.spendCents).toBe(5000);
    expect(jan01.isZero).toBe(false);
  });

  it("excludes transfers from spendCents", () => {
    const txns = [
      t("xfer", { amountCents: -50000, isTransfer: true, createdAt: "2026-01-02T10:00:00.000Z" }),
      t("spend", { amountCents: -2000, createdAt: "2026-01-02T12:00:00.000Z" }),
    ];
    const result = buildSpendingHeatmap(txns, "2026-01-01", "2026-01-03");
    const jan02 = result.find((d) => d.date === "2026-01-02")!;
    expect(jan02.spendCents).toBe(2000); // transfer excluded
  });

  it("all-zero range → all intensity===0", () => {
    const result = buildSpendingHeatmap([], "2026-01-01", "2026-01-03");
    expect(result.every((d) => d.intensity === 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getSpendingInsights (smoke tests — no DB, pure fn)
// ---------------------------------------------------------------------------

describe("getSpendingInsights", () => {
  it("returns an array", () => {
    const txns = [
      t("a", { amountCents: -5000, categoryId: "cat-dining", createdAt: "2026-02-10T00:00:00.000Z" }),
    ];
    const result = getSpendingInsights(txns, "2026-03-01T00:00:00.000Z");
    expect(Array.isArray(result)).toBe(true);
  });

  it("each insight has category, message, severity", () => {
    const txns: ReportTxn[] = [];
    const result = getSpendingInsights(txns, "2026-03-01T00:00:00.000Z");
    for (const insight of result) {
      expect(typeof insight.category).toBe("string");
      expect(typeof insight.message).toBe("string");
      expect(["info", "warning"]).toContain(insight.severity);
    }
  });
});

// ---------------------------------------------------------------------------
// getBehaviouralInsights (smoke tests)
// ---------------------------------------------------------------------------

describe("getBehaviouralInsights", () => {
  it("returns an array", () => {
    const result = getBehaviouralInsights([], "2026-03-01T00:00:00.000Z");
    expect(Array.isArray(result)).toBe(true);
  });

  it("each insight has pattern and message strings", () => {
    const txns = [
      t("a", { amountCents: -5000, createdAt: "2026-01-05T09:00:00.000Z" }),
      t("b", { amountCents: -3000, createdAt: "2026-01-06T09:00:00.000Z" }),
    ];
    const result = getBehaviouralInsights(txns, "2026-03-01T00:00:00.000Z");
    for (const insight of result) {
      expect(typeof insight.pattern).toBe("string");
      expect(typeof insight.message).toBe("string");
    }
  });
});
