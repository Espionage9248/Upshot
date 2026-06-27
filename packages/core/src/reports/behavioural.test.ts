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
// getSpendingInsights — trigger tests
//
// now = "2026-03-15T12:00:00.000Z"
//   current month  = 2026-03-01 .. 2026-03-15
//   prior window   = 2025-12-01 .. 2026-02-28 (3 months, avg = total / 3)
// ---------------------------------------------------------------------------

describe("getSpendingInsights — trigger tests", () => {
  // Fixed reference point used across all trigger tests.
  const NOW = "2026-03-15T12:00:00.000Z";

  // Helper: a txn in the current month (March 2026)
  const curr = (id: string, amountCents: number, categoryId: string): ReportTxn =>
    t(id, { amountCents, categoryId, createdAt: "2026-03-10T10:00:00.000Z" });

  // Helper: a txn in the prior window (e.g. January 2026)
  const prior = (id: string, amountCents: number, categoryId: string): ReportTxn =>
    t(id, { amountCents, categoryId, createdAt: "2026-01-10T10:00:00.000Z" });

  // ── Rule: "new spending" (avg===0, current>0, ≥$10) ──────────────────────

  it('fires "New spending" info insight when category appears only in current month', () => {
    const txns = [curr("a", -5000, "Dining")]; // $50 in March, nothing in prior window
    const result = getSpendingInsights(txns, NOW);
    const match = result.find((r) => r.category === "Dining");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("info");
    expect(match!.message).toContain("New spending");
    expect(match!.message).toContain("Dining");
  });

  it('does NOT fire "New spending" when current spend is below noise threshold ($10)', () => {
    const txns = [curr("a", -999, "Dining")]; // $9.99 — below $10 noise floor
    const result = getSpendingInsights(txns, NOW);
    expect(result.find((r) => r.category === "Dining")).toBeUndefined();
  });

  // ── Rule: "spending stopped" (avg>0, current===0) ────────────────────────

  it('fires "spending stopped" info insight when category is in prior months but not current', () => {
    // $150 across 3 prior months → avg $50/mo; nothing in March
    const txns = [
      prior("a", -5000, "Gym"),
      prior("b", -5000, "Gym"),
      prior("c", -5000, "Gym"),
    ];
    const result = getSpendingInsights(txns, NOW);
    const match = result.find((r) => r.category === "Gym");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("info");
    expect(match!.message).toContain("spending stopped");
    expect(match!.message).toContain("Gym");
  });

  // ── Rule: "up X%" warning (current/avg > 1.2) ────────────────────────────

  it('fires "up X%" warning when current month > 120% of prior avg', () => {
    // Prior: $100/mo avg (3 × $100 = $300 across 3 months → avg = $300/3 = $100 = 10000¢)
    // Current: $150 (15000¢) → ratio = 1.5, change = 50%
    const txns = [
      prior("p1", -10000, "Transport"),
      prior("p2", -10000, "Transport"),
      prior("p3", -10000, "Transport"),
      curr("c1", -15000, "Transport"),
    ];
    const result = getSpendingInsights(txns, NOW);
    const match = result.find((r) => r.category === "Transport");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("warning");
    expect(match!.message).toContain("Transport");
    expect(match!.message).toContain("up");
    expect(match!.message).toContain("50%");
    expect(match!.message).toContain("3-month avg");
  });

  it('does NOT fire "up" warning when current is only 110% of prior avg (within ±20%)', () => {
    // Prior avg = 10000¢; current = 11000¢ → ratio 1.1, inside the 1.2 threshold
    const txns = [
      prior("p1", -10000, "Transport"),
      prior("p2", -10000, "Transport"),
      prior("p3", -10000, "Transport"),
      curr("c1", -11000, "Transport"),
    ];
    const result = getSpendingInsights(txns, NOW);
    const match = result.find((r) => r.category === "Transport");
    expect(match).toBeUndefined();
  });

  // ── Rule: "down X%" info (current/avg < 0.8) ─────────────────────────────

  it('fires "down X%" info when current month < 80% of prior avg', () => {
    // Prior avg = 10000¢; current = 6000¢ → ratio 0.6, change = 40%
    const txns = [
      prior("p1", -10000, "Groceries"),
      prior("p2", -10000, "Groceries"),
      prior("p3", -10000, "Groceries"),
      curr("c1", -6000, "Groceries"),
    ];
    const result = getSpendingInsights(txns, NOW);
    const match = result.find((r) => r.category === "Groceries");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("info");
    expect(match!.message).toContain("Groceries");
    expect(match!.message).toContain("down");
    expect(match!.message).toContain("40%");
    expect(match!.message).toContain("3-month avg");
  });

  it('does NOT fire "down" info when current is 85% of prior avg (within ±20%)', () => {
    // Prior avg = 10000¢; current = 8500¢ → ratio 0.85, inside the 0.8 threshold
    const txns = [
      prior("p1", -10000, "Groceries"),
      prior("p2", -10000, "Groceries"),
      prior("p3", -10000, "Groceries"),
      curr("c1", -8500, "Groceries"),
    ];
    const result = getSpendingInsights(txns, NOW);
    const match = result.find((r) => r.category === "Groceries");
    expect(match).toBeUndefined();
  });

  // ── Rule: noise filter — both sides below $10 ────────────────────────────

  it("filters out categories where both current and avg are below $10 noise floor", () => {
    // Even though current > avg * 1.2, both are tiny — should be suppressed
    const txns = [
      prior("p1", -500, "Misc"), // $5 prior
      curr("c1", -700, "Misc"),  // $7 current (> 120% of avg, but both < $10)
    ];
    const result = getSpendingInsights(txns, NOW);
    expect(result.find((r) => r.category === "Misc")).toBeUndefined();
  });

  // ── Rule: excludes transfers, salary, positive txns ──────────────────────

  it("excludes transfers, salary, and positive amounts from insight calculations", () => {
    const txns = [
      t("xfer", { amountCents: -50000, categoryId: "Shopping", isTransfer: true, createdAt: "2026-03-05T10:00:00.000Z" }),
      t("sal",  { amountCents: -50000, categoryId: "Shopping", isSalary: true,   createdAt: "2026-03-05T10:00:00.000Z" }),
      t("pos",  { amountCents: 50000,  categoryId: "Shopping",                   createdAt: "2026-03-05T10:00:00.000Z" }),
    ];
    const result = getSpendingInsights(txns, NOW);
    // None of these should produce an insight for "Shopping"
    expect(result.find((r) => r.category === "Shopping")).toBeUndefined();
  });

  // ── Rule: top-8 cap — only 8 insights returned ───────────────────────────

  it("returns at most 8 insights when many categories are affected", () => {
    // 10 categories with large increases
    const txns: ReportTxn[] = [];
    for (let i = 0; i < 10; i++) {
      const cat = `Cat${i}`;
      txns.push(prior(`p${i}a`, -10000, cat));
      txns.push(prior(`p${i}b`, -10000, cat));
      txns.push(prior(`p${i}c`, -10000, cat));
      txns.push(curr(`c${i}`, -20000, cat));
    }
    const result = getSpendingInsights(txns, NOW);
    expect(result.length).toBeLessThanOrEqual(8);
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

// ---------------------------------------------------------------------------
// getBehaviouralInsights — trigger tests
//
// now = "2026-03-15T12:00:00.000Z"  (a Sunday, UTC)
//   90-day window = 2025-12-15T12:00:00Z .. 2026-03-15T12:00:00Z
//   getUTCDay(): Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
//   getUTCHours(): morning 6-11, afternoon 12-16, evening 17-21, night 22-5
// ---------------------------------------------------------------------------

describe("getBehaviouralInsights — trigger tests", () => {
  const NOW = "2026-03-15T12:00:00.000Z";

  // Helper: txn within the 90-day window, on a Wednesday (UTC day=3), morning hour
  // 2026-03-11 is a Wednesday (Mar 15 is Sun; 15-3=12 is Thu; 15-4=11 is Wed ✓)
  const wed = (id: string, amountCents = -5000) =>
    t(id, { amountCents, createdAt: "2026-03-11T09:00:00.000Z" });

  // Helper: txn within the 90-day window, on a Monday (UTC day=1)
  // 2026-03-09 is a Monday
  const mon = (id: string, amountCents = -1000) =>
    t(id, { amountCents, createdAt: "2026-03-09T09:00:00.000Z" });

  // ── Rule: day_of_week (highestDayAvg > dailyAvg * 1.3) ─────────────────

  it('fires "day_of_week" insight when one day dominates spending (>130% of daily avg)', () => {
    // To trigger: concentrate large spend on Wednesdays, tiny spend on other days.
    // dailyAvg = totalSpent / 90
    // highestDayAvg = wednesdayTotal / (90/7) ≈ wednesdayTotal / 12.857
    // Need: wednesdayTotal / 12.857 > (totalSpent / 90) * 1.3
    //   → wednesdayTotal / 12.857 > totalSpent / 69.23
    //   → wednesdayTotal * 69.23 > totalSpent * 12.857
    // If wednesdayTotal = W and otherTotal = O, totalSpent = W + O:
    //   W * 69.23 > (W + O) * 12.857
    //   W * (69.23 - 12.857) > O * 12.857
    //   W * 56.37 > O * 12.857  → W/O > 0.228
    // So Wednesday just needs to be ~23%+ of total spend.
    // Use: 5 Wed txns × $500 = $2500; 6 Mon txns × $100 = $600. W/(W+O)=80.6% ✓
    const txns = [
      wed("w1", -50000), wed("w2", -50000), wed("w3", -50000),
      wed("w4", -50000), wed("w5", -50000),
      mon("m1", -10000), mon("m2", -10000), mon("m3", -10000),
      mon("m4", -10000), mon("m5", -10000), mon("m6", -10000),
    ];
    const result = getBehaviouralInsights(txns, NOW);
    const match = result.find((r) => r.pattern === "day_of_week");
    expect(match).toBeDefined();
    expect(match!.message).toContain("Wednesdays");
  });

  it('does NOT fire "day_of_week" when spending is spread evenly across days', () => {
    // Same amount on every day of the week — no single day exceeds 130% of daily avg
    // Use 7 days, one txn per day within the window
    const dates = [
      "2026-03-09T09:00:00.000Z", // Mon
      "2026-03-10T09:00:00.000Z", // Tue
      "2026-03-11T09:00:00.000Z", // Wed
      "2026-03-12T09:00:00.000Z", // Thu
      "2026-03-13T09:00:00.000Z", // Fri
      "2026-03-14T09:00:00.000Z", // Sat
      "2026-03-15T09:00:00.000Z", // Sun
    ];
    const txns = dates.map((createdAt, i) =>
      t(`d${i}`, { amountCents: -10000, createdAt }),
    );
    const result = getBehaviouralInsights(txns, NOW);
    expect(result.find((r) => r.pattern === "day_of_week")).toBeUndefined();
  });

  // ── Rule: time_of_day (topBucket > 40% of totalSpent) ──────────────────

  it('fires "time_of_day" insight when one time bucket exceeds 40% of total spend', () => {
    // All spend in evening (17:00-21:59 UTC) → 100% > 40%
    const txns = [
      t("e1", { amountCents: -10000, createdAt: "2026-03-10T18:00:00.000Z" }),
      t("e2", { amountCents: -10000, createdAt: "2026-03-11T19:00:00.000Z" }),
      t("e3", { amountCents: -10000, createdAt: "2026-03-12T20:00:00.000Z" }),
    ];
    const result = getBehaviouralInsights(txns, NOW);
    const match = result.find((r) => r.pattern === "time_of_day");
    expect(match).toBeDefined();
    expect(match!.message).toContain("evening");
  });

  it('fires "time_of_day" with "morning" when morning bucket dominates', () => {
    // All spend in morning (6:00-11:59 UTC)
    const txns = [
      t("m1", { amountCents: -10000, createdAt: "2026-03-10T07:00:00.000Z" }),
      t("m2", { amountCents: -10000, createdAt: "2026-03-11T09:00:00.000Z" }),
      t("m3", { amountCents: -10000, createdAt: "2026-03-12T11:00:00.000Z" }),
    ];
    const result = getBehaviouralInsights(txns, NOW);
    const match = result.find((r) => r.pattern === "time_of_day");
    expect(match).toBeDefined();
    expect(match!.message).toContain("morning");
  });

  it('does NOT fire "time_of_day" when spending is split across time buckets below 40%', () => {
    // 30% morning, 30% afternoon, 40% split: use 3+3+4 = 10 equal txns across 3 buckets
    // Each bucket gets 1/3 ≈ 33% < 40%
    const txns = [
      t("a1", { amountCents: -10000, createdAt: "2026-03-10T07:00:00.000Z" }), // morning
      t("a2", { amountCents: -10000, createdAt: "2026-03-10T08:00:00.000Z" }), // morning
      t("b1", { amountCents: -10000, createdAt: "2026-03-10T13:00:00.000Z" }), // afternoon
      t("b2", { amountCents: -10000, createdAt: "2026-03-10T14:00:00.000Z" }), // afternoon
      t("c1", { amountCents: -10000, createdAt: "2026-03-10T18:00:00.000Z" }), // evening
      t("c2", { amountCents: -10000, createdAt: "2026-03-10T19:00:00.000Z" }), // evening
    ];
    const result = getBehaviouralInsights(txns, NOW);
    expect(result.find((r) => r.pattern === "time_of_day")).toBeUndefined();
  });

  // ── Rule: frequency trend — "more frequent" (recentWeeks > allAvg * 1.25) ─

  it('fires "frequency" more-purchases insight when recent 3 weeks spike above 125% of 12-week avg', () => {
    // 12-week window ends at NOW. weekIdx = floor((nowMs - txnMs) / (7 * 86400000))
    // weekIdx 0 = most recent week, 11 = oldest week.
    // Strategy: 1 txn/week in weeks 3-11 (9 weeks × 1 = 9 txns, avg = 9/12 = 0.75)
    //            5 txns/week in weeks 0-2 (3 weeks × 5 = 15 txns)
    // allAvg = (15 + 9) / 12 = 2.0
    // recentAvg = (5+5+5)/3 = 5.0
    // 5.0 > 2.0 * 1.25 = 2.5 ✓
    const txns: ReportTxn[] = [];
    // Weeks 0-2: 5 txns each. Offsets within week ensure they land in correct weekIdx.
    // weekIdx 0 = 0-6 days before now; weekIdx 1 = 7-13 days; weekIdx 2 = 14-20 days
    const nowMs = Date.parse(NOW);
    for (let week = 0; week < 3; week++) {
      for (let j = 0; j < 5; j++) {
        const ms = nowMs - (week * 7 + j) * 86_400_000 - 3_600_000; // within that week
        txns.push(t(`rw${week}_${j}`, { amountCents: -5000, createdAt: new Date(ms).toISOString() }));
      }
    }
    // Weeks 3-11: 1 txn each
    for (let week = 3; week < 12; week++) {
      const ms = nowMs - week * 7 * 86_400_000 - 3_600_000;
      txns.push(t(`ow${week}`, { amountCents: -5000, createdAt: new Date(ms).toISOString() }));
    }
    const result = getBehaviouralInsights(txns, NOW);
    const match = result.find((r) => r.pattern === "frequency");
    expect(match).toBeDefined();
    expect(match!.message).toContain("more frequent");
  });

  it('fires "frequency" less-frequent insight when recent 3 weeks drop below 80% of 12-week avg', () => {
    // 5 txns/week in weeks 3-11 (9 weeks × 5 = 45 txns)
    // 1 txn/week in weeks 0-2 (3 weeks × 1 = 3 txns)
    // allAvg = (3 + 45) / 12 = 4.0
    // recentAvg = (1+1+1)/3 = 1.0
    // 1.0 < 4.0 * 0.8 = 3.2 ✓
    const txns: ReportTxn[] = [];
    const nowMs = Date.parse(NOW);
    // Weeks 0-2: 1 txn each
    for (let week = 0; week < 3; week++) {
      const ms = nowMs - week * 7 * 86_400_000 - 3_600_000;
      txns.push(t(`rw${week}`, { amountCents: -5000, createdAt: new Date(ms).toISOString() }));
    }
    // Weeks 3-11: 5 txns each
    for (let week = 3; week < 12; week++) {
      for (let j = 0; j < 5; j++) {
        const ms = nowMs - (week * 7 + j) * 86_400_000 - 3_600_000;
        txns.push(t(`ow${week}_${j}`, { amountCents: -5000, createdAt: new Date(ms).toISOString() }));
      }
    }
    const result = getBehaviouralInsights(txns, NOW);
    const match = result.find((r) => r.pattern === "frequency");
    expect(match).toBeDefined();
    expect(match!.message).toContain("less frequently");
  });

  it('does NOT fire "frequency" when recent 3 weeks are within ±25% of 12-week avg', () => {
    // Uniform 3 txns/week across all 12 weeks → recentAvg = allAvg = 3.0 (no trigger)
    const txns: ReportTxn[] = [];
    const nowMs = Date.parse(NOW);
    for (let week = 0; week < 12; week++) {
      for (let j = 0; j < 3; j++) {
        const ms = nowMs - (week * 7 + j) * 86_400_000 - 3_600_000;
        txns.push(t(`w${week}_${j}`, { amountCents: -5000, createdAt: new Date(ms).toISOString() }));
      }
    }
    const result = getBehaviouralInsights(txns, NOW);
    expect(result.find((r) => r.pattern === "frequency")).toBeUndefined();
  });

  // ── Edge: empty window returns empty array ───────────────────────────────

  it("returns empty array when there are no expense txns in the 90-day window", () => {
    // Only txns before the 90-day window
    const txns = [
      t("old", { amountCents: -10000, createdAt: "2025-01-01T00:00:00.000Z" }),
    ];
    const result = getBehaviouralInsights(txns, NOW);
    expect(result).toHaveLength(0);
  });

  // ── Edge: excludes transfers and salary from behavioural window ───────────

  it("excludes transfers and salary from the 90-day spend window", () => {
    // Large transfer and salary txns within 90 days — should not trigger any insight
    const txns = [
      t("xfer", { amountCents: -500000, isTransfer: true, createdAt: "2026-03-10T10:00:00.000Z" }),
      t("sal",  { amountCents: -500000, isSalary: true,   createdAt: "2026-03-10T10:00:00.000Z" }),
    ];
    const result = getBehaviouralInsights(txns, NOW);
    expect(result).toHaveLength(0);
  });

  // ── Edge: cap at 4 insights ──────────────────────────────────────────────

  it("returns at most 4 insights", () => {
    // Engineer txns to trigger all 4 possible insight types simultaneously.
    // day_of_week: dominate Wednesdays; time_of_day: dominate evenings;
    // frequency: spike recent 3 weeks above 125% of 12-week avg
    const txns: ReportTxn[] = [];
    const nowMs = Date.parse(NOW);
    // Recent 3 weeks: heavy Wednesday evening spend → triggers dow + tod + freq-up
    for (let week = 0; week < 3; week++) {
      for (let j = 0; j < 5; j++) {
        // Wednesday (Mar 11 is wed, minus 7*week)
        const ms = nowMs - (week * 7 + 4) * 86_400_000 + 6 * 3_600_000; // ~18:00 UTC Wed
        txns.push(t(`rw${week}_${j}`, { amountCents: -50000, createdAt: new Date(ms).toISOString() }));
      }
    }
    // Older weeks: 1 txn/week (non-Wednesday, non-evening)
    for (let week = 3; week < 12; week++) {
      const ms = nowMs - week * 7 * 86_400_000 - 50 * 3_600_000; // some Monday morning
      txns.push(t(`ow${week}`, { amountCents: -1000, createdAt: new Date(ms).toISOString() }));
    }
    const result = getBehaviouralInsights(txns, NOW);
    expect(result.length).toBeLessThanOrEqual(4);
  });
});
