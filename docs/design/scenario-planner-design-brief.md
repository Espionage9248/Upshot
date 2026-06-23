# Design Brief — Scenario Planner & Locked Debt Payoff

**For:** a design-first pass (Claude Design). **Posture:** this is a *design* problem, not a polish-the-code problem. A functional prototype exists, but treat it as reference for *what the surface must do* — **not** how it should look or how it should be arranged. You have full latitude to restructure the layout, hierarchy, flow, and information architecture. The only fixed inputs are the **data model**, the **set of controls**, and the **brand/design system** (all below).

---

## 1. Context
**Upshot** is a private, single-user personal-finance app (built over the Up Bank API), self-hosted, with a deliberately tactile, data-dense aesthetic anchored on Up's **"Sunset Orange" coral**. This brief covers one feature: the **Scenario Planner**, an inline surface on the **`/plan/debts`** page where the owner models paying off their debts faster, commits to a plan, and tracks it against reality.

## 2. The problem / jobs to be done
One person, their own money, on phone and desktop. The surface has to make these feel effortless and trustworthy:
- *"If I put an extra $X/month toward my debts, when am I debt-free, and how much interest do I save?"*
- *"What if I get a raise, cut a subscription, or drop a lump sum in March?"*
- *"Lock in the plan I like, then each month tell me whether I'm on track, ahead, or slipping."*
- *"Save a few 'what-if' budgets to compare and revisit."*

It should read as a calm, legible **planning instrument** — not a spreadsheet, not a sales funnel. The hardest design job is **clarity under density**: a lot of interrelated inputs and outputs that must never feel like a wall of controls.

## 3. The reality you design *within* (fixed — don't redesign these)
**Data model — two persistence layers (this is the conceptual spine):**
- Exactly one **Locked Plan**: the *real, tracked commitment*. Freezes its projected payoff curve at lock time and measures actual progress against it.
- Any number of **Saved Scenarios**: *hypothetical* "budgets". Store the full tuned inputs, recompute live against current debts whenever opened, and can be **promoted** into the Locked Plan.
- **The "reality line" between these two must be legible at all times.** Users must always feel whether they're playing with a hypothesis or looking at the real, tracked plan. This distinction is the heart of the feature.

**The inputs the planner must expose (the controls are fixed; their arrangement is yours):**
- **Income:** base monthly income (seeded from detected salary) + optional "raise to $X from \<month\>".
- **Expenses:** per-recurring-item keep/cut with editable amounts, plus one "discretionary spend" figure (seeded from a 6-month average). Shows a running total.
- **Payoff strategy:** Snowball / Avalanche / Custom — and in Custom, a **user-defined debt order**.
- **Allocation:** either a "share of headroom → extra/month" (forward mode) **or** a target debt-free month → solved required payment (target-date mode), with a warning when the target is unreachable.
- **Lump sums:** one-off amounts at a chosen month.
- **Outputs:** debt-free month (scenario vs baseline), months saved, interest saved.
- **Actions:** Save as scenario, Lock in debt plan; and on saved items: open / promote / delete; on a locked plan: re-model / unlock.

**Money & numbers:** integer cents only; money has a dedicated, sign-aware treatment with a mono/tabular-number style. Don't introduce decimals-as-floats or a different numeric voice.

## 4. The current build — reference only
A working prototype renders all of the above inline on `/plan/debts`, below the debt list, as three stacked blocks: a **locked-plan status banner** (when locked), the **Scenario Planner** tuner, and a **saved-scenarios list**. It functions end-to-end but was assembled by a code lens — the arrangement, hierarchy, and chart are placeholders. **Do not anchor on it.** Use it only to confirm *what each control does*.

