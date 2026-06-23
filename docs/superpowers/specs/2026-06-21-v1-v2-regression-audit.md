# V1 → V2 Regression Audit

> Date: 2026-06-21 · Author: pairing session · Status: first pass for review

## Why this exists

Phase 5 shipped "all gates green" but UAT found the **debt** and **BNPL** surfaces had
silently drifted from V1's explicit, working behaviour — wasting rebuild effort to
re-reach parity the old tool already had. PLAN-V2 §13 *claims* "every V1 capability maps
to a phase," but that mapping is **necessary, not sufficient**: the regressions live
between the *plan* and the *as-built code*. This audit checks all three columns —
**V1 capability → V2 plan home → V2 as-built reality** — and grades each.

**Method:** V1 inventory from `reference/v1/docs/PLAN.md` (P1–P23) + `CLAUDE.md`. V2 plan
from `PLAN-V2.md` §9.1/§11/§13. As-built status from grep/read of `apps/web`, `packages/*`
(confidence noted per row). Built phases today: **0–5**. Phases **6 (reports/analytics/
scenarios), 7 (2Up), 8 (ops), 9 (migration)** are not yet built.

**Grades:** `REGRESSION` = built phase, drifted or missing vs V1 (actionable now) ·
`PLAN-GAP` = V1 capability with no/weak V2 home in §9.1 (decision needed) ·
`PENDING` = correctly deferred to an unbuilt future phase (not a regression; coverage
verified) · `PARITY` = built and matches.

---

## A. Regressions in built phases (actionable now)

| # | V1 capability | V2 home | As-built reality | Severity | Confidence |
|---|---|---|---|---|---|
| A1 | **Debt holistic view** — snowball/avalanche/custom **strategy toggle**, what-if extra payment **across all debts**, debt-free date, payoff order; V1 scenario planner | Plan / 5.1 | Only a **per-debt detail page** (`debt-detail.tsx`) with a single-debt what-if. List page (`debt-list.tsx`) shows a tiny per-card "Estimated payoff" line; **no dashboard, no strategy toggle, no across-all-debts what-if, no refinance sim** (refinance is net-new). | HIGH | confirmed (read) |
| A2 | **BNPL/Afterpay model (P18C)** — "Mark as Afterpay" **from a transaction**, **amount read-only**, **always 4×fortnightly**, **installments-paid stepper**, auto-match by description+amount±10%, **synthetic aggregate debt** on Debts page | Plan / 5.2 | Free-floating **manual form** (`installment-form-dialog.tsx`): hand-typed merchant/total/count/**editable frequency-days**/first-due; **no transaction anchor**, amount not read-only, **no debt rollup**. Worker match logic (`match.ts`) is close to V1. | HIGH | confirmed (read) |
| A3 | **Purchases / Wishlist** — wishlist priority + target price, **"Save $X/mo"** hint, **URL scrape** (P13A), **mark-as-purchase** from a transaction (P12C), purchased linkage | Plan (§9.1) — but **no Phase task** builds it (4.x/5.x omit it) | `purchases` **table exists** (schema) but **no UI surface, no core logic, no server actions**. Plan room "done" (Phase 5) without it. | HIGH | confirmed (no surface; schema-only) |
| A4 | **Recurring shows category** (Rent/Bills, not just type) | Plan / 5.3 | Card renders the **kind** badge ("Bill"/"Subscription"), never `row.category`. | MED | confirmed (read) |
| A5 | **Overlap/duplicate warning is actionable** | Plan / 5.3 | Alert prints a count only — **never names the offending items**, no link/action. | MED | confirmed (read) |
| A6 | **Delete** a debt / BNPL plan / recurring item | Plan / 5.x | Backend delete actions **exist** (`deleteDebtAction`, `deleteInstallmentPlanAction`, recurring pause/dismiss) but **no UI control** calls them. | MED | confirmed (read) |
| A7 | **Per-field form validation** | Plan / 5.x | Single shared `error` rendered only under the **last** field → messages surface under the wrong input (the "Frequency rejects 4" bug). Affects debt + BNPL forms. | MED | confirmed (read) |
| A8 | **Dashboard: safe-to-spend hero + named health state + next BNPL** (V1 CashFlowSummaryCard; Phase 3.3 deliverable) | Today / 3.3 | `today/data.ts` returns net-worth, upcoming bills, sync health, empty insights. **No safe-to-spend, no named health state, no next-BNPL.** (Cash-flow forecast/overdraft is legitimately Phase 6.) | MED | confirmed (read) |
| A9 | **Debt payment auto-matching** (V1 `matchDebtPayments`: comma-separated description patterns e.g. `"ZipMoney, ZipPay, Zip"` → auto-link transactions as debt payments on every sync, reduce balance; the **Zip-as-debt** use case) | Plan / 5.1 + Phase 2 match engine | **Deferred no-op**: `LINK_DEBT` exists in `MATCH_ACTION_TYPES` but `apply.ts:82-87` returns early ("deferred past Phase 4"); `debts.matchRuleId` + `debt_payments` table exist but **nothing wires them**. Only **manual** `recordDebtPaymentAction` works. | HIGH | confirmed (read apply.ts) |

> **Related deferred no-ops** (same `apply.ts` block): `LINK_RECURRING` / `LINK_INSTALLMENT` are
> harmless — recurring detection and `matchInstallments` handle those out-of-band. **`IGNORE_SUBSCRIPTION`**
> is worth a check: V1 dismissing a suggested sub added its pattern to a permanent **ignore list** so
> DETECT wouldn't re-suggest it; if V2 only sets status `CANCELLED`, a dismissed sub may be re-suggested
> on the next DETECT run. Flagged for the recurring fixes (A4–A6) scope. Description rewrites
> (Zip→ZipMoney/ZipPay, Apple→…) are **out of scope** — user-created `RENAME` match-rules (Phase 4.3),
> contingent on the note text being matchable (V2 fields = `description`/`categoryName`/`rawText`; **no
> `note`** — verify the Zip note lands in `rawText`).

