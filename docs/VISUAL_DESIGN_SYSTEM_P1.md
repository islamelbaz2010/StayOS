# StayOS — Visual Design System
## Part 1 of 4: Identity · Colors · Typography · Tokens

**Version:** 1.0 | **Status:** Production-Ready | **Builds on:** PRODUCT_EXPERIENCE_DESIGN.md

---

# 1. VISUAL IDENTITY

## 1.1 Brand Personality

Five words that govern every visual decision:

| Word | What it means in the UI |
|------|------------------------|
| **Trusted** | Generous whitespace, no clutter, honest pricing, visible security cues |
| **Modern** | Inter typeface, geometric icons, flat surfaces with purposeful depth |
| **Warm** | Amber accent, photography of real people in real spaces, soft illustration curves |
| **Precise** | Pixel-perfect alignment, consistent 4px grid, zero decorative friction |
| **Scalable** | Every component works at 1 property or 10,000 — density adapts to content |

---

## 1.2 Logo

### Primary Mark

The StayOS logo is a wordmark paired with a geometric icon.

**Icon:** A stylized "S" constructed from two overlapping arcs — the upper arc is a home roof, the lower arc is a map-pin curve. Together they read as both shelter and place.

```
  ╭──╮
 ╱    ╲      ← roof arc (home)
╱  ●   ╲     ← dot center
╲       ╱
 ╲    ╱       ← pin arc (location)
  ╰──╯
```

**Wordmark:** "StayOS" in Inter 700 (Bold). Letter-spacing: -0.5px. The "OS" renders in `#2C5FFF` (brand primary). "Stay" renders in `#111827` (neutral-900) on light backgrounds, `#FFFFFF` on dark.

### Logo Variants

| Variant | Usage | Min Size |
|---------|-------|----------|
| Full horizontal (icon + wordmark) | Top navigation, marketing | 120px wide |
| Icon only | Mobile nav, favicons, app icon | 24px |
| Wordmark only | Footer on dark backgrounds | 100px wide |
| White full (for dark backgrounds) | Hero overlays, email headers | 120px wide |

### Logo Clear Space

Minimum clear space = 1× the icon height on all four sides. No element may enter this zone.

### Logo Don'ts
- Never stretch or distort
- Never recolor the icon except to white for dark contexts
- Never place on a busy photographic background without a frosted scrim
- Never use a font weight other than 700 for the wordmark
- Never add drop shadows, glows, or outlines

---

## 1.3 Brand Personality in Visual Language

### Visual Hierarchy

```
Level 1 — Hero / Page Titles:   56px / 700 weight / tight letter-spacing
Level 2 — Section Headings:     32px / 700 weight
Level 3 — Card Headings:        20px / 600 weight
Level 4 — Body / Descriptions:  16px / 400 weight
Level 5 — Labels / Meta:        12–14px / 500 weight / muted color
```

### Surface Language

StayOS uses a **flat-first, depth-when-needed** approach:
- Default surfaces: pure white `#FFFFFF`, no decorative gradients
- Depth: shadows only (never fake borders pretending to be elevation)
- Brand pops: a single `#2C5FFF` element per screen commands attention
- Photography carries warmth — the UI stays neutral so images breathe

### Tone of Illustration

Illustrations appear only in: empty states, onboarding, error pages, loading states, and marketing.

Style: **Line-geometric + spot color**
- Stroke weight: 1.5px, `#D1D5DB`
- Spot color: `#2C5FFF` or `#F59E0B` — one per illustration only
- No gradients inside illustrations
- Characters: diverse, minimal facial features, warm skin tones
- Objects: property silhouettes, passports, phones, maps — not abstract
- Size on screen: 120–200px tall in empty states, 280px in full-page errors

### Photography Art Direction

| Context | Style | DON'TS |
|---------|-------|--------|
| Property hero images | Golden hour light, wide-angle, room clearly shown, minimal clutter | Stock-looking staged shots, extreme filters |
| Profile avatars | Head-and-shoulders, natural light, neutral background | Heavy editing, formal ID photo style |
| Host photos | Candid, in or near property, smiling, authentic | Corporate headshots |
| City destination cards | Iconic landmark + sky, saturated but not oversaturated | Generic stock cityscapes |
| Marketing banners | Real guests in properties, candid moments, storytelling | Lifestyle model shots that feel fake |

