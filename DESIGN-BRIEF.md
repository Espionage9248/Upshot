# Upshot V2 — Design System Brief

> **For Claude Design.** This brief is derived from `PLAN-V2.md` §9 (Screen & Component Inventory) and §10 (Design System). It is self-contained — you do not need the rest of the plan to act on it, though the source of truth for any ambiguity is `PLAN-V2.md`.
>
> **The ask in one line:** re-imagine a single-user personal-finance app from a clean redesign lens — its look *and* its organisation — and propose a complete, tokenized, accessible, light + dark design system that we'll implement as `packages/ui`.

---

## 0. Read this first — the spirit of the brief

This is **a redesign, not a reskin.** What follows describes what the app must let its owner *do and see* — that is the raw material. **How it's organised, laid out, sequenced, composed, and styled is wide open**, and that's the point.

Three rules frame everything below:

1. **Almost nothing is sacred.** Information architecture, how screens are grouped and ordered, where elements live, how components sit together and interact, navigation model, typography, spacing, motion — all of it is yours to question and re-propose. If the V1-derived structure shown here is the wrong shape, say so and show a better one. The inventories in §5 and §6 are a **checklist of needs, not a layout to preserve.**
2. **The one real holdover is color** — specifically the Up-brand anchor and the accessibility/dark-mode requirements (§3, §4, §8). Even there, the exact ramps and values are open; what's fixed is "Up-inspired + WCAG AA + colorblind-safe + first-class dark mode."
3. **Work in options, not edicts; the owner approves.** At the decisions that matter — overall direction, navigation/IA, the dashboard, the ledger, money rendering, charts — present **2–3 distinct directions** with the trade-offs, rather than a single answer. The owner (a single user — see §1) confirms the final design. Treat this as a collaboration with checkpoints, not a spec to execute.

---

## 1. The product in one screen

**Upshot** is a private, **single-user** personal budget tracker — a from-scratch V2 rebuild. It syncs a real bank account (Up Bank, Australia), tracks envelope budgets, debts, BNPL/installments, recurring bills, a purchase wishlist, and rich reports/analytics. It runs as a self-hosted web app the owner reaches over a private network from **both phone and desktop**.

These are *needs to satisfy*, not layout instructions — how you meet them is open:

- **Used daily and often just glanced at.** The owner needs to answer "am I okay this week?" in a couple of seconds. Calm and legible beats clever.
- **Money-dense.** Nearly everything is currency in rows and columns. Numbers must be scannable, aligned, and unambiguous in sign and direction. This is the single most important craft problem in the system — and a strong reason to rethink, not inherit, V1's layouts.
- **Personal, not corporate.** One person's financial life, not a B2B SaaS dashboard. It can have warmth and a point of view. It should *not* look like a generic admin template.
- **Dark mode is first-class** — used at night, at a glance. Light and dark are peers.
- **Trust is the emotional core.** This shows someone their debts and savings. Honest, steady, in control — never alarming for its own sake, never gamified into anxiety.

The single owner is also your **approver**: there's no committee, no brand-police, no legacy-user migration to fear. That's freedom — propose boldly.

---

## 2. Division of labour & ways of working

| You (Claude Design) | We implement |
|---|---|
| The redesign: information architecture, layout, composition, interaction model, and the full visual language | `packages/web` screens + `packages/ui` (tokens, primitives, finance components) |
| Token *values* and ramps | `packages/ui/src/tokens/` |
| Per-component visual treatment + states | `packages/ui/src/primitives/` and `src/finance/` |
| Data-viz palette + chart styling | chart components |

You are **not** being asked to write production component code or make feature/logic decisions — the *capabilities and data* are settled (§5, §6) and won't change. But **everything about how those capabilities are presented is in scope**, including proposing a different set of screens or a different component decomposition than the one listed.

**How we'd like you to deliver:**

