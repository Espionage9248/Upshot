# Scenario Planner & Locked Debt Payoff — design (FROZEN 2026-06-21)

**Status:** design frozen, ready for `writing-plans`. Supersedes the `#2 payoff plan` line in `.superpowers/sdd/uat-followups-design.md` (which is now build-ready, no longer "STILL CONVERGING"). Folds in the owner's added scope: modifying expenses (+ income) as part of the budget-planning lifecycle.

**Goal:** One inline Scenario Planner on `/plan/debts` that lets the owner tune income, expenses, and extra debt payment and watch the payoff timeline react — with two distinct kinds of persistence: a single **reality-tracked Locked Debt Plan** and any number of **saved (untracked) planning scenarios**.

---

## 1. Core concept — one tuner, two persistence layers

A single **Scenario Planner** surface tunes three input groups and renders the debt-payoff timeline live. Persistence splits along the reality line:

- **① Locked Debt Plan — reality-anchored, tracked, exactly 0 or 1 active.** Locks ONLY the debt commitment: strategy + extra-payment amount + lump sums + the *projected curve snapshot* (debt-free month + expected balance per month) + lock date. The dashboard tracks **planned-vs-actual** against real balances and real payments. Unlockable to re-model.
- **② Saved Scenarios ("budgets") — simulation, NOT tracked, 0..many, named.** A snapshot of ALL tuned inputs (income+raise, expense edits, to-debt share, lump sums, strategy, mode). Reference/aspiration only. Can be opened, re-tuned, and **promoted** → becomes the Locked Debt Plan (the bridge between layers). Income/expenses are never tracked day-to-day because they aren't real yet.

```
                 SCENARIO PLANNER (tuner)
   income(+raise) · expenses(recurring±/disc.) · to-debt share · lump sums
                              │
              ┌───────────────┴───────────────┐
        [ Save as scenario ]            [ Lock in debt plan ]
              │                                 │
        ② named simulation              ① one active, tracked
          full inputs, live debts         debt commitment only
          reference only        ←promote─  planned-vs-actual on dashboard
```

**Rationale (owner's words):** "the day to day can't lock in against an income that isn't real." The tracked artifact contains only debt facts (real balances, real payments); the rich income+expense planning lives in saveable-but-untracked scenarios.

---

## 2. Inputs & the math (mostly reuse of existing `packages/core/src/debt`)

- `headroom = income(month) − expenses − Σ debt minimums`
- income: **base monthly income** (seeded from detected salary, editable) **+ optional raise step** `{toCents, fromMonth}` → income is a step function (base before the raise month, raised after).
- expenses = **Σ kept recurring items** (each keep/cut + editable amount, sourced live from the recurring tracker) **+ a discretionary lump** (single editable figure, seeded from the 6-month average of non-recurring, non-transfer outflow).
- **to-debt share** (`toDebtShareBps`, basis points) of headroom → `extraPaymentCents`. Because headroom steps up at a raise, the to-debt amount steps up too → the engine models extra as a **two-step function** (pre/post raise). Remainder of headroom is "to savings/buffer" (shown, not persisted as a commitment).
- feed `extraPaymentCents` + strategy into existing `computeSnowball` → per-month balance curve, debt-free month, interest. Baseline (extra=0) vs scenario via the existing `computeWhatIf` shape.
- **lump sums** `[{amountCents, month, targetDebtId|null}]` — one-off principal at a month, to the target (or current-priority debt when null).
- **backward mode** — `solveExtraForTargetDate`: binary-search `extraPaymentCents` until `debtFreeMonth ≈ targetMonth`; flag when the solved extra exceeds headroom.

**Saved scenarios use LIVE debts:** a scenario persists only the *tuning* inputs; the debt curve is recomputed against **current** real balances every time it's opened or listed. (The Locked Plan is the opposite — its curve is frozen at lock, because that snapshot is the commitment being measured.)

---

## 3. Surface (inline on `/plan/debts`, below the debt list)

**A) Locked-plan status banner** — top of dashboard, only when a plan is locked:
- debt-free month, lock date + locked extra/mo, real balance, balance gap vs plan ("$640 ahead"), slip ("▲2 mo early" / "▼3 mo late"), status dot (● on track / ● ahead / ● behind=amber), **Re-model / unlock** button.
- secondary nudge line when behind on contributions this month.
- hint when the debt set changed since lock ("debts changed — re-model?").

**B) Scenario Planner** — below the debt list:
- mode toggle: **forward** (set extra → date) / **by target date** (pick date → solved required payment).
- INCOME group: base income [edit] + optional "raise to $X from <month>".
- EXPENSES group: committed recurring items (keep/cut checkbox + editable amount) + discretionary [edit]; shows Σ expenses.
- TO DEBT group: headroom (computed) + to-debt slider/field (share) + "rest → savings" + lump sums [add].
- timeline chart (§4) between TO DEBT and outputs.
- outputs: debt-free month (scenario vs baseline), months saved, interest saved.
- actions: **[Save as scenario]**, **[Lock in debt plan]**.
- backward mode replaces TO-DEBT with a date picker → solved required payment + over-headroom warning.