**Photo overlay rule:** When text must appear over photos, apply a gradient scrim: `linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 60%)` — always at the bottom where text lives.

---

## 1.4 Iconography System

**Library:** Lucide Icons (MIT license, consistent 24px grid, 1.5px stroke)  
**Fallback:** Heroicons (same grid)

### Icon Grid

All icons are drawn on a 24×24px grid with:
- 2px padding on all sides (live area: 20×20px)
- 1.5px stroke, round caps, round joins
- No fills unless explicitly a filled variant

### Icon Sizes

| Size | px | Usage |
|------|----|-------|
| `icon-xs` | 12px | Dense table cells, badge icons |
| `icon-sm` | 16px | Button icons (left of label) |
| `icon-md` | 20px | Default inline usage |
| `icon-lg` | 24px | Navigation items, feature icons |
| `icon-xl` | 32px | Empty state accent icons |
| `icon-2xl` | 48px | Feature marketing icons |

### Icon Color Rules

- Inherit text color by default (currentColor)
- Interactive icons on hover: transition to `#2C5FFF`
- Destructive icons: `#EF4444`
- Success indicators: `#10B981`
- Disabled icons: `#D1D5DB`

### Core Icon Set (Required — Must Exist in Design System)

| Category | Icons |
|----------|-------|
| Navigation | home, search, calendar, message-circle, heart, user, bell, menu, x, chevron-right, chevron-left, chevron-down, arrow-left |
| Amenities | wifi, car, utensils, waves, dumbbell, wind, flame, tv, lock, key |
| Actions | plus, edit-2, trash-2, copy, share-2, download, upload, eye, eye-off, filter, sliders |
| Status | check-circle, x-circle, alert-circle, info, clock, shield, shield-check |
| Finance | credit-card, dollar-sign, wallet, trending-up, bar-chart-2, receipt |
| Property | bed, bath, users, map-pin, building-2, home, camera, image |
| Communication | mail, phone, send, flag, star, thumbs-up |

---

## 1.5 Moodboard Description

The StayOS visual atmosphere is built from four reference pillars:

**Pillar 1 — Airbnb's warmth:** Photography-first, generous whitespace, rounded corners on every card, human photography over product photography.

**Pillar 2 — Stripe Dashboard's precision:** Tabular numbers aligned perfectly, data tables with honest information density, status colors that are unmistakable at a glance, monospaced numerals.

**Pillar 3 — Linear's speed:** Dark sidebars (optional), keyboard-first interactions, instant visual feedback, no decorative loading spinners — skeleton states only.

**Pillar 4 — Apple's restraint:** White space is not empty space, typography does most of the heavy lifting, UI chrome recedes so content leads.

**Result:** A platform that feels trustworthy enough to hand over your passport scan, fast enough for a property manager checking 40 units, and beautiful enough that a guest screenshots their confirmation.

---

# 2. COLOR SYSTEM

## 2.1 Full Token Set — Light Mode

### Brand

| Token | Value | Contrast on White | Usage |
|-------|-------|-------------------|-------|
| `--color-brand-50` | `#EEF2FF` | — | Lightest tint, hover bg on ghost elements |
| `--color-brand-100` | `#E0E7FF` | — | Selected state backgrounds |
| `--color-brand-200` | `#C7D2FE` | — | Focus rings (inner) |
| `--color-brand-300` | `#A5B4FC` | — | Decorative accents |
| `--color-brand-400` | `#818CF8` | 3.1:1 | — |
| `--color-brand-500` | `#6366F1` | 4.5:1 | — |
| `--color-brand-600` | `#2C5FFF` | 5.2:1 | **Primary brand — all CTAs** |
| `--color-brand-700` | `#1A3FCC` | 7.4:1 | Hover state of primary button |
| `--color-brand-800` | `#1E3A8A` | 9.8:1 | Active state, pressed |
| `--color-brand-900` | `#1e2d6b` | 12.3:1 | Darkest, text on light blue bg |

