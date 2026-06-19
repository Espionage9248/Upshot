# Upshot

A private, self-hosted personal budget tracker built on a secure, type-safe, observable foundation — a ground-up rebuild of an [Up Bank](https://up.com.au) budgeting app.

> **Status:** Under active development. A single-user, private, self-hosted application.

---

## What it is

Upshot syncs a personal Up Bank account and turns it into a calm, glanceable picture of your money:

- **Envelope budgeting** across savers, with allocation, emergency-fund tracking, and goal confidence
- **Debt payoff** (snowball / avalanche / custom) with fee accrual and what-if extra payments
- **BNPL / installments** as a first-class concept, plus **recurring-bill intelligence** (price-drift, overlap, cost-per-use)
- A **purchase wishlist**, **net worth** with manual assets, and rich **reports / analytics / scenarios**
- A read-only, contributor-attributed view of a closed joint (**"2Up"**) account, rebuilt from source statements

It is a ground-up rebuild of an earlier version that had accreted structural debt and security gaps. This time the foundations are load-bearing from the first commit, not retrofitted — passkey auth, encryption at rest, integer-cents money, a typed contract layer, and observable automation.

---

## Architecture

A single **pnpm + Turborepo** TypeScript monorepo:

- **`apps/web`** — Next.js (App Router). Server Components for reads, typed Server Actions for writes. One process: no separate API, no CORS, no client/server type drift.
- **`apps/worker`** — a long-running process owning all scheduling (Up sync, fee accrual, recurring/installment detection, backups). A web restart never interrupts a sync; a long sync never blocks the UI.
- **`packages/core`** — framework-free domain logic (money, sync, budget, debt, recurring, reports, scenarios, the rule engine). Pure-tested against in-memory repository fakes — no database needed.
- **`packages/db`** — Drizzle schema + migrations over an **encrypted** SQLite database (SQLCipher via `PRAGMA key`).
- **`packages/contracts`** — Zod schemas: one definition → runtime validation **and** inferred TypeScript types.
- **`packages/ui`** — the design system as tokenized, accessible Radix + CVA components.

Two principles run through everything: **money is integer cents end to end** (never floats), and **all transaction-matching config is user-editable data** via a unified rule engine (never hardcoded patterns).

```
apps/        web (Next.js)   ·  worker (scheduler)
packages/    core  ·  db  ·  contracts  ·  ui  ·  config
ops/         docker-compose  ·  Caddyfile  ·  litestream  ·  migrate-v1
```

---

## Tech stack

TypeScript (strict) · Next.js (App Router) · React 19 · Tailwind v4 · Drizzle ORM · better-sqlite3-multiple-ciphers (SQLCipher) · Zod v4 · better-auth (passkeys) · Vitest · Playwright · fast-check · Litestream (backups) · ntfy (alerting) · Docker + Caddy / Tailscale · GitHub Actions.

---

## Design system

The approved visual language lives in [`design_handoff_upshot/`](design_handoff_upshot/), with the round-3 IA addendum in [`design_handoff_round3_ia/`](design_handoff_round3_ia/):

- **[`ds/tokens.css`](design_handoff_upshot/ds/tokens.css)** — the canonical token contract (Tailwind v4 `@theme`, OKLCH, **light + dark as true peers**, anchored on Up Sunset Orange `#ff705c` as the sole accent).
- **`Upshot Component Specs.md`** — per-component anatomy, variants, sizes, and **every state**, mapped to Radix + CVA.
- Living HTML/JSX render the whole system light + dark — **visual references only**, recreated in-stack (no Babel-in-browser shipped).

The product is organised as **five rooms + ⌘K** (Today · Money · Budget · Plan · Analyze), with Settings reached via the gear. Identity: a warm, editorial shell carrying confident, **colourblind-safe** money — Figtree for UI, JetBrains Mono for figures (tabular), meaning never carried by colour alone, WCAG AA in both modes. See [`DESIGN-BRIEF.md`](DESIGN-BRIEF.md) for the intent and decision history. The brand mark (**"Apex"**) and icon system (Lucide, re-skinned) ship in [`design_handoff_brand_icons/`](design_handoff_brand_icons/).

---

## Security & privacy

- **Single-user passkey (WebAuthn)** auth via better-auth; every route and every Server Action requires a valid session.
- **Encryption at rest** — SQLCipher; the key lives only in env / Docker secret, never in the repo. (Lost key = unrecoverable data, by design.)
- **Secrets** (`UP_API_TOKEN`, `DB_ENCRYPTION_KEY`) exist only in env / Docker secrets — never written to the database or logs.
- **TLS-only exposure** via Caddy (auto-HTTPS) or Tailscale — never naked on the LAN, never the public internet.
- **No financial data, database, or secrets are ever committed** (see [`.gitignore`](.gitignore)).

---

## Roadmap

Delivered in staged, independently-testable phases:

| Phase | Focus |
|---|---|
| 0 | Repo & toolchain foundation |
| 1 | Encrypted data layer + the `Money` value object |
| 2 | Up sync engine + worker (idempotent, observable) |
| 3 | Auth + web shell (`packages/ui` from the design contract) |
| 4 | Accounts, budgeting, transactions + rule UI |
| 5 | Debts, snowball, BNPL, recurring |
| 6 | Reporting, analytics, scenarios |
| 7 | 2Up historical module |
| 8 | Reliability & ops hardening |
| 9 | Migration & cutover |

Phases 0–2 and 8 are design-independent; Phases 3–7 build `packages/ui` from the design contract (tokens → `Money` atom → primitives → finance → screens).

---

## Development

> The monorepo is scaffolded in **Phase 0**. Once it lands, the standard loop is:

```bash
pnpm install
pnpm test     # unit (Vitest) · property (fast-check) · contract · integration · E2E (Playwright)
pnpm build
```

The encrypted database requires `DB_ENCRYPTION_KEY`; Up sync requires `UP_API_TOKEN`. Both are provided via environment / Docker secrets — never committed.

---

## License

[GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only).

This is a personal project shared in the open. You're free to use, study, modify, and self-host it under the AGPL — including running a modified version as a network service, provided you make your source available to its users under the same license.
