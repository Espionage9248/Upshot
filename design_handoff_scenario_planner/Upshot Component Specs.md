# Upshot V2 — Component Specs

Companion to **`ds/tokens.css`** (token contract) and **`Upshot Design System.html`** (live, light + dark reference). This document is the written hand-off: anatomy, token mapping, variants/sizes, and every state, authored to map onto **Radix UI primitives + CVA** variants.

> Feature logic is settled — this governs *presentation only*. Where a component wraps a Radix primitive, keep Radix's accessibility behaviour (focus trap, roving tabindex, `aria-*`, escape/dismiss) and style the parts.

---

## 0. Conventions

- **Library:** `packages/ui`. Primitives in `src/primitives/`, finance/domain in `src/finance/`, tokens in `src/tokens/`.
- **Variants:** every component is a `cva()` base + `variants` + `defaultVariants`. Prop names below are the CVA keys.
- **Tokens:** components reference CSS variables only — never raw colour. Names below match `tokens.css`.
- **States (interactive):** `default · hover · focus-visible · active · disabled · selected · error`. **`focus-visible` is always `--focus` (Up orange), 2px, 2px offset** — in both modes.
- **Density:** controls are 38px tall at `md`; touch targets never below 44px (use `lg` on touch).
- **Numbers:** anything that aligns in a column uses `--font-mono` + `.tnum`.

---

## 1. Foundations (summary)

| Group | Tokens | Notes |
|---|---|---|
| Neutrals | `--n-0 … --n-900`, `--bg --surface --surface-2 --surface-3 --line --line-soft --text --text-2 --text-3` | Authored per mode. Light = warm paper, dark = warm charcoal. |
| Brand | `--coral --coral-text --coral-dim --on-coral --yellow --focus` | `--coral` is the only accent. `--coral-text` is the AA-safe text variant per mode; `--on-coral` rides on coral fills. |
| Finance | `--income --expense --transfer --saved --debt --warn --proj` | Meaning **never by colour alone** — always + sign + icon/label. |
| Data-viz | `--viz-1 … --viz-7` | Ordered; `--viz-1` = coral = "actual". Past 7 series → group tail as "Other". |
| Type | `--font-sans --font-mono`, `--text-*` roles | Figtree + JetBrains Mono. Tabular money mandatory. |
| Spacing | 4px base (`--spacing`) | 2/4/6/8/12/16/20/24/32/40/48/64. |
| Radius | `--radius-data 9 · --radius-sm 6 · --radius-card 18 · --radius-pill` | Soft containers, crisp data. |
| Elevation | `--elev-1/2/3/-pop` | Light = real shadow. Dark = lighter surface + 1px inset top-highlight (shadow is secondary). |
| Motion | `--duration-fast/base/slow`, `--ease-out/-in-out/-spring` | Collapses under `prefers-reduced-motion`. |

---

## 2. Primitives

### Button — `<button>` + `cva`
- **Anatomy:** `[leading icon?] · label · [trailing icon?]`. Icon-only buttons set `aria-label`.
- **variant:** `primary` (`--coral` bg / `--on-coral`) · `secondary` (`--surface-2` / `--text` / `--line` border) · `ghost` (transparent / `--text-2`) · `danger` (`--expense` tint + border).
- **size:** `sm` 32 · `md` 38 · `lg` 44. Radius `--radius-data`.
- **States:** hover = `brightness(1.08)`; active = `translateY(1px)`; focus-visible = `--focus` ring; disabled = `opacity .42`, no pointer; **loading** = leading icon → spinner, `aria-busy`, disabled.

### Input · Select · Textarea — Label + control + `cva(state)`
- **Anatomy:** `label · control · [hint | error]`. Control bg `--surface-2`, 1px `--line`, radius `--radius-data`, 38px.
- **state:** `default · focus` (`--focus` border + 3px `--coral`/22% halo) · `error` (`--expense` border + message) · `disabled` (`opacity .5`).
- **Select** wraps **Radix Select** (trigger matches input metrics; content uses `--elev-pop`). **Money inputs** right-align + `--font-mono`.