## B. Plan-level gaps — V1 capability with no/weak V2 home

| # | V1 capability | V2 plan home | As-built | Severity | Decision needed |
|---|---|---|---|---|---|
| B1 | **Merchant analysis page (P14)** — `/merchants`, spend-by-merchant trend, visits/mo, rising-merchant callouts, expandable detail | **None** — no row in §9.1; "merchant" is only a transaction field | Absent | MED | **DECIDED (2026-06-21): fold into Analyze (Phase 6).** Add a §9.1 Analyze row + a Phase 6 task; not part of the Plan-room rebuild. |
| B2 | **Category → Saver mapping (P15A)** — link Up categories to saver envelopes; "Linked Categories" on saver cards | **None** in §9.1 | Absent | LOW–MED | V1 itself scoped this as *config-only, report detection deferred*. **DEFERRED (2026-06-21):** revisit when Phase 6 analytics (a potential consumer) is designed. |
| B3 | **Transaction enrichment niceties** — **Cover/Round-Up badge** (P21), **foreign-currency display** (P10), Zip/Apple-Pay description rewrites (P10) | Money room (implied) | Patreon/salary **are** seeded as `match_rules` (`seed.ts` ✓). Cover badge / foreign-currency display in the ledger UI appear **absent**. | LOW | Confirm in a deeper Money-room read; restore the display bits. |

## C. Correctly pending (future phases — coverage verified, not regressions)

| V1 capability | V2 home | Note |
|---|---|---|
| Reports: monthly / yearly / FY / analytics / behavioral / spending-pattern / emergency-fund readiness | Phase 6 (`core/src/reports`) | Not built yet. Plan covers + folds in MoM deltas, Sankey, heatmap, streaks. |
| Scenarios: debt-payoff / salary / expense + cash-flow forecast 30/60/90 | Phase 6 (`core/src/scenarios`) | Not built. **Overlaps the debt-dashboard what-if/refinance the owner now wants** — reconcile (see §E). |
| Tax report (AU brackets, deductible totals) | Phase 6 / `/reports/tax` | `settings/tax` + `isTaxDeductible` flags exist; the *report* is Phase 6. |
| 2Up historical | Phase 7 | Not built; Round-3 design returned. Re-derived from PDFs (not migrated). |
| Net worth + manual assets | Phase 4 `/net-worth` | **Built** (PARITY pending spot-check). |
| Emergency fund readiness | Phase 4 `core/budget/emergency-fund.ts` | **Built**; verify readiness score/tier/tips parity later. |
| Scheduled auto-sync / fees / detect | Phase 2 + manual triggers | Built; manual job triggers added in Phase 5 follow-up. |

---

## D. Headline

The **data model (Phase 1) is complete** — `purchases`, `assets`, `two-up`, debt/recurring/
installment tables all exist. The regressions are all in the **built UI/logic layers**, and
they cluster in the **Plan room** (debts, BNPL, purchases) plus the **Today** dashboard.
Reports/analytics/scenarios/2Up are genuinely *pending* future phases, not regressions —
**do not** treat their absence as drift.

## E. Recommended consolidated rebuild scope

Since the **Plan room** is being rebuilt to V1 parity anyway, do it **once**, whole:

1. **Debt dashboard** (A1) — across-all-debts view, strategy toggle, what-if, refinance sim.
   **DECIDED (2026-06-21, E1 = option 1):** build the **debt-payoff scenario engine**
   (extra-payment what-if + strategy + the net-new interest-change/refinance axis) **now**,
   as part of the debt dashboard. Phase 6.2's scenarios task then **consumes** this engine
   and adds only salary/expense scenarios + cash-flow forecast — built once, not twice.
   **+ Debt payment matching (A9):** wire `LINK_DEBT` (record `debt_payments` + reduce balance on
   sync) + a debt-form pattern input — restores V1 `matchDebtPayments`; the Zip-as-debt use case.
2. **BNPL → V1 Afterpay model** (A2) — transaction-anchored entry (amount read-only,
   4×fortnightly, installments-paid stepper), early/bulk-payment-tolerant matching,
   read-only synthetic-debt rollup onto the debt dashboard.
3. **Purchases / Wishlist** (A3) — wishlist + target price + "Save $X/mo" + mark-as-purchase
   from a transaction. (URL scrape: confirm still wanted.)
4. **Recurring fixes** (A4/A5/A6) — show category, name+link overlap items, wire delete.
5. **Form error placement** (A7) — per-field errors across Plan forms.

**Decisions (resolved 2026-06-21):** B1 merchants → **fold into Analyze (Phase 6)**. B2
category→saver → **deferred** to Phase 6 design. E1 → **option 1**: debt-payoff what-if +
refinance built into the debt dashboard now; salary/expense/forecast stay in Phase 6.
**Today** completeness (A8) is real but **separable** — a follow-up, not part of the
Plan-room rebuild. **Delivery (resolved):** scrap PR #11's debt/BNPL surfaces, rebuild the
Plan room on a fresh branch; keep recurring (with the A4/A5/A6 fixes).

> Confidence note: A1–A8 and B1/B2 are confirmed by reading the code / confirming surface
> absence. B3 is grep-inferred and needs a deeper Money-room read before acting.
