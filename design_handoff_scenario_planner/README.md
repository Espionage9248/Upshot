# Handoff: Scenario Planner & Locked Debt Payoff (`/plan/debts`)

## Overview
An inline surface on **`/plan/debts`** where the owner models paying their debts off
faster, commits to one tracked plan, and measures real progress against it. It sits
below the debt list + BNPL summary on the existing Plan → Debts & payoff page.

The feature has two persistence layers (the conceptual spine — do not collapse them):

- **One Locked Plan** — the real, tracked commitment. Locking *freezes* the projected
  payoff curve; from then on Upshot measures actual progress against that frozen curve
  (ahead / on-track / behind).
- **Any number of Saved Scenarios** — hypothetical "what-if" budgets. Each stores the
  full tuned inputs and **recomputes live against current debts** whenever opened. A
  scenario can be **promoted** to become the Locked Plan.

**The "reality line" between these is the heart of the feature.** The user must always
feel whether they're playing with a hypothesis or looking at the real, tracked plan.

## About the design files
The files in this bundle are **design references authored in HTML/React-via-Babel** —
prototypes that show the intended look, layout, and behavior. **They are not production
code to copy.** The task is to **recreate these designs in the Upshot codebase** using
its established environment: **React + the `packages/ui` library (Radix primitives + CVA
variants) + the `tokens.css` contract**. Re-use existing primitives wherever they exist
(Button, Segmented control, Money, Switch/Slider, Radix Dialog/Sheet, the SVG gauge) and
build the new bespoke pieces (payoff chart, the tuner, the locked banner) in that idiom.

The prototype packs **every state onto one design canvas** (pan/zoom; the `lib/design-canvas.jsx`
wrapper is scaffolding only — ignore it for implementation). The first artboard is a fully
interactive build of the surface; the rest are edge/feedback states.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, components, copy, and interactions.
Recreate pixel-faithfully using the codebase's libraries. All visual values come from
`tokens.css` (bundled) — reference tokens by name, never hardcode hex.

> **Numbers are representative.** The prototype uses a simple closed-form model so the
> curve/outputs react believably as you tune — it is **not** real amortisation. In
> production, replace `model()` (in `build/planner-tuner.jsx`) with the real multi-debt
> amortisation from the frozen functional spec
> (`docs/superpowers/specs/2026-06-21-scenario-planner-payoff-design.md`). The design does
> not depend on the model's internals — only on the shape of its outputs (see State).

## Screenshots (supporting reference)
These PNGs (in `screenshots/`) are **secondary references** — use them only if the structure
isn't clear from the live HTML and code, which remain the source of truth. They're shown in
**dark mode** (the brand-forward default; light is a full peer — toggle it live, top-right of
the HTML). Captured via static rendering, so a few tight labels/markers may sit slightly off
where the web font didn't load — trust the live render for exact metrics.

| | |
|---|---|
| **The surface in context** — full `/plan/debts`, workspace direction, mid-tuning. The interactive centrepiece. | `screenshots/01-shot.png` |
| **Tracked plan locked** — locked banner + reality line in place; debt list reflects the locked strategy. | `screenshots/03-shot.png` |
| **Tuner A · Workspace** — primary controls open, budget assumptions disclosed. | `screenshots/04-shot.png` |
| **Tuner B · Stepped** — one numbered section at a time (also the mobile reflow). | `screenshots/05-shot.png` |
| **Re-modelling the locked plan** — reality line in its solid-coral "locked-edit" state. | `screenshots/06-shot.png` |
| **Timeline chart — hypothesis** — baseline vs scenario, lump notch, debt-free marker. | `screenshots/07-shot.png` |
| **Timeline chart — locked** — scenario vs the frozen locked curve + "you are here". | `screenshots/08-shot.png` |
| **Locked banner — all statuses** — ahead / on-track / behind. | `screenshots/09-shot.png` |
| **Saved scenarios** — populated "what-if" cards with open / promote / delete. | `screenshots/10-shot.png` |
| **Feedback & states** — toasts + the lock confirm dialog. | `screenshots/11-shot.png` |
| **Mobile · 360px** — tuner (stepped), tracked-plan banner, chart with locked read. | `screenshots/12-shot.png` |

---

## Information-architecture decisions (resolved in this design)

