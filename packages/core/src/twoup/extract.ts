/**
 * Assemble ledger RawRows from pdfjs positioned-text items.
 *
 * Algorithm:
 *  1. Sort items top→bottom (y descending — pdfjs origin is bottom-left),
 *     then left→right (x ascending) within the same y.
 *  2. Track `currentDate` from day-header lines matching
 *     /^[A-Za-z]+,\s+\d{1,2}\s+[A-Za-z]{3}$/.
 *     Adjacent header tokens at the same y are joined before matching.
 *  3. A transaction STARTS at a time token /^\d{1,2}:\d{2}(am|pm)$/ with
 *     x ≤ bands.timeMax, and OWNS all following items until the next time
 *     token or day header.
 *  4. Within a transaction, classify items by x-band:
 *       description: bands.descMin ≤ x < bands.descMax  → joined by space
 *       amount:      x ≥ bands.amountMin AND x < bands.balanceMin → parseAmountCents
 *       balance:     x ≥ bands.balanceMin                          → parseMoneyCents magnitude
 *  5. Only emit a row once a time token has been seen (excludes Summary block).
 */

import type { PositionedText, RawRow, StatementSummary } from "./types";
import { parseAmountCents, parseMoneyCents, parseStatementDate } from "./parse";

export interface Bands {
  timeMax: number;
  descMin: number;
  descMax: number;
  amountMin: number;
  balanceMin: number;
}

export const DEFAULT_BANDS: Bands = {
  timeMax: 60,
  descMin: 80,
  descMax: 340,
  amountMin: 450,
  balanceMin: 520,
};

const DAY_HEADER_RE = /^[A-Za-z]+,\s+\d{1,2}\s+[A-Za-z]{3}$/;
const TIME_RE = /^\d{1,2}:\d{2}(am|pm)$/;

export function assembleTransactions(
  items: PositionedText[],
  opts: { year: number; bands?: Bands },
): RawRow[] {
  const bands = opts.bands ?? DEFAULT_BANDS;

  // Sort top→bottom (y desc), then left→right (x asc)
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  const rows: RawRow[] = [];
  let currentHeader = "";
  let inTransaction = false;

  // Current transaction accumulator
  let currentTime = "";
  let descParts: string[] = [];
  let amountCents: number | null = null;
  let balanceCents: number | null = null;

  function flushTransaction(): void {
    if (!inTransaction || !currentTime || !currentHeader) return;
    if (amountCents === null || balanceCents === null) return;
    rows.push({
      date: parseStatementDate(currentHeader, opts.year),
      time: currentTime,
      description: descParts.join(" ").replace(/\s+/g, " ").trim(),
      amountCents,
      balanceCents,
    });
  }

  // Group items by y so we can join tokens at the same y for header detection
  // We process sorted items one at a time, grouping adjacent same-y items
  // into logical "lines" before classifying them.

  // Build y-grouped lines
  interface Line { y: number; items: PositionedText[] }
  const lines: Line[] = [];
  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last && last.y === item.y) {
      last.items.push(item);
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  // Pending description items are buffered until a time token claims them.
  // This handles the PDF layout where description appears on the line ABOVE
  // the time/amount/balance row.
  let pendingDesc: string[] = [];

  for (const line of lines) {
    // Check if this line is a day header (join all tokens in y-group)
    const joined = line.items.map((i) => i.str).join(" ").trim();
    if (DAY_HEADER_RE.test(joined)) {
      flushTransaction();
      inTransaction = false;
      currentHeader = joined;
      pendingDesc = [];
      descParts = [];
      amountCents = null;
      balanceCents = null;
      continue;
    }

    // Check if this line contains a time token
    const timeItem = line.items.find(
      (i) => TIME_RE.test(i.str.trim()) && i.x <= bands.timeMax,
    );

    if (timeItem) {
      // Flush the previous transaction before starting a new one
      flushTransaction();
      inTransaction = true;
      currentTime = timeItem.str.trim();
      // Desc items buffered since last time token / day header belong to this txn
      descParts = [...pendingDesc];
      pendingDesc = [];
      amountCents = null;
      balanceCents = null;

      // Process other items on this line (amount, balance, extra desc)
      for (const item of line.items) {
        if (item === timeItem) continue;
        const str = item.str.trim();
        if (!str) continue;
        if (item.x >= bands.balanceMin) {
          balanceCents = Math.abs(parseMoneyCents(str));
        } else if (item.x >= bands.amountMin) {
          amountCents = parseAmountCents(str);
        } else if (item.x >= bands.descMin && item.x < bands.descMax) {
          descParts.push(str);
        }
      }
      continue;
    }

    // No time token — classify items and route to pending desc or current txn
    for (const item of line.items) {
      const str = item.str.trim();
      if (!str) continue;

      if (item.x >= bands.descMin && item.x < bands.descMax) {
        // Description-band items always go into pendingDesc.
        // When a time token is found, pendingDesc is claimed by that transaction.
        // This correctly handles desc appearing above the time/amount line.
        pendingDesc.push(str);
      } else if (inTransaction) {
        // Amount / balance items can only belong to a started transaction
        if (item.x >= bands.balanceMin) {
          balanceCents = Math.abs(parseMoneyCents(str));
        } else if (item.x >= bands.amountMin) {
          amountCents = parseAmountCents(str);
        }
      }
    }
  }

  // Flush the last transaction
  flushTransaction();

  return rows;
}

