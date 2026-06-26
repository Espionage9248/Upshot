# Spec — Scenario Planner UI Rebuild (high-fidelity, from design handoff)

**Date:** 2026-06-23
**Branch:** `matching-foundation` (scenario wave unpushed; this stacks on it)
**Status:** design approved; awaiting spec review → writing-plans

## 1. Context & goal

The Scenario Planner + Locked Debt Payoff feature is **functionally complete** on
`/plan/debts` (engine, DB, server actions, data loader, and four inline-styled
*placeholder* components wired into `debt-dashboard.tsx`). A high-fidelity design has now
landed in `design_handoff_scenario_planner/`. The goal is to **recreate that design
pixel-faithfully in the codebase**, replacing the placeholders, using `packages/ui`
(Radix + CVA) and the `tokens.css` contract — and to close the handful of **data/engine
gaps** the design needs that the current contract doesn't supply.

This is **not** a pure visual swap: it requires one engine extension, one schema column +
migration, several loader/preview additions, and one new shared primitive (Toaster), in
addition to the (larger) visual work.

The feature *logic* is settled — the frozen functional spec
(`docs/superpowers/specs/2026-06-21-scenario-planner-payoff-design.md`) governs behaviour;
this spec governs **presentation + the data contract changes needed to feed it**.

## 2. Locked decisions (from brainstorming)

1. **Phased, faithful.** Full pixel-faithful rebuild, staged across reviewable
   commit-groups on `matching-foundation`, UAT'd per phase. Phase order below.
2. **Re-model persists full inputs.** Add an `inputs` JSON column to `payoff_plan`
   (migration 0005); lock saves the complete `ScenarioInputs`; Re-model restores the exact
   tuning (income, expenses, discretionary, raise, slider, strategy, order, lumps).
3. **Pixel-faithful** to the handoff; all values from `tokens.css` by name (never hardcode hex).
4. **Placement:** `PayoffChart` stays feature-local in `apps/web/components/plan/`;
   `Toaster`/`toast` is reusable → `packages/ui`.

## 3. Source-of-truth references

- Handoff README: `design_handoff_scenario_planner/README.md` (IA decisions, Screens/Views,
  interactions, state contract)
- Component specs: `design_handoff_scenario_planner/Upshot Component Specs.md`
- Reference build (look + metrics; **not** code to copy):
  `design_handoff_scenario_planner/build/{planner-core,planner-tuner,planner-chart,planner-views,planner-states}.jsx`
- Screenshots (dark-mode secondary reference): `design_handoff_scenario_planner/screenshots/01..12`
- Token contract (already 1:1 with codebase): `packages/ui/src/styles/tokens.css`

> The reference `model()` in `planner-tuner.jsx` is a **representative** closed-form model.
> We do **not** port it — we feed the design from the real amortisation engine
> (`@upshot/core` `simulatePayoff` / `solveExtraForTargetDate`). The design depends only on
> the *shape* of the derived outputs (§8), not the model internals.

## 4. IA decisions baked in (resolved by the handoff)

1. **Strategy duplication → merged.** The planner owns the strategy selector. The debt
   list merely *reflects* the locked plan's strategy ("Clearing by Avalanche" + lock glyph)
   **only when locked**. **Remove** the pre-existing global `Payoff strategy` Segmented in
   `debt-dashboard.tsx` (and stop calling `setDebtStrategyAction` from there).
2. **Forward vs target-date** = two modes of one Allocation control (segmented:
   "Set an amount" / "Pick a date"), at parity — both end in one monthly figure + a
   debt-free month.
3. **Custom order** = explicit keyboard-accessible reorder (up/down + grab affordance),
   not drag-only.
4. **Two directions:** A · **Workspace** (desktop, recommended) and B · **Stepped**
   (numbered accordion = the ≤640px reflow). Ship A ≥640px, B <640px.

## 5. Phase 0 — Foundations

Small, mostly non-visual; unblocks Phases 1–2. Each item ships with tests.

### 5.1 Engine — per-debt cleared months
- `packages/core/src/payoff/types.ts`: extend `PayoffResult` with
  `perDebt: { id: string; clearedMonth: string | null }[]` (a debt that never clears in the
  horizon → `null`).
- `simulate.ts`: record the month each debt's balance first reaches 0 during the existing
  month-loop. No change to existing fields.
- Tests: a multi-debt fixture asserting each `clearedMonth` under snowball vs avalanche, and
  `null` for an un-cleared debt within the horizon.
- **Consumers:** PayoffMilestones (Phase 1) + the chart's per-debt markers if used.

