"use client";

import type { ReactElement } from "react";
import { UIcon } from "../icons";

export interface StreakIndicatorProps {
  currentDays: number;
  bestDays: number;
}

/**
 * StreakIndicator — flame icon + current streak count + best N days.
 * Quiet; no escalation or confetti. Design ref: §"Streak indicator".
 * Flame glyph via UIcon "flame", coloured var(--income).
 */
export function StreakIndicator({ currentDays, bestDays }: StreakIndicatorProps): ReactElement {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
      aria-label={`Streak: ${currentDays} days. Best: ${bestDays} days.`}
    >
      <span style={{ color: "var(--income)", display: "inline-flex", alignItems: "center" }}>
        <UIcon name="flame" size={18} />
      </span>
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: "var(--text-1)",
          lineHeight: 1,
        }}
      >
        {currentDays}
      </span>
      <span
        style={{
          fontSize: 12,
          color: "var(--text-3)",
          fontWeight: 500,
        }}
      >
        best {bestDays}
      </span>
    </div>
  );
}