1. **Strategy duplication → merged.** The planner owns the strategy selector
   (snowball / avalanche / custom). The page's debt list simply *reflects* the locked
   plan's strategy ("Clearing by Avalanche", with a lock glyph) — there is **no** second
   global strategy control. Remove/relabel any pre-existing global one accordingly.

2. **Forward vs target-date** are two modes of one allocation control, swapped by a
   segmented toggle, kept at parity (both end in a single monthly figure + a debt-free month).

3. **Custom order** uses an explicit, keyboard-accessible reorder (up/down buttons + a
   grab affordance) — not drag-only — so it works with a keyboard and screen reader.

4. **The dense tuner is presented as two directions to choose between** (see Screens):
   - **A · Workspace** (recommended) — primary controls (Allocation, Payoff order) always
     open; seeded "Budget assumptions" (Income, Expenses, One-off payments) as collapsed
     disclosures. Result column = outputs → chart → debt-free path.
   - **B · Stepped** — one numbered section open at a time (accordion). Calmer; this is
     also the **mobile** reflow.
   Ship **A** for desktop and **B** for ≤ ~640px. (Per stakeholder: Workspace is preferred for IA.)

---

## Screens / Views

> Desktop content column sits to the right of the 84px `UpRail`; page padding `34px 40px 48px`,
> vertical rhythm `gap: 18px`. Page header (`Debts & payoff`, 27px/600) → `PlanTabs`
> (underline tabs, active = "Debts & payoff") → [Locked banner if locked] → Debt summary
> → Planner → Saved scenarios.

### 1. Debt summary (context above the planner)
Two cards in a `1.5fr / 1fr` grid.
- **What you owe** — total `$13,040` (mono, 22px/700); rows per debt: 36px rounded icon
  tile, name (13.5px/600), `{apr}% APR · min ${min}/mo` (mono 11px), right-aligned balance
  (mono 15px/700). Visa row shows a **utilisation** mini-bar (5px track, 80% marker line,
  colour steps income<50 → debt 50–80 → warn>80). Header shows "Clearing by Avalanche" +
  lock glyph **only when a plan is locked**.
- **Buy now, pay later** — `$146 remaining`; per-plan installment pip rows (N-of-M, filled = coral)
  + "next in 12 days" + projected Money amount.
Debts: Visa `$2,000 @ 18.9% min $60`; Personal loan `$4,800 @ 9.4% min $135`; Car loan `$6,240 @ 3.1% min $195`.

### 2. The planner card — direction A (Workspace)
Card: `--surface`, `--radius-card`, padding 22. **Reality-line frame:** hypothesis =
`border-top: 3px dashed coral@55%`; locked-edit = `border-top: 3px solid --coral` + coral
border + `--elev-2`.
- **Header row:** left = `RealityHeader` (a pill — hypothesis: dashed coral "What-if · not
  committed" w/ sparkle icon; locked-edit: solid coral "Editing your tracked plan" w/ lock
  icon — plus scenario name 16px/700 and an unsaved-dot); right = `Save as scenario` (ghost,
  copy icon) + `Lock in this plan` (primary, lock icon).
- **Body grid `1.32fr / 1fr`, `align-items: start`, gap 22:**
  - **Left (result):** `OutputsBlock` → chart card (border, radius-card, pad 16, `PayoffChart` h≈320)
    → `PayoffMilestones`.
  - **Right (controls):** "Allocation" sub-card (always open, `AllocationBlock`) → "Payoff order"
    sub-card (always open, `StrategyBlock`) → "Budget assumptions" divider → three
    `Disclosure`s (Income, Expenses, One-off payments), collapsed by default with a right-aligned
    summary value.

### 3. The planner card — direction B (Stepped)
Same header + left result column. Right column is a single accordion of **5 numbered
`Disclosure`s**, one open at a time: 1 How much / by when (Allocation) · 2 Payoff order ·
3 One-off payments · 4 Income · 5 Expenses. Number badge = 22px rounded; active badge coral.

### 4. `OutputsBlock` — "If you commit to this"
Eyebrow label → big debt-free month (mono, 40px/700, `--coral-text`) + "debt-free" →
"vs ~~Aug '29~~ doing nothing" (baseline struck through). Below: two stat tiles —
`{monthsSaved} mo sooner` (income) and `+$ interest saved` (Money, kind=saved).

### 5. `PayoffMilestones` — "Debt-free path · {Strategy} order"
A segmented horizontal bar (10px, segment widths ∝ balance, coral→debt colour ramp by
order) + one row per debt: colour chip · name · `{apr}%` (mono) · clear-month (coral-text,
mono, with a check glyph). Reacts to strategy/custom order. Fills the result column.

