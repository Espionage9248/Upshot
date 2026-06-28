// packages/core/src/twoup/analytics.test.ts
import { describe, it, expect } from "vitest";
import type { TwoUpTxn } from "./types";
import { buildOverview, filterLedger, extractMerchant } from "./analytics";

let n = 0;
function txn(
  owner: TwoUpTxn["owner"],
  amountCents: number,
  opts: Partial<{ date: string; category: string | null; description: string }> = {},
): TwoUpTxn {
  return {
    id: `t${n++}`,
    rowHash: `h${n}`,
    date: opts.date ?? "2023-01-15",
    description: opts.description ?? "Test txn",
    amountCents,
    owner,
    category: opts.category !== undefined ? opts.category : null,
  };
}

// ---------- buildOverview ----------

describe("buildOverview", () => {
  it("totalInCents sums inflows excluding REVERSAL", () => {
    const txns: TwoUpTxn[] = [
      txn("JAMES", 50000),
      txn("BRITTNEY", 30000),
      txn("REVERSAL", 10000),
      txn("SHARED", -20000),
    ];
    const ov = buildOverview(txns);
    expect(ov.totalInCents).toBe(80000); // 50k + 30k, not the 10k reversal
  });

  it("totalSpentCents sums absolute outflows excluding REVERSAL", () => {
    const txns: TwoUpTxn[] = [
      txn("JAMES", 100000),
      txn("SHARED", -30000),
      txn("JAMES", -10000),
    ];
    const ov = buildOverview(txns);
    expect(ov.totalSpentCents).toBe(40000);
  });

  it("distributedCents === totalInCents - totalSpentCents", () => {
    const txns: TwoUpTxn[] = [
      txn("JAMES", 100000),
      txn("BRITTNEY", 80000),
      txn("SHARED", -50000),
      txn("JAMES", -20000),
    ];
    const ov = buildOverview(txns);
    expect(ov.distributedCents).toBe(ov.totalInCents - ov.totalSpentCents);
    expect(ov.distributedCents).toBe(110000);
  });

  it("per-person putInCents matches contribution inflows", () => {
    const txns: TwoUpTxn[] = [
      txn("JAMES", 60000),
      txn("BRITTNEY", 40000),
      txn("INTEREST", 1000),
      txn("SHARED", -10000),
    ];
    const ov = buildOverview(txns);
    expect(ov.james.putInCents).toBe(60000);
    expect(ov.britt.putInCents).toBe(40000);
  });

  it("shareOfCostsCents = round(sharedOut/2) + personal", () => {
    const txns: TwoUpTxn[] = [
      txn("JAMES", 100000),
      txn("BRITTNEY", 100000),
      txn("SHARED", -10001), // shared outflow with odd cent
      txn("JAMES", -5000),   // James personal
      txn("BRITTNEY", -3000), // Britt personal
    ];
    const ov = buildOverview(txns);
    // sharedOut=10001, half=Math.round(10001/2)=5001
    expect(ov.james.shareOfCostsCents).toBe(5001 + 5000); // 10001
    expect(ov.britt.shareOfCostsCents).toBe(5001 + 3000); // 8001
  });

  it("netCents matches computeSettlement jamesNetCents/brittNetCents", () => {
    const txns: TwoUpTxn[] = [
      txn("JAMES", 80000),
      txn("BRITTNEY", 70000),
      txn("SHARED", -20000),
    ];
    const ov = buildOverview(txns);
    // half = 10000; james net = 80000 - 10000 - 0 = 70000
    expect(ov.james.netCents).toBe(70000);
    expect(ov.britt.netCents).toBe(60000);
  });

  it("jamesPct and brittPct sum to 100", () => {
    const txns: TwoUpTxn[] = [
      txn("JAMES", 75000),
      txn("BRITTNEY", 25000),
    ];
    const ov = buildOverview(txns);
    expect(ov.jamesPct + ov.brittPct).toBeCloseTo(100);
    expect(ov.jamesPct).toBeCloseTo(75);
    expect(ov.brittPct).toBeCloseTo(25);
  });

  it("jamesPct/brittPct are 0 when no contributions", () => {
    const txns: TwoUpTxn[] = [txn("SHARED", -5000)];
    const ov = buildOverview(txns);
    expect(ov.jamesPct).toBe(0);
    expect(ov.brittPct).toBe(0);
  });

  it("rhythm = per-YYYY-MM inflow totals, ascending, excluding REVERSAL", () => {
    const txns: TwoUpTxn[] = [
      txn("JAMES", 50000, { date: "2023-03-10" }),
      txn("BRITTNEY", 30000, { date: "2023-01-05" }),
      txn("JAMES", 20000, { date: "2023-01-20" }),
      txn("REVERSAL", 9999, { date: "2023-01-25" }), // excluded
      txn("SHARED", -10000, { date: "2023-02-01" }), // outflow, excluded from rhythm
    ];
    const ov = buildOverview(txns);
    expect(ov.rhythm).toEqual([
      { month: "2023-01", totalInCents: 50000 },
      { month: "2023-03", totalInCents: 50000 },
    ]);
  });

  it("categories = per-category outflow totals + counts, descending", () => {
    const txns: TwoUpTxn[] = [
      txn("SHARED", -30000, { category: "Groceries" }),
      txn("SHARED", -20000, { category: "Groceries" }),
      txn("JAMES", -60000, { category: "Rent" }),
      txn("SHARED", -10000, { category: "Transport" }),
      txn("JAMES", 10000), // inflow, not in categories
    ];
    const ov = buildOverview(txns);
    expect(ov.categories[0]).toEqual({ category: "Rent", cents: 60000, count: 1 });
    expect(ov.categories[1]).toEqual({ category: "Groceries", cents: 50000, count: 2 });
    expect(ov.categories[2]).toEqual({ category: "Transport", cents: 10000, count: 1 });
  });

  it("unassignedInCents = Σ UNASSIGNED inflows", () => {
    const txns: TwoUpTxn[] = [
      txn("UNASSIGNED", 12000),
      txn("UNASSIGNED", 8000),
      txn("JAMES", 50000),
      txn("UNASSIGNED", -5000), // outflow — not counted
    ];
    const ov = buildOverview(txns);
    expect(ov.unassignedInCents).toBe(20000);
  });

  it("returns zero overview for empty input", () => {
    const ov = buildOverview([]);
    expect(ov.totalInCents).toBe(0);
    expect(ov.totalSpentCents).toBe(0);
    expect(ov.distributedCents).toBe(0);
    expect(ov.jamesPct).toBe(0);
    expect(ov.brittPct).toBe(0);
    expect(ov.rhythm).toEqual([]);
    expect(ov.categories).toEqual([]);
    expect(ov.unassignedInCents).toBe(0);
  });

  it("settlement is forwarded from computeSettlement", () => {
    const txns: TwoUpTxn[] = [
      txn("JAMES", 100000),
      txn("BRITTNEY", 80000),
      txn("SHARED", -20000),
    ];
    const ov = buildOverview(txns);
    expect(ov.settlement.jamesContribCents).toBe(100000);
    expect(ov.settlement.brittContribCents).toBe(80000);
    expect(ov.settlement.sharedOutCents).toBe(20000);
  });
});

