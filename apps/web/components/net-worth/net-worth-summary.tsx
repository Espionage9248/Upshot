"use client";

import { Stat, Money } from "@upshot/ui";

export interface NetWorthSummaryProps {
  totalCents: number;
}

/**
 * The hero figure on /net-worth: a single big mono total. Client component —
 * serializable props only, never imports @upshot/db. The value is reinforcement-
 * neutral (no spend/income colour); sign is carried by the figure itself.
 */
export function NetWorthSummary({ totalCents }: NetWorthSummaryProps) {
  return (
    <Stat
      label="Total net worth"
      value={<Money cents={totalCents} kind="neutral" size={34} weight={700} showCents={false} />}
    />
  );
}