## 5. Open design questions to solve
These are problems to design through, not bugs to patch:
- **One coherent surface from many controls.** Income, expenses, strategy + custom order, allocation, lumps, a live chart, outputs, and actions currently stack into a tall column. What's the right grouping, hierarchy, and progressive disclosure — especially on a phone?
- **Strategy duplication.** The page already has a global debt-strategy control (driving the summary), and the planner needs its own (per-scenario). Two "strategy" selectors on one page is confusing — resolve the IA (merge, nest, relabel, or clearly separate).
- **Forward vs target-date modes** swap a meaningful chunk of UI. How do you make switching feel intentional and keep parity between the two?
- **Custom debt ordering** — what's the right reorder affordance (drag vs explicit controls, with accessibility), and how does it relate to the strategy selector?
- **Seeded values** (income, discretionary spend) feel arbitrary without framing. How do you communicate "we estimated this from your last 6 months — edit it"?
- **Feedback & states** — saving, locking, promoting, unlocking, plus error/empty/first-run states. The flow currently gives no confirmation; design the full state set.
- **The reality line** (§3) — how do hypothetical scenarios vs the tracked locked plan *look and feel* distinct?

## 6. The end-to-end flows to nail
1. **First run / explore** — sensible default state before anything is saved or locked; tune inputs and watch outputs/chart react.
2. **Save a scenario** — name it; it joins the saved list.
3. **Compare** — scan/open multiple saved scenarios (recomputed against current debts).
4. **Lock** — the current tuning (or a saved scenario) becomes the tracked plan; the status banner appears.
5. **Track** — each visit the banner shows ahead / on-track / behind, the gap, slip (e.g. "▲2 mo early"), and a contributions nudge.
6. **Promote** — a saved scenario replaces the locked plan.
7. **Re-model / unlock** — back to tuning.

## 7. The timeline chart
A live chart plotting **total debt balance over months**: a **baseline** curve (no extra), the **scenario** curve (coral), each with a debt-free marker, plus a faint **locked-plan curve** + a "you are here" point when a plan is locked. Design the full treatment — axes, ticks, date labels, markers, the ahead/behind read against the locked curve, hover/inspection if it helps, and a real **360px** layout, plus empty/loading states.

> **Implementation note (so you're not constrained):** you may assume the chart can use lightweight scale/path math (e.g. `d3-scale`/`d3-shape`, or visx if you want interactive tooltips/crosshairs). **But it must render bespoke and token-themed — your design in the app's visual language, not a charting library's default look.**

## 8. Design system & hard constraints
- **Work inside the existing Up-inspired system — do not invent a new visual language.** Anchor colour is **Sunset Orange / coral** (`--coral` ≈ `#ff705c`, with an on-coral text token); a full light/dark token set exists. Numbers use a mono/tabular treatment; money has a dedicated sign-aware component.
- **Reuse existing primitives** where natural: a segmented control (renders as accessible radios), the money component, buttons (primary/secondary/ghost/danger; sm/md/lg), Radix dialog/sheet, and an existing hand-rolled SVG gauge as the in-house chart precedent.
- **Mobile-first / 360px** is a first-class target — this is used on a phone; the dense tuner and the chart both need genuine small-screen designs, not a squeezed desktop.
- **Accessibility:** keyboard + screen-reader support throughout (toggles, slider, reorder).
- **It lives inline on `/plan/debts`**, alongside the debt list and a BNPL summary — it must sit coherently in that page, not feel bolted on.

## 9. What we'd love from you
- Layouts for **every state**: first-run/empty, mid-tuning, forward mode, target-date mode, custom-order active, saved-scenarios list (populated), and the locked-plan banner in each status (ahead / on-track / behind).
- The **timeline chart** treatment (desktop + 360px), with markers, the baseline/scenario/locked read, and empty/loading.
- **Information architecture & hierarchy** for the dense tuner (grouping, disclosure, the strategy-duplication resolution).
- **Mobile reflow** for the whole surface.
- **Microcopy** for seeds, the reality-line distinction, the over-headroom warning, and confirmation/error feedback.

## 10. References (if you have repo access)
- Frozen functional spec: `docs/superpowers/specs/2026-06-21-scenario-planner-payoff-design.md`
- Design system / tokens: `packages/ui/src/styles/tokens.css`; components in `packages/ui/src/`
- The reference prototype: `apps/web/components/plan/{scenario-planner,payoff-chart,locked-plan-banner,saved-scenarios-list}.tsx`, wired in `apps/web/components/plan/debt-dashboard.tsx`
