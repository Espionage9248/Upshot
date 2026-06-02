# Upshot — Brand assets

Generated from the approved **“Apex”** mark (Appendix C / C1). The mark uses the existing rail
gradient — **no new colour tokens**. See `Upshot Brand & Iconography.html` for the full spec, lockups,
icon system (C2), and rationale.

## Mark family
- **Full mark** — gradient squircle + upward sweep arriving at a point. Use ≥ 32px.
- **Small glyph** — heavier stroke + larger dot on a tighter tile. Use ≤ 16px (favicon).

## Files

### `svg/` (masters — scale to anything)
| File | Use |
|---|---|
| `mark.svg` | full mark, rounded tile (transparent corners) |
| `mark-maskable.svg` | full-bleed tile (PWA maskable / iOS / circle-crop avatars) |
| `favicon.svg` | bold small-size glyph on a tighter tile |
| `glyph-mono.svg` | `currentColor` glyph, no tile — flat/monochrome contexts |
| `lockup-horizontal.svg` | mark + “Upshot” wordmark (Figtree 800) |
| `social-preview.svg` | 1280×640 GitHub social card |

### `png/` (raster exports)
| File | Where it goes |
|---|---|
| `icon-512.png`, `icon-192.png` | PWA / web app icon (standard, transparent corners) |
| `maskable-512.png` | PWA maskable icon (full-bleed, glyph in safe zone) |
| `apple-touch-180.png` | `apple-touch-icon` (full-bleed; iOS rounds it) |
| `favicon-32.png`, `favicon-16.png` | browser favicons (simplified glyph) |
| `avatar-512.png` | GitHub org/repo avatar (full-bleed; survives circle crop) |
| `ghcr-512.png` | Docker / GHCR registry logo (rounded app-icon look) |
| `social-preview-1280x640.png` | GitHub repo **Settings → Social preview** |

## Notes
- The squircle **gradient tile is the identity** — it reads on light and dark unmodified.
- **Wordmark = Figtree 800, −0.03em.** The SVG masters reference Figtree; the social PNG was rasterised
  in a sandbox — if the wordmark didn't pick up Figtree exactly, re-export `social-preview.svg` /
  `lockup-horizontal.svg` from any browser with Figtree available for a pixel-exact wordmark.
- **Favicon `.ico`:** combine `favicon-16/32.png` (e.g. with ImageMagick `convert`) or ship `favicon.svg`
  directly (modern browsers accept SVG favicons).
- Icons (C2): per-icon 24px SVGs, `currentColor`, named to match `UIcon` — see the spec page §C2.
