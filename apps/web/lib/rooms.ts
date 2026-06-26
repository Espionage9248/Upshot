import type { UIconKey } from "@upshot/ui";

/**
 * The five rooms (canonical source). `id` doubles as the UIcon key (per the
 * design handoff); the URL path is distinct from both. Array order is the rail
 * order, and the 1-based index is the ⌘1–5 digit shortcut.
 *
 * Imported by both `components/up-rail.tsx` (the nav rail) and
 * `lib/commands.ts` (the command palette) so the two never drift.
 */
export const ROOMS: ReadonlyArray<{ id: UIconKey; label: string; href: string }> = [
  { id: "today", label: "Today", href: "/today" },
  { id: "ledger", label: "Money", href: "/money" },
  { id: "wallet", label: "Budget", href: "/budget" },
  { id: "plan", label: "Plan", href: "/plan" },
  { id: "look", label: "Analyse", href: "/analyse" },
];
