import type { UIconKey } from "@upshot/ui";
import { ROOMS } from "./rooms";

/**
 * Pure command-palette model. No React / Next imports — fully unit-tested.
 * The component layer (components/command-palette.tsx) renders this and owns
 * keyboard/router side effects.
 */

export type CommandGroup = "Go to" | "Actions";

export interface Command {
  id: string;
  group: CommandGroup;
  label: string;
  sub?: string;
  icon: UIconKey;
  /** Present for "go-to" commands; the route to push. */
  href?: string;
  kind: "go-to" | "action";
}

// Group order is fixed: Go to before Actions.
const GROUP_ORDER: readonly CommandGroup[] = ["Go to", "Actions"];

// Go-to commands derive from the canonical room list (shared with the rail).
const GO_TO: Command[] = ROOMS.map((room) => ({
  id: `go-to:${room.id}`,
  group: "Go to",
  label: room.label,
  icon: room.id,
  href: room.href,
  kind: "go-to",
}));

// Action commands — first-class entries, no-op-with-feedback until their future
// phases land. Task 20: Transactions/Top-result groups need the Today/ledger
// data layer; omitted here because there is no data source yet.
const ACTIONS: Command[] = [
  {
    id: "action:flag-deductible",
    group: "Actions",
    label: "Flag as deductible",
    icon: "flag",
    kind: "action",
  },
  {
    id: "action:pause-subscription",
    group: "Actions",
    label: "Pause subscription",
    icon: "pause",
    kind: "action",
  },
  {
    id: "action:mark-transfer",
    group: "Actions",
    label: "Mark as transfer",
    icon: "repeat",
    kind: "action",
  },
];

const ALL_COMMANDS: readonly Command[] = [...GO_TO, ...ACTIONS];

/**
 * Case-insensitive filter on label (and sub). Empty/whitespace query returns
 * the full list in stable group order (Go to, then Actions).
 */
export function buildResults(query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [...ALL_COMMANDS];
  return ALL_COMMANDS.filter((c) => {
    const haystack = `${c.label} ${c.sub ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}

/**
 * Bucket results into groups for header rendering, preserving GROUP_ORDER and
 * dropping any group with no matching items.
 */
export function groupResults(
  results: readonly Command[],
): Array<{ group: CommandGroup; items: Command[] }> {
  return GROUP_ORDER.map((group) => ({
    group,
    items: results.filter((c) => c.group === group),
  })).filter((g) => g.items.length > 0);
}

/** 1→/today … 5→/analyze; out-of-range → undefined. */
export function roomForDigit(d: number): string | undefined {
  return ROOMS[d - 1]?.href;
}

/**
 * Pure active-index mover for keyboard nav. Wraps within [0, count-1]: down from
 * the last row → 0, up from the first → last. An empty list (count 0) → -1.
 */
export function moveActiveIndex(
  current: number,
  key: "ArrowDown" | "ArrowUp",
  count: number,
): number {
  if (count <= 0) return -1;
  const delta = key === "ArrowDown" ? 1 : -1;
  return (current + delta + count) % count;
}
