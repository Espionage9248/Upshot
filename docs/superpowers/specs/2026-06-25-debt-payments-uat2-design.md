# Spec — Debt payments UAT-2: rules-engine matching, forward-only balance, edit-debt, surfaces

**Date:** 2026-06-25
**Branch:** `scenario-planner` (follows the debt-payments wave `e6d9d5e..9867265`)
**Status:** design approved (owner) → writing-plans next

## 1. Context & goal

Owner UAT of the debt-payments wave surfaced four issues plus a missing capability. Root cause of the
worst one: the bespoke debt-link path creates a **`description`-"contains"** rule
([`debts-core.ts:71`](../../apps/web/server-actions/debts-core.ts)), but for debts like Zip the
description is always "Zip", so the rule matched **every** Zip transaction (purchases included) over
months of history. The detect job's Step 4 then **decremented `currentBalanceCents` by every matched
amount** ([`match-payments.ts:93`](../../packages/core/src/debt/match-payments.ts)), driving the
owner-typed current balances **below reality**. With no edit-debt UI, the owner cannot repair them.

Goals (one wave):
1. **Match debt payments precisely** via the existing rules engine (rawText / amount / **note**, not
   just description).
2. **Forward-only balance:** matched payments still *record* (for history + the actual-payment figure)
   but only *decrement the balance for payments dated on/after linking* — never retroactive history.
3. **Edit-debt UI** (repair the corrupted balances) + an **unlink / clear-matched-payments** affordance
   (wipe over-matched junk, re-link cleanly).
4. **Debt detail:** list matched payments + a **"total paid"** sum.
5. **Recurring list:** the monthly total **includes** debt payments and is rendered more prominently.

## 2. Locked decisions (from brainstorming)

1. **Balance: forward-only (owner).** Record every matched payment; decrement `currentBalanceCents`
   ONLY for payments with `paymentDate >= debts.paymentsLinkedAt`. History is informational, never
   subtracted from the typed current balance.
2. **Matching: via the rules engine, all field types (owner).** The link flow authors a real rule with
   the existing RuleEditor — conditions over `description` / `categoryName` / `rawText` / **`note`**
   (new) / amount+currency — and a `LINK_DEBT` action. The bespoke description-only
   `upsertDebtPaymentRule` is retired.
3. **Reuse the full RuleEditor dialog (owner-confirmed fork).** Seed it from the two entry points rather
   than build a second, slimmer debt-only condition editor — DRY and "just like the rules engine".
4. **Edit-debt = wire the existing `updateDebtAction`** into a `DebtFormDialog` edit mode; the owner
   repairs balances themselves (no automated reversal of the bad decrements — the amounts are tangled
   with over-matched purchases, so manual correction is safer).
5. **Purchases-in-timeline is OUT (owner).** Separate brainstorm → spec → plan after this wave lands.

## 3. Source-of-truth references (existing infrastructure to reuse)

- **Rules engine + LINK_DEBT:** `saveRule` reconciles `LINK_DEBT` actions to `DebtRepo.setMatchRule`
  (sets `debts.matchRuleId`), diff-based ([`rules-core.ts:58-98`](../../apps/web/server-actions/rules-core.ts)).
  The RuleEditor authors `description`/`categoryName`/`rawText` + amount/currency conditions and a
  `LINK_DEBT` action with a target-debt select
  ([`condition-row.tsx:9-13`](../../apps/web/components/settings/rule-builder/condition-row.tsx),
  [`action-row.tsx:13-25,115-125`](../../apps/web/components/settings/rule-builder/action-row.tsx)).
  It is a client Dialog taking `rule: LoadedRule | null` with an `initialRule` seed
  ([`rule-editor.tsx:45-53`](../../apps/web/components/settings/rule-builder/rule-editor.tsx)),
  reached at `/settings/rules` ([`rule-list.tsx:89-161`](../../apps/web/components/settings/rule-builder/rule-list.tsx)).
- **Match engine:** `MatchTarget` + `fieldValue` switch over the matchable fields, plus `matchAmount`
  (amount ± `toleranceCents`, optional `currency`)
  ([`engine.ts:6-14,82-126`](../../packages/core/src/match/engine.ts)).
  `MATCH_FIELDS = ["description","categoryName","rawText"]`
  ([`enums.ts:16`](../../packages/contracts/src/enums.ts)); zod `matchConditionSchema`
  ([`match-rule.ts:12-22`](../../packages/contracts/src/match-rule.ts)).
