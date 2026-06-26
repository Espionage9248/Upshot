# Pay-rise modelling — design

**Date:** 2026-06-25
**Branch:** `scenario-planner` (accumulating; push at wave end for owner UAT — main is PR-only/forward-only, do not touch)
**Status:** Approved — ready for plan
**Wave type:** Standalone feature wave (NOT a numbered Scenario-Planner rebuild phase). Sequenced BEFORE Scenario Planner Phase 3 (mobile), by owner decision — the gaps live in the exact income controls Phase 3 must make responsive, so settle them first.

## Problem

The planner's "Model a pay rise" feature has two owner-flagged gaps:

- **Gap 1 — raise start-month is locked to 2 options.** [income-block.tsx](../../../apps/web/components/plan/income-block.tsx) renders a 2-option `Segmented` of `startMonth+3` / `startMonth+6` only. The owner wants free month selection, forward-only, capped to the next 12 months.
- **Gap 2 — the raised amount's debt impact is invisible and uncontrollable.**
  - *Invisible:* `buildPayoffInputs` already models the raise (a 2-segment `extraSchedule`, so the curve bends at `raise.fromMonth`), but `previewScenarioAction` only returns `preExtraCents` (the **pre**-raise figure). [allocation-block.tsx](../../../apps/web/components/plan/allocation-block.tsx) shows a single `$X/mo` and never the post-raise step — so modelling a raise "feels like nothing happens".
  - *Uncontrollable:* only `toDebtShareBps%` of the raise reaches debt (the global share applied to the new total income). "Throw the whole raise at debt" is not expressible.

### Key insight (why B+A are one control, not two)

Headroom is linear in income (`headroom = income − expense − minimums`), so the legacy post-raise extra
`share(raise.toCents) ≈ share(base) + (toDebtShareBps% × raiseDelta)`.
The *visible step* (surface the post-raise extra) and the *tunable raise→debt control* are therefore the **same control viewed two ways**: the second slider's value **is** the size of the visible step. Bundling them is more coherent than sequencing them.

## Decisions (resolved in brainstorm)

| Decision | Choice |
|---|---|
| Gap 2 scope | **Unified control (B+A)** — surface the post-raise step **and** make it tunable |
| Raise→debt unit | **Percentage of the raise** (bps) — auto-scales if the raise amount is edited; clean legacy default |
| Gap-1 picker | **−/month/+ stepper** — reuses the existing target-date stepper pattern |
| Bundling | **One wave** (Gap 1 + Gap 2) — they share the income-block surface |
| Back-compat default | Legacy raise (no new field) → **byte-for-byte current behaviour**; toggle-on seeds the new field to the global share so the curve does not jump |

## Design

### 1. Data model — `packages/db` (JSON column, NO migration)

Extend the raise shape in [planning-scenario-repo.ts](../../../packages/db/src/repositories/planning-scenario-repo.ts) with one **optional** field:

```ts
raise: { toCents: number; fromMonth: string; toDebtBps?: number } | null
```

- `toDebtBps` ∈ `0..10000` — the share of the **raise delta** (`toCents − baseIncomeCents`) directed to debt.
- **Optional is the back-compat hinge.** `planning_scenarios.inputs` and `payoff_plan.inputs` are JSON columns, so no migration. Existing saved scenarios and the current locked plan carry `raise` *without* `toDebtBps` → reads as `undefined` → engine falls back to today's exact behaviour. Never a crash (§12-style legacy-row risk, covered by test).

### 2. Engine — `apps/web/server-actions/planner-core.ts` (`buildPayoffInputs`)

This math lives in the **web** package, not `packages/core`. `headroomCents` / `simulatePayoff` / `orderByStrategy` in core are **unchanged**.

```
raiseDelta       = max(0, raise.toCents − baseIncomeCents)
raisedExtraCents =
   raise.toDebtBps === undefined
     ? share(raise.toCents)                                   // LEGACY: exact old behaviour
     : preExtraCents + floor(raiseDelta × raise.toDebtBps / 10000)   // NEW: decomposed, tunable
```

- The second `extraSchedule` segment (`{ fromMonth: raise.fromMonth, extraCents }`) uses `raisedExtraCents` (was `share(raise.toCents)`).
- `buildPayoffInputs` returns a new `raisedExtraCents: number` field (alongside `preExtraCents`) so the preview can surface the step. When `inputs.raise` is null, callers treat the post-raise extra as absent (`null` in the preview).
- **Continuity:** at `toDebtBps = toDebtShareBps` (the toggle-on default), `raisedExtraCents ≈ share(raise.toCents)` within floor-rounding (a few cents) — toggling the control on does not visibly jump the curve. At `toDebtBps = 10000` the whole raise hits debt; at `0`, none of it does.
- **No new cap needed:** `preExtra ≤ headroom(base)` and the raise portion `≤ raiseDelta`, and `headroom(toCents) = headroom(base) + raiseDelta`, so `raisedExtraCents ≤ headroom(toCents)`. Proven by linearity.
- Integer cents only; `Math.floor`, never `parseFloat`.

### 3. Data flow — `previewScenarioAction` + `PlannerPreview`

- [planner-types.ts](../../../apps/web/components/plan/planner-types.ts) `PlannerPreview` gains `raisedExtraPaymentCents: number | null` (null when `inputs.raise` is null).
- [planner.ts](../../../apps/web/server-actions/planner.ts) `previewScenarioAction` returns `raisedExtraPaymentCents` from `built.raisedExtraCents` (or null). `planner.ts` is a `"use server"` module — it continues to export only async functions; the return type is widened inline (no bare `export type`).
- **TARGET_DATE is unchanged.** The target-date solver overrides the extra (just as the global share slider is overridden in that mode), so the raise→debt control is **FORWARD-only**. The raise's effect on income/headroom still applies in both modes; only the *allocation* control is FORWARD-only.

