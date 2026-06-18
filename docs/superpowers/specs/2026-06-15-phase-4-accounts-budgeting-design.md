# Phase 4 — Accounts, Budgeting, Transactions + Rule UI — Design

**Date:** 2026-06-15
**Branch (execution):** `phase-4-accounts-budgeting` (off `main`, after Phase 3 / PR #5 merged)
**Plan source:** `PLAN-V2.md` §4 (schema) + §9 (IA) + §11 Phase 4 (tasks 4.1–4.4)
**Status:** approved design; next step is the bite-sized TDD plan via `writing-plans` (lands in `docs/superpowers/plans/`, gitignored).

---

## 1. Outcome

Envelope budgeting, the transaction ledger, the match-rule editor (with Up write-back), and
net worth are fully usable, built to the **five-room IA** and the design contract
(`design_handoff_upshot/`). Integer-cents throughout; passes the env-free `next build`; no new
npm dependencies.

## 2. Settled decisions (from brainstorming)

1. **Surfaces resolve to the five-room IA**, not the legacy `/accounts`·`/transactions`·`/net-worth`
   route names: Budget room `/budget`, Money room `/money`, rule editor + tax under the Settings
   surface `/settings`, net worth = a Today section + a dedicated `/net-worth` surface.
2. **Goal-confidence = Monte Carlo** (new; not in V1). Simulate forward paths from the historical
   net-inflow distribution; confidence = fraction of paths reaching the target. **Seeded
   first-party PRNG** for deterministic tests. No new dependency.
3. **Up write-back is in scope this phase.** Rule actions and ledger edits that change tags or
   categories push to Up (`APPLY_TAG`/`SET_CATEGORY`). This is the Phase-2-deferred work landing.
4. **Budget port scope = savers + emergency + confidence.** Port `analyseSaver`/`analyseAllSavers`
   + `analyseEmergencyFund` (readiness tiers). **Defer** `calculateBudgetHealth` &
   `suggestAdjustments` to the Analyze room (Phase 6).
5. **Rule application = preview + explicit Apply.** The editor shows "N matching transactions";
   the user clicks Apply; local DB updates and tags/categories push to Up for those rows. Future
   syncs keep applying automatically.
6. **Write-back failures = best-effort, local always wins.** Local change always persists; the Up
   push is attempted per transaction; failures are logged (`event_log`) and surfaced, never
   block or roll back the local edit. Consistent with the Phase-3 `401 → Reconnect` model.
7. **Link-to-purchase is deferred to Phase 5** (the Purchases surface lives in the Plan room and
   doesn't exist yet). `/money` keeps filter/paginate + category/tag edit + salary/transfer +
   tax-deductible only.

**Assumption (flagged, accepted):** Up's API is read-only for money movement — no inter-account
transfer endpoint. Budget "allocate/transfer" is **local bookkeeping** (`budget_allocations` /
`accounts.monthlyAllocationCents`); Up balances stay authoritative.

**Net-worth + debts (flagged, accepted):** the formula subtracts `debts.includeInNetWorth`. Debt
CRUD is Phase 5, so the table is empty in Phase 4 and net worth = bank + assets in practice. The
debts term is built anyway (harmless when empty, correct once Phase 5 lands).

## 3. Current-state grounding (verified in code 2026-06-15)

- Phase 3 merged: `apps/web/app/(app)/` has `today/` + `settings/` (+ `sync-activity/`); routing
  is room-prefixed; route group `(app)`; auth gated via `requireSession()`.
- `packages/core/src` has `money/match/sync/up/health/ports` — **no `budget/` module** (Phase 4 port).
- UI atoms exist: `finance/confidence.tsx`, `readiness-gauge`, `stat`, `money`, `upcoming-bills`;
  primitives (Button/Card/Input/Select/Dialog/Tabs/Table/Badge/Tooltip/Switch/Slider/…) all built.
- `UpClient.addTag()` exists (`packages/core/src/up/client.ts:61`); **no category-write method**.
- Today net worth is **bank-only** today (`apps/web/app/(app)/today/data.ts:44` sums `balanceCents`);
  the `dash-calm` "Net worth" card already renders `data.netWorthCents`.
- Ports present: account/category/match-rule/settings/transaction/job-run. **No** BudgetAllocation
  or Asset repo.
- Schema tables exist (Phase 1): `budgetAllocations`, `assets`, `assetValuations`, `matchRules`
  (+ `matchConditions`/`matchActions`), `accounts.role`/`monthlyAllocationCents`,
  `transactions.isTaxDeductible`/`taxDeductionCategory`/`isInterest`/`isSalary`/`isTransfer`.
- Server-action pattern: `action()` wrapper (`apps/web/lib/action.ts`) returning `ActionResult<T>`;
  core/wrapper split (`*-core.ts` pure + db-injected, `"use server"` thin wrappers); memoized
  `getDb()`; DB routes `export const dynamic = "force-dynamic"`.

## 4. Architecture

### 4.1 New core modules (`packages/core/src`, pure, integer-cents, fake-backed)

- **`budget/`** — port from V1 `reference/v1/backend-src/services/budgetAnalysis.ts`:
  - `analyseSaver` / `analyseAllSavers` → `SaverBudgetAnalysis` (allocation vs spending, variance,
    trend, 6-month history, average monthly spend). Exclude saver-to-saver reallocations from spend.
  - `analyseEmergencyFund` → `EmergencyFundAnalysis` (target = 6× avg monthly expenses, readiness
    score + tier, top-up/replenishment, monthly-savings tracking).
  - Interest earned + growth derived from `isInterest` postings on savers.
  - **Not ported (Phase 6):** `calculateBudgetHealth`, `suggestAdjustments`, `analyseEssentials`,
    category-savers CRUD.
- **`budget/confidence.ts`** (new) — `goalConfidence(input, seed)`:
  - Input: current balance, target cents, target date, historical monthly net-inflow series.
  - Monte Carlo: N paths (≈1000) sampling monthly net inflow from the historical distribution
    (empirical resample or mean+stdev — settle in plan); project to target date; confidence =
    fraction of paths ≥ target. Returns a banded score (maps to the `Confidence` UI atom).
  - **Seeded first-party PRNG** (e.g. mulberry32/xorshift, ~10 lines, no dep) injected so the
    function is pure and deterministic. Property tests: same seed ⇒ same output; monotonicity
    (more headroom / more time ⇒ ≥ confidence).
- **`networth/`** (new, small) — `computeNetWorth({accounts, assets, debts})` =
  Σ bank balances + Σ `assets.valueCents` where `includeInNetWorth` − Σ `debts.currentBalanceCents`
  where `includeInNetWorth`.

### 4.2 New repos (port in `core/src/ports` + Drizzle adapter in `db` + in-memory fake)

- `BudgetAllocationRepo` — read/upsert `budget_allocations` by (`accountId`,`month`); compute spent.
- `AssetRepo` — CRUD `assets` + append/read `asset_valuations` (history for the trend).

### 4.3 UpClient additions (`packages/core/src/up`)

- `setCategory(transactionId, categoryId | null)` — PATCH `/transactions/{id}/relationships/category`
  (Up's categorize endpoint; `null` de-categorises). Add to the client, the `UpClientPort` type,
  the loopback fixture-server handler, and a contract test.
- `removeTag(transactionId, tagId)` — **only if** an action needs tag un-apply; otherwise skip.
- Keep `addTag` as-is.

### 4.4 Server-actions (web; `*-core.ts` pure + `"use server"` thin wrappers; every action re-checks auth)

- **Budget:** `setAllocation`, `transferAllocation` — local `budget_allocations` /
  `accounts.monthlyAllocationCents` only; write `event_log`.
- **Money:** `setCategory`, `setTags`, `markSalary`, `markTransfer`, `markTaxDeductible`
  (+ `taxDeductionCategory`). Category/tag edits: local DB first, then **best-effort Up push**
  (`setCategory`/`addTag`); push failure → `event_log`, surfaced, never rolls back.
- **Rules:** `createRule`/`updateRule`/`deleteRule` over `match_rules`/`match_conditions`/
  `match_actions`; `previewMatches(rule)` → count of matching synced transactions; `applyRule(rule)`
  → local apply + best-effort Up push for `APPLY_TAG`/`SET_CATEGORY`. **FK-validate `SET_CATEGORY`
  target ids** against synced categories before save (Phase-2 precondition: a bad id must not be
  persisted, and must never reach a sync that would FK-fail).
- **Tax settings:** update `app_settings` tax fields (financial-year start, residency/Medicare flag).
- **Assets:** `createAsset`/`updateAsset`/`deleteAsset` + `recordValuation`.

### 4.5 Surfaces (build to `design_handoff_upshot/`; token-exact; light+dark; 360px-survivable)

- **`/budget`** — saver cards (balance vs allocation, role badges, variance/trend), emergency-fund
  card (readiness gauge), allocate/transfer controls, interest earned + growth, goal-confidence rings.
- **`/money`** — ledger: filter (account/status/category/tag/flag/date) + paginate; row edit of
  category/tags; mark salary/transfer; mark tax-deductible (+ deduction category). Best-effort Up
  push surfaced per row.
- **`/settings`** — rule-builder (conditions + actions, preview count, explicit Apply) under the
  Settings sub-nav; Tax settings pane. Extends `SettingsNav`.
- **`/net-worth`** — assets CRUD (type, value, institution, include-in-net-worth), valuation history,
  total + trend (`NetWorthTrend`). Today's net-worth number becomes the real formula and the section
  links here.

## 5. Groups & sequencing (pause + report at each boundary; await go-ahead before next group)

| Group | Scope | Model bias |
|---|---|---|
| **A — Budget** | `core/src/budget` + confidence (Monte Carlo) + `BudgetAllocationRepo` + allocate/transfer actions + `/budget` UI | Opus (math + design fidelity) |
| **B — Money** | txn query/filter/paginate + flag/category/tag actions + new `UpClient.setCategory` + best-effort write-back + `/money` ledger UI | Opus (write-back security + design) |
| **C — Rules + Tax** | `match_rules` CRUD + FK validation + preview/Apply (local + Up push) + tax settings + `SettingsNav` + rule-builder UI | Opus |
| **D — Net worth** | `AssetRepo` + `computeNetWorth` + real Today number + `/net-worth` surface (assets CRUD, valuations, trend) | Mixed: formula Opus, asset-CRUD form cheaper |

**Order A → B → C → D.** Rationale: B introduces `UpClient.setCategory`, which C's rule-Apply
reuses, so B precedes C. A and D are independent; A first (foundational), D last.

## 6. Execution discipline (orchestrator)

- **Subagent-driven development:** fresh implementer subagent per task; two-stage review
  (spec compliance, then code quality) before each commit; model picked by complexity.
- **Independent gate after every task** (not trusting any subagent "DONE"):
  `pnpm typecheck` · `pnpm lint` · `pnpm test` · env-free build
  (`env -u DB_ENCRYPTION_KEY -u DATABASE_URL -u BETTER_AUTH_SECRET -u BETTER_AUTH_URL
  -u UPSHOT_RP_ID -u NEXT_PUBLIC_BETTER_AUTH_URL pnpm build`).
- **Baseline captured before Group A;** report deltas (pass/fail counts + names) vs it.
- Commits **local** on `phase-4-accounts-budgeting`; **PR only when asked**, at the end.

## 7. Persistent constraints (carried from Phases 0–3)

- Integer cents only; no float money math.
- `apps/web` does **not** depend on `@upshot/contracts` — derive row types from Drizzle
  (`typeof tables.X.$inferSelect`); re-declare enums locally if needed.
- `"use client"` must **not** transitively import `@upshot/db`; DB access via `getDb()` in
  pages/handlers; DB routes `export const dynamic = "force-dynamic"`.
- Server-action core/wrapper split; every action re-checks auth and returns `ActionResult<T>`.
- `packages/ui/src/styles/tokens.css` is **locked** — reference CSS vars only, never edit.
- No secrets in source/logs; never commit `.env`/`*.db`; env-free `next build` must keep passing.
- **No new npm dependencies** without explicit approval.
- Web project — no Axiom skills.

## 8. Out of scope (this phase)

`calculateBudgetHealth` / `suggestAdjustments` / `analyseEssentials` / category-savers (→ Phase 6);
link-to-purchase (→ Phase 5); debt CRUD/UI (→ Phase 5); the Today bento/insights beyond the real
net-worth number; reports/analytics/tax-time surface (→ Phase 6, though the tax-deductible flag +
tax settings are captured here as inputs).

## 9. Verification

- Core: Vitest unit tests against fakes for `budget`, `confidence` (property tests: seed-determinism
  + monotonicity), `networth`; contract test for `UpClient.setCategory` against the fixture server.
- Web: per-surface Playwright journeys (budget allocate/transfer; ledger filter + edit + tax-deduct;
  rule create → preview → Apply incl. the `401 → Reconnect`/best-effort path; assets CRUD + Today
  number). Token-exact spot-checks vs the design references.
- Gate green (typecheck/lint/test/env-free build) with deltas reported vs the captured baseline.
