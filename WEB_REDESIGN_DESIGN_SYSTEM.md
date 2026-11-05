# MAKAZOH Web Design System — Airbnb-Reference Adaptation

Single source: `apps/web/tailwind.config.ts` (tokens) + `apps/web/app/globals.css` (shared primitive recipes). Reference: `Handoff/MAKAZOH_AIRBNB_DESIGN_REFERENCE_PACK_2026-10-19/DESIGN airbnb.md` — every measured value in that spec is reproduced; the brand accent is MAKAZOH lime, not Airbnb coral.

## 1. Brand & semantic color tokens

| Token | Hex | Use |
|---|---|---|
| `primary.500` | `#84CC16` | CTAs, active states — locked CI |
| `primary.600` | `#65A30D` | Hover/active, text-on-white accents |
| `primary.300/200` | `#A3E635`/`#D9F99D` | Highlights, filter fills |
| `primary.50/100` | `#F7FEE7`/`#ECFCCB` | Selected rows, soft fills |
| `neutral.950` | `#222222` | Primary ink (spec-measured) |
| `neutral.900` | `#111827` | CI text (kept for compat) |
| `neutral.600` | `#6A6A6A`/`#6B7280` | Secondary text |
| `neutral.500` | `#717171` | Meta text, verified icon |
| `neutral.300` | `#DDDDDD` | Search-pill hairline, card borders |
| `neutral.200/150` | `#EBEBEB` | Content hairlines, legal bar |
| `neutral.100` | `#F7F7F7` | Footer band, chip fill `#F2F2F2`, calendar range band |
| `canvas` | `#FFFFFF` | Page background — spec is pure white |
| Semantic: `success` `#2E7D32`, `warning` `#F59E0B`, `error` `#C13515`, `info` `#1D4ED8` | | badges/statuses |

## 2. Typography

- Families: `DM Sans` (Latin, recommended Cereal stand-in) + `Cairo` (Arabic), loaded in `app/layout.tsx` `<head>` via Google Fonts preconnect + stylesheet; fallback stacks unchanged.
- Scale (spec ladder): 11px micro-labels → 12px meta → **14px body/controls** (the dominant size) → 16px UI emphasis → 18–20px titles → 22–26px section/headings (max — no giant hero text).
- Eyebrows: uppercase 10–11px, 500 weight, muted — `.section-title` base.
- Arabic line-height accommodations preserved via `text-ar-title` etc.

## 3. Spacing & rhythm

8px base scale; section rhythm `py-10 sm:py-14`; `.container-page` = `max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8` (spec container).

## 4. Radii (spec-measured)

`2xs 3px` · `xs 6px` · `sm 8px` (inputs/rows) · `md 12px` (content cards) · `lg 14px` · `xl 16px` · **`2xl 20px` (listing photos, hero media — dominant photo radius)** · `3xl 24px` (modals) · **`full 9999px` (pills — CTAs, chips, search capsule)**

## 5. Borders & elevation

- **Hairlines first**: `#DDDDDD` on the floating search pill, `#EBEBEB` on content cards/dividers/legal bar. Content cards are flat (`shadow-none`).
- Shadows reserved for floating chrome: `capsule` (0 1 2 + 0 8 28 rgba(0,0,0,.12) — spec-measured), `pill` (subtle), `search` (focus lift 0 16px/32px), `menu` (dropdowns 0 10px/37px + 0 8px/14px), `modal` (dialogs/drawers), `glow` (lime focus halo on primary).

## 6. Components

- **Buttons** `.btn-primary` (lime pill, pressed glow), `.btn-secondary` (ink), `.btn-ghost`, `.btn-soft` (gray pill), `.btn-danger`, `.btn-outline` — all `rounded-full`, height ladder xs–xl (32–56px), focus-visible double-ring `#FFF 2px + #222 4px` (spec).
- **Inputs** `.input` — 12px radius, `#EBEBEB` hairline, hover `#B0B0B0`, ink focus ring; `.form-field` label/hint/error stack.
- **Cards** `.card` (white + `#EBEBEB` hairline + `rounded-xl`/`2xl` for photos, `shadow-none`), `.panel`, `.section-card`.
- **Chips** `.chip` — `#F2F2F2` unselected, ink-inverted selected (spec pattern).
- **Badges** `.badge` + semantic variants.
- **Nav** — 80px header, ink underline active tab, circular utility controls, pill sign-in/user menu.
- **Search** — `LandingSearchForm` floating segmented capsule (internal `#DDDDDD` dividers, hover segments `#F7F7F7`, circular lime submit, lifts `shadow-search` on focus).
- **ListingCard** — flat, `rounded-2xl` 1:1 photo, white pill badges, heart overlay, 15px semibold title + muted meta + `EGP x / night`.
- **Modals/drawers** — `rounded-3xl`, `shadow-modal`, scrim `bg-ink/60`.
- **Tables/lists** — hairline row dividers, `#F7F7F7` hover fills.

## 7. Interaction states

Hover (subtle fills/underline), active (pressed scale/glow), focus-visible double-ring everywhere, disabled (`neutral-200` fill), loading (spinner + opacity), selected (ink-invert or lime), invalid (error border + message).

## 8. Responsive rules

Breakpoints sm 640 / md 768 / lg 1024 / xl 1280. Search capsule stacks vertically < md into segmented card; category strip scrolls; nav collapses to circular hamburger + drawer; grids 1→2→3→4 cols.

## 9. RTL / Arabic

`dir="rtl"` flips all logical properties; direction-aware utilities (`ms-/me-/ps-/pe-`, `rtl:` variants) used throughout; chevrons/arrows mirrored; Cairo font stack; mixed-language content (EGP amounts, dates) kept LTR-in-RTL. Verified on home/search/host/admin at desktop + 390px width.

## 10. Motion

`transition-standard` 200ms / `ease-standard cubic-bezier(.2,0,0,1)`; `motion-reduce:` guards on transforms; skeletons use pulse with `motion-reduce:animate-none`.
