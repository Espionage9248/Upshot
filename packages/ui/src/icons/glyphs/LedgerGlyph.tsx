import type { SVGProps } from "react";

export interface GlyphProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

/**
 * Custom "Ledger" glyph — a booklet with ruled lines and a receipt-style
 * jagged bottom edge. Matches the ds.jsx ICONS.ledger path exactly.
 * First-party, AGPL-3.0-only.
 */
export function LedgerGlyph({
  size = 24,
  strokeWidth = 1.6,
  ...rest
}: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3V3.5z" />
      <path d="M9 8h6M9 11.5h6M9 15h3" />
    </svg>
  );
}
