# Claude Code — integration prompt (Appendix C · Brand &amp; Icons)

Paste into Claude Code with this bundle and the main Upshot design system present in the repo.

---

> **Context.** This bundle (`design_handoff_brand_icons/`) delivers the Upshot **brand mark** (“Apex”) and the
> formalised **UI icon system** (Lucide, re-skinned), in the existing token language — **no new colour tokens.**
> The mark assets are in `brand/` (SVG masters + PNG exports); the full spec is `Upshot Brand & Iconography.html`.
> Read `design_handoff_brand_icons/README.md` first, especially the **Licensing** section.
>
> Work in two phases; don't write code until Phase 1 is reviewed.
>
> ## Phase 1 — Plan (planning only)
> 1. Add a short **Branding & icons** section to `PLAN-V2.md`: the mark is a small family (full mark ≥32px,
>    simplified glyph ≤16px); list where each export lands (GitHub avatar + social preview, GHCR logo, PWA
>    `icon-512/192` + `maskable-512` + `apple-touch-180`, favicons / `favicon.svg`).
> 2. Record the icon decision: **Lucide base, re-skinned** (stroke 1.6 rest / 1.9 + coral active, round terminals,
>    24px grid), **named to match the existing `UIcon` keys**, plus custom finance glyphs.
> 3. **Add a licensing task to the plan and treat it as a blocker:** before Lucide ships, the repo must include
>    the **Lucide `LICENSE` (ISC; Feather portions MIT)** and retain its copyright notice — e.g. in
>    `packages/ui/src/icons/LICENSE` and/or a top-level `THIRD-PARTY-NOTICES` file. No icon merge without it.
> 4. Confirm **no new design tokens** are introduced (mark gradient = the existing rail gradient; icons are
>    `currentColor`). Stop and show me the plan changes.
>
> ## Phase 2 — Implement (after I approve Phase 1)
> 1. **Brand assets:** wire `brand/png` + `brand/svg` into the app/repo:
>    - PWA manifest → `icon-192/512` (purpose `any`) + `maskable-512` (purpose `maskable`); `<link rel="apple-touch-icon">` → `apple-touch-180`; favicons → `favicon-16/32` or `favicon.svg`.
>    - GitHub repo Settings → Social preview = `social-preview-1280x640.png`; avatar = `avatar-512.png`.
>    - GHCR/Docker image label/logo = `ghcr-512.png` (+ `mark.svg`).
>    - If you need a pixel-exact wordmark, re-export `social-preview.svg` / `lockup-horizontal.svg` with Figtree available.
> 2. **Icons:** add the Lucide dependency, build the icon layer in `packages/ui` so components import by the
>    **same names the JSX uses** (`today, ledger, wallet, plan, look, gear, search, bell, sync, command, home,
>    card, percent, link, clock, flag, pause, tag, swap, repeat, shield, trend, filter, arrowR, down, up, scale,
>    plus, check …`). Map each to its Lucide equivalent; build the **custom finance glyphs** where Lucide has no
>    match. Apply the re-skin (active = 1.9 + coral on `--coral-dim`; rest = 1.6 on `--text-3`). Icons are
>    `currentColor`, decorative ones `aria-hidden`, icon-only controls keep `aria-label`; the sync spinner honours
>    `prefers-reduced-motion`.
> 3. **Land the LICENSE file from Phase 1 in the same change** — the icon PR is not complete without it.
> 4. Whenever a brand/icon question arises, consult `Upshot Brand & Iconography.html` and `brand/README.md` — don't invent.
>
> When done, show me: the manifest/head wiring, the icon module, and the location of the Lucide LICENSE in the repo.

---

*The mark uses zero new tokens, and Lucide is permissive (ISC/MIT) with no copyleft — the only hard requirement is that its licence text + copyright travel with the shipped repo/artifact.*