- **Lead with direction.** Before detailing tokens, propose 2–3 overall design directions (mood, IA stance, density, personality) and let the owner pick or blend.
- **Options at the hinge points.** Navigation/IA, the dashboard composition, the transaction ledger, money rendering, and the chart language each deserve a couple of alternatives with trade-offs.
- **Then the system.** Once a direction is chosen, deliver the full token set + component specs in the format of §9.
- **Flag anything you'd change in §5/§6.** If the inventory implies a worse structure than you'd design, restructure it and tell us — that feedback loops back into `PLAN-V2.md` §9 (the plan already expects §9/§10 to be rewritten once the design returns).

---

## 3. The one real holdover — color & brand

Carried forward from V1 because it's Up-inspired and accessibility-load-bearing. This is essentially the *only* fixed input. Even here, treat values as a starting point and propose ramps.

- **Primary — Up Sunset Orange:** `#ff705c` → HSL `14 100% 68%`. The brand anchor. The system builds outward from it. Up orange stays the brand accent — but **where and how it's deployed is open** (V1 painted default buttons, focus rings, and the active nav with it; you may rethink that distribution as long as Up orange reads as *the* accent).
- **Up Yellow `#ffee52`** and **Up near-black `#1a1a1c`** exist in the brand but were unused in V1 — fully available; use them, or don't.
- **Everything else about color is open:** neutrals and full ramps, the finance-semantic palette (§4), the data-viz series palette — all yours, subject only to the accessibility constraints in §8.

The fixed core, restated: *Up orange as the anchor accent; WCAG AA; colorblind-safe; first-class dark mode.* Beyond that, propose.

---

## 4. Money has meaning — the finance-semantic layer

Money isn't just a number; its *meaning* must read instantly and survive colorblindness, dark mode, and small sizes. The product needs to distinguish these seven meanings. The **meanings are fixed; how you express them — color values, and whether color is even the right primary signal — is open** (within §8's accessibility rules):

| Meaning | What it is | Typically seen in |
|---|---|---|
| `income` | Money in (salary, refunds, positive flow) | transactions, cashflow, reports |
| `expense` | Money out (spending, negative flow) | transactions, category breakdowns |
| `transfer` | Internal movement between own accounts — neutral, *not* spending | transactions, account moves |
| `saved` | Money set aside / envelope-funded / emergency fund | savers, envelopes, readiness |
| `debt` | Owed balances, debt progress | debt cards, snowball, net-worth |
| `warning` | Attention needed — overdraft risk, overspent envelope, bill due | banners, badges, risk indicators |
| `projected` | Estimated / future / not-yet-real | forecasts, payoff dates, what-ifs |

Constraints on however you express these:

- **Never meaning by color alone** — pair with sign (`+`/`−`), icon, label, or form. Must survive greyscale and common red-green deficiencies (WCAG 1.4.1; also colorblind users).
- **`projected` must read as "not real yet"** — it often sits beside a solid actual value, so the actual-vs-projected distinction has to be obvious at a glance.
- **`transfer` is deliberately neutral** — a transfer between the owner's own accounts must not read as spending.
- **`warning` is concern, not panic** — reserve any louder/critical treatment for genuine risk (overdraft).

This is the highest-leverage craft problem in the system, so it's a good place to **show options.**

---

## 5. What the app must surface (capability & data inventory)

The complete set of jobs-to-be-done and the data each needs. **This is raw material, shown in its current V1-derived organisation for reference only.** Re-architect freely — merge, split, re-sequence, rename, or replace the navigation model entirely. The route names and groupings below are *not* a prescription.

> The grouping into Glance / Manage / Analyze is just *one* lens — question it.

**Glance — answer a question fast**

| (V1 route) | Job | Data it needs |
|---|---|---|
| `/` Dashboard | At-a-glance financial health | spending balance, envelope summary, upcoming bills, next BNPL payment, debt total, cash-flow sparkline + overdraft risk, sync status |
| `/login` | Passkey sign-in + recovery | passkey prompt, recovery-code entry |

**Manage — dense, interactive, edited often**

