# Handoff: Upshot V2 — Design System + Converged Screens

> **Status:** Build fidelity proof reviewed and **approved** for implementation.
> **Fidelity:** High-fidelity, token-exact. Recreate pixel-faithfully using the canonical tokens.
> **Stack intent:** `packages/ui` · Tailwind v4 `@theme` (from `ds/tokens.css`) · Radix UI primitives + CVA variants.

---

## Overview

Upshot is a personal-finance app. This bundle is the resting point of a two-round design exploration,
converged into one system: a **warm, editorial shell** carrying **confident, colourblind-safe money**.
Light and dark are designed as **true peers** (not an inverted theme). It contains everything needed to
implement the system in a real codebase:

- a canonical **token contract** (`ds/tokens.css`),
- a written **component specification** (`Upshot Component Specs.md`) — anatomy, variants, sizes, every state,
- two **living reference renders** (design system + applied product screens), light + dark,
- an approved **build fidelity proof** certifying the references resolve to the contract.

The brand anchor is **Up Sunset Orange `#ff705c`** — the only accent. Figtree is the UI typeface; JetBrains
Mono is mandatory for money/aligned numbers (tabular figures).

---

## About the design files

**These files are design *references* authored in HTML/JSX — prototypes that show intended look and behaviour,
not production code to copy verbatim.** The task is to **recreate them in the target codebase's environment**
using its established patterns. The spec is explicitly written to map onto **Radix primitives + CVA**, and the
tokens are authored for **Tailwind v4 `@theme`** — if the repo already uses those, this is a near-direct port.
If the repo uses something else (Vue, SwiftUI, plain CSS), keep the **values and visual decisions** from
`tokens.css` + the spec and express them in the local idiom. If no front-end exists yet, Tailwind v4 + Radix +
CVA (React) is the intended stack.

The JSX in `ds/` and `build/` runs in-browser via Babel for previewing only. **Do not ship Babel-in-browser.**
Treat the JSX as the source of truth for *exact* styling values (sizes, weights, radii, paddings, colours).

---

## Fidelity — High

Colours, typography, spacing, radii, elevation and motion are all final and tokenised. Recreate the UI
pixel-faithfully against `ds/tokens.css`. Where a measurement isn't in the spec, read it off the JSX
(every component is inline-styled with exact values).

---

## The contract — what actually ships into `packages/ui`

| Artefact | File | Role |
|---|---|---|
| **Tokens** | `ds/tokens.css` | **Source of truth.** Tailwind v4 `@theme` + `:root` (light) & `.dark` (dark) variable sets, OKLCH, Up-orange anchored. Everything references these — never raw colour. |
| **Component spec** | `Upshot Component Specs.md` | Per-component anatomy, token mapping, variants/sizes, and **every state**, mapped to Radix + CVA. The authoritative implementation doc. |
| **Design-system reference** | `Upshot Design System.html` (+ `ds/*.jsx`) | Living reference: tokens + every primitive/finance component rendered with states, light + dark (toggle top-right). |
| **Applied screens** | `Upshot Expansion.html` (+ `build/*.jsx`, `screens/expansion.jsx`) | The components composed into real product screens, light + dark (toggle top-right). |
| **Fidelity proof** | `proof/Upshot Build Fidelity Proof.html` | The approved certification: token parity, component coverage, live both-mode renders, a11y conformance, reconciliation log. |

> `build/*.jsx` are the screen sources; `screens/expansion.jsx` is their concatenation (what the HTML loads).
> `lib/design-canvas.jsx` is only the review canvas (pan/zoom wrapper) — **not** part of the product.

---

## Design tokens (headline values — full set in `ds/tokens.css`)

**Do not re-derive these. Import `ds/tokens.css`.** Summary for orientation:

- **Brand:** `--coral #ff705c` (fills, active nav, viz-1) · `--coral-text` (coral as *text*, AA per mode) ·
  `--coral-dim` (selected/active wash, focus halo) · `--on-coral` (text/icon on coral fills) ·
  `--focus` (focus ring — `#ff705c` light, `#ff8473` dark) · `--yellow` (celebratory only).
- **Neutrals (warm, hue ≈ 60):** `--bg --surface --surface-2 --surface-3 --line --line-soft --text --text-2 --text-3`,
  authored per mode (light = warm paper, dark = warm charcoal).
- **Finance semantics (meaning never by colour alone):** `--income --expense --transfer --saved --debt --warn --proj`.
  Always paired with a **sign (+ − ~)** and an **icon/label**. `transfer` is neutral-by-intent (must not read as spend).
  `projected` is dashed + `~` and lower-emphasis than actuals.
- **Data-viz:** ordered `--viz-1 … --viz-7` (viz-1 = coral = "actual"). Beyond 7 series, group the tail as "Other".
- **Type:** `--font-sans` Figtree · `--font-mono` JetBrains Mono. Roles `--text-display/h1/h2/h3/title/body/bodysm/label/caption/money(-xl)`.
  Tabular figures (`.tnum`) mandatory anywhere numbers align.
- **Spacing:** 4px base (`--spacing`); scale 2/4/6/8/12/16/20/24/32/40/48/64.
- **Radius:** `--radius-data 9` (rows/chips/inputs) · `--radius-sm 6` · `--radius-card 18` (cards/sheets) · `--radius-pill`.
- **Elevation:** `--elev-1/2/3/-pop`. Light = real shadow; **dark = lighter surface + 1px inset top-highlight** (shadow secondary).
- **Motion:** `--duration-fast 120 / base 180 / slow 280`; `--ease-out` (default), `--ease-in-out`, `--ease-spring`.
  All motion collapses to ≤0.01ms under `prefers-reduced-motion`.