### Neutral (Grey Scale)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-neutral-0` | `#FFFFFF` | Cards, modals, page surface |
| `--color-neutral-50` | `#F9FAFB` | Page background |
| `--color-neutral-100` | `#F3F4F6` | Hover background on rows/items |
| `--color-neutral-150` | `#EAECF0` | Skeleton shimmer light |
| `--color-neutral-200` | `#E5E7EB` | Dividers, borders |
| `--color-neutral-300` | `#D1D5DB` | Input borders (default state) |
| `--color-neutral-400` | `#9CA3AF` | Placeholder text |
| `--color-neutral-500` | `#6B7280` | Secondary text, captions |
| `--color-neutral-600` | `#4B5563` | Label text, form helpers |
| `--color-neutral-700` | `#374151` | Body text |
| `--color-neutral-800` | `#1F2937` | Headings (secondary) |
| `--color-neutral-900` | `#111827` | Primary headings, maximum contrast text |

### Semantic — Success

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success-50` | `#ECFDF5` | Success message background |
| `--color-success-100` | `#D1FAE5` | Success badge background |
| `--color-success-500` | `#10B981` | Success icon, checked state |
| `--color-success-600` | `#059669` | Success text on white |
| `--color-success-700` | `#047857` | Success text on light green bg |

### Semantic — Warning

| Token | Value | Usage |
|-------|-------|-------|
| `--color-warning-50` | `#FFFBEB` | Warning message background |
| `--color-warning-100` | `#FEF3C7` | Warning badge background |
| `--color-warning-400` | `#FBBF24` | Warning icon |
| `--color-warning-500` | `#F59E0B` | Warning state, pending indicator |
| `--color-warning-700` | `#B45309` | Warning text (AA compliant on light bg) |

### Semantic — Danger

| Token | Value | Usage |
|-------|-------|-------|
| `--color-danger-50` | `#FFF5F5` | Error input background |
| `--color-danger-100` | `#FEE2E2` | Error badge background |
| `--color-danger-500` | `#EF4444` | Error icon, destructive actions |
| `--color-danger-600` | `#DC2626` | Error button background |
| `--color-danger-700` | `#B91C1C` | Error text on white (AA) |

### Semantic — Info

| Token | Value | Usage |
|-------|-------|-------|
| `--color-info-50` | `#EFF6FF` | Info message background |
| `--color-info-100` | `#DBEAFE` | Info badge background |
| `--color-info-500` | `#3B82F6` | Info icon |
| `--color-info-700` | `#1D4ED8` | Info text on white (AA) |

### Accent — Amber (Warmth / Premium)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent-100` | `#FEF9C3` | Premium badge light |
| `--color-accent-400` | `#FACC15` | Star rating fill |
| `--color-accent-500` | `#EAB308` | Host earnings highlight |
| `--color-accent-600` | `#CA8A04` | Premium text, gold badge text |

### Surface Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--surface-page` | `#F9FAFB` | Page background behind all content |
| `--surface-card` | `#FFFFFF` | Cards, panels, modals |
| `--surface-overlay` | `rgba(0,0,0,0.50)` | Modal backdrops |
| `--surface-sidebar` | `#FFFFFF` | Light sidebar variant |
| `--surface-sidebar-dark` | `#111827` | Dark sidebar variant |
| `--surface-nav` | `#FFFFFF` | Top navigation |
| `--surface-input` | `#FFFFFF` | Form input backgrounds |
| `--surface-input-disabled` | `#F9FAFB` | Disabled inputs |
| `--surface-hover` | `#F3F4F6` | Row/item hover |
| `--surface-selected` | `#EEF2FF` | Sidebar active item |
| `--surface-skeleton` | `linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)` | Skeleton shimmer |

---

## 2.2 Dark Mode Token Set

Dark mode uses the same token names — values shift. Toggled via `data-theme="dark"` on `<html>`.