| (V1 route) | Job | Data it needs |
|---|---|---|
| `/accounts` | Envelope budgeting | per-saver balance vs allocation, role badges, emergency-fund card, allocate/transfer |
| `/transactions` | Ledger + management | filterable/paginated list, category/tag editing, link-to-purchase, mark salary/transfer, apply rules |
| `/debts` | Debt tracking + snowball | debt cards, balances, snowball/avalanche projection, payoff timeline, what-if extra payment, fee schedule |
| `/installments` | BNPL / Afterpay | active plans, installment progress, next due dates, totals remaining |
| `/recurring` | Bills & subscriptions | active / paused / suggested, bill vs subscription, next-expected dates, monthly cost summary |
| `/purchases` | Wishlist + purchased | wishlist priority, target price/date, purchased linkage |
| `/settings` | Configuration | budget/debt/purchase settings, match-rule editor, sync cadence |
| `/sync` | Sync + activity | manual sync triggers, job-run history, event/activity log, token health |

**Analyze — chart- and number-heavy, read more than edited**

| (V1 route) | Job | Data it needs |
|---|---|---|
| `/reports/monthly · /yearly · /financial-year` | Period reports | cashflow, category breakdown, YoY, insights |
| `/reports/analytics` | Analytics hub | budget health score, performance, envelope alignment, tag summary, emergency-fund readiness, behavioral patterns |
| `/scenarios` | What-if planning | debt-payoff / salary-change / expense-change simulators, cash-flow forecast (30/60/90) |
| `/2up` | Historical joint account | imported ledger, per-contributor + category breakdown, 50/50 split view |

Open questions worth your opinion (examples, not limits): Should this be 14 destinations or fewer, with more on each? Is a sidebar the right model, or something else? Does the dashboard aggregate the others, or stand apart? How does a dense ledger want to behave on a phone? Where do edit actions live — inline, sheet, popover? Treat these as starting provocations.

> **More capabilities since the first draft:** the inventory above has grown — net worth & assets, goal/saver confidence, spending heatmap + streaks, auto-insights, recurring price-drift/overlap/cost-per-use, credit-card utilisation, an AU tax-time view, a configurable dashboard, a command palette, a money-flow diagram, and forecast confidence bands are all now **committed scope**. They're specified in **Appendix A** and must be placed in your IA.

---

## 6. The jobs the components do (composition is open)

V1 named these component roles. Treat this as a **checklist of jobs the UI must perform**, not a prescribed set — re-compose, rename, merge, or split as your design wants. `packages/ui` will still be a tokenized, accessible library; its internal shape is yours.

**Primitive-level needs** (V1 leaned on Radix + CVA — keep, swap, or extend): buttons, cards, dialogs, sheets, selects, tabs, tables, inputs, switches, sliders, badges, progress, skeletons, alerts, popovers. For whatever set you land on: specify anatomy, token mapping, and all states (default / hover / focus-visible / active / disabled / selected / error). Focus-visible is branded to Up orange.

**Finance-level jobs** — the domain layer, where the system earns its keep:

- **Render money** (the atom) — sign-, meaning-, and tabular-aware currency. Everything downstream depends on this reading perfectly; it deserves options.
- **Summarise a stat** — labelled big number + secondary trend.
- **Show an envelope's state** — balance vs allocation, role, funded/overspent.
- **Show debt paydown** — paid vs remaining, trajectory.
- **Show installment progress** — N-of-M, next due.
- **A ledger row** — the workhorse; scannable, editable, phone-survivable.
- **Cashflow over time** — including the `projected` forward portion.
- **Category breakdown** — proportional spend (uses the data-viz palette).
- **Sync status** — healthy / syncing / failed / token-unhealthy.
- **A rule builder** — dense condition/action form for match rules.
- **Empty / loading / suggested states** — these are everyday states, not edge cases; design them.
- **A readiness gauge** — emergency-fund / budget-health score.
- **Upcoming bills** — near-term dues with dates and amounts.

How these decompose into actual components, and how they sit together on a screen, is exactly the kind of thing to re-imagine.

---

## 7. Token taxonomy to deliver

Once a direction is chosen:

- **Color** — neutral ramps (light + dark), brand layer anchored on Up orange, the finance-semantic layer (§4), and a colorblind-safe **data-viz series palette** that degrades gracefully as series grow. V1 used ad-hoc chart colors; we want a real, ordered palette.
- **Typography** — a scale with named roles, weights, line-heights. **Tabular figures for all money and aligned columns** is a requirement; the family and the rest of the scale are open (Geist is the current working family — change it if you have a reason).
- **Spacing & radius** — consistent scales; a clear stance on corner-radius given the warm brand.
- **Elevation** — a small intentional set that also works in dark mode (where shadow is weak — say how you signal depth there).
- **Motion** — one coherent language: durations, easings, and the patterns for sheets/dialogs/popovers and chart/number transitions. Respect `prefers-reduced-motion`.

All of these are open to your judgement — the only fixed thread running through them is accessibility (§8).

---

## 8. Accessibility constraints — non-negotiable

These hold regardless of direction:

- **WCAG AA** for all text and meaningful UI, in **both** light and dark.
- **Dark mode is a peer**, designed deliberately — not a careless inversion.
- **Tabular figures** wherever numbers align.
- **Colorblind-safe** data-viz and finance semantics; **never color alone** to convey meaning.
- **Keyboard navigable**, with visible **focus-visible** rings branded Up orange.
- **Responsive mobile → desktop** — both are used daily; dense data must survive a phone width.
- Baked into tokens/components, not retrofitted.

---

## 9. Technical delivery format

So the system drops into `packages/ui` cleanly:

- **Tokens as CSS variables**, structured for **Tailwind v4 CSS-first `@theme`** (the app is Tailwind v4, React 19). Provide full light (`:root`) and dark variable sets. Modern, ramp-friendly color space preferred (OKLCH; HEX/HSL fine), keeping Up orange mapped as the anchor accent.
- **Component specs** authored so they map to **Radix + CVA**-style variants/sizes (or your proposed structure), with anatomy + states.
- **Mockups / reference markup welcome** as communication — especially for the option-driven decisions (§2). The contract deliverable is values + visual decisions, not feature logic.
- **Data-viz palette** as an ordered token list plus usage rules.

---

## 10. Design direction — provocations, fully open

The plan deliberately left the *feel* open, and per §0 so is the structure. This section is **provocation, not mandate** — bring a point of view, propose alternatives, disagree.

Aspirations to react to:

- **Calm, trustworthy, steady** — confidence and clarity over excitement; quiet by default, loud only where risk is real.
- **Warm, because the brand is warm** — Up Sunset Orange is a friendly coral, not corporate blue. Let it feel human.
- **Effortlessly legible at a glance** — the two-second "am I okay?" read is the whole game.
- **Distinctive, not template-y** — have an opinion; a memorable, considered finance aesthetic.

Anti-patterns to avoid:

- Generic AI/SaaS-admin look: flat grey cards, default-shadcn-out-of-the-box, purple-gradient hero energy, emoji-as-design.
- Gamified anxiety: aggressive reds, alarmist badges, dopamine confetti around money.
- Decoration that fights legibility: low-contrast greys on money, color-only meaning, cramped tables.
- A dark mode that's just inverted light mode with muddy semantics.

Use Up's own brand warmth as a touchpoint, then make it yours — and show the owner a couple of ways it could go.

---

## 11. Open vs fixed — quick reference

| Fixed (the holdover) | Open — propose, with options |
|---|---|
| Up orange `#ff705c` as the anchor accent | How/where Up orange is deployed |
| WCAG AA, colorblind-safe, first-class dark mode | Neutrals & all ramps, finance-semantic values, data-viz palette |
| Tabular figures for aligned money | Type scale & family |
| The *capabilities & data* the app must surface (§5) | Information architecture, screen set, grouping, order, navigation model |
| The *jobs* the UI must perform (§6) | Component decomposition, naming, composition, interaction |
| — | Spacing, radius, elevation, motion |
| — | Layout, where elements live, how they sit and interact |
| Up Yellow `#ffee52` / near-black `#1a1a1c` exist in the brand | Whether & how to use them — and everything else |

The owner confirms the final design. Nothing in the "Open" column is settled until they've chosen from your options.

---

## 12. How this plugs back in

