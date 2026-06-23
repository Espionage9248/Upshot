import type { RecurringItem } from "@upshot/contracts";

type RecurringKind = RecurringItem["kind"];

/**
 * Keywords that mark a recurring charge as a utility/bill rather than a
 * discretionary subscription. Matched as substrings (case-insensitive) against
 * the item's category and merchant.
 */
const BILL_KEYWORDS = [
  "electric",
  "energy",
  "power",
  "gas",
  "water",
  "internet",
  "broadband",
  "nbn",
  "phone",
  "mobile",
  "telco",
  "insurance",
  "rent",
  "mortgage",
  "council",
  "rates",
  "utilit",
];

/**
 * Heuristic default for a detected recurring item's kind. Detection cannot tell
 * a bill from a subscription, so we infer from the category/merchant text:
 * utility-style keywords → BILL, everything else → SUBSCRIPTION. The user can
 * always override per-item via the card toggle.
 */
export function inferRecurringKind(
  category: string | null,
  merchant: string | null,
): RecurringKind {
  const haystack = `${category ?? ""} ${merchant ?? ""}`.toLowerCase();
  return BILL_KEYWORDS.some((kw) => haystack.includes(kw)) ? "BILL" : "SUBSCRIPTION";
}