### Switch · Slider · Checkbox — Radix Switch / Slider / Checkbox
- **Switch:** 38×22 track; off `--surface-3`, on `--coral`; 18px white thumb; `--ease-out` slide.
- **Slider:** 5px `--surface-3` track, `--coral` range, 16px thumb (2px coral ring, `--elev-1`). Focus ring on thumb.
- **Checkbox:** 18px; checked `--coral` + `--on-coral` tick; indeterminate = coral bar.

### Tabs — Radix Tabs
- Underline style: active = `--text` + 2px `--coral` indicator; rest = `--text-3`. Indicator animates `--duration-base --ease-out`.

### Badge — `cva(tone)`
- Pill, `--radius-data`, 11px/700. `tone` maps to a semantic/neutral colour at 13% fill + 26% border. Used for roles (Bill, Saver), status (Overspent), and `NEW`.

### Progress — Radix Progress
- 6px `--surface-3` track; fill = `--coral` (or a semantic colour in context). Indeterminate = sweeping gradient.

### Skeleton
- `--surface-2`→`--surface-3` shimmer (1.4s, paused under reduced-motion). Match the radius/line-height of the content it replaces.

### Alert — `cva(tone)`
- `[icon] · message · [action?]`. `tone`: `info` (neutral) · `warning` (`--warn`) · `critical` (`--expense`, reserved for real risk). 12% fill + 28% border.

### Dialog · Sheet · Popover — Radix Dialog / Popover
- **Scrim:** low-alpha warm black + 2px backdrop blur.
- **Dialog:** centred, `--radius-card`, `--elev-3`; enter = scale `.96→1` + fade, `--duration-slow --ease-out`.
- **Sheet:** edge-anchored (bottom on phone, right on desktop), drag handle; slide `--duration-slow`.
- **Popover:** `--elev-pop`; fade + 4px rise, `--duration-base`. All trap & restore focus (Radix).

### Card
- `--surface`, 1px `--line`, `--radius-card`, `--elev-1`. Section header = `--text-label` eyebrow. Never put `overflow:auto` height-100% inside — size to content.

### Table
- Header row `--surface-2`, `--text-label` caps. Rows separated by `--line-soft`. Numeric columns right-aligned + `.tnum`. Row hover lifts surface; selected = `--coral-dim` + 2px inset coral edge.

### Tooltip — Radix Tooltip
- `--surface-3` (dark) / `--n-900` text-on-light handled per mode; 12px; 150ms open delay; `--elev-pop`.

---

## 3. Finance components

### Money — the atom · `<Money n kind size weight arrow quiet cents />`
- **kind:** `income · expense · transfer · saved · debt · projected · neutral`.
- **Rendering:** `--font-mono` `.tnum`; **sign always present** (`+ − ~`); colour from `--{kind}`; optional leading direction arrow. `quiet` → `--text` (neutral) for calm glances. `projected` → `--proj` + dashed underline + `~`.
- **Rule:** colour is reinforcement, never the sole signal. `transfer` is neutral and must not read as spend.

### Stat — labelled big number + trend
- `--text-label` label · big `--font-mono` value · secondary trend (Money `delta` or `▲/▼ MoM`). Optional sparkline.

### Envelope — `cva(state: funded | overspent)`
- Row: name + role Badge · `balance / allocation` (mono) · 5px progress. Funded = coral gradient; **overspent** = full-width `--expense` bar + `−$` amount in `--expense`.

### Debt paydown / Installment
- **Debt:** paid (`--saved`) vs remaining (`--debt`) split bar + trajectory spark; pairs with **Utilisation** for cards.
- **Installment:** N-of-M pip row (filled = coral) + "next due" date.