When you return directions, the owner picks one (or a blend); you deliver the full system; we then update `PLAN-V2.md` §9/§10 with the final IA, tokens, and components, build `packages/ui`, and refine the UI tasks in Phases 3–7. **Feature logic doesn't change — only its presentation does.** The plan already anticipates this loop (it expects §9/§10 to be rewritten once the design lands), so structural redesigns are welcome, not disruptive. Until the system arrives, the build runs on placeholder tokens, so nothing is blocked — take the room to get it right, and to show options.

---

## Appendix A — Committed capabilities from the competitor scan

> **Status changed — these are now scope, not a menu.** These started as optional inspiration from another personal-finance app ([comma.finance](https://comma.finance/)) and have since been **promoted to committed scope** in the implementation plan (`PLAN-V2.md` §4 schema, §9 inventory, and Phases 1–8). Treat them as **features that must exist and need a home in the design.** What's fixed is the *capability and its data*; the *visual and IA expression remains yours*, under the same rules as the rest of this brief — Up-orange anchor (§3), finance semantics (§4), accessibility (§8), and the anti-patterns (§10). Design your own expression: distinctive, not derivative; calm, never gamified. (Their gambling features remain excluded.)

For each: the job, where it could live, and what's **fixed** vs **open**.

- **Net worth & assets** *(new surface)* — the owner enters manual assets (investments, Super, property, …); the app shows total net worth (bank + assets − debts) and its trend over time. **Fixed:** capability + data. **Open:** standalone screen vs dashboard section vs both, and the whole visual treatment (a restrained, trustworthy chart likely beats a gimmick).
- **Goal / saver confidence** — every saver allocation and purchase goal shows a *likelihood-of-reaching-it* signal alongside progress. **Fixed:** the dual signal. **Open:** the visual language for "on track / at risk / off track" — not color-only, not alarmist.
- **Spending heatmap + no-spend streaks** — analytics surface: a calendar of daily spend with auto-labels (payday, bill day) and zero-spend days, plus a quiet streak indicator. **Fixed:** the analytics. **Open:** the visualization (data-viz palette, AA both modes; streaks = encouragement, not a dopamine mechanic).
- **Auto-insight cards** — short, plain-language observations surfaced as cards across analytics. **Fixed:** that insights exist. **Open:** the card pattern and tone (helpful, never nagging).
- **Recurring-spend intelligence** — the bills/subscriptions surface must show **price-drift alerts** (a charge went up), **overlap/duplicate warnings** (two services in one category), and **cost-per-use**. **Fixed:** these signals. **Open:** how they're visualised (an "orbit" is one idea; calm + legible is the requirement; brand logos can aid recognition).
- **Credit-card utilisation** — debt cards show balance-vs-limit utilisation. **Fixed:** the metric. **Open:** the indicator (high utilisation is concern, not alarm — mind the `warning` semantics).
- **Tax-time view** — a surface for AU tax-deductible totals and an estimated deduction/refund; transactions can be flagged deductible. **Fixed:** the capability. **Open:** placement (own view, under reports, or settings-adjacent) and treatment.
- **Cash-flow forecast with confidence bands** — the 30/60/90 forecast shows a widening uncertainty band further out. **Fixed:** the band. **Open:** the chart styling (the `projected` semantic from §4 applies).
- **Money-flow diagram** — an animated flow of income → categories → savings as a cash-flow centrepiece. **Fixed:** in scope as a chart. **Open:** dashboard hero vs reports element vs both, and full styling (respect `income`/`expense`/`transfer`/`saved` + colorblind-safe).
- **Named health state + month-over-month framing** — the dashboard expresses health as a small, calm spectrum of **named states** (not a bare score); reports carry **month-over-month deltas**. **Fixed:** named-state framing + deltas. **Open:** the visual language (concern, not red-panic).
- **Configurable dashboard** — the glance-screen is owner-arrangeable from a widget set, with a strong default. **Fixed:** configurability + persistence. **Open:** the widget catalogue, the default layout, and the editing UX — and weigh editability against protecting the two-second "am I okay?" read.
- **Command palette (Cmd/Ctrl-K)** — keyboard-first search / navigate / act across the app. **Fixed:** it exists. **Open:** its design and scope.

**Still genuinely optional** (polish, not committed): small **trend arrows / sparklines** on key stats, and any **playful metaphor** for net worth (e.g. terrain) — adopt only if it serves legibility and the calm register.

---

## Appendix B — IA gaps surfaced in reconciliation (round-3 questions) · ✓ RESOLVED

> **Status: ✓ RESOLVED in round 3 (2026-06-02).** Claude Design returned answers + surfaces in `design_handoff_round3_ia/` (visual source of truth: `screens/round3.jsx`), reconciled into `PLAN-V2.md` §9.0/§9.1/§9.2. In brief: **B1** Settings = a full surface launched from the gear (+ ⌘K), *not* a sixth rail room; **B2** Sync & activity = a section inside Settings with **Runs** + **Activity** tabs (incl. 401 → Reconnect); **B3** 2Up = a read-only Analyze sub-surface — Overview + explorable Ledger with per-contributor analytics. No new tokens. *(Original questions preserved below for the record.)*

### B1 — Settings needs a real home
The system distributes feature config into rooms (match-rule builder → Money, tax → Analyze) and shows a gear in the rail footer, but **no Settings surface is specified.** The owner confirms a proper Settings destination is required. It must hold: account/profile, **sync cadence & connection** (Up token health, reconnect), budget/debt/purchase preferences, tax settings, data export (encrypted DB export + report PDF/CSV), and the **Sync & activity** view (B2).
- **Question:** is Settings a **6th rail room**, or a **full surface reached via the gear** (and ⌘K)? Your IA kept the rail at five "so it survives a phone," which argues against a sixth — but Settings is too heavy for a status-only gear popover. We'd like your recommendation **and** a layout.
- **✓ Resolved:** a **full surface reached via the gear (+ ⌘K)** — not a sixth room; the rail stays five (phone via avatar/overflow). 230px sub-nav (Account · Connections & sync · Budgeting & goals · Debts & purchases · Tax · Data & export · Sync & activity) + content pane. See `SettingsSurface` in `round3.jsx`.

### B2 — Sync & activity (the "what happened" surface)
The shell surfaces sync *status* (top-bar pill, `Sync status`) but not the activity itself. We need a full surface: manual sync trigger, **job-run history** (machine ledger: sync/fees/detect/backup runs — status, counts, errors, timing), the **event/activity log** (user-facing actions), and **token health** (Up `401` → "reconnect bank"). Likely lives inside Settings (B1). Compose from existing components (`Sync status`, Table, Badge, Alert) — confirm the layout and whether the activity log earns its own tab.
- **✓ Resolved:** inside Settings, **two tabs — Runs** (machine `job_runs`: Job · Status · Result · Duration · When, incl. token-expired 401 → Reconnect) and **Activity** (plain-language `event_log`); header "Sync now" + health pill + last-sync. See `SyncRuns` / `SyncActivity` in `round3.jsx`.

### B3 — 2Up historical joint account — placement is fine; depth is the ask
The owner agrees 2Up is a **sub-surface, not a room** (a closed, historical, read-only account), with **Analyze** the natural parent. **But it must not be a stripped read-only view** — it's critical and must tell a very clear story. Required:
- A **first-class explorable ledger**: search + filter transactions (by person, category, merchant, date, amount) — the same Ledger-row quality as Money.
- **Per-contributor analytics — the heart of it:** **who put money *in*** (contributions by person), **who spent money *out* and where** (spending by person × merchant/category), and **money-in vs money-out per person** — alongside the existing per-contributor + category breakdown and 50/50 split.
- **Question:** confirm the Analyze sub-surface placement and design 2Up to carry this depth — a clear two-person, money-in-vs-out, where-did-it-go view — reusing `Money`, Ledger row, Category donut, Stat, and the split components.
- **✓ Resolved:** an Analyze sub-surface — **Overview** (in/spent/distributed · money-in-vs-out per person · who-contributed split + rhythm · who-spent-where) + explorable **Ledger** (search + Person/Category/Date/Amount filters, contributor-attributed rows). Person identity `--viz-2`/`--viz-4`; strictly read-only. See `TwoUpOverview` / `TwoUpLedger` in `round3.jsx`.

**Deliverable — ✓ delivered (`design_handoff_round3_ia/`):** the IA recommendation (Settings = gear surface) + surface designs for **Settings**, **Sync & activity**, and the **2Up** sub-surface, in the existing token/component language. Reconciled into `PLAN-V2.md` §9. Everything else in the system stands.

---

## Appendix C — Iconography (new request)

> **Status: new request for Claude Design.** Same system, same token contract — **no new colour tokens** (icons resolve to `currentColor` / existing tokens). Two deliverables: **C1** the Upshot brand mark (the immediate need — repo + container), and **C2** the formalized UI icon set the app already leans on. Carry forward the warm, calm, editorial identity; Up Sunset Orange `#ff705c` stays the anchor; accessibility rules (§8) still bind.

### C1 — Brand mark / app logo *(the "at minimum" need)*
We need a mark for the **GitHub repo** (avatar + social preview) and the **Docker / GHCR container image**. These share one mark, so design **one brand mark** that exports cleanly everywhere it lives.
- **Anchor / starting point:** the nascent mark already in the rail — a coral gradient squircle (`radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)`, soft-rounded). Evolve it into a real, memorable mark (an "Upshot"/upward motif fits the name and the calm-confidence tone), or propose alternatives — but keep Up orange the anchor.
- **Must survive every size:** legible from **1024px** (app icon / social preview) down to a **16px favicon** — so it likely needs a **simplified standalone glyph** for tiny sizes alongside the full mark. Square master + safe area.
- **Light, dark, and on-tile:** reads on light, on dark, and as its own app tile (on a gradient or neutral — specify which).
- **Wordmark:** an "Upshot" wordmark in the system family (Figtree) + lockups (horizontal, stacked, mark-only).
- **Concrete exports to deliver** (master **SVG** +):
  - GitHub — **social preview 1280×640** (mark + wordmark) and a **square avatar ≥512×512**.
  - Docker/GHCR — **square logo** (512×512 PNG + SVG) for the registry.
  - App/PWA/web — **512 & 192** (standard + **maskable**), **180** apple-touch, **favicon 32/16** (or an SVG favicon), and a **monochrome** variant.
- **Question:** one mark, or a small family (full logo + small-size glyph)? Recommend.

### C2 — UI icon system *(the broader iconography)*
The app already references a named line-icon set (`UIcon` in the delivered JSX). Formalize it.
- **Style:** define stroke weight, grid (e.g. 24px), corner radius, terminals, optical sizing — **rounded and friendly**, matching the warm editorial system (not sharp/technical). Active state = heavier stroke + coral (the rail already does ~`1.9` active / `1.6` rest).
- **Approach — recommend one:** (a) adopt a quality open set re-skinned to the style (e.g. Lucide / Phosphor — note the license) with a few **custom finance glyphs**, or (b) a fully bespoke set. State the trade-off.
- **Working set to cover** (pulled from the references — extend as needed):
  - **Rooms:** `today` · `ledger` (Money) · `wallet` (Budget) · `plan` · `look` (Analyze)
  - **Chrome:** `gear`/settings · `search` · `bell` · `sync` · ⌘K affordance · avatar
  - **Settings nav:** `home` · `card` · `percent` · `link` · `clock`
  - **Actions / activity:** `flag` (deductible) · `pause` · `tag` · `swap` (transfer) · `repeat` (recurring) · `shield` (backup) · `trend` · `filter` · `chevron`/`arrowR`/`down` · `scale` (split/settle)
  - **Finance-semantic marks:** direction/affordance glyphs for income/expense/transfer/saved/debt — they **reinforce** the sign + colour, never the sole signal.
- **Delivery:** per-icon **SVG on a 24px grid**, `currentColor`-driven (inherit token colours), named to match the existing `UIcon` names so they drop into `packages/ui`; plus an index/sprite. Decorative icons `aria-hidden`; icon-only controls keep their labels (per the component spec). Any animated icon (e.g. the sync spinner) honours `prefers-reduced-motion`.

**Deliverable summary:** the brand mark + its exports (C1) and the formalized UI icon set + delivery (C2), in the existing token/component language — **no new colour tokens.**