| Token | Light Value | Dark Value |
|-------|-------------|------------|
| `--surface-page` | `#F9FAFB` | `#0F1117` |
| `--surface-card` | `#FFFFFF` | `#1A1D27` |
| `--surface-sidebar` | `#FFFFFF` | `#13151F` |
| `--surface-nav` | `#FFFFFF` | `#13151F` |
| `--surface-input` | `#FFFFFF` | `#1F2230` |
| `--surface-hover` | `#F3F4F6` | `#252836` |
| `--surface-selected` | `#EEF2FF` | `#1E2D5E` |
| `--color-neutral-900` | `#111827` | `#F9FAFB` |
| `--color-neutral-700` | `#374151` | `#D1D5DB` |
| `--color-neutral-500` | `#6B7280` | `#9CA3AF` |
| `--color-neutral-300` | `#D1D5DB` | `#374151` |
| `--color-neutral-200` | `#E5E7EB` | `#2D3142` |
| `--color-neutral-100` | `#F3F4F6` | `#252836` |
| `--color-brand-600` | `#2C5FFF` | `#4F7BFF` |
| `--color-brand-700` | `#1A3FCC` | `#3D68F5` |
| `--color-success-500` | `#10B981` | `#34D399` |
| `--color-warning-500` | `#F59E0B` | `#FBBF24` |
| `--color-danger-500` | `#EF4444` | `#F87171` |

### Dark Mode Design Rules

1. **Never use pure black** (`#000000`) — use `#0F1117` for page background
2. **Layer darkness** in +7% luminosity steps: page → card → input → elevated
3. **Brand blue shifts lighter** in dark mode to maintain contrast: `#2C5FFF` → `#4F7BFF`
4. **Shadows disappear** in dark mode — use subtle borders (`1px solid rgba(255,255,255,0.06)`) instead
5. **Images dim** to 90% opacity in dark mode: `filter: brightness(0.9)`
6. **Skeleton shimmer** reverses: `#252836` → `#2D3142` → `#252836`

---

## 2.3 Color Application Rules

### The One-Blue Rule
Each screen has exactly one dominant `--color-brand-600` element drawing the eye. This is always the primary CTA button. Secondary blues appear only in links, active states, and focus rings.

### Status Color Application — Never Color Alone
Every status must communicate through three channels simultaneously:

```
● Confirmed   →  green dot  +  "Confirmed" text  +  green bg chip
● Pending     →  amber dot  +  "Pending" text    +  amber bg chip  
● Cancelled   →  gray dot   +  "Cancelled" text  +  gray bg chip
● Disputed    →  red dot    +  "Disputed" text   +  red bg chip
```

### Financial Number Coloring

| Number type | Color | Additional style |
|-------------|-------|-----------------|
| Revenue / positive | `--color-success-600` `#059669` | — |
| Loss / negative | `--color-danger-600` `#DC2626` | — |
| Neutral amount | `--color-neutral-900` | — |
| Platform fee | `--color-neutral-500` | — |
| Tax line | `--color-neutral-500` | — |
| Grand total | `--color-neutral-900` | font-weight: 700 |

---

# 3. TYPOGRAPHY

## 3.1 Font Families

| Language | Primary Font | Fallback Stack | Source |
|----------|-------------|----------------|--------|
| English / LTR | `Inter` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | Google Fonts |
| Arabic / RTL | `Cairo` | `'Tajawal', 'Noto Sans Arabic', sans-serif` | Google Fonts |
| Monospace (code, IDs) | `JetBrains Mono` | `'Fira Code', 'Courier New', monospace` | Google Fonts |

**Loading strategy:** Preconnect to fonts.googleapis.com. Load `Inter` weights 400, 500, 600, 700 — subset to latin. Load `Cairo` weights 400, 600, 700 — subset to arabic. Use `font-display: swap`.

## 3.2 Type Scale — Desktop (≥1024px)