### 4. UI

**`income-block.tsx`:**
- Replace the 2-option `Segmented` with a **−/month/+ stepper**, clamped to `[startMonth+1 … startMonth+12]` (forward-only, ≤12 months). Mirror the target-date stepper in `allocation-block.tsx` (−/label/+ buttons, mono label). `−`/`+` are disabled at the bounds. A stored `fromMonth` outside the range is shown as-is; the steppers walk it back into range. Default on toggle-on stays `startMonth+3`.
- Add a **"Of your $D/mo raise, send X% to debt"** slider below the month stepper, **rendered only when `inputs.mode === "FORWARD"`** (consistent with the global share slider being FORWARD-only). `D` and the live `$` (= `raiseDelta × toDebtBps / 10000`) are computed locally from `inputs` — income-block needs no preview data for this.
- Toggle-on now seeds `{ toCents: baseIncomeCents + 50000, fromMonth: m3, toDebtBps: inputs.toDebtShareBps }`.

**`allocation-block.tsx`:**
- When `preview.raisedExtraPaymentCents != null`, render the "Extra toward debts" readout as a **stacked step `$X → $Y/mo`** (`X` = `extraPaymentCents`, `Y` = `raisedExtraPaymentCents`) with a small "↑ steps up at your pay rise" caption. Otherwise the single `$X/mo` as today.
- `Money` from `@upshot/ui` (integer cents). Colours via `var(--…)` tokens only.

### 5. Chart — `payoff-chart.tsx`

- New optional prop `raise?: { fromMonth: string } | null`.
- Render a vertical **"↑ pay rise" notch** on the scenario curve at `diffMonths(startMonth, raise.fromMonth)`, mirroring the existing lump-notch pattern (vertical line + dot + label), positioned on the nearest scenario point. Only when the month is within the chart horizon. Tokens only, no hex.
- The caller (`scenario-planner.tsx`) passes `raise={inputs.raise}` through.

### 6. Back-compat & testing

The gate runs **core + db + web** (to prove no regression) even though new tests land in **db + web**. `packages/core` is untouched.

- **db** — `planning-scenario-repo.test.ts`: round-trip a raise *with* `toDebtBps`; confirm a raise *without* it round-trips as `undefined`.
- **web** — `planner-core.test.ts`:
  - legacy raise (no `toDebtBps`) → second segment exactly `share(toCents)` (§12 legacy-default pin);
  - `toDebtBps = 10000` → `preExtra + raiseDelta`;
  - `toDebtBps = 0` → `preExtra`;
  - `toDebtBps = toDebtShareBps` → ≈ `share(toCents)` (continuity);
  - `raisedExtraCents` returned correctly (and absent-raise path unaffected).
- **web** component tests (`fireEvent` / `waitFor`; `vi`/`it`/`expect` from `vitest`; **no** `@testing-library/user-event`):
  - `income-block.test.tsx`: stepper clamps `[+1,+12]` & forward-only; raise→debt slider patches `toDebtBps`; toggle-on seeds `toDebtBps`; raise→debt slider hidden in TARGET_DATE.
  - `allocation-block.test.tsx`: stacked `$X → $Y` step when `raisedExtraPaymentCents != null`; single `$X` when null.
  - `payoff-chart.test.tsx`: renders the raise notch when `raise` prop present; absent when null.

### 7. e2e — extend `apps/web/e2e/auth.spec.ts` (the ONE spec, ONE context)

- Update the planner steps: the `Segmented` is gone → drive the month **stepper** instead.
- Add a step adjusting the **raise→debt slider**.
- **Lock or promote a scenario whose raise carries `toDebtBps`** — exercises the real write path through to `payoff_plan.inputs` (per the "e2e must invoke write paths" rule).
- Keep the final `expect(pageErrors).toEqual([])` guard.

### 8. Out of scope

- TARGET_DATE raise-allocation semantics (unchanged this wave).
- Deferred prior-wave items: real debts-changed detection, error-toasts, broader visual-craft pass.
- Phase 3 mobile responsiveness — the **next** wave makes these (now-final) controls responsive.

## Standing constraints (enforce in every implementer + reviewer dispatch)

- Integer cents only; `Money`/`MoneyInput` take integer cents; never `parseFloat`.
- Colours via `tokens.css` `var(--…)` by name — no hex (`color-mix(in oklch, var(--…) …)` allowed).
- `"use server"` modules export only async functions + `export type {X} from "..."` (with `from`) — a bare `export type {X}` crashes every action at runtime.
- `@testing-library/user-event` is NOT a dependency — `fireEvent`/`waitFor` only.
- Run `pnpm --filter @upshot/web typecheck` independently (real exit code) after every web task — vitest strips types and hides type errors.
- `exactOptionalPropertyTypes` is NOT enabled (only `strict:true`) — the conditional-spread idiom is house style; typecheck is the arbiter.
- e2e is one test on one context (resident passkey survives register→login) — EXTEND `auth.spec.ts`, never add a second spec.

## Baseline gate (capture/confirm before starting)

`pnpm -r typecheck` 0 / `pnpm -r lint` 0 / `pnpm -r test` 1109 (contracts 9 / core 347 / db 105 / ui 156 / worker 11 / web 481) / prod-build e2e green (`pageErrors` empty).
e2e = `pnpm --filter @upshot/web build && pnpm --filter @upshot/web e2e`.