// Tokens that look like money values: "$X", "+$X", "-$X"
const MONEY_RE = /^[+-]?\$/;

/**
 * Parse the statement summary block (Opening Balance / Money In / Money Out /
 * Closing Balance) from positioned-text items and return integer cents.
 *
 * Algorithm:
 *  1. Slide a window across y-sorted items joining adjacent same-y tokens to
 *     detect each multi-word label ("Opening Balance", "Money In", etc.).
 *  2. For each label, find the nearest money token (MONEY_RE) by Euclidean
 *     distance from the label centroid. Tokens at or below the label y
 *     (Δy ≥ 0 in pdfjs bottom-left, i.e. token.y ≤ label.y) are preferred
 *     by halving their effective distance.
 *  3. Parse with parseMoneyCents and take the magnitude (all four figures are
 *     reported positive on the statement).
 *  4. Throws if any of the four labels cannot be found.
 */
export function parseSummary(items: PositionedText[]): StatementSummary {
  const LABELS = [
    { key: "opening", words: ["Opening", "Balance"] },
    { key: "in",      words: ["Money", "In"] },
    { key: "out",     words: ["Money", "Out"] },
    { key: "closing", words: ["Closing", "Balance"] },
  ] as const;

  // Group items by y (same y = same line), sorted top-to-bottom (y desc)
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  // Money tokens
  const moneyTokens = sorted.filter((i) => MONEY_RE.test(i.str.trim()));

  // Find label positions by scanning lines for matching consecutive tokens
  const found: Record<string, { x: number; y: number }> = {};

  // Build lines
  interface Line { y: number; items: PositionedText[] }
  const lines: Line[] = [];
  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last && last.y === item.y) {
      last.items.push(item);
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  for (const line of lines) {
    const strs = line.items.map((i) => i.str.trim());
    for (const label of LABELS) {
      if (found[label.key]) continue;
      // Scan all positions in the line for the first word of the label
      for (let idx = 0; idx < strs.length; idx++) {
        if (strs[idx] !== label.words[0]) continue;
        // Check remaining words appear consecutively
        let match = true;
        for (let w = 1; w < label.words.length; w++) {
          if (strs[idx + w] !== label.words[w]) { match = false; break; }
        }
        if (!match) continue;
        // Centroid x of the label tokens
        const labelItems = line.items.slice(idx, idx + label.words.length);
        const cx = labelItems.reduce((s, i) => s + i.x, 0) / labelItems.length;
        found[label.key] = { x: cx, y: line.y };
        break;
      }
    }
  }

  for (const label of LABELS) {
    if (!found[label.key]) {
      throw new Error(`parseSummary: label "${label.words.join(" ")}" not found`);
    }
  }

  function nearestMoney(lx: number, ly: number): number {
    let best: PositionedText | null = null;
    let bestDist = Infinity;
    for (const t of moneyTokens) {
      const dx = t.x - lx;
      const dy = ly - t.y; // positive = token is below label (pdfjs bottom-left)
      let dist = Math.sqrt(dx * dx + dy * dy);
      // Prefer tokens at or below label y (dy ≥ 0)
      if (dy < 0) dist *= 2;
      if (dist < bestDist) { bestDist = dist; best = t; }
    }
    if (!best) throw new Error("parseSummary: no money token found");
    return Math.abs(parseMoneyCents(best.str));
  }

  return {
    openingCents: nearestMoney(found["opening"]!.x, found["opening"]!.y),
    moneyInCents:  nearestMoney(found["in"]!.x,      found["in"]!.y),
    moneyOutCents: nearestMoney(found["out"]!.x,     found["out"]!.y),
    closingCents:  nearestMoney(found["closing"]!.x, found["closing"]!.y),
  };
}
