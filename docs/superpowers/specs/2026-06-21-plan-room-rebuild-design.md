# Plan-Room Rebuild — Design Spec

> Date: 2026-06-21 · Status: design for review · Supersedes the debt + BNPL surfaces of Phase 5 (PR #11)

## Goal

Rebuild the **Plan room** to true V1 parity, in one pass, fixing the regressions found in the
[V1→V2 regression audit](2026-06-21-v1-v2-regression-audit.md): the **debt** surface (A1),
**BNPL** surface (A2), the **missing purchases/wishlist** surface (A3), and the recurring
fixes (A4/A5/A6) + per-field form errors (A7). Built to V1's explicit, working behaviour —
not re-derived.

## Delivery

- **Scrap PR #11's debt/BNPL surfaces.** Rebuild on a fresh branch off `main`. **Keep recurring**
  (it works; it gets the A4/A5/A6 fixes folded in).
- **No schema migrations** — every table/field needed already exists (`debts`, `installment_plans`,
  `installment_plan_payments`, `purchases`, `purchase_images`, `recurring_items`, `app_settings`).
  This is a `core` logic + `web` surface rebuild only.
- Built via subagent-driven-development from a bite-sized TDD plan; PR to `main` only when asked.

## Out of scope (deliberately deferred — see audit)

- **Merchants analysis** (B1) → folded into **Analyze / Phase 6** (add a §9.1 row + Phase 6 task).
- **Category→Saver mapping** (B2) → **deferred** to Phase 6 design.
- **Salary/expense scenarios + cash-flow forecast** → **Phase 6.2** (this rebuild builds only the
  *debt-payoff* scenario engine; Phase 6 consumes it and adds the rest — E1 = option 1).
- **Today dashboard** completeness (A8: safe-to-spend, named health state, next-BNPL) → separate follow-up.

---

## Architecture — reused vs new

| Layer | Reused | New / extended |
|---|---|---|
| `core/debt` | `computeSnowball`, `computeWhatIf`, `utilisation`, `fees`, `months` | **Extend the what-if** to per-debt extra-payment targeting + per-debt interest-rate override (refinance); **`portfolioSummary`** that folds in the BNPL rollup |
| `core/installments` | `matchInstallments` (amount+merchant; already bulk/early-tolerant), `planProgress` | **recent-window gating** for the description+amount creation path; **`bnplRollup`** = Σ (totalInstallments − installmentsPaid) × installmentCents over ACTIVE plans |
| `core/purchases` | — | **New**: `monthlySaveTarget(targetPriceCents, targetDate, now)` → "Save $X/mo" |
| `core/match` + `apps/worker` | rule engine, sync pipeline | **Wire `LINK_DEBT`** (currently a deferred no-op): record a `debt_payment` (idempotent by `transactionId`) + reduce balance when a tx matches a debt's rule — restores V1 `matchDebtPayments` |
| `db` | all schemas (no migration) | — |
| `web` Money | `ledger-table`, `row-edit-popover` | **"Mark as BNPL" row action** (transaction-anchored); **"Mark as purchase" row action** |
| `web` Plan | `/plan/recurring` (+ fixes) | **Rebuild** `/plan/debts` (dashboard), **rebuild** `/plan/installments` (BNPL), **new** `/plan/purchases` |

---

## Surface 1 — Debt dashboard (`/plan/debts`)

**Replaces** the current list-of-cards-only view. Across-all-debts holistic dashboard:

- **Summary header**: debt-free date · total interest paid · payoff order · **strategy toggle**
  (Snowball / Avalanche / Custom) persisted to `app_settings.debtStrategy` via a `setDebtStrategyAction`.
- **What-if panel** (ephemeral, read-only compute — no writes):
  - **Per-debt extra payment** — choose a debt + extra $/mo applied to it.
  - **Per-debt refinance** — override any debt's interest rate to simulate refinancing.
  - Output: *months saved* + *interest saved* vs the baseline analysis.
  - Engine: extend the existing what-if to
    `computeWhatIf(debts, { strategy, startMonth, extraPaymentCents, extraTargetDebtId?, rateOverrides? })`
    where `rateOverrides: Record<debtId, rateFraction>`; baseline = same call with no extra/overrides.
- **Debt cards**: balance, monthly payment, utilisation bar (credit-limited debts), per-card payoff
  month; each links to the existing per-debt detail page (`/plan/debts/[id]`, payoff timeline kept).
- **BNPL rollup line** (read-only): the `bnplRollup` total rendered as a managed row that feeds the
  debt-free picture. Not editable here; "managed by BNPL tracking" affordance links to `/plan/installments`.

### Debt payment matching (Zip et al.) — restore V1 `matchDebtPayments`

V1 auto-linked transactions to debts as **payments** on every sync via comma-separated
`paymentDescriptionPattern` (e.g. `"ZipMoney, ZipPay, Zip"`), reducing the balance. In V2 this is
a **deferred no-op**: the `LINK_DEBT` match action exists in the enum but `apply.ts` returns early
("deferred past Phase 4"), `debts.matchRuleId` and the `debt_payments` table exist but **nothing
wires them** — so debts only track payments via the **manual** `recordDebtPaymentAction`. Restore it:

- **Debt form**: a "payment match pattern(s)" input (comma-separated descriptions, V1 parity). On
  save it creates/links a `match_rule` (OR over the patterns) and stores `debts.matchRuleId`.
- **Engine/worker**: implement the `LINK_DEBT` action — when a transaction matches a debt's rule,
  **insert a `debt_payment`** (idempotent by `transactionId`) and **reduce `currentBalanceCents`**.
  Runs in the sync pipeline (and a manual "rematch payments" trigger, mirroring V1).
- **Cross-layer note:** this touches the match engine + worker, not just Plan UI. In scope here
  because the debt surface is non-functional for revolving debts (Zip) without it.

## Surface 2 — BNPL, V1 Afterpay model (`/plan/installments` + Money ledger)

Two creation paths; one matching engine; a read-time rollup.

**Fixed invariants for both paths:** `frequencyDays = 14` (no field — fortnightly is the only Up BNPL
cadence). **`totalInstallments` is an input defaulting to 4** (4 covers Afterpay; editable for other
*true* BNPL such as Klarna/Humm). **Zip is NOT a BNPL plan** — it is a revolving **debt** matched by
description pattern; see Surface 1 → *Debt payment matching*. The entered **"amount" is the
per-installment (payment) amount** — i.e. what each debit
shows, the value we match transactions against — *not* the purchase total. `totalCents = installmentCents
× totalInstallments` is derived.

- **Path A — from a transaction** (Money ledger row action **"Mark as BNPL"**):
  - `installmentCents` **read-only from the tx amount** (the tx is one installment). `totalInstallments`
    input (default 4). **Installments-paid stepper (1..total, default 1)**. `nextDueDate` pre-filled
    `txDate + paid×14`; `firstDueDate = txDate`.
  - `merchant` / match pattern **locked from the tx description**. Stepper = total → created `COMPLETE`.
- **Path B — from the BNPL surface** (merchant + per-installment amount + total count):
  - On submit, auto-match against **recent transactions only** — a bounded window (default **45 days**,
    constant in `core`, tunable) — so it cannot false-match historical same-merchant debits. Seeds
    `installmentsPaid` from the count of matches found; sets `nextDueDate` from the latest match + 14.
- **Matching** (worker `matchInstallments`, unchanged logic): amount (±10%) + merchant, counts however
  many installment-sized debits landed. **Tolerant of early/bulk payment** — the owner clears several
  installments on salary day as **separate installment-sized debits**; the matcher counts them and marks
  `COMPLETE` at 4 even when paid weeks "early". Due-dates are *expected*; paid-count drives status.
- **No synthetic `debts` row** — the rollup (Surface 1) is computed at read-time. Cleaner than V1's hack,
  and respects V2's deliberate debts / installment_plans table split.
- **List**: active (instalment X of 4 · remaining/total · progress) + completed; **delete** wired.

## Surface 3 — Purchases / Wishlist (`/plan/purchases`) — new

- Wishlist cards from `purchases` (status `WISHLIST`): `customName`, `priority`, `targetPriceCents`,
  `targetDate`, **"Save $X/mo"** hint (`monthlySaveTarget`), `url`, `notes`, images.
- **URL scrape** (kept): "Fetch from URL" → a server action fetches the `url` and parses OG/meta tags
  → non-destructively fills empty name/price/merchant. One outbound fetch; no third-party API.
- **Mark-as-purchase** (Money ledger row action): links `transactionId`, flips status `WISHLIST → PURCHASED`,
  records `priceCents`/`purchaseDate`. Purchased linkage shown.
- **Delete** wired.

## Surface 4 — Recurring fixes (`/plan/recurring`, keep + patch)

- **A4**: render `row.category` on the card (alongside, not instead of, the bill/subscription kind).
- **A5**: overlap alert **names the offending items and links to each** (scroll/anchor to its card).
- **A6**: wire **delete/remove** for active recurring items (uses existing pause/dismiss/delete actions).

## Cross-cutting — form errors (A7)

Per-field validation errors across **all** Plan forms (debt, BNPL, purchase): each field renders its own
error beneath itself, not a single shared error under the last input. Fixes the "Frequency rejects 4"
class of bug (which was an installments-error rendered under the frequency field).

---

## Testing discipline (the lesson, enforced)

Three UAT failures in a row came from tests that validated *logic* but never invoked the *production
write path* (see [[e2e-must-invoke-write-paths]]). For every surface here:

- **Core unit tests**: what-if with extra-target + rate-override math; baseline vs projected deltas;
  `bnplRollup`; recent-window gating (a stale same-merchant debit outside the window is **not** matched);
  early/bulk match (3 installment-sized debits on one day → paid=3); `monthlySaveTarget`.
- **Prod-build e2e invokes every real write path** and asserts **no `pageerror`**: mark-BNPL-from-a-tx,
  BNPL bulk-payment match result, add-to-wishlist, URL-scrape fill, mark-purchased, strategy toggle,
  what-if compute, delete on each surface. Plus the **validation-error paths** (submit incomplete forms,
  assert the error renders under the right field). Route-smoking empty states is **not** coverage.

## Engine signatures (for the plan)

```ts
// core/debt — extend the existing what-if
interface WhatIfInput {
  strategy: DebtStrategy;
  startMonth: string;             // yyyy-MM
  extraPaymentCents: number;      // 0 = baseline
  extraTargetDebtId?: string;     // undefined = follow strategy order
  rateOverrides?: Record<string, number>; // debtId -> annual rate fraction (refinance sim)
}
computeWhatIf(debts: DebtInput[], input: WhatIfInput):
  { withChanges: SnowballAnalysis; base: SnowballAnalysis; monthsSaved: number; interestSavedCents: number }

// core/installments
bnplRollup(plans: { totalInstallments: number; installmentsPaid: number; installmentCents: number; status: string }[]):
  { remainingCents: number; activeCount: number; nextDueDate: string | null }
const BNPL_RECENT_MATCH_WINDOW_DAYS = 45;

// core/purchases
monthlySaveTarget(targetPriceCents: number, targetDate: string | null, now: Date):
  { monthlyCents: number | null }   // null when no target date or date in the past
```
