# Phase 7 — 2Up historical module — Design

> PLAN-V2 §11 Phase 7 (Tasks 7.1, 7.2) + §9.0 B3 + §4.7. Branch
> `phase-7-2up-historical` off `main` (`5eae08c`). Baseline gate: typecheck 0 /
> lint 0 / **1353** tests (contracts 9 / core 487 / db 110 / ui 179 / worker 11 /
> web 557). Latest migration `0008`. e2e = `pnpm --filter @upshot/web build && pnpm --filter @upshot/web e2e`.

## 0. Data handling — STRICTLY LOCAL (overrides everything)

The 2Up source is **real financial PII** and must never leave the machine.

- 23 source PDFs in `docs/2up/` (`2up-statement-YYYY-MM.pdf`, **2021-05 → 2023-03**),
  gitignored via the explicit `docs/2up/` rule (+ `*.pdf`/`*.csv`). Never `git add -f`,
  commit, or push a statement or any derived extract.
- **The classification config is PII too.** V1 hard-coded real name tokens, account
  numbers, and merchant/debt patterns into committed source (`reference/v1/.../twoup.ts`).
  V2 does **not** repeat this: those live in a **local gitignored config**
  `docs/2up/twoup.config.local.json` (covered by `docs/2up/`). Committed code is
  generic; **tests use synthetic names/descriptions only**.
- Any intermediate extract (CSV/NDJSON) is written under `docs/2up/` (gitignored).
  Reconciliation reports may contain amounts → stdout or `docs/2up/` only.
- Never store contributor names / amounts / balances / descriptions in memory,
  commit messages, PR bodies, or fixtures.

**First action each session:** `git check-ignore docs/2up/2up-statement-2021-05.pdf`
resolves and `git status --porcelain docs/2up` is empty. *(Verified at design time.)*

## 1. Findings that reframe the prompt (confirmed by local inspection)

1. **All 23 statements are true-text PDFs** (3k–15k chars each), *not* scans. The
   16–173 images/file are per-row merchant icons. → deterministic extraction is viable.
2. **Single joint ledger**, grouped by day, fixed x-columns: time (x≈35) · description
   (x≈88, multi-line wrap) · category/method (x≈353) · **signed amount** (x≈460–480,
   `+$`=in / `$`/`-$`=out) · **running balance** (x≈540). A **Summary** block prints
   **Opening · Money In · Money Out · Closing**.
3. **No per-person spend signal.** The method column has 25 distinct tokens, all
   transaction *types* (`Purchase`/`Payment`/`BPAY`/`Direct`/`Refund`) — no cardholder.
   A card last-4 appears in only **2 of 23** statements. → spending **cannot** be
   attributed to a person from the data; only **inflows** carry a depositor name.
4. **Schema already exists** in migration `0000` (`two_up_transactions` + unique index
   `two_up_rowhash_uq`). → **no new migration.** The ingestion writer is new code only.
5. **pdfjs-dist** extracts clean positioned text in Node (verified) → **all-TS** pipeline,
   no Python dependency.

These mean V1's failure mode (regex-cleaning a hand-made CSV where text bled between
rows) is structurally avoided: every word is assigned to its transaction by **coordinate**.

## 2. Scope (locked via brainstorm forks)

**In:**
- All-TS ingestion pipeline (pdfjs-dist) → reconciled, classified rows in
  `two_up_transactions`. One repeatable local command, idempotent by `rowHash`.
- **Overview** `/analyse/2up` + **Ledger** `/analyse/2up/ledger` (Analyse sub-surface;
  add "2Up" to the nav rail), built to `design_handoff_round3_ia/screens/round3.jsx`
  (`TwoUpOverview`, `TwoUpLedger`) with faithful reductions (§5).
- **One write path** — "mark owner / category" on a transaction (§4), feeding the
  settlement math. This **relaxes §9.0's "strictly read-only"**; recorded in PLAN-V2.

**Out (deferred, documented — §8):** Up API statement-PDF fetch (spike note only);
auto-pull → Paperless directory; any per-person *spend* attribution; PDF parsing of
non-2Up statements.

