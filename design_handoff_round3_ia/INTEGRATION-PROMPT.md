# Claude Code — integration prompt (Round 3 / Appendix B)

Paste the following into Claude Code, with this bundle and the main Upshot design system both present in the repo.

---

> **Context.** The Upshot design system (`design_handoff_upshot/`) is the approved, in-flight system, and `PLAN-V2.md` tracks its build. This bundle (`design_handoff_round3_ia/`) resolves the three IA gaps from the brief's Appendix B by adding three surfaces — **Settings**, **Sync & activity**, and **2Up** — in the *same* token contract and component language. **No new tokens are introduced.** The exact visual spec for these surfaces is `design_handoff_round3_ia/screens/round3.jsx`; the existing components it builds on are in `screens/expansion.jsx`. Read `design_handoff_round3_ia/README.md` first.
>
> **Work in two phases. Do not write feature code until Phase 1 is reviewed.**
>
> ## Phase 1 — Reconcile into the plan (planning only)
> 1. There is one real **IA decision** to record: **Settings is a full surface launched from the gear (and ⌘K), not a sixth rail room.** The five-room rail is fixed (phone survivability); on phone, Settings is reached from the avatar/overflow. Update the IA / navigation sections of `PLAN-V2.md` to reflect this, plus: **Sync & activity** is a section inside Settings with two tabs (**Runs** = machine job history, **Activity** = user-facing log); **2Up** is a **read-only sub-surface under Analyze**.
> 2. Add these three surfaces to the plan's surface inventory with their routes (e.g. `/settings`, `/settings/sync-activity`, `/analyze/2up`, `/analyze/2up/ledger`).
> 3. Note in `PLAN-V2.md` that these surfaces introduce **no new design tokens** and that `design_handoff_round3_ia/screens/round3.jsx` is the visual source of truth for them.
> 4. **Stop and show me** the plan changes and any conflicts with the existing plan before implementing.
>
> ## Phase 2 — Implement (after I approve Phase 1)
> Recreate the three surfaces in this codebase's stack, **reusing existing components** and **only** adding the net-new pieces below. Follow `Upshot Component Specs.md` (Radix + CVA) and match the exact styling in `round3.jsx`.
>
> - **Reuse:** `Money`, `Card`, `Stat`, `Badge`, `Tabs`, `Table`, `Switch`, `Utilisation`, `Donut`, `Spark`, the **Sync status** pill, and the rail.
> - **Add (compose existing tokens/primitives only):**
>   - `RailGear` — prefer a `settingsActive` prop on the existing rail (gear highlighted, no room active) over a fork.
>   - `SettingsNav` — vertical settings sub-nav (active = `--coral-dim` + inset coral edge).
>   - `Segmented` — segmented control (Radix ToggleGroup styled as a pill group) for sync cadence.
>   - `ToggleRow` — label + sub + Switch.
>   - `FilterChip` — filter/Select trigger chip (Radix Select trigger) for the 2Up ledger.
>   - 2Up analytics: `ContributorPanel` (in/out bars + net), `SplitBar` (two-person share), `CatSplit` (per-category two-person bars), `Avatar`, and `TUpRow` (ledger row with contributor attribution).
> - **Rules to hold:** no new tokens — everything resolves to `ds/tokens.css`; person identity uses `--viz-2` (Sam) / `--viz-4` (Alex) while money direction stays `income`/`expense` (sign + colour, never person-colour alone); the `401 → reconnect` token-health state must exist in the Runs table and on the Settings connection card; 2Up is strictly read-only; light + dark both ship; preserve focus rings, tabular figures, and reduced-motion.
> - **Whenever a design question arises, consult `round3.jsx` and the component spec — do not invent.**
>
> When the surfaces are built, show me the routes and a screenshot of each in light and dark.

---

*Tip: if `PLAN-V2.md` already has an Appendix-B section, have Claude Code mark those three items resolved and link them to the new routes.*
