# Phase 5 — Debts, Snowball, BNPL, Recurring — Design

**Status:** approved 2026-06-20, pre-implementation
**Plan reference:** `PLAN-V2.md` §Phase 5 (5.1 debts, 5.2 installments, 5.3 recurring)
**Branch:** `phase-5-debts-recurring` off `origin/main` (`3733c03`)
**Baseline to diff against:** 669 tests green; typecheck / lint / env-free build all 0
**Build method:** subagent-driven-development — independent tasks, full gate re-run after each, whole-branch Opus review before any PR

## Outcome

Debt tracking + payoff projections, installment (BNPL) plans, and bills/subscriptions
are fully usable inside a new **Plan** room (`/plan`). The room's rail entry already
exists (`apps/web/lib/rooms.ts`) but has no route yet — Phase 5 creates it.

## Scope

In scope: debts (5.1), installment plans (5.2), recurring items (5.3), plus the new
`/plan` room shell and two approved fold-ins (dialog `aria-describedby` a11y pass;
saver-trend 6-month breakdown on `/budget`).

Out of scope (deliberately deferred): **purchases** (unscheduled) and **scenarios**
(Phase 6.2) — both also live in the Plan room per §9, and will slot into the `/plan`
sub-nav later. Phase 5 ships the three sections above only.

## Schema

All Phase 5 tables already exist from the Phase-1 26-table schema — verified in
`packages/db/src/schema/`:

- `debts` (incl. `creditLimitCents`, `monthlyFeeCents`/`feeDueDay`/`lastFeeAppliedAt`,
  `payoffPriority`, `includeInSnowball`, projection cache cols), `debt_payments`,
  `debt_expenses`.
- `installment_plans` (+ `installment_plan_payments`).
- `recurring_items` (+ price-drift cols `lastAmountCents`/`priceLastChangedAt`,
  usage cols `usageCount`/`usageResetAt`).

Contracts enums exist (`DEBT_TYPES`, `INSTALLMENT_STATUSES`, `RECURRING_KINDS/FREQUENCIES/STATUSES`).
`app_settings` already carries `debtStrategy` (default `SNOWBALL`) + `extraPaymentCents`.
`job_runs.job` already includes `FEES` and `DETECT`.

**Phase 5 is additive code, not schema.** During implementation each task re-verifies its
table's field coverage against the contract before writing the repo; if a gap is found it
is raised, not silently migrated.

## V1 reference

- `reference/v1/backend-src/services/debtSnowball.ts` — BALANCE/INTEREST/CUSTOM strategies,
  per-month amortization, snowball cascade, what-if.
- `reference/v1/backend-src/services/subscriptionService.ts` — statistical auto-detect,
  post-sync matching, monthly-cost normalization, dismiss/ignore.

Both use **float dollars**. V2 re-derives all of it in **integer cents** (see decisions).
Price-drift, overlap/duplicate, and cost-per-use are **new in V2** (V1 has no equivalent).

## Cross-cutting decisions

1. **Integer-cents amortization.** `interestCents = roundHalfUp(balanceCents * interestRate / 12)`;
   `principalCents = paymentCents − interestCents`; the final month clamps principal to the
   remaining balance so it lands exactly on 0. `interestRate` (Drizzle `real`, e.g. `0.1999`)
   is the only non-money value — used solely as a multiplier, never parsed as money. Property
   test (fast-check): Σprincipal == originalBalance, balance never negative, schedule
   terminates (≤600-month safety cap as in V1).
2. **Snowball cascade** (ported): a fully-paid debt's `monthlyPaymentCents` rolls into the
   next debt's available extra. Strategy mapping: `SNOWBALL`→smallest balance first,
   `AVALANCHE`→highest `interestRate` first, `CUSTOM`→stored `payoffPriority` (or an
   ephemeral order passed by a future scenario planner).
3. **Matching = dedicated core matchers.** Keyed on the row's stored `description`/`merchant`
   + `amountCents`±tolerance, run in a worker `DETECT` tick post-sync. The rule-engine
   `LINK_DEBT`/`LINK_RECURRING`/`LINK_INSTALLMENT` actions stay explicit no-ops
   (`packages/core/src/match/apply.ts`); `matchRuleId` remains a nullable future override.
4. **Fee accrual = worker `FEES` job.** Monthly on `feeDueDay`: add `monthlyFeeCents` to
   `currentBalanceCents`, set `lastFeeAppliedAt`. **Idempotent** — never double-applies
   within a calendar month (guard on `lastFeeAppliedAt`).
5. **Dismiss / ignore for recurring.** A dismissed suggestion is kept as `status=CANCELLED`
   (existing enum), and detection **skips any normalized description already mapped to a
   non-SUGGESTED item** (ACTIVE/PAUSED/CANCELLED). This avoids reintroducing V1's
   `ignoredSubscriptionPatterns` JSON column (the plan dropped it in favour of the
   `IGNORE_SUBSCRIPTION` rule action). Reversible; alternative (an `IGNORE_SUBSCRIPTION`
   rule) noted but not chosen.
6. **Web boundary (unchanged constraints).** `data.ts` and server-actions derive row types
   from Drizzle (`Awaited<ReturnType<DrizzleXRepo["list"]>>`), never import `@upshot/contracts`.
   No `"use client"` file transitively value-imports `@upshot/db`. `packages/ui` tokens.css
   is locked; Tailwind v4 already `@source`s `packages/ui`. No new npm deps.

## Architecture — the established per-domain pattern

Each domain follows the Phase-4 shape:

```
core/src/<domain>/*        pure logic + a Repo port + an in-memory fake
db/src/repositories/*      Drizzle implementation of the port
web .../<route>/data.ts    Server-Component data loader (Drizzle row types)
web .../<route>/page.tsx    Server Component surface
web server-actions/*-core.ts  pure action logic (unit-tested)
web server-actions/*.ts      action wrapper (auth re-check + revalidate)
worker DETECT / FEES jobs   detection + matching + fee accrual
```

## Tasks (TDD; full gate after each)

**Task 0 — Plan room shell.** `/plan` route + `layout.tsx` with three-section sub-nav
(Debts · BNPL · Recurring); empty hub. → verify: `/plan` renders when authed, redirects
when unauth; gate green.

### Group A — Debts (5.1)
- **A1 core** `core/src/debt`: payoff engine (3 strategies, per-month amortization, what-if =
  current vs +extra → months & interest saved), fee-accrual calc, utilisation
  (`balanceCents ÷ creditLimitCents`). `DebtRepo` port + in-memory fake. → property + unit tests.
- **A2 db** `DrizzleDebtRepo` (+ `debt_payments`, `debt_expenses`). → integration test on an
  ephemeral encrypted DB.
- **A3 web** `/plan/debts` section + `/plan/debts/[id]` detail (cards, balances, payoff
  timeline, utilisation bar, what-if extra-payment control) + server-actions (debt CRUD,
  record payment). → Playwright journey.
- **A4 worker** `FEES` job (idempotent monthly accrual) + payoff-projection cache recompute. →
  unit: a double-tick within a month applies the fee once.

### Group B — Installments / BNPL (5.2)
- **B1 core** `core/src/installments`: plan progress, instalment **matcher** (description +
  amount±tolerance), status transition (`ACTIVE`→`COMPLETE` when `installmentsPaid==totalInstallments`),
  `nextDueDate` advance. `InstallmentRepo` port + fake. → contract test: fixture transactions
  match instalments deterministically and idempotently.
- **B2 db** `DrizzleInstallmentRepo` (+ `installment_plan_payments`). → integration test.
- **B3 web** `/plan/installments` + plan detail (progress, next due, remaining) + "mark-as-BNPL"
  create + server-actions. → Playwright.
- **B4 worker** instalment matching folded into the `DETECT` tick.

### Group C — Recurring (5.3)
- **C1 core** `core/src/recurring`: statistical detection (≥3 occurrences, amount within ±15%
  of median, interval std-dev/median < 0.3, V1 frequency ranges — all cents/day integer math),
  **price-drift** (a matched charge differing from `lastAmountCents` beyond tolerance updates
  `amountCents`, stamps `lastAmountCents`+`priceLastChangedAt`), **overlap/duplicate** (pure
  function over active items grouped by category/merchant), **cost-per-use**
  (`monthlyCost / usageCount`, divide-by-zero guarded), monthly-cost normalization, next-expected
  date. `RecurringRepo` port + fake. → unit tests per the §7 verification list.
- **C2 db** `DrizzleRecurringRepo`. → integration test.
- **C3 web** `/plan/recurring` (active/paused/suggested, bill vs subscription,
  suggested→accept/dismiss, drift + overlap warnings, manual usage tally) + server-actions. →
  Playwright.
- **C4 worker** recurring detection + ACTIVE-item matching in the same `DETECT` tick (B4 + C4
  are one job).

### Task H — Plan hub aggregation
Last web task: wire debt-total, next-BNPL, and upcoming-recurring summaries into the `/plan`
landing.

### Group D — Fold-ins (both approved)
- **D1** Dialog `aria-describedby` a11y pass — codebase-wide, mechanical, all-or-none. → e2e
  guard asserts dialogs describe their content.
- **D2** Saver-trend 6-month breakdown on `/budget` — surface the per-month flow behind the
  Building/Steady/Drawing-down badge (data mostly exists in `core/src/budget`). → unit + a
  Playwright assertion.

## Testing strategy (per PLAN-V2 §7 + Phase 5 verification)

- **Property (fast-check):** snowball/avalanche amortization (no cent lost, terminates),
  fee-accrual idempotency.
- **Unit:** recurring detection, price-drift, overlap/duplicate, cost-per-use, utilisation,
  what-if deltas; all action `*-core.ts`.
- **Contract:** instalment matching against recorded fixture transactions.
- **Integration:** the three new Drizzle repos against an ephemeral encrypted SQLite file.
- **E2E (Playwright):** a journey per Plan section against the seeded DB.

## Verification gate (after every task)

`pnpm typecheck` · `pnpm lint` · `pnpm test` · env-free `pnpm build` (with `DB_ENCRYPTION_KEY`
and auth env vars **unset** — proves no top-level DB/secret access). Report the delta vs the
669-test baseline after each task; a test that flips is run alone + as a group before being
called flake or regression.

## Binding constraints (carried, unchanged)

Integer cents only, never `parseFloat` money. `apps/web` must not import `@upshot/contracts`.
No `"use client"` file may transitively value-import `@upshot/db`. `packages/ui/src/styles/tokens.css`
is locked. No new npm deps without owner approval. Commit/push only when asked. Never commit the
real domain/topology (gitignored `ops/` only).

## Risks / things most likely to be wrong

- The integer-cents rounding could drift from V1's float results on a long mortgage schedule;
  the property test (exact-zero terminal balance) is the guard, but expect the *displayed*
  total-interest figure to differ slightly from V1 by design.
- Dismiss-as-`CANCELLED` (decision 5) is the one defaulted choice; if detection's
  "skip known descriptions" proves too broad/narrow in practice it's the first knob to revisit.
- Instalment matching tolerance (amount±%) is heuristic; the contract test pins the fixture
  behaviour, but real Up settlement timing (charge vs settle date) is the likely source of any
  miss — mirror V1's description+amount (no date constraint) approach.
