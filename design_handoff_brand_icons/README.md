# Handoff: Upshot V2 — Brand mark &amp; Iconography (Appendix C)

> **Addendum to the main Upshot design system** (`design_handoff_upshot/`). Same token contract —
> **no new colour tokens.** Two deliverables: **C1** the brand mark (repo + container) and **C2** the
> formalised UI icon set. Approved direction: mark **“Apex”**, icon base **Lucide**.
>
> **View:** open `Upshot Brand & Iconography.html` (full spec + lockups + icon system, light/dark toggle).

---

## C1 — Brand mark “Apex”

A confident upward sweep arriving at a point (“the upshot”), reversed out of the existing rail gradient.
**It is a small family, not one file:** the full gradient-tile mark for ≥ 32px, and a simplified glyph for ≤ 16px.

### Assets — `brand/`
- **`brand/svg/`** — masters (scale to anything): `mark.svg`, `mark-maskable.svg`, `favicon.svg`,
  `glyph-mono.svg`, `lockup-horizontal.svg`, `social-preview.svg`.
- **`brand/png/`** — `icon-512/192`, `maskable-512`, `apple-touch-180`, `favicon-32/16`, `avatar-512`,
  `ghcr-512`, `social-preview-1280x640`.
- **`brand/README.md`** — per-file placement (PWA, iOS, GitHub avatar + social preview, GHCR, favicons).

### Wiring
- GitHub: repo **Settings → Social preview** = `social-preview-1280x640.png`; org/repo avatar = `avatar-512.png`.
- Docker/GHCR: registry logo = `ghcr-512.png` (+ `mark.svg`).
- Web/PWA: `icon-512/192`, `maskable-512`, `apple-touch-180`, `favicon-16/32` (or ship `favicon.svg`).
- The gradient tile is the identity — it reads on light and dark unmodified. **No new tokens** (it's the rail gradient).
- Wordmark = **Figtree 800, −0.03em**. The wordmark PNGs were rasterised in a sandbox — re-export
  `social-preview.svg` / `lockup-horizontal.svg` from a browser with Figtree for a pixel-exact wordmark.

---

## C2 — UI icon system (Lucide, re-skinned)

Formalises the `UIcon` line set the app already uses.

- **Base: [Lucide](https://lucide.dev).** 24px grid, rounded — the family the current `UIcon` paths already echo.
  Re-skin to spec: **stroke 1.6 rest / 1.9 + coral active**, round caps & joins, optical sizes 16/18/21/24.
- **Add custom finance glyphs** for the semantic marks (income/expense/transfer/saved/debt direction),
  `scale` (split/settle), and any Up-specific needs.
- **Delivery:** per-icon **24px SVG**, `currentColor` (inherits tokens), **named to match `UIcon` keys** so they
  drop into `packages/ui`; tree-shakeable index + an SVG sprite. Decorative icons `aria-hidden`; icon-only
  controls keep their `aria-label` (per the component spec). The sync spinner honours `prefers-reduced-motion`.
- Meaning is never carried by an icon's colour alone — it reinforces the sign + label.

### ⚠️ Licensing — required before shipping Lucide
Lucide is distributed under the **ISC License** (it forked Feather, which is **MIT**) — both permissive, but
**attribution must ship in the repo.** To use Lucide you **must**:
1. Include the **Lucide `LICENSE`** file in the repo — e.g. `packages/ui/src/icons/LICENSE` or a top-level
   `THIRD-PARTY-NOTICES` / `NOTICE` file.
2. **Retain the copyright notice** (“Copyright (c) for portions … are held by the Lucide / Feather authors”).
3. If you build from the npm package, `lucide`’s `LICENSE` is already in `node_modules/lucide` — copy it into
   your distributed artifact/`NOTICE` so the attribution travels with the build.
4. Your **own custom finance glyphs** are first-party — license them under the repo’s own licence.

> Net: Lucide is free to use commercially with **no copyleft**, but the ISC/MIT text + copyright line must be
> present in the shipped repo/artifact. Don’t merge the icon set without that file.

---

## Files in this bundle

```
INTEGRATION-PROMPT.md              ← paste into Claude Code (start here)
Upshot Brand & Iconography.html    ← full spec: mark, lockups, icon system (open to view)
brand/svg/*                        ← mark masters (SVG)
brand/png/*                        ← raster exports (favicons, PWA, GitHub, GHCR, social)
brand/README.md                    ← per-file placement guide
```

Tokens and component spec are unchanged — see the main bundle (`design_handoff_upshot/`). **Zero new tokens.**
