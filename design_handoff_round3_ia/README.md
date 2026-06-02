# Handoff: Upshot V2 — Round 3 IA gaps (Appendix B)

> **Addendum to the main Upshot design system** (`design_handoff_upshot/`). Same token contract,
> same component language — **no new tokens.** This bundle resolves the three IA gaps raised in
> the brief's Appendix B and adds the surfaces that home them.
>
> **Fidelity:** high (token-exact). **Source of truth for these surfaces:** `screens/round3.jsx`.

---

## What this resolves

| # | Gap | Resolution |
|---|---|---|
| **B1** | No home for **Settings** | A **full surface reached via the gear (+ ⌘K) — not a 6th rail room.** The five-room rail stays intact (phone survivability); Settings is a deliberate destination, reached from the avatar/overflow on phone. |
| **B2** | Only sync **status**, no activity | **Sync & activity** lives inside Settings, split into two tabs: **Runs** (machine job history) and **Activity** (plain-language user log). Includes the `401 → reconnect` token-health state. |
| **B3** | **2Up** joint account depth | A **read-only sub-surface under Analyze** with real depth: a first-class searchable/filterable ledger + per-contributor money-in-vs-out analytics + who-spent-where. |

**The B1 decision is an IA change** — the router/nav must treat Settings as a gear-launched surface, and `PLAN-V2.md` should record it. Everything else composes existing components.

---

## How to view

Open **`Upshot Round 3 — IA Gaps.html`** (design canvas; pan/zoom, light/dark toggle top-right).
It loads `screens/expansion.jsx` (the already-delivered component system, for rendering only),
`screens/round3.jsx` (the new surfaces — **what you port**), and `lib/design-canvas.jsx` (review wrapper, not product).

---

## Surfaces

### B1 · Settings  (`SettingsSurface`)
- **Layout:** rail (gear active, no room selected) · header "Settings" · **left sub-nav (230px)** + content pane.
- **Sub-nav sections:** Account & profile · Connections & sync · Budgeting & goals · Debts & purchases · Tax · Data & export · Sync & activity.
- **Shown section — Connections & sync:** bank-connection card (Up · `Sync status` healthy · token "renews 28 Jun" · Reconnect), **Sync cadence** (segmented Real-time / Hourly / Daily + Switch rows), **Detection & automation** (Switch rows), and a link through to Sync & activity.

### B2 · Sync & activity  (`SyncRuns`, `SyncActivity`)
- Inside Settings. Header: **Sync now** (primary) + overall health + last-sync. **Tabs: Runs · Activity.**
- **Runs** — Table: Job · Status (Badge) · Result/counts · Duration · When. States: success / running / failed / **token expired (401) → Reconnect**.
- **Activity** — plain-language log rows (flag deductible, pause sub, create rule, mark transfer, edit budget, reconnect), icon + sentence + timestamp.

### B3 · 2Up  (`TwoUpOverview`, `TwoUpLedger`)  — under Analyze, read-only
- **Overview:** Stat strip (total in / spent / distributed) · **Money in vs out per person** (Sam/Alex panels: put-in `income`, spent `expense`, net `saved`, bars on a shared scale, even-split settle line) · **Who contributed** (split bar + contribution rhythm spark) · **Where it went · who spent where** (per-category Sam/Alex split bars).
- **Ledger:** search field + filter chips (Person / Category / Date / Amount) + sort · Table with contributor-attributed rows (`Money` sign+colour, category dot, date) · "Showing 9 of 1,284".

---

## Components — reuse vs. net-new

**Reuse as-is (already in the system):** `Money`, `Card`, `Label`, `Pill`, `Utilisation`, `Spark`, `Donut`, `UpRail`, Tabs, Badge, Table, Switch, **Sync status** (= the status pill), **Stat** (= the stat cards).

**Net-new presentational pieces to add to `packages/ui`** (all compose existing tokens/primitives — no new tokens):
- **`RailGear`** — rail in its *Settings-active* state (gear highlighted, no room active). Prefer adding a `settingsActive` prop to the existing rail rather than a fork.
- **`SettingsNav`** — vertical settings sub-nav (active = `--coral-dim` + inset coral edge).
- **`Segmented`** — segmented control (Radix ToggleGroup/Tabs styled as a pill group).
- **`ToggleRow`** — label + sub + Switch row.
- **`FilterChip`** — filter/Select trigger chip (maps to Radix Select trigger).
- **2Up viz:** **`ContributorPanel`** (in/out bars + net), **`SplitBar`** (two-person share), **`CatSplit`** (per-category two-person bars), **`Avatar`** (initial chip), **`TUpRow`** (ledger row with contributor attribution).

Person identity uses `--viz-2` (teal = Sam) and `--viz-4` (indigo = Alex); money direction stays `income`/`expense` (sign + colour) — meaning is never carried by the person colour alone.

---

## Files in this bundle

```
INTEGRATION-PROMPT.md              ← paste this into Claude Code (start here)
Upshot Round 3 — IA Gaps.html      ← the surfaces, light + dark (open to view)
screens/round3.jsx                 ← SOURCE OF TRUTH for the new surfaces (port this)
screens/expansion.jsx              ← existing delivered components (render-only reference)
lib/design-canvas.jsx              ← review canvas only (NOT product)
```

Tokens and the per-component spec are unchanged — see the main bundle (`design_handoff_upshot/ds/tokens.css`,
`Upshot Component Specs.md`). These surfaces add **zero** new tokens.