### 6. `PayoffChart` — the timeline (bespoke SVG, token-themed)
Plots **total debt balance ($) over months**. ViewBox `1000 × height` (responsive 100% width).
- **Y axis:** gridlines + labels at `$0 / $4k / $8k / $12k`-style nice ticks (mono, --text-3).
- **X axis:** month ticks every 6 (mobile 12), labelled `Mon 'YY`. A dashed **TODAY** divider at month 0.
- **Curves:** scenario = solid `--coral` 2.8px with faint coral area fill + filled debt-free
  dot & a coral **DEBT-FREE** flag + date; baseline ("No extra") = dashed `--proj` 2px with
  open debt-free marker; locked reference (when present) = solid `--text-2` 2px with a
  **you-are-here** ring at the current month. Optional **lump-sum notch** (vertical tick + "+ lump").
- **Hover:** vertical crosshair + dots on each curve + a floating readout card
  (`--elev-pop`) showing the month and each balance (mono). Flips at the right edge.
  (Desktop only; disable on touch.)
- **Empty state:** dashed hatched well + icon + "Your payoff curve will appear here".
- **Loading state:** skeleton curves + shimmer + "Recomputing against your current debts…".
- **Mobile:** height ~170–230, fewer ticks, no hover, legend rendered below the chart as rows.

### 7. `LockedBanner` — the reality line (3 statuses)
Appears above the debt summary when a plan is locked. Coral 3px left edge, coral-dim top
gradient, `--elev-2`. Left: an 84px **gauge** (% paid) + "YOUR TRACKED PLAN" eyebrow (lock
glyph) + "Debt-free by **Feb '28**" (mono) + a `Confidence` chip (ahead/on-track/behind —
glyph + label + colour, never colour alone) + a slip figure (`▲ 2 mo early` / `on track` /
`▼ 3 wk behind`). Right: `Re-model` (secondary) + `Unlock` (ghost). Below: a one-line,
plain-language **nudge** (icon + sentence). Statuses map: `on`→income, `at`→warn,
`off`→expense.

### 8. `SavedScenarios`
- **Populated:** "Saved scenarios" label + "{n} what-ifs · recomputed live" + a 3-col grid
  of `ScenarioCard`s. Each card: **dashed** border ("WHAT-IF" pill w/ sparkle) — or solid
  coral-dim ("LOCKED" pill w/ lock glyph) for the tracked one. Shows DEBT-FREE / EXTRA/MO /
  SAVES stats, a "Recomputed against today's balances" line, and actions: `Open` (full),
  `Promote` (primary, lock icon — what-ifs only), `Delete` (ghost trash — what-ifs only).
- **Empty:** dashed well + "No saved what-ifs yet" + guidance pointing at **Save as scenario**.

### 9. Feedback & states
- **Toasts** (`--elev-pop`, coloured left edge, auto-dismiss ~3.2s, role="status"): Saved,
  Locked, Unlocked, Promoted, Deleted, and an error ("Couldn't reach that date").
- **Confirm dialogs** (Radix Dialog; scrim = warm-black @45% + 2px blur; centred card,
  `--radius-card`, `--elev-3`): Lock, Promote, Unlock — each with icon tile, title, an
  explanatory body that names the consequence, and Cancel / confirm (confirm is `danger`
  for Unlock).

### 10. Mobile (360px)
`Phone` frame (status bar + back/title + bottom 5-tab nav). Three key screens: the **tuner**
(stepped reflow — what-if pill, compact outputs, small static chart, numbered disclosures,
sticky Save / Lock actions), the **tracked-plan banner + scenarios**, and the **chart** with
the locked read + a legend rendered as rows.

---

## Interactions & behavior
- **Tune → react:** moving the allocation slider / changing mode / strategy / lumps / expenses
  recomputes outputs, the chart, and the debt-free path live (debounce the real engine if needed).
- **Forward mode:** slider = % of computed monthly **headroom**; shows the resulting `$X/mo`
  and the headroom figure.
- **Target-date mode:** stepper picks a debt-free month; the engine **solves the required
  monthly payment**. If that exceeds headroom → **unreachable warning** (warn-tinted box +
  message naming the shortfall); clamp/guide rather than block.