### 5.2 DB — persist full inputs on the locked plan
- `packages/db/src/schema/…` `payoff_plan`: add `inputs` column (JSON `ScenarioInputs`),
  nullable for back-compat with any pre-existing row.
- Migration **0005** (follow the 0004 pattern).
- `DrizzlePayoffPlanRepo` get/upsert round-trips `inputs`.
- `lockPayoffPlanAction` / `promoteScenarioToPlanAction` write the source `ScenarioInputs`.
- Tests: repo round-trip of `inputs`; null-safe read of a legacy row.

### 5.3 Data loader / preview additions (`planning-data.ts`, `planner.ts`)
- **Per-scenario interest-saved:** for each saved scenario also simulate its baseline
  (extra=0) and surface `interestSavedCents` + `monthsSaved` (cards' SAVES stat).
- **Locked % paid:** `lockedPlan.lockBalanceCents` (= frozen `projectedCurve[0].balanceCents`)
  so the banner gauge can compute `(lock − current) / lock`.
- **Locked curve to the planner:** expose `lockedPlan.projectedCurve` (frozen) +
  `projectedDebtFreeMonth` to the planner so the chart can draw the locked reference +
  "you are here" in locked-edit mode.
- **Locked inputs for re-model:** surface `lockedPlan.inputs` (from 5.2).
- **Headroom/spare in preview:** `previewScenarioAction` returns `headroomCents` and
  `overHeadroom` (the Allocation block shows "$X spare/mo" and "N% of spare cash").
  (`buildPayoffInputs` already computes headroom internally — surface it.)
- **perDebt passthrough:** preview returns `scenario.perDebt` (from 5.1) for milestones.

### 5.4 New primitive — Toaster
- `packages/ui/src/primitives/toast.tsx`: a `Toaster` provider + `toast(...)` API (or a
  minimal context hook), `--elev-pop`, coloured left edge by tone
  (success/locked/neutral/warn), auto-dismiss ~3.2s, `role="status"`, honours
  `prefers-reduced-motion`. Export from `packages/ui`.
- Tones needed: Saved, Locked, Unlocked, Promoted, Deleted, Error.
- Tests: renders message, dismisses, `role="status"` present.

## 6. Phase 1 — Workspace desktop centrepiece

The interactive heart (handoff Screens §2, §4, §5, §6; shots 01/04/07). Replaces
`scenario-planner.tsx` + `payoff-chart.tsx` and the debt-summary area of `debt-dashboard.tsx`.

- **Reality-line framed planner `Card`** — hypothesis = `border-top: 3px dashed coral@55%`;
  locked-edit = `border-top: 3px solid --coral` + coral border + `--elev-2`.
- **`RealityHeader`** — pill (hypothesis: dashed coral "What-if · not committed" + sparkle;
  locked-edit: solid coral "Editing your tracked plan" + lock) + scenario name (16/700) +
  unsaved-dot; right = `Save as scenario` (ghost) + `Lock in this plan` (primary).
- **Body grid `1.32fr / 1fr`, `align-items:start`, gap 22:**
  - **Left (result):** `OutputsBlock` (eyebrow → big debt-free month 40/700 `--coral-text`
    → "vs ~~baseline~~ doing nothing" → two stat tiles: `{monthsSaved} mo sooner` income +
    `+$ interest saved` saved) → chart card (border, radius-card, pad 16, `PayoffChart`
    h≈320) → `PayoffMilestones` (segmented balance bar + per-debt rows with clear-month from
    §5.1).
  - **Right (controls):** Allocation sub-card (Set-an-amount slider w/ headroom% + $X/mo +
    spare/mo, **or** Pick-a-date stepper → solved required payment + unreachable warning) →
    Strategy sub-card (snowball/avalanche/custom + the explanatory line + ordered list;
    Custom → keyboard reorder list) → "Budget assumptions" divider → three collapsed
    `Disclosure`s (Income, Expenses, One-off payments) each with a right-aligned summary value.
- **Bespoke `PayoffChart` v2 (desktop)** — viewBox `1000×H`, responsive width; Y gridlines +
  nice `$0/$4k/$8k/$12k` ticks (mono `--text-3`); X month ticks every 6, `Mon 'YY`; dashed
  **TODAY** divider at month 0; scenario = solid `--coral` 2.8px + faint area fill + filled
  debt-free dot + **DEBT-FREE** flag; baseline = dashed `--proj` 2px + open marker; optional
  **lump notch**. (Hover, locked curve, empty/loading, mobile → Phases 2–3.)
- **Debt summary** (handoff §1; shot 01) — two cards `1.5fr/1fr`: **What you owe**
  (total mono; per-debt icon tile, name, `{apr}% APR · min $/mo`, right balance; Visa
  utilisation mini-bar reusing existing util logic; "Clearing by {Strategy}" + lock glyph
  **only when locked**) + **Buy now, pay later** (existing rollup, restyled).
- **Remove the duplicate global strategy control** (IA #1).
- **Seeded-value hints** — italic sparkle "we estimated this — edit it" on income &
  discretionary (`SeedHint`).
- Wire Save/Lock to existing actions (Lock confirm dialog comes in Phase 2; for Phase 1 a
  direct call is acceptable but will be wrapped in Phase 2).

## 7. Phase 2 — States & feedback

(Handoff §7, §8, §9; shots 03/06/08/09/10/11.)

- **`LockedBanner`** — coral 3px left edge, coral-dim top gradient, `--elev-2`; 84px gauge
  (% paid via §5.3) + "YOUR TRACKED PLAN" eyebrow (lock) + "Debt-free by {month}" +
  `Confidence` chip (ahead/on-track/behind — glyph+label+colour, never colour-only) + slip
  (`▲ 2 mo early` / `on track` / `▼ 3 wk behind`) + Re-model (secondary) + Unlock (ghost) +
  one-line nudge. Reuse `packages/ui` `Confidence` + `ReadinessGauge`.
- **Re-model → locked-edit** — Re-model loads `lockedPlan.inputs` (§5.2) into the planner and
  sets page mode `locked-edit` (solid-coral frame; "Update locked plan" primary). Chart shows
  the locked reference curve + "you are here".
- **`SavedScenarios`** — populated grid of `ScenarioCard`s: dashed "WHAT-IF" (sparkle) or
  solid coral-dim "LOCKED" (lock) for the tracked one; DEBT-FREE / EXTRA-MO / SAVES (§5.3) +
  "Recomputed against today's balances" + actions Open / Promote (what-ifs) / Delete
  (what-ifs). Empty = dashed well pointing at "Save as scenario".
- **Confirm dialogs** (Radix Dialog) — Lock / Promote / Unlock; icon tile, title,
  consequence body, Cancel / confirm (confirm = `danger` for Unlock).
- **Toasts** wired to every action (Saved/Locked/Unlocked/Promoted/Deleted/Error
  "Couldn't reach that date").
- **Chart states** — empty (dashed hatched well + icon) and loading (skeleton + shimmer +
  "Recomputing against your current debts…"); the locked read (scenario vs frozen locked +
  "you are here").

### 7.1 Fold-in — debt-detail Payoff timeline → locked plan as source-of-truth
(Phase-1 UAT deferred follow-up #2; included in Phase 2 as delimited **tail** tasks — owner
decision 2026-06-25. Shares the "locked plan = source of truth" concept.)
- **Repoint** `apps/web/app/(app)/plan/debts/[id]/data.ts` (`loadDebtDetail`): the Payoff
  timeline must read **strategy / extraPaymentCents / customOrder from the locked
  `payoff_plan`** (`DrizzlePayoffPlanRepo.get()`), not the orphaned
  `appSettings.debtStrategy` / `appSettings.extraPaymentCents` (Phase 1 removed the control
  that set them, so they are stale). Feed those into the existing `computeSnowball`.
- **No-lock fallback (owner decision):** when no plan is locked, compute the **baseline
  minimums-only** schedule — `strategy = SNOWBALL`, `extraPaymentCents = 0` — so the table
  always shows a real "if you keep paying minimums" projection (snowball cascade of freed-up
  minimums). Never crash; never read the stale settings.
- **Repoint the main loader too (revised 2026-06-25):** `apps/web/app/(app)/plan/debts/data.ts`
  (`loadDebtsData`) was *also* reading the stale `appSettings.debtStrategy` / `extraPaymentCents`
  to compute its `analysis`. The original intent here was "delete dead reads," but a pre-flight
  check during execution found `analysis` is **not** dead: the `/plan` hub
  (`apps/web/app/(app)/plan/data.ts`) renders `analysis.debtFreeMonth`. So the main loader is
  **repointed** onto the locked `payoff_plan` (same as `loadDebtDetail`), with the same
  minimums-only fallback — the `analysis` field is retained (its source changes). The genuinely
  dead `DebtsData.strategy` field (no live consumer; the debug-only `debt-list.tsx` is never
  imported) is dropped, and the now-unused `tables` import removed. No unrelated refactor.
- **Out of scope (still deferred):** real "debts-changed-since-lock" detection (needs a
  migration) — unchanged from §12.
- Tests: `[id]/data.ts` loader picks up a locked plan's strategy/extra; null-safe baseline
  when unlocked; existing debt-detail tests stay green.

## 8. Phase 3 — Mobile & polish

(Handoff §3, §10; shots 05/12.)

- **Stepped direction** — right column becomes a single numbered accordion (1 How much/by
  when · 2 Payoff order · 3 One-off payments · 4 Income · 5 Expenses), one open at a time;
  number badge 22px, active = coral. Same header + left result column.
- **Responsive switch** — Workspace ≥640px, Stepped <640px (CSS/container or a width hook).
- **Mobile chart** — height ~170–230, fewer ticks (every 12), no hover, legend rendered as
  rows below.
- **Sticky mobile actions** — Save / Lock pinned.
- **Chart hover** (desktop only) — vertical crosshair + per-curve dots + floating readout
  card (`--elev-pop`, month + each balance), flips at right edge, disabled on touch.
- **A11y + motion sweep** — keyboard reorder + slider + toggles; visible `--focus` rings;
  `prefers-reduced-motion` collapses entrance/curve-draw to final state; verify 360px (no
  clipping), tabular figures on aligned numbers, ≥44px touch targets.

## 9. Data contracts

**Derived outputs the UI relies on** (fed by the real engine; mirrors the handoff State §):
```
preview = {                     // per-keystroke, from previewScenarioAction
  scenario:  { curve, debtFreeMonth, totalInterestCents, monthsToPayoff, perDebt },
  baseline:  { curve, debtFreeMonth, totalInterestCents, monthsToPayoff },
  extraPaymentCents,            // forward = preExtra; target = solved required
  headroomCents, overHeadroom,  // Allocation: spare/mo, N% of spare, over-headroom warn
  achievable,                   // target-date reachability (→ unreachable banner)
  interestSavedCents, monthsSaved
}
```
The **locked reference curve is frozen/static** — it is NOT part of the live preview. It
comes from page-level `PlanningData.lockedPlan.projectedCurve` and is passed to the chart as
a prop; the chart overlays it (+ "you are here") only in locked-edit mode.
**Planner state object** (`ScenarioInputs`, unchanged): mode, strategy, order, headroomShare
(bps), targetMonth, income/raise, recurringEdits (keep + override), discretionary, lumpSums.

**Page-level state:** `lockedPlan | null` (now incl. `inputs`, `lockBalanceCents`,
`projectedCurve`), `scenarios[]` (now incl. `interestSavedCents`), planner `mode:
hypothesis | locked-edit`, transient `toast`, `dialog`.

## 10. Component → primitive mapping

| New piece | Built from |
|---|---|
| RealityHeader pill | `Badge`/custom pill + `Icon` |
| OutputsBlock | `Money`, `Stat`, tokens |
| Allocation (forward/target) | `Segmented`, `Slider`, `Input`(month stepper), `Alert`(warn) |
| Strategy + reorder | `Segmented` + custom keyboard list |
| Budget disclosures | Radix-based disclosure (new small wrapper) |
| PayoffChart | bespoke SVG (feature-local) |
| PayoffMilestones | bespoke (bar + rows), `Money` |
| LockedBanner | `ReadinessGauge`, `Confidence`, `Button` |
| ScenarioCard | `Card`, `Money`, `Badge`, `Button` |
| Confirm dialogs | Radix `Dialog` |
| Toaster | **new** `packages/ui` primitive |

## 11. Testing & verification gate

Baseline before any change: **995 tests** (capture exact pass/fail + names first).
Each phase must leave the full gate green and report the delta:
- **Unit** — engine (per-debt clear months; existing payoff/solve tests stay green), db
  (inputs round-trip), toast.
- **Component** — key new components (planner render in both modes, scenario card,
  locked banner statuses).
- **Prod-build e2e** — per the standing owner rule (3 prior UAT bugs from missing tests):
  the e2e must **invoke the real write paths** (save → lock → unlock → promote → delete) and
  assert **no `pageerror`**, not just smoke read/empty states. Extend the existing
  scenario-planner e2e.

## 12. Non-goals / deferred / risks

- **Deferred (unchanged from prior wave):** real "debts-changed-since-lock" detection
  (migration-backed) — still out of scope.
- **Representative-model parity:** we feed real amortisation; minor curve-shape differences
  from the prototype's closed-form model are expected and fine.
- **Risk — legacy locked row:** a pre-0005 locked row has `inputs = null`; Re-model must fall
  back to re-seeding (don't crash). Covered by a null-safe test.
- **Risk — "weeks" slip copy:** design shows "▼ 3 wk behind"; engine currently yields whole
  months (`slipMonths`). Keep month-granular copy unless a weeks source is added (note, don't
  invent precision).
- **Open at build time:** exact chart metrics, easing, and disclosure animation come from the
  reference `.jsx` + live HTML; mine them during Phase 1/3 rather than guessing here.