**C) Saved scenarios** — collapsible list below the planner: name, debt-free month (recomputed live), extra/mo; actions: **open** (load into tuner), **lock** (promote), **rename**, **delete**.

---

## 4. Chart (hand-rolled SVG, `packages/ui/src/finance/readiness-gauge.tsx` precedent)

- x = months from now; y = total debt balance.
- **baseline** curve (grey, extra=0) vs **scenario** curve (coral/accent), each with a debt-free marker.
- when a plan is locked: a 3rd faint **locked-curve** line + a dot at the real current balance/today.
- no chart dependency — recreate in-stack. Exact visual treatment (axis labels, ticks, markers, responsive 360px) is a **build-time craft task** (use the visual companion / frontend-design then); this spec fixes only *what it plots*.

---

## 5. Tracking mechanics — two signals → one status

1. **Outcome (real vs locked curve):** `Σ current debt balances` vs locked curve's expected-balance-for-this-month → ahead / on-track (within tolerance) / behind, with the $ gap. Recompute `computeSnowball` from *current* balances + locked extra/strategy → projected debt-free month → slip delta vs the locked `projectedDebtFreeMonth`.
2. **Behaviour (committed extra paid?):** from matched debt payments (the `debt_payments` / #13 data), `Σ actual payments this month` vs `Σ minimums + extra`. Short → amber "behind on contributions this month" nudge.
- **Precedence:** balances-behind ⇒ **behind**; otherwise ahead/on-track from balances, contributions line is a secondary nudge.
- **Edge:** debt set changed since lock ⇒ re-model hint (don't silently mis-track).

Core: `evaluatePlanStatus(lockedPlan, currentBalances, actualPaidThisMonth, currentMonth) → { status, balanceGapCents, projectedDebtFreeMonth, slipMonths, contributionsShortfallCents }` — pure, TDD.

---

## 6. Persistence (one additive migration, worker applies on boot)

```
payoff_plan            -- 0 or 1 row; absent = nothing locked
  id, strategy, extraPaymentCents, customOrder(json|null),
  lumpSums(json), lockedAt,
  projectedDebtFreeMonth, projectedCurve(json), totalInterestProjectedCents

planning_scenarios     -- 0..many, named
  id, name, createdAt, updatedAt, inputs(json)   -- tuning only; debts stay live
```
Repos: `PayoffPlanRepo` (get/upsert/delete the single row), `PlanningScenarioRepo` (CRUD + list). Integer cents throughout; JSON columns for the curve/lumps/inputs blobs.

---

## 7. Server actions (`*-core.ts` logic + thin `"use server"` wrappers, event_log on writes)

`lockPayoffPlanAction(input)`, `unlockPayoffPlanAction()`, `savePlanningScenarioAction(input)`, `updatePlanningScenarioAction(input)`, `deletePlanningScenarioAction(id)`, `promoteScenarioToPlanAction(id)`. Each revalidates `/plan/debts` + `/plan`.

---

## 8. Build sequencing (high level — `writing-plans` decomposes into bite-sized tasks)

1. Migration: `payoff_plan` + `planning_scenarios`.
2. Core engine (TDD): `computeSnowball` lump-sum + two-step-extra extensions; `solveExtraForTargetDate`; `headroom`/`computeScenario`; `evaluatePlanStatus`.
3. Repos: `PayoffPlanRepo`, `PlanningScenarioRepo` (+ ports/in-memory if the contract pattern requires).
4. Server actions: lock/unlock/save/update/delete/promote.
5. Data loader: planner initial state + locked-plan status + scenario list (extend `loadDebtsData` or a new `loadPlanningData`).
6. UI: status banner; Scenario Planner (income/expenses/to-debt + outputs + actions); timeline chart; saved-scenarios list; forward/backward mode.
7. Chart visual craft pass (companion/frontend-design).
8. e2e write-paths: lock plan → save scenario → promote → unlock, asserting persistence + no `pageerror`.
9. Full forced gate (`TURBO_FORCE=true`), prod-build e2e.

**Global constraints (inherited):** integer cents only, never `parseFloat`; no bare `export type {X}` in `"use server"`; the real gate runs `TURBO_FORCE=true`; e2e must invoke real write paths + assert no pageerror; build on the current plan-room/matching line (do not merge to main ahead of PR #12); no domain/topology committed.

## 9. Deferred / out of scope (separate later specs)
- #6 recurring-detection rework; #8 smart Mark-as-BNPL.
- Multiple income streams within one scenario (raise-step covers the headline case).
- Per-category budget envelopes (discretionary lump covers v1).
- The rest of the debt surface follow-ups (#11 `debts.startDate`, #3 edit/delete debt, #1 remove what-if, #13 matched-payments display) — **grouping decided: option (a), standalone**. This wave ships the scenario planner on its own and only hard-depends on #13's matched-payment data, which already exists from the matching-foundation work (the `installment_plan_payments` / debt-payment links). #11/#3/#1 land later as a separate debt-surface wave; the planner's tracking signal (§5) reads existing payment data, not #11's editable `startDate`.
