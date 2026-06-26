"use client";

import type { ReactElement } from "react";
import { EmptyState } from "./empty-state";

export interface SpendingHeatmapProps {
  days: Array<{
    date: string;
    spendCents: number;
    intensity: number;
    isZero: boolean;
  }>;
}

/** Format cents as a dollar string for aria-labels */
function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Format ISO date as a readable label */
function formatDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString("en-AU", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

/**
 * SpendingHeatmap — 7-column calendar grid of daily spend.
 * Intensity fills cells via color-mix(in oklch, var(--coral) <pct>%, transparent).
 * Zero-spend cells are dashed-empty. All cells carry aria-labels (date + spend).
 * Design ref: §"Spending heatmap". AA: labels carry meaning, not colour alone.
 */
export function SpendingHeatmap({ days }: SpendingHeatmapProps): ReactElement {
  if (days.length === 0) {
    return (
      <EmptyState
        icon="clock"
        title="No spending data"
        hint="Spending heatmap appears once transactions are recorded."
      />
    );
  }

  return (
    <div
      role="grid"
      aria-label="Daily spending heatmap"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 4,
      }}
    >
      {days.map((day) => {
        const pct = Math.round(Math.min(1, Math.max(0, day.intensity)) * 100);
        const background = day.isZero
          ? "transparent"
          : `color-mix(in oklch, var(--coral) ${pct}%, transparent)`;

        const ariaLabel = day.isZero
          ? `${day.date} (${formatDate(day.date)}): no spend`
          : `${day.date} (${formatDate(day.date)}): ${formatDollars(day.spendCents)}`;

        return (
          <div
            key={day.date}
            role="gridcell"
            aria-label={ariaLabel}
            data-heatmap-cell
            data-zero={day.isZero ? "true" : "false"}
            data-intensity={day.isZero ? 0 : pct / 100}
            style={{
              aspectRatio: "1",
              borderRadius: 4,
              background,
              borderWidth: 1,
              borderStyle: day.isZero ? "dashed" : "solid",
              borderColor: day.isZero
                ? "var(--line)"
                : `color-mix(in oklch, var(--coral) ${Math.max(pct, 20)}%, transparent)`,
              minHeight: 24,
            }}
          />
        );
      })}
    </div>
  );
}
