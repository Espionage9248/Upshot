import type { TwoUpTxn } from "./types";

export interface Settlement {
  jamesContribCents: number;
  brittContribCents: number;
  interestCents: number;
  unassignedContribCents: number;
  sharedOutCents: number;
  jamesPersonalCents: number;
  brittPersonalCents: number;
  jamesNetCents: number;
  brittNetCents: number;
  whoOwedWhomCents: number;
}

export function computeSettlement(txns: TwoUpTxn[]): Settlement {
  let jamesContribCents = 0;
  let brittContribCents = 0;
  let interestCents = 0;
  let unassignedContribCents = 0;
  let sharedOutCents = 0;
  let jamesPersonalCents = 0;
  let brittPersonalCents = 0;

  for (const t of txns) {
    const amt = t.amountCents;
    if (t.owner === "REVERSAL") continue;

    if (amt > 0) {
      // inflow — bucket by owner
      if (t.owner === "JAMES") jamesContribCents += amt;
      else if (t.owner === "BRITTNEY") brittContribCents += amt;
      else if (t.owner === "INTEREST") interestCents += amt;
      else if (t.owner === "UNASSIGNED") unassignedContribCents += amt;
      // SHARED inflows: not counted as a contribution category
    } else {
      // outflow — bucket by owner
      const abs = -amt;
      if (t.owner === "SHARED") sharedOutCents += abs;
      else if (t.owner === "JAMES") jamesPersonalCents += abs;
      else if (t.owner === "BRITTNEY") brittPersonalCents += abs;
    }
  }

  const half = Math.round(sharedOutCents / 2);
  const jamesNetCents = jamesContribCents - half - jamesPersonalCents;
  const brittNetCents = brittContribCents - half - brittPersonalCents;

  // Compute as integer difference directly — the shared half cancels, so no rounding artefact.
  // Coerce -0 → 0 to satisfy Object.is-based equality checks (e.g. vitest toBe).
  const whoOwedWhomCents =
    ((jamesContribCents - brittContribCents) - (jamesPersonalCents - brittPersonalCents)) || 0;

  return {
    jamesContribCents,
    brittContribCents,
    interestCents,
    unassignedContribCents,
    sharedOutCents,
    jamesPersonalCents,
    brittPersonalCents,
    jamesNetCents,
    brittNetCents,
    whoOwedWhomCents,
  };
}