---

## Components to build

The full per-component contract (anatomy · token mapping · variants · sizes · **all states**) is in
**`Upshot Component Specs.md`** — implement from it directly. Inventory:

**Primitives (§2):** Button · Input/Select/Textarea · Switch/Slider/Checkbox · Tabs · Badge · Progress ·
Skeleton · Alert · Dialog · Sheet · Popover · Card · Table · Tooltip.

**Finance (§3):** Money (the atom) · Stat · Envelope · Debt/Installment · Ledger row · Cashflow/Forecast ·
Category donut · Net-worth trend · Money-flow (Sankey) · Readiness gauge · Confidence · Card utilisation ·
Sync status · Rule builder · Insight card · Spending heatmap · Streak · Upcoming bills · Command palette ·
Empty/Loading/Suggested states.

> **`Money` is the atom everything composes from.** Build it first and correctly: `--font-mono` + `.tnum`,
> sign always present, colour from `--{kind}`, optional direction arrow, `quiet` → neutral text, `projected`
> → `--proj` dashed + `~`. Colour is reinforcement, never the sole signal.

---

## Screens (in `Upshot Expansion.html`)

Each is a `.up`-scoped React view; the light/dark toggle is top-right.

| Screen | Component | Purpose |
|---|---|---|
| Revised IA map | `IAMap` | Information architecture — where each committed capability lives. |
| Dashboard · Calm default | `DashCalm` | Opinionated default: safe-to-spend hero, forecast, readiness, bills. |
| Dashboard · Configurable bento | `DashGrid` | User-arrangeable widget grid. |
| Dashboard · Arrange mode | `DashEdit` | The grid in edit/arrange state (add-widget rail). |
| Net worth & assets | `NetWorth` | Assets/debts, net-worth trend, asset rows. |
| Recurring intelligence | `Recurring` | Subscriptions/bills detection + management. |
| Analytics | `Analytics` | Spending heatmap + streaks + insights. |
| Tax time | `TaxTime` | Deductible flagging / tax surfaces. |
| Component gallery | `ComponentsGallery` | New components in the converged language. |
| Command palette (⌘K) | `CommandPalette` | Radix Dialog + grouped results; actions are first-class. |

---

## Interactions, state & accessibility

- **States** (every interactive component): `default · hover · focus-visible · active · disabled · selected · error`.
  **focus-visible is always `--focus`, 2px, 2px offset, in both modes.**
- **Overlays** (Radix Dialog/Popover): dialog scales `.96→1` + fade (slow); sheet slides from edge (slow);
  popover fades + 4px rise (base). Scrim = low-alpha warm black + 2px backdrop blur. All trap & restore focus.
- **Responsive:** dense tables (e.g. Ledger) collapse to merchant + amount on a 360px phone — don't clip.
  Touch hit targets ≥ 44px (use `lg` control size on touch).
- **A11y checklist** (must hold per component): AA in both modes · no meaning by colour alone · visible focus
  ring · keyboard operable (preserve Radix behaviours) · tabular figures on aligned numbers · honours
  `prefers-reduced-motion`. (See proof §04.)

---

## Suggested implementation order

1. **Tokens** — port `ds/tokens.css` into the build (Tailwind v4 `@theme`); wire light `:root` + `.dark`.
2. **`Money` atom** + the typography/`.tnum` plumbing.
3. **Primitives** (Button → inputs → Switch/Slider/Checkbox → Tabs/Badge/Progress → Alert/Skeleton → Dialog/Sheet/Popover → Card/Table/Tooltip).
4. **Finance components**, composing on `Money`.
5. **Screens**, composing primitives + finance.

---

## Screenshots

`screenshots/` holds rendered captures for quick visual reference **without running anything**:

- `01-dashboard-calm-dark.png` — Dashboard, Calm default (dark)
- `02-net-worth-dark.png` — Net worth & assets (dark)

This is a **partial set** (two key screens, dark — the product default). For the **complete** visual reference
— every screen in **both light and dark** — open `Upshot Design System.html` and `Upshot Expansion.html` and use
the **light/dark toggle (top-right)**. The live HTML is the source of truth for look and behaviour.

---

## Files in this bundle

```
ds/tokens.css                      ← canonical token contract (START HERE)
Upshot Component Specs.md          ← per-component spec (Radix + CVA)
Upshot Design System.html          ← living reference (ds/*.jsx), light + dark
Upshot Expansion.html              ← applied product screens (build/*.jsx), light + dark
proof/Upshot Build Fidelity Proof.html  ← approved fidelity certification
screenshots/                       ← rendered references (partial: 2 screens, dark)
ds/*.jsx                           ← design-system reference component source
build/*.jsx                        ← screen source (concatenated → screens/expansion.jsx)
lib/design-canvas.jsx              ← review canvas only (NOT product)
Upshot Directions.html             ← round-1 exploration (historical context, optional)
```

Open the two HTML files in a browser to see the system live (toggle light/dark top-right).

---

## Kickoff prompt for Claude Code

Paste this in your repo with the bundle present:

> Implement the Upshot design system from `design_handoff_upshot/` into this codebase.
> Start by porting `ds/tokens.css` (Tailwind v4 `@theme`, light `:root` + dark `.dark`) into our build, then
> build the `Money` atom, then the primitives, then the finance components, following
> `Upshot Component Specs.md` (Radix primitives + CVA variants). Match the exact styling values in the
> reference `*.jsx` files. Keep meaning-never-by-colour-alone, the `--focus` ring on every focusable element,
> tabular figures on all aligned numbers, and `prefers-reduced-motion` support. Don't ship Babel-in-browser —
> these HTML/JSX files are visual references only.