| Token | Size | Weight | Line-height | Letter-spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `type-hero` | 56px | 700 | 1.1 (61.6px) | -1.5px | Landing hero headline |
| `type-display-xl` | 48px | 700 | 1.15 (55.2px) | -1px | Marketing section heads |
| `type-display-lg` | 40px | 700 | 1.2 (48px) | -0.8px | Page titles |
| `type-display-md` | 32px | 700 | 1.25 (40px) | -0.5px | Major section headings |
| `type-display-sm` | 24px | 600 | 1.3 (31.2px) | -0.3px | Card headings, modal titles |
| `type-heading-lg` | 20px | 600 | 1.4 (28px) | -0.2px | Sub-section headings |
| `type-heading-md` | 18px | 600 | 1.4 (25.2px) | -0.1px | Widget titles, form section heads |
| `type-heading-sm` | 16px | 600 | 1.5 (24px) | 0 | Input labels, emphasized text |
| `type-body-xl` | 20px | 400 | 1.6 (32px) | 0 | Lead paragraph, feature descriptions |
| `type-body-lg` | 18px | 400 | 1.6 (28.8px) | 0 | Primary body text |
| `type-body-md` | 16px | 400 | 1.6 (25.6px) | 0 | Default body, descriptions |
| `type-body-sm` | 14px | 400 | 1.5 (21px) | 0 | Secondary info, helper text |
| `type-body-xs` | 13px | 400 | 1.4 (18.2px) | 0 | Dense tables, meta data |
| `type-label-lg` | 16px | 500 | 1.4 (22.4px) | 0 | Button text (large), nav items |
| `type-label-md` | 14px | 500 | 1.4 (19.6px) | 0 | Button text (default), table headers |
| `type-label-sm` | 12px | 500 | 1.3 (15.6px) | 0.2px | Badge text, tags, chip labels |
| `type-caption` | 12px | 400 | 1.4 (16.8px) | 0.1px | Image captions, legal text |
| `type-code` | 13px | 400 | 1.6 | 0 | IDs, reference numbers, code |
| `type-mono-lg` | 24px | 700 | 1 | -0.5px | KPI numbers in dashboards |
| `type-mono-xl` | 36px | 700 | 1 | -1px | Hero metric numbers |

## 3.3 Type Scale — Tablet (768–1023px)

All desktop values reduce by one step. Specifics:

| Token | Desktop | Tablet |
|-------|---------|--------|
| `type-hero` | 56px | 44px |
| `type-display-xl` | 48px | 38px |
| `type-display-lg` | 40px | 32px |
| `type-display-md` | 32px | 28px |
| `type-display-sm` | 24px | 22px |
| `type-body-lg` | 18px | 17px |
| `type-body-md` | 16px | 16px |

All other tokens remain same as desktop.

## 3.4 Type Scale — Mobile (<768px)

| Token | Mobile Value | Weight | Notes |
|-------|-------------|--------|-------|
| `type-hero` | 36px | 700 | Breaks to 2 lines acceptable |
| `type-display-lg` | 28px | 700 | — |
| `type-display-md` | 24px | 700 | — |
| `type-display-sm` | 20px | 600 | — |
| `type-heading-lg` | 18px | 600 | — |
| `type-body-md` | 16px | 400 | Never go below 16px on mobile |
| `type-body-sm` | 14px | 400 | Minimum for non-critical text |
| `type-label-md` | 15px | 500 | Buttons slightly larger on mobile |
| `type-mono-lg` | 20px | 700 | KPI numbers |

**Mobile Typography Rules:**
- Minimum font size on mobile: 14px (no exceptions for interactive text)
- Maximum line length: 75 characters (set `max-width: 65ch` on text blocks)
- 16px minimum on inputs to prevent iOS auto-zoom
- Increase line-height to 1.7 on body text for thumb-scroll readability

## 3.5 Arabic / RTL Typography

| Token (Arabic) | Size | Weight | Line-height | Notes |
|----------------|------|--------|-------------|-------|
| `type-ar-display` | 40px | 700 | 1.4 | Arabic needs more line-height |
| `type-ar-heading` | 24px | 600 | 1.5 | — |
| `type-ar-body` | 16px | 400 | 1.8 | Arabic body needs 1.8 lh |
| `type-ar-label` | 14px | 600 | 1.4 | Weight up — Arabic 400 can feel thin |
| `type-ar-caption` | 12px | 500 | 1.5 | — |

**Arabic Typography Rules:**
1. `font-family: 'Cairo', 'Tajawal', sans-serif` — Cairo renders beautifully at all sizes
2. `letter-spacing: 0` always — Arabic doesn't use letter-spacing
3. Line-height always higher than English equivalent (+0.2)
4. Numbers in Arabic context: use Eastern Arabic-Indic digits `٠١٢٣٤٥٦٧٨٩` as user preference option; default to Western `0123456789`
5. Prices and amounts: always LTR even in RTL context — wrap in `<bdi>` or `dir="ltr"` span
6. Mixed content (Arabic text + English product name): `unicode-bidi: embed`

## 3.6 Typography Pairing Rules

