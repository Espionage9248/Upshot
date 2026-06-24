# Spec — Debt payments as transaction-derived, debt-owned recurring costs

**Date:** 2026-06-24
**Branch:** `scenario-planner` (follows the Phase-1 UAT-fix batch)
**Status:** design approved (owner) → writing-plans next

## 1. Context & goal

Today a debt's monthly payment is a **static number the owner typed when creating the debt**
(`debts.minimumPaymentCents` / `monthlyPaymentCents`, written only by the debt create/edit form —
[`debt-repo.ts:28-29,55-56`](../../../packages/db/src/repositories/debt-repo.ts)). It is **disconnected
from the owner's actual payment transactions**, it is **hidden** from the planner's budget (the engine
silently subtracts it from spare cash), and debt payments are **not represented** in the recurring list
except as accidental, inconsistent *generic* suggestions from the recurring detector.

The goal: make a debt's monthly payment a **real, transaction-derived number** — its **actual last
payment** — **owned by the debt**, **counted exactly once**, and **visible in three places**: on the
debt, as a single lump-sum line in the planner budget, and as a read-only grouped entry in the recurring
list. The owner links each debt to its payments **once** (a confirm step); after that it is automatic.

This spec governs **only** the debt-payments feature. Two related concerns are explicitly **out of
scope** (separate follow-ups): the *generic* detection-recall bug (missed monthly/annual non-debt
recurring — the detector groups by exact normalised description and can't catch annuals), and making
the locked plan the source-of-truth for the per-debt payoff timeline.

## 2. Locked decisions (from brainstorming)

1. **Source of truth = the debt's actual matched payments** (not a typed minimum, not a duplicated
   recurring row). "Actual payment" = the amount of the debt's **latest matched `debt_payment`**.
2. **Attribution = one-time confirm per debt.** When a recurring debt-payment pattern is detected (or
   from the debt detail page), the owner confirms "this is a payment for *[debt]*". That builds a
   `match_rule` for the debt; matching is automatic thereafter. **No auto-guessing** which debt a
   payment belongs to.
3. **Representation = the debt owns it (Approach A).** Debt payments are **not** rows in the `recurring`
   table. They are derived from the debt + its matched payments and **displayed** read-only.
4. **Counting:** the planner **reserves each debt's actual payment** (replacing the typed minimum as the
   reserved figure); generic detection **excludes** debt-matched transactions so they never double-count.
5. **Surfaces:** debt ("What you owe" + detail) shows the actual payment; the planner budget shows a
   **single lump-sum** "Debt payments — $X/mo" line; the recurring list shows a **single grouped,
   read-only "Debt payments"** entry.

## 3. Source-of-truth references (existing infrastructure to reuse)

- `debts.matchRuleId → match_rules` ([`schema/debts.ts:24`](../../../packages/db/src/schema/debts.ts)) —
  a debt may carry a match rule that identifies its payment transactions.
- `debt_payments` table ([`schema/debts.ts:35`](../../../packages/db/src/schema/debts.ts)) — matched
  payment records (`debtId`, `transactionId`, `amountCents`, `paidAt`).
- `DrizzleDebtRepo`: `listWithRule()`, `listLinkedPaymentTxIds()`, `applyPaymentMatches(payments,
  balanceUpdates)`, `recordPayment()`, `listPayments(debtId)`
  ([`debt-repo.ts:79-160`](../../../packages/db/src/repositories/debt-repo.ts)).
- `matchDebtPayments(matchers, txs, linkedTxIds)` ([`core/src/debt/match-payments.ts`](../../../packages/core/src/debt/match-payments.ts))
  and the detect job Step 4 ([`db/src/jobs/detect.ts:216-225`](../../../packages/db/src/jobs/detect.ts))
  already match transactions to debts (via the rule) and update **balances**.
- `match_rules` unified rules engine (matching-foundation wave) — debts, recurring, and installments all
  link via `matchRuleId`; rule creation/authoring exists.
- The recurring detector `detectRecurring(transactions, {existingNonSuggestedPatterns})`
  ([`core/src/recurring/detect.ts`](../../../packages/core/src/recurring/detect.ts)) — grouped by exact
  normalised description; produces SUGGESTED items.
- The planner reserves debt minimums in `buildPayoffInputs` / `headroomCents`
  ([`apps/web/server-actions/planner-core.ts:53`](../../../apps/web/server-actions/planner-core.ts),
  [`planner.ts`](../../../apps/web/server-actions/planner.ts)) and in `loadPlanningData`
  ([`planning-data.ts`](../../../apps/web/app/(app)/plan/debts/planning-data.ts)).

> The infrastructure for matching transactions → debts and updating balances **already exists**. This
> feature is mostly **deriving + surfacing the actual payment**, **the link/confirm flow**, and **the
> counting change** — not new matching machinery.

## 4. Data model

**No new tables.** One **derived** value and one small reuse:

- **Actual payment (derived, not stored):** `actualPaymentCents(debt)` = the `amountCents` of the debt's
  **most recent** `debt_payment` (max `paidAt` via `listPayments`), or `null` if none. A debt is
  "**linked**" when it has a `matchRuleId` **and** at least one matched `debt_payment`.
