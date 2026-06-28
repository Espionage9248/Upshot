import type { Owner } from "./types";

export interface TwoUpConfig {
  owners: { JAMES: string[]; BRITTNEY: string[] };
  interestPatterns: string[];
  reversalPatterns: string[];
  categoryRules: { patterns: string[]; category: string }[];
  personalDebt: { owner: "JAMES" | "BRITTNEY"; patterns: string[] }[];
}

/** Escape special regex characters in a token. */
function escapeRegex(token: string): string {
  return token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Returns true if description contains the token on a word boundary (case-insensitive). */
function matchesToken(description: string, token: string): boolean {
  return new RegExp(`\\b${escapeRegex(token)}\\b`, "i").test(description);
}

/** Returns true if description matches any pattern in the list. */
function matchesAny(description: string, patterns: string[]): boolean {
  return patterns.some((p) => matchesToken(description, p));
}

export function classify(
  description: string,
  amountCents: number,
  cfg: TwoUpConfig,
): { owner: Owner; category: string } {
  // Category: first matching categoryRules entry; else default by sign.
  let category: string;
  const matchedRule = cfg.categoryRules.find((rule) =>
    matchesAny(description, rule.patterns),
  );
  if (matchedRule) {
    category = matchedRule.category;
  } else {
    category = amountCents > 0 ? "Income" : "Uncategorised";
  }

  // Owner classification differs by inflow vs outflow.
  let owner: Owner;

  if (amountCents > 0) {
    // Inflows — priority order: reversal → interest → BRITTNEY → JAMES → UNASSIGNED
    if (matchesAny(description, cfg.reversalPatterns)) {
      owner = "REVERSAL";
    } else if (matchesAny(description, cfg.interestPatterns)) {
      owner = "INTEREST";
    } else if (matchesAny(description, cfg.owners.BRITTNEY)) {
      owner = "BRITTNEY";
    } else if (matchesAny(description, cfg.owners.JAMES)) {
      owner = "JAMES";
    } else {
      owner = "UNASSIGNED";
    }
  } else {
    // Outflows — personalDebt match → that owner; else SHARED
    const debtMatch = cfg.personalDebt.find((entry) =>
      matchesAny(description, entry.patterns),
    );
    owner = debtMatch ? debtMatch.owner : "SHARED";
  }

  return { owner, category };
}