| Pairing | Heading | Body |
|---------|---------|------|
| Page header | `type-display-md` / 700 | `type-body-md` / 400 |
| Card | `type-display-sm` / 600 | `type-body-sm` / 400 |
| Dashboard widget | `type-label-md` / 500 muted | `type-mono-lg` / 700 |
| Table | `type-label-md` / 500 | `type-body-xs` / 400 |
| Modal | `type-heading-lg` / 600 | `type-body-md` / 400 |
| Empty state | `type-heading-md` / 600 | `type-body-sm` / 400 muted |
| Toast | `type-body-sm` / 500 | — |
| Button | `type-label-md` / 500 | — |

---

# 4. DESIGN TOKENS — PRODUCTION READY

## 4.1 Spacing Tokens

All spacing is based on a **4px base unit**. Token naming follows T-shirt sizes.

| Token | Value | Common Usage |
|-------|-------|--------------|
| `--space-px` | 1px | Fine borders, separator lines |
| `--space-0.5` | 2px | Icon-to-text gap in dense views |
| `--space-1` | 4px | Tight internal padding, icon gaps |
| `--space-2` | 8px | Input icon padding, badge padding |
| `--space-3` | 12px | Small button padding V, list item gap |
| `--space-4` | 16px | Default card padding, form field gap |
| `--space-5` | 20px | Component gap in forms |
| `--space-6` | 24px | Card padding desktop, section gap small |
| `--space-7` | 28px | — |
| `--space-8` | 32px | Section padding small, modal padding |
| `--space-10` | 40px | Section gap large |
| `--space-12` | 48px | Dashboard widget gap |
| `--space-14` | 56px | — |
| `--space-16` | 64px | Section padding large, hero content padding |
| `--space-20` | 80px | Major section separators |
| `--space-24` | 96px | Page top padding |
| `--space-32` | 128px | Hero vertical padding |

## 4.2 Border Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0px | Tables, full-bleed images |
| `--radius-xs` | 2px | Skeleton bars |
| `--radius-sm` | 4px | Small badges, tags, chips |
| `--radius-md` | 6px | Inputs, small buttons |
| `--radius-lg` | 8px | Default buttons, small cards |
| `--radius-xl` | 12px | Standard cards, panels |
| `--radius-2xl` | 16px | Large cards, modals, drawers |
| `--radius-3xl` | 20px | Feature cards, onboarding panels |
| `--radius-4xl` | 24px | Search pill, large property cards |
| `--radius-full` | 9999px | Avatars, toggles, pill badges |