## 3. Task 7.1 — Extraction & reconciliation

All extraction/parsing logic is **pure and tested** except the thin pdfjs IO boundary.

### `packages/core/src/twoup/extract.ts`
- `assembleTransactions(pageItems: PositionedText[]): RawRow[]` — pure. Groups
  positioned text into transactions by **day-group header** (`Weekday, DD Mon`) +
  **x-band** assignment; joins multi-line descriptions belonging to one transaction by
  vertical proximity. Returns `RawRow = { date, time, description, amountCents,
  balanceCents }` + per-statement `Summary = { openingCents, moneyInCents,
  moneyOutCents, closingCents }`.
- **Integer cents only.** `parseMoneyCents("$1,234.56") → 123456` by stripping
  non-digits and tracking sign (`+`=in, `-`/bare=out). **Never `parseFloat`.**
- A thin `scripts/twoup/ingest.ts` owns the pdfjs IO: PDF bytes → `PositionedText[]`
  (`{ x, y, str }` from `getTextContent`), handed to the pure assembler.

### `packages/core/src/twoup/reconcile.ts` — the non-negotiable gate (pure, tested)
`reconcileStatement(rows, summary): ReconResult` asserts **to the exact cent**:
1. **Running balance** — `balance[i] === balance[i-1] + amountCents[i]` for every row
   (seeded from `openingCents`); last row === `closingCents`.
2. **Summary identity** — `openingCents + Σ(in) − Σ(out) === closingCents`.
3. **Row count** present and self-consistent.

Returns `{ ok, firstBreakIndex?, expected?, actual? }`. **A statement is not ingested
unless `ok`.** The ingest command prints a per-statement report and exits non-zero on
any failure.

### Idempotency — `packages/core/src/twoup/hash.ts`
- `rowHash = sha256(date │ time │ amountCents │ balanceCents).slice(0, 32)`.
  All four fields are numeric/stable; running balance is near-unique per row, so the
  hash is **stable across description-parsing changes** → manual marks keyed to a row
  never orphan on a re-pull. *(Differs from V1, which hashed the messy raw description.)*

### Ingest command
`pnpm tsx scripts/twoup/ingest.ts <docs/2up>` — runs extract → reconcile → classify →
upsert. **Local only** (PDFs are gitignored; never CI). Idempotent: upsert by `rowHash`,
existing rows skipped (preserves marks). **`pdfjs-dist` is a dev-only dependency of the
script** — `packages/core` stays pure and receives `PositionedText[]`, so it never
imports pdfjs.

## 4. Task 7.2 — Core domain (pure, integer-cents, never import `@upshot/db`)

### Owner model
One **owner** attribution per transaction unifies V1's `contributor` + `debtOwner`:
- **Inflows** → `JAMES` / `BRITTNEY` (name match) · `INTEREST` · `REVERSAL` (dishonour,
  excluded from math) · **`UNASSIGNED`** when no confident signal.
- **Outflows** → `null` = **shared** (50/50, default) · `JAMES`/`BRITTNEY` = that
  person's **personal cost the pool funded**.