- **Save as scenario:** push current tuning to Saved Scenarios (auto-named); success toast.
- **Lock in plan:** opens confirm dialog → on confirm freezes the curve, shows the
  LockedBanner, toast. Re-model sets the planner into "locked-edit" (solid coral frame).
- **Promote (saved card):** confirm → replaces the locked plan, recomputed against today.
- **Unlock:** confirm (danger) → returns to free modelling; the plan is saved to scenarios.
- **Seeded values** (income, discretionary, expense amounts) carry an italic sparkle
  "we estimated this — edit it" hint; all are editable.
- **Motion** honours `prefers-reduced-motion` (durations collapse). Entrance/curve-draw
  animations must degrade to the final state for print/PDF/reduced-motion.

## State management
Single planner state object (`usePlanner` in `build/planner-tuner.jsx` is the reference shape):
```
{ mode: 'forward'|'target', strategy: 'snowball'|'avalanche'|'custom',
  order: debtId[],                         // custom order
  headroomShare: 0..100,                   // forward
  targetMonths: int,                       // target-date
  income, raiseOn, raiseAmount, raiseMonth,
  cut: {debtRecurringId: bool}, amounts: {id: number}, discretionary,
  lumps: [{ id, month, amount }] }
```
Derived (the only contract the UI relies on — back it with real amortisation):
`{ headroom, extra, overHeadroom, months, monthsSaved, interestSaved, requiredPayment,
   unreachable, keptExpenses, lumpForChart }`.
Page-level: `lockedPlan | null`, `scenarios[]`, `mode: hypothesis|locked-edit`, transient
`toast`, `dialog`. Persist Locked Plan + Saved Scenarios server-side/local per the spec;
scenarios recompute against current debts on open.

## Design tokens
All in **`ds/tokens.css`** (bundled — light `:root` + dark `.dark`, OKLCH, Tailwind v4
`@theme`). Anchor = Sunset Orange `--coral #ff705c` with `--coral-text` (AA text variant per
mode) and `--on-coral` (text on coral fills). Key names used here: surfaces
`--bg --surface --surface-2 --surface-3 --line --line-soft`; text `--text --text-2 --text-3`;
finance `--income --expense --transfer --saved --debt --warn --proj`; radii
`--radius-data 9 / --radius-sm 6 / --radius-card 18 / --radius-pill`; elevation
`--elev-1/2/3/-pop`; motion `--duration-fast/base/slow` + `--ease-out/-in-out/-spring`.
Type: **Figtree** (sans) + **JetBrains Mono** (`.tnum` tabular) — money/numbers are always
mono + tabular + sign-aware. **Meaning is never colour-only** (always sign/glyph/label too).

## Assets
No raster assets. All icons are inline single-path SVGs (`UIcon` set in
`build/planner-core.jsx`) — map these to the codebase's existing icon set; the path data is a
reference, not a deliverable. The Up logo mark is a CSS radial-gradient placeholder — use the
real brand mark.

## Files in this bundle
- `Upshot Scenario Planner.html` — entry; open in a browser to interact with all states. Loads the build files + design-canvas wrapper. Light/dark toggle top-right.
- `build/planner-core.jsx` — tokens scope, icons, atoms (Money, Card, Confidence, Gauge), controls (Button, Segmented, Toggle, Slider, MoneyInput, Field), chrome (UpRail, PlanTabs), Toast.
- `build/planner-chart.jsx` — `PayoffChart`, `ChartEmpty`, `ChartLoading`.
- `build/planner-tuner.jsx` — fixed data, the representative `model()` (**swap for real amortisation**), `usePlanner`, and all control blocks (Income, Expenses, Strategy + ReorderList, Allocation, Lumps, Outputs).
- `build/planner-views.jsx` — `ScenarioPlanner` (both directions), `RealityHeader`, `PayoffMilestones`, `LockedBanner`, `SavedScenarios`/`ScenarioCard`, `DebtSummary`.
- `build/planner-states.jsx` — interactive `DebtsPage`, `ConfirmDialog`, `FeedbackShowcase`, mobile screens.
- `lib/design-canvas.jsx` — **scaffolding only** (the pan/zoom board); not part of the feature.
- `ds/tokens.css` — the token contract (source of truth for all values).
- `Upshot Component Specs.md` — the broader component spec (anatomy, variants, states) the new pieces should align to.
- `screenshots/` — 11 dark-mode reference PNGs of the states above (supporting only; see the Screenshots section).