## 4.3 Shadow Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-none` | `none` | Flat elements |
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Subtle card lift |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Default cards |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)` | Hovered cards, dropdowns |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.07), 0 4px 6px rgba(0,0,0,0.04)` | Floating panels, popovers |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.08), 0 10px 10px rgba(0,0,0,0.04)` | Modals |
| `--shadow-2xl` | `0 25px 50px rgba(0,0,0,0.12)` | Full-screen modal overlays |
| `--shadow-inner` | `inset 0 2px 4px rgba(0,0,0,0.04)` | Recessed elements, pressed state |
| `--shadow-focus-brand` | `0 0 0 3px rgba(44,95,255,0.25)` | Keyboard focus on brand elements |
| `--shadow-focus-error` | `0 0 0 3px rgba(239,68,68,0.25)` | Keyboard focus on error state |

## 4.4 Animation / Motion Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | `50ms` | Immediate visual response |
| `--duration-fast` | `100ms` | Button state changes |
| `--duration-normal` | `200ms` | Standard transitions |
| `--duration-moderate` | `300ms` | Modal open, drawer slide |
| `--duration-slow` | `500ms` | Page-level transitions |
| `--duration-xslow` | `800ms` | Counter animations, progress |
| `--ease-linear` | `linear` | Progress bars |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving screen |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering screen |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Elements repositioning |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bounce effects (wishlist ♥) |
| `--ease-decelerate` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Drawers entering |
| `--ease-accelerate` | `cubic-bezier(0.4, 0.0, 1, 1)` | Drawers exiting |

## 4.5 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | 0 | Default stacking context |
| `--z-raised` | 10 | Cards on hover, slightly elevated |
| `--z-dropdown` | 100 | Select dropdowns, autocomplete |
| `--z-sticky` | 200 | Sticky headers, booking widget |
| `--z-fixed` | 300 | Fixed navigation, sidebar |
| `--z-overlay` | 400 | Modal backdrops |
| `--z-modal` | 500 | Modals, drawers, bottom sheets |
| `--z-toast` | 600 | Toast notifications |
| `--z-tooltip` | 700 | Tooltips — always on top |

## 4.6 Breakpoint Tokens

| Token | Value | Label |
|-------|-------|-------|
| `--bp-xs` | 320px | Mobile S |
| `--bp-sm` | 480px | Mobile L |
| `--bp-md` | 768px | Tablet |
| `--bp-lg` | 1024px | Desktop S |
| `--bp-xl` | 1280px | Desktop M |
| `--bp-2xl` | 1536px | Desktop L |
| `--bp-3xl` | 1920px | Ultra-wide |
| `--content-max` | 1440px | Maximum content width |

## 4.7 Grid Tokens

| Token | Value at breakpoint | Usage |
|-------|--------------------|----|
| `--grid-cols-mobile` | 4 columns | Mobile |
| `--grid-cols-tablet` | 8 columns | Tablet |
| `--grid-cols-desktop` | 12 columns | Desktop |
| `--grid-gutter-mobile` | 16px | Mobile gutter |
| `--grid-gutter-tablet` | 24px | Tablet gutter |
| `--grid-gutter-desktop` | 32px | Desktop gutter |
| `--grid-margin-mobile` | 16px | Mobile margin |
| `--grid-margin-tablet` | 32px | Tablet margin |
| `--grid-margin-desktop` | 48px | Desktop margin |

## 4.8 Component-Specific Tokens

### Navigation

| Token | Value |
|-------|-------|
| `--nav-height-desktop` | 72px |
| `--nav-height-mobile` | 60px |
| `--sidebar-width-expanded` | 240px |
| `--sidebar-width-collapsed` | 64px |
| `--bottom-nav-height` | 64px |
| `--nav-bg` | `var(--surface-nav)` |
| `--nav-border` | `1px solid var(--color-neutral-200)` |
| `--nav-shadow` | `var(--shadow-sm)` |

### Cards

| Token | Value |
|-------|-------|
| `--card-bg` | `var(--surface-card)` |
| `--card-border` | `none` |
| `--card-radius` | `var(--radius-xl)` |
| `--card-shadow` | `var(--shadow-sm)` |
| `--card-shadow-hover` | `var(--shadow-md)` |
| `--card-padding` | `var(--space-6)` |
| `--card-padding-sm` | `var(--space-4)` |
| `--card-transition` | `box-shadow var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-out)` |

### Buttons

| Token | Value |
|-------|-------|
| `--btn-primary-bg` | `var(--color-brand-600)` |
| `--btn-primary-bg-hover` | `var(--color-brand-700)` |
| `--btn-primary-bg-active` | `var(--color-brand-800)` |
| `--btn-primary-text` | `#FFFFFF` |
| `--btn-primary-shadow` | `0 1px 2px rgba(44,95,255,0.3)` |
| `--btn-radius` | `var(--radius-lg)` |
| `--btn-transition` | `background-color var(--duration-fast), box-shadow var(--duration-fast)` |
| `--btn-height-sm` | `32px` |
| `--btn-height-md` | `40px` |
| `--btn-height-lg` | `48px` |
| `--btn-height-xl` | `56px` |
| `--btn-padding-sm` | `0 var(--space-3)` |
| `--btn-padding-md` | `0 var(--space-4)` |
| `--btn-padding-lg` | `0 var(--space-6)` |
| `--btn-padding-xl` | `0 var(--space-8)` |

### Forms

| Token | Value |
|-------|-------|
| `--input-height` | `44px` |
| `--input-height-sm` | `36px` |
| `--input-height-lg` | `52px` |
| `--input-bg` | `var(--surface-input)` |
| `--input-border` | `1.5px solid var(--color-neutral-300)` |
| `--input-border-hover` | `1.5px solid var(--color-neutral-400)` |
| `--input-border-focus` | `2px solid var(--color-brand-600)` |
| `--input-border-error` | `2px solid var(--color-danger-500)` |
| `--input-radius` | `var(--radius-md)` |
| `--input-padding` | `0 var(--space-3)` |
| `--input-font-size` | `16px` |
| `--input-placeholder-color` | `var(--color-neutral-400)` |

---

*Part 1 complete. Continue with Part 2: High-Fidelity Screen Specifications.*