> **Decision (replaces V1's "all unlabelled inflows = James"):** ambiguous inflows →
> **`UNASSIGNED`** (surfaced for marking), not silently credited to James. The Overview
> shows an "unassigned contributions" figure until cleared. This is the honest version of
> "mark transactions that can't be identified."

### `packages/core/src/twoup/classify.ts` (config-driven, generic)
`classify(text, amountCents, cfg): { owner, category }` where `cfg` is loaded from the
**local gitignored** `docs/2up/twoup.config.local.json`:
```
cfg = {
  owners: { JAMES: {tokens:[…]}, BRITTNEY: {tokens:[…]} },  // tokens incl. full + SHORT form + surname
  interestPatterns: […], reversalPatterns: […],
  categoryRules: [{ patterns:[…], category }],              // first-match wins
  personalDebtPatterns: [{ owner, patterns:[…] }],          // seed personal-owner on known outflows
}
```
- **Name matching must match the short form, not only the full given name** (the
  partner's 4-letter short form AND full name AND surname), case-insensitive, on
  **word boundaries** to limit false positives (e.g. avoid a 3-letter fragment matching
  inside an unrelated merchant). `UNASSIGNED` + manual marking is the safety net.
- Committed source contains **no real tokens**; `cfg` is injected. Tests pass a synthetic
  `cfg` (`{JAMES:["alice"], BRITTNEY:["bob","bobbie"]}`) over synthetic descriptions.

### `packages/core/src/twoup/settlement.ts` (property-tested) — corrected model
Let `C_p` = contributions (inflows owned by p), `S` = Σ shared outflows, `P_p` = Σ
personal outflows owned by p (pool-funded personal cost). Each person bears **half of
genuinely-shared spend + the full amount of their own pool-funded personal costs**:
```
net_p          = C_p − S/2 − P_p
whoOwedWhom    = net_JAMES − net_BRITTNEY            // + = James owed by Britt
```
> **V1 bug, deliberately not ported.** V1's debt adjustment has the **sign backwards**:
> it *raises* a person's owed-position when the pool funds **their own** personal debt
> (they benefited → it must *lower* it). Derivation: V1 `overcontribution = (jIn−bIn)
> + Dj − Db`; correct `= (jIn−bIn) − Dj + Db`. V2 implements the clean model above.

Property tests:
- **Symmetry:** swapping all `JAMES`↔`BRITTNEY` owners negates `whoOwedWhom`.
- **Shared-only / equal contribution:** `P=0`, `C_J=C_B` ⟹ `whoOwedWhom = 0`.
- **Personal funded lowers owner's net:** increasing `P_J` strictly decreases `net_J`.
- **Conservation:** `C_J + C_B + interest + unassigned − S − P_J − P_B` equals the net
  pool change (ties to reconciled balances).
- Integer-cents exact; halving `S` uses a documented rounding rule (odd cents → deterministic).

### `packages/core/src/twoup/analytics.ts` (pure, tested)
`totalsIn/Spent/distributed` (distributed = final statement `closingCents`), per-person
`{ putIn, shareOfCosts = S/2 + P_p, net }`, who-contributed split + `%`, **monthly
contribution rhythm**, **per-category totals** (joint), top merchants (`extractMerchant`
ported, integer-cents).

## 5. Data model & idempotency

- **No new migration.** Reuse `two_up_transactions` (migration `0000`): nullable
  `contributor` column carries the unified **owner**; `category` carries the effective
  category. id, `rowHash` (unique), `date`, `description`, `amountCents` as-is.
- Ingest writes the **auto** owner + category. **Mark-owner action UPDATEs** them.
- Re-ingestion idempotent by `rowHash`, existing rows skipped → marks survive. The
  account is **closed** (immutable source), so production re-derivation that could
  threaten marks effectively never happens.
- *Rejected alternative:* separate `two_up_overrides` table (migration `0009`) for
  wipe-and-re-derive-while-keeping-marks — unjustified for a closed dataset.

## 6. Surfaces (faithful reductions of `round3.jsx`; no new tokens)

Add **"2Up"** to `apps/web/components/analyse/analyse-nav-rail.tsx`
(Reports · Analytics · Forecast · Tax · **2Up**). Person identity = `--viz-2` (James) /
`--viz-4` (Britt); **money direction = sign + income/expense colour, never person-colour
alone**. Light + dark, focus rings, tabular figures, reduced-motion preserved.

### Overview `/analyse/2up`
- StatCards: **Total put in** · **Total spent** · **Distributed at close** (final
  `closingCents`).
- `ContributorPanel` per person → **Put in** (real) / **Share of costs** (`S/2 + P_p`) /
  **Net position** (`net_p`). Keeps the mock's 3-row layout; every number real — no
  fabricated per-card spend.
- "Who contributed" split (`SplitBar`) + **contribution rhythm** (`Spark`) — real.
- "Where it went" → **per-category joint totals** (single series, category colour). The
  mock's two-person `CatSplit` reduces here (per-person *spend* not in data).
- A scale/settlement callout: who-owed-whom + "settled at close".

### Ledger `/analyse/2up/ledger`
- Columns Person · Merchant · Category · Date · Amount. **Person** = owner avatar
  (J/B coloured; neutral "Joint" for shared, "Unassigned" for unmarked inflows).
- Filters: Person · Category · Date · Amount + search. Read paths via `@upshot/db` repo.
- **Mark owner / category control** per row → the one write action.

### Write action (`"use server"` — core/wrapper split)
One action `updateTwoUpAttribution({ id, owner?, category? })` — a thin `"use server"`
async wrapper over a pure `actions-core.ts` + a `@upshot/db` writer (either field
optional; `owner` accepts a clear-to-`null`/`UNASSIGNED`). **Auth on the action**; only
`async` fns + `export type {…} from "./actions-core"` exported from the `"use server"`
module (no bare `export type`). Revalidate the 2Up routes after write.

## 7. Verification

- **Reconciliation:** every statement penny-perfect (running balance + summary identity
  + row count); ingest exits non-zero otherwise.
- **Idempotency:** re-running ingest changes nothing (upsert by `rowHash`); a marked
  row keeps its mark across re-ingest.
- **Split math property-tested** (symmetry / shared-only / monotonic / conservation).
- `pnpm --filter @upshot/web typecheck` **and** `pnpm -r lint` run **separately** after
  every web task; clear stale `apps/web/.next` on branch switch.
- **e2e** extends `apps/web/e2e/auth.spec.ts` (one test, one context): navigate
  `/analyse/2up` + `/analyse/2up/ledger`, **invoke the mark-owner write action**, assert
  the row updates, final `expect(pageErrors).toEqual([])`.
- **Fixtures synthetic only** — fabricated rows/owners/descriptions; never real values.

## 8. Deferred (captured, not built)

- **Up API statement-PDF spike** — documented investigation: does `UpClient` / the Up
  API expose statement PDFs for a **closed** account? (Almost certainly not.) Findings
  note only; no fetch code.
- **Auto-pull statements → Paperless directory** — owner's future-feature idea; only
  meaningful for the **active** account, a separate ops concern. Noted for a later phase.

## 9. Module layout

```
packages/core/src/twoup/
  extract.ts      assembleTransactions + parseMoneyCents (pure)
  reconcile.ts    penny-perfect gate (pure)
  hash.ts         stable rowHash (pure)
  classify.ts     owner + category, config-injected (pure)
  settlement.ts   corrected fairness model (pure, property-tested)
  analytics.ts    totals / per-person / rhythm / per-category (pure)
  index.ts
  __tests__/      synthetic fixtures only
packages/db/        two-up repo: read queries + mark-owner/category writer
apps/web/app/(app)/analyse/2up/{page.tsx, ledger/page.tsx}
apps/web/components/analyse/two-up/*   ContributorPanel, SplitBar, CatSplit→CatTotals, TUpRow, Avatar, mark control
apps/web/app/(app)/analyse/2up/actions.ts (+ actions-core.ts)
scripts/twoup/ingest.ts   pdfjs IO + pipeline driver (local only)
docs/2up/twoup.config.local.json   PII classify config (gitignored)
```

## 10. Decisions resolved

1. **Extraction:** deterministic word-coordinate (all-TS, pdfjs-dist). ✅
2. **Spend split:** contribution-fairness baseline; **per-person spend not in data** →
   ContributorPanel "Share of costs", `CatSplit` → joint category totals.
3. **Mark owner feeds settlement** (inflow→contribution, outflow→personal pool-funded);
   **owner + category** both editable; survives re-ingest via stable `rowHash`.
4. **`UNASSIGNED`** replaces V1's default-to-James.
5. **No migration** (reuse `contributor`/`category` columns).
6. **V1 settlement sign bug corrected**, locked by property tests.
7. **Read-only relaxed** to one write path; recorded in PLAN-V2 §9.0 / Phase 7.
8. Up API + Paperless **deferred** to documented notes.
