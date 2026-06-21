/**
 * Pure helpers for purchases — no "use server", no DB. Safe to import anywhere.
 */

/**
 * `dollarsToCents`: validates a dollar string (e.g. "299.00") and converts to
 * integer cents. Returns undefined for invalid/blank strings.
 */
function dollarsToCents(s: string): number | undefined {
  const trimmed = s.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return undefined;
  return Math.round(parseFloat(trimmed) * 100);
}

/**
 * Extracts Open Graph purchase metadata from raw HTML.
 * Reads `og:title` → name, `og:price:amount` → priceCents (cents),
 * `og:site_name` → merchant. Returns `{}` when no tags match.
 */
export function parsePurchaseMeta(html: string): {
  name?: string;
  priceCents?: number;
  merchant?: string;
} {
  const result: { name?: string; priceCents?: number; merchant?: string } = {};

  const titleMatch = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (titleMatch) result.name = titleMatch[1];

  const priceMatch = /<meta[^>]+property=["']og:price:amount["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (priceMatch) {
    const cents = dollarsToCents(priceMatch[1]!);
    if (cents !== undefined) result.priceCents = cents;
  }

  const siteMatch = /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (siteMatch) result.merchant = siteMatch[1];

  return result;
}