- **MatchTarget construction sites** (must thread `note`): `match/apply.ts:19-32`,
  `sync/sync-service.ts`, `debt/match-payments.ts:74-82`.
- **Debt-payment matching + balance:** `matchDebtPayments` decrements `balanceCents = Math.max(0, … - abs)`
  and skips `alreadyLinkedTxIds` (idempotent across runs)
  ([`match-payments.ts:58-93`](../../packages/core/src/debt/match-payments.ts)); detect Step 4 feeds it
  ([`detect.ts:225-231`](../../packages/db/src/jobs/detect.ts)). `debt_payments.paymentDate` (ISO text)
  exists to compare ([`schema/debts.ts:42`](../../packages/db/src/schema/debts.ts)).
- **Repos:** `DrizzleDebtRepo` `listPayments(debtId)`, `recordPayment`, `setMatchRule`,
  `applyPaymentMatches`, `latestPaymentCentsByDebt` (this wave).
- **Edit-debt:** `updateDebtAction(input: DebtRow & {paymentPatterns?})` exists but is wired to NO UI
  ([`debts.ts:36-43`](../../apps/web/server-actions/debts.ts)); `DebtFormDialog` is add-only (`trigger`
  prop, calls `createDebtAction`) ([`debt-form-dialog.tsx:46-54`](../../apps/web/components/plan/debt-form-dialog.tsx)).
- **Recurring total:** `monthlyTotalCents = Σ toMonthlyCostCents(active)` — excludes debt payments
  ([`recurring/data.ts:43-46`](../../apps/web/app/(app)/plan/recurring/data.ts)); rendered as a summary
  bar ([`recurring-list.tsx:119-136`](../../apps/web/components/plan/recurring-list.tsx)).
- **Latest migration:** `0005_odd_victor_mancha.sql` → next is **0006**.

## 4. Data model

**One additive migration (0006).** `debts.paymentsLinkedAt TEXT` (ISO date string, nullable). Stamped
when a debt's payment rule is linked (the link/save flow). NULL for unlinked debts and pre-existing
debts. No other schema change; `debt_payments` and `match_rules` unchanged.

**`note` becomes a matchable field** — `MATCH_FIELDS` gains `"note"`; `MatchTarget` gains
`note: string | null`; the engine `fieldValue` switch handles it; the 3 construction sites pass
`txn.note`. `transactions.note` already exists.

## 5. Matching via the rules engine (Issue 1)

1. **Add `note`** end-to-end: contracts enum + zod, `MatchTarget`, `fieldValue`, the 3 target
   constructors, and the RuleEditor ConditionRow field dropdown.
2. **Link entry points open the RuleEditor seeded:**
   - **Trigger A — suggestion card:** "This is a payment for [debt ▾]" opens the RuleEditor with a
     `LINK_DEBT` action pre-targeted to the chosen debt + a seeded starting condition from the
     suggestion (description = pattern name, amount = detected amount). The owner refines (adds a
     rawText / note / amount condition) and saves. On save, `saveRule` sets `debts.matchRuleId`; the
     originating SUGGESTED recurring item is dismissed (CANCELLED).
   - **Trigger B — debt detail:** "Link this debt's payment" opens the same seeded RuleEditor with the
     `LINK_DEBT` action targeting this debt (no suggestion to dismiss).
3. **Retire `upsertDebtPaymentRule` + the bespoke `linkDebtPaymentToDebtAction`** (or reduce them to a
   thin call into `saveRule`); the canonical path is one rule editor + `saveRule`. Stamp
   `paymentsLinkedAt` at this point.

> The RuleEditor already supports everything; the work is **seeding it** (initial conditions + a
> pre-set `LINK_DEBT` action), **mounting it** inline at the two entry points, and the
> **dismiss-on-save** for Trigger A.

## 6. Forward-only balance (Issue 2)

- `matchDebtPayments` gains a per-matcher `linkedAt: string | null`. It still records **all** matched
  payments (so `latestPaymentCentsByDebt` / history reflect the real latest payment), but the
  balance-decrement (`balanceCents -= abs`) applies **only when `tx.paymentDate >= linkedAt`** (and
  when `linkedAt` is non-null). When `linkedAt` is null, no decrement (safe default).