- **Effective monthly payment:** `effectivePaymentCents(debt)` = `actualPaymentCents(debt)` when linked,
  else the typed `minimumPaymentCents ?? monthlyPaymentCents` (today's value) as a **labelled fallback**.
- No `debtId` column added to `recurring`; no debt-payment rows in the `recurring` table.

A core helper (e.g. `effectiveDebtPaymentCents`) centralises the "actual-or-fallback" rule so every
surface and the engine agree on one number.

## 5. The one-time link flow

1. **Trigger A — from a recurring suggestion.** The detector still surfaces an un-attributed recurring
   pattern as a SUGGESTED item. That suggestion gains a new action: **"This is a payment for [debt ▾]"**
   (a debt picker). Confirming:
   - Creates a `match_rule` for that debt, with conditions seeded from the detected pattern (description
     match, optionally amount), and sets `debts.matchRuleId`.
   - **Dismisses the generic suggestion** (it is now a debt payment, not a generic recurring).
2. **Trigger B — from the debt detail page.** A "Link this debt's payment" affordance opens the same
   debt-aware flow (pick the matching transaction / pattern → create the rule). This covers debts whose
   pattern the generic detector never surfaced (e.g. it was below threshold).
3. After linking, the existing detect-job Step 4 matches those transactions on each run, records
   `debt_payments`, updates the balance, and (new) the derived actual payment follows automatically.
4. **Unlink:** clearing the link (remove the rule association) reverts the debt to its typed-minimum
   fallback everywhere.

## 6. Surfaces (all read-only; one number)

- **Debt — "What you owe" + debt detail:** show `effectivePaymentCents`. When linked, label it as the
  actual payment (e.g. "$X/mo · last payment"); when falling back, present it as the typed minimum.
- **Planner budget (Allocation/budget assumptions):** a read-only **single lump-sum** line —
  **"Debt payments — $X/mo"** where `X = Σ effectivePaymentCents over included debts`. This is exactly
  the amount the engine reserves (see §7), so the spare-cash maths is finally transparent.
- **Recurring list (`/plan/recurring`):** a single read-only **"Debt payments"** group entry,
  marked as a debt cost (visually distinct from BILL/SUBSCRIPTION), summarising the debt payments
  (count + total), derived from the debts — **managed from the debt, not editable inline**.

## 7. Counting (the correctness landmine — handled)

- **Planner reserves the effective payment, not the typed minimum.** Everywhere the engine currently
  sums `minimumPaymentCents` for included debts (`planner-core.ts`, `planning-data.ts`), it sums
  `effectiveDebtPaymentCents` instead:
  `spare = income − expenses − discretionary − Σ effectiveDebtPaymentCents`.
  The budget "Debt payments" line (§6) displays exactly this reserved sum → **counted once, visible**.
- **Generic detection excludes debt-matched transactions.** Before `detectRecurring` runs in the detect
  job, exclude transactions in `listLinkedPaymentTxIds()` (and/or transactions matching a debt's rule),
  so a debt payment is **never** offered as a generic recurring suggestion or counted as a generic
  expense.
- **Behaviour change (owner-approved):** reserving the *actual* payment means the planner's baseline is
  the owner's real current behaviour (which may already include voluntary extra), and the slider's
  "pay extra" is on top of that — more accurate than reserving a static minimum.

## 8. Edge cases & non-goals

- **Unlinked debt** → typed-minimum fallback everywhere (today's behaviour). The link flow upgrades it.
- **"Actual" = latest matched payment** (reflects the last payment), not an average. A later payment
  with a different amount updates it on the next match.
- **Variable payments (e.g. credit cards):** the latest matched amount is used; acceptable per the
  owner's "reflect the actual last payment".
- **Annual/irregular *debt* payments:** handled because matching is **rule-based, not threshold-based**
  (once linked, frequency doesn't matter). The owner has no annual *debt* payments today, but this is
  robust if they appear.
- **Non-goals (separate follow-ups):**
  - **Generic detection-recall** (missed monthly/annual *non-debt* recurring; the exact-description
    grouping + the ≥3-occurrence/annual limits) — the **next** piece of work.
  - **Locked plan → per-debt payoff timeline** source-of-truth (debt-detail timeline still reads
    orphaned `appSettings`) — deferred, pairs with the Phase-2 locked-read.

## 9. Testing & verification gate

- **Unit (core/db):** `effectiveDebtPaymentCents` (actual-when-linked, fallback-when-not, latest-by-date);
  `detectRecurring` excludes debt-matched transactions; the planner reserve uses the effective payment.
- **Component (web):** the budget "Debt payments" lump-sum line (sum + read-only); the recurring-list
  "Debt payments" group (read-only, marked as debt); the debt surfaces showing actual vs fallback; the
  link action (confirm "this is a payment for [debt]" → creates the rule / sets `matchRuleId`).
- **Prod-build e2e (standing owner rule — invoke real write paths):** extend the e2e to exercise the
  **link a debt payment** write path (confirm → rule created → debt shows the payment) and assert no
  `pageerror`.
- Full monorepo suite stays green; typecheck + lint clean; migrations (if any rule/association helper
  needs one) apply cleanly. **Run `typecheck` per task** (the Phase-1 wave accumulated hidden
  `noUncheckedIndexedAccess` errors by running vitest only — do not repeat that).

## 10. Open questions for the plan

- Exact seeding of the `match_rule` conditions from a detected pattern (description-only vs +amount) and
  the debt-picker UX placement on the suggestion card and the debt detail page.
- Whether `effectiveDebtPaymentCents` lives in `@upshot/core` (pure) consuming a passed
  latest-payment, with the repo read in the loader — to keep core DB-free.