// ---------- filterLedger ----------

describe("filterLedger", () => {
  const base: TwoUpTxn[] = [
    { id: "a", rowHash: "h1", date: "2023-03-10", description: "Coles Supermarket", amountCents: -5000, owner: "SHARED", category: "Groceries" },
    { id: "b", rowHash: "h2", date: "2023-02-05", description: "James salary", amountCents: 100000, owner: "JAMES", category: "Income" },
    { id: "c", rowHash: "h3", date: "2023-01-20", description: "Britt pay", amountCents: 80000, owner: "BRITTNEY", category: "Income" },
    { id: "d", rowHash: "h4", date: "2023-03-15", description: "REVERSAL transaction", amountCents: 5000, owner: "REVERSAL", category: null },
    { id: "e", rowHash: "h5", date: "2023-02-28", description: "Woolworths", amountCents: -3000, owner: "SHARED", category: "Groceries" },
    { id: "f", rowHash: "h6", date: "2023-04-01", description: "Unassigned deposit", amountCents: 20000, owner: "UNASSIGNED", category: null },
  ];

  it("always excludes REVERSAL", () => {
    const result = filterLedger(base, {});
    expect(result.every((t) => t.owner !== "REVERSAL")).toBe(true);
    expect(result.find((t) => t.id === "d")).toBeUndefined();
  });

  it("filterLedger({ owner: JAMES }) drops other owners AND REVERSAL", () => {
    const result = filterLedger(base, { owner: "JAMES" });
    expect(result.every((t) => t.owner === "JAMES")).toBe(true);
    expect(result.every((t) => t.owner !== "REVERSAL")).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe("b");
  });

  it("filters by category", () => {
    const result = filterLedger(base, { category: "Groceries" });
    expect(result.every((t) => t.category === "Groceries")).toBe(true);
    expect(result.length).toBe(2);
  });

  it("filters by direction IN (amount > 0)", () => {
    const result = filterLedger(base, { direction: "IN" });
    expect(result.every((t) => t.amountCents > 0)).toBe(true);
    // REVERSAL excluded; remaining inflows: b, c, f
    expect(result.length).toBe(3);
  });

  it("filters by direction OUT (amount <= 0)", () => {
    const result = filterLedger(base, { direction: "OUT" });
    expect(result.every((t) => t.amountCents <= 0)).toBe(true);
    expect(result.length).toBe(2);
  });

  it("filters by date range inclusive", () => {
    const result = filterLedger(base, { from: "2023-02-01", to: "2023-02-28" });
    expect(result.length).toBe(2);
    expect(result.map((t) => t.id).sort()).toEqual(["b", "e"]);
  });

  it("case-insensitive substring search on description", () => {
    const result = filterLedger(base, { search: "coles" });
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe("a");
  });

  it("search is case-insensitive", () => {
    const result = filterLedger(base, { search: "COLES" });
    expect(result.length).toBe(1);
  });

  it("returns results sorted date DESC", () => {
    const result = filterLedger(base, {});
    const dates = result.map((t) => t.date);
    for (let i = 1; i < dates.length; i++) {
      const cur = dates[i]!;
      const prev = dates[i - 1]!;
      expect(cur <= prev).toBe(true);
    }
  });

  it("combines multiple filters", () => {
    const result = filterLedger(base, { owner: "SHARED", direction: "OUT", category: "Groceries" });
    expect(result.length).toBe(2);
    expect(result.every((t) => t.owner === "SHARED")).toBe(true);
  });
});

// ---------- extractMerchant ----------

describe("extractMerchant", () => {
  it("returns the description as-is for simple names", () => {
    expect(extractMerchant("Woolworths")).toBe("Woolworths");
  });

  it("strips trailing store numbers", () => {
    expect(extractMerchant("Coles 4321")).toBe("Coles");
  });

  it("takes the part before the first comma", () => {
    expect(extractMerchant("7-Eleven, Some City")).toBe("7-Eleven");
  });

  it("drops payment-ref noise (card numbers etc)", () => {
    // e.g. "EFTPOS 1234 WOOLWORTHS" -> "WOOLWORTHS" or similar
    const result = extractMerchant("Bunnings Warehouse 0987");
    expect(result).toBe("Bunnings Warehouse");
  });

  it("handles extra whitespace", () => {
    expect(extractMerchant("  JB Hi-Fi  ")).toBe("JB Hi-Fi");
  });
});