- Detect Step 4 passes each debt's `paymentsLinkedAt`. Idempotency unchanged (already-linked txns still
  skipped). Net effect: linking a debt with months of history records the history + sets the actual
  payment, but does **not** subtract it from the typed current balance; only payments made after
  linking draw it down.

## 7. Edit-debt + repair (Issue 2b)

- **`DebtFormDialog` edit mode:** add `initialValues?: DebtRow`; when present, pre-populate fields, call
  `updateDebtAction` (full `DebtRow`), and label the submit "Save". An **Edit** button on debt detail
  opens it. This is how the owner resets the corrupted balances to reality.
- **Unlink / clear matched payments:** a debt-detail affordance that (a) deletes that debt's
  `debt_payments` rows, (b) clears `debts.matchRuleId` (and optionally deletes the now-orphan rule), and
  (c) nulls `paymentsLinkedAt`. Lets the owner wipe the over-matched junk and re-link with a precise
  rule. (A repo method + a "use server" action + a confirm button.)

## 8. Surfaces

- **Debt detail (Issue 3 + the add):** a **matched-payments list** (`listPayments(debtId)` → date +
  amount, most-recent first) and a **"Total paid"** sum (`Σ debt_payments.amountCents` for the debt).
  Plus the Edit + Unlink affordances (§7).
- **Recurring list (Issue 4):** `monthlyTotalCents` **includes** the debt-payments total
  (`+ data.debtPayments.totalCents`); the total row is rendered **more prominently** (larger / heavier,
  visually the headline above the debt-payments group); shown even when only debt payments exist.

## 9. Edge cases & non-goals

- **Pre-existing linked debts (the owner's corrupted ones):** `paymentsLinkedAt` is NULL → no further
  decrement; owner uses Edit to restore the balance and Unlink+re-link to fix the rule. The first
  re-link stamps `paymentsLinkedAt`.
- **`note` is nullable** → a note condition simply never matches a null note (engine returns false on
  null, existing behaviour).
- **Trigger A seeding without a transaction in hand:** the suggestion carries name + amount but not
  rawText; seed description + amount, let the owner add rawText/note in the editor. No rawText
  auto-fetch.
- **Non-goals (separate follow-ups):** wishlist-purchases-in-the-payoff-timeline (own brainstorm next);
  the generic detection-recall fix; locked-plan→per-debt-timeline source-of-truth.

## 10. Testing & verification gate

- **Unit (core):** `note` matching in the engine (`fieldValue` + a contains/exact case); forward-only
  decrement in `matchDebtPayments` (payment before `linkedAt` records-but-no-decrement; after → records
  + decrements; null `linkedAt` → no decrement; all still recorded).
- **Unit (db):** migration 0006 applies (additive ALTER); detect Step 4 passes `paymentsLinkedAt`;
  clear-matched-payments repo method deletes rows + clears the FK.
- **Component (web):** RuleEditor offers the `note` field; the seeded link flow (Trigger A/B) opens the
  editor with a `LINK_DEBT` action + dismisses the suggestion on save; `DebtFormDialog` edit mode calls
  `updateDebtAction` with the edited values; debt-detail matched-payments list + "Total paid"; recurring
  total includes debt payments + prominence.
- **Prod-build e2e (standing owner rule — invoke real write paths):** extend the journey to drive the
  edit-debt write path (open Edit → change a value → Save → assert persisted) and, if feasible under the
  single journey, the rules-engine link path; assert no `pageerror`.
- Full monorepo suite green; **typecheck + lint clean (run `typecheck` per task** — the prior wave hid
  `noUncheckedIndexedAccess` errors by running vitest only); migration applies 0000→0006 cleanly.

## 11. Open questions for the plan

- Whether to fully retire `upsertDebtPaymentRule`/`linkDebtPaymentToDebtAction` or keep a thin wrapper
  that builds a `LoadedRule` and calls `saveRule` (less churn at the call sites; same canonical path).
- Exact seeding shape handed to the RuleEditor (a partial `LoadedRule` with one condition + one
  `LINK_DEBT` action) and how the dialog is mounted at the two entry points (inline vs a shared
  controller).
- Whether "clear matched payments" also deletes the orphaned `match_rule` or only clears the FK
  (leaving the rule listed under `/settings/rules` for reuse).