### Ledger row — responsive
- **Desktop grid:** category dot · merchant · category · type Badge · Money · running balance (mono). **Phone:** dot + merchant + Money; type/balance behind an expand. Selected = `--coral-dim` + inset coral edge; hover lifts surface. Inline edit via Popover; categorise via Sheet on phone.

### Cashflow / Forecast — SVG
- Actual line = `--viz-1` (coral); **projected** tail = same hue, dashed; **confidence band** = coral at 12% opacity, widening with horizon. "Today" divider marked. 30/60/90 toggle via Tabs.

### Category breakdown — Donut/bars
- Ordered `--viz-1…7`, top-down by share; centre shows total. Always legended.

### Net-worth trend — SVG
- Assets area (`--saved`, up) + debts area (`--debt`, down) from a baseline; **net line** in `--coral`. Range tabs 3M/6M/1Y/All.

### Money-flow (Sankey)
- income (`--income`) → merged node (`--coral`) → categories (`--expense`) + saved (`--saved`). A **Reports** centrepiece, not the dashboard hero. Motion: links draw in on mount (`--duration-slow`), reduced-motion shows final state.

### Readiness gauge
- Ring (`--surface-3` track + `--saved` arc), centre % + sub. Pairs with **Confidence**.

### Confidence indicator — `level: on | at | off`
- Segmented (`Off track · At risk · On track`) or `compact`. **Never colour-only:** active segment carries a glyph (`✓ / • / ↓`) + label + position. Colours `--income / --warn / --expense`.

### Card utilisation
- Label + % (mono) + 6px bar; colour steps `--income` (<50) → `--debt` (50–80) → `--warn` (>80). 80% marker line. High = concern, not alarm.

### Sync status — `state: healthy | syncing | failed | token`
- Pill: dot + label, semantic colour at 12% fill. `healthy`→`--income`, `syncing`→`--text-3`, `failed`→`--expense`, `token`→`--warn` ("Reconnect bank").

### Rule builder
- Token-chip row: `IF [field] [operator] [value] → [action]`. Chips `--surface-2`/`--line`; the action chip uses `--coral-dim`/`--coral-text`. Add condition = ghost button.

### Insight card
- `[topic icon] · plain-language sentence`. `--surface-2`, `--radius-data`. Icon accent by topic (trend, price-drift = `--warn`). Tone: helpful, never nagging. Dismissible.

### Spending heatmap
- 7-col calendar; intensity = coral mix by daily spend; **zero-spend = dashed empty cell**; payday/bill auto-labels. AA in both modes (don't rely on the lightest steps for meaning — labels carry it).

### Streak indicator
- Flame (`--income`) + count + "best N". Quiet encouragement — no confetti, no escalating colour.

### Upcoming bills
- Day-count chip (`--warn` tint if ≤2 days) · name/sub · `projected` Money.

### Command palette (⌘K)
- Radix Dialog + list. Search field (mono hint) → grouped results: **Top result · Transactions · Actions · Go to**. Active row `--coral-dim`. Footer: `↑↓ navigate · ⏎ select · ⌘1–5 room · esc`. Actions are first-class (flag deductible, pause sub, mark transfer).

### Empty / Loading / Suggested — everyday states
- **Empty:** dashed `--line` well + icon + one-line guidance + optional CTA.
- **Loading:** Skeletons matched to final layout.
- **Suggested:** dashed-border card with a subtle coral tint + "Add" / "Dismiss".

---

## 4. Accessibility checklist (per component)

- [ ] Text & meaningful UI ≥ WCAG AA in **both** modes.
- [ ] No meaning by colour alone (sign/icon/label present).
- [ ] Visible `--focus` ring on every focusable part.
- [ ] Keyboard operable (Radix behaviours intact); logical tab order.
- [ ] Tabular figures on aligned numbers.
- [ ] Hit target ≥ 44px on touch.
- [ ] Motion honours `prefers-reduced-motion`.
- [ ] Survives a 360px phone width (dense tables collapse, don't clip).
