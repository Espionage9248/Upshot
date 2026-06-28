// packages/core/src/twoup/classify.test.ts
import { describe, it, expect } from "vitest";
import { classify, type TwoUpConfig } from "./classify";

// Synthetic config: "Bartholomew"/"Bart" stands in for the real full/short-form pair.
const cfg: TwoUpConfig = {
  owners: { JAMES: ["alice", "ali"], BRITTNEY: ["bartholomew", "bart", "barton"] },
  interestPatterns: ["interest"],
  reversalPatterns: ["dishonour"],
  categoryRules: [
    { patterns: ["coles", "woolworths"], category: "Groceries" },
    { patterns: ["qantas"], category: "Travel" },
  ],
  personalDebt: [{ owner: "BRITTNEY", patterns: ["acme finance"] }],
};

describe("classify — inflows", () => {
  it("matches the SHORT form, not only the full name", () => {
    expect(classify("Transfer from Bart", 5000, cfg).owner).toBe("BRITTNEY");
    expect(classify("Transfer from Bartholomew", 5000, cfg).owner).toBe("BRITTNEY");
  });
  it("matches James by token", () => {
    expect(classify("From Ali", 5000, cfg).owner).toBe("JAMES");
  });
  it("flags interest and reversals", () => {
    expect(classify("Interest payment", 12, cfg).owner).toBe("INTEREST");
    expect(classify("Dishonour reversal", 5000, cfg).owner).toBe("REVERSAL");
  });
  it("defaults an unidentifiable inflow to UNASSIGNED (not James)", () => {
    expect(classify("Osko deposit", 5000, cfg).owner).toBe("UNASSIGNED");
  });
  it("does not match a token inside an unrelated word (word boundary)", () => {
    expect(classify("Alimony service", 5000, cfg).owner).toBe("UNASSIGNED"); // 'ali' not matched inside 'Alimony'
  });
});

describe("classify — outflows", () => {
  it("defaults outflows to SHARED", () => {
    expect(classify("Coles Burwood", -4250, cfg).owner).toBe("SHARED");
  });
  it("attributes a known personal-debt outflow to its owner", () => {
    expect(classify("Acme Finance BPAY", -10000, cfg).owner).toBe("BRITTNEY");
  });
  it("categorises by first-match rule", () => {
    expect(classify("Coles Burwood", -4250, cfg).category).toBe("Groceries");
    expect(classify("Qantas flights", -61200, cfg).category).toBe("Travel");
    expect(classify("Mystery shop", -1000, cfg).category).toBe("Uncategorised");
  });
});
