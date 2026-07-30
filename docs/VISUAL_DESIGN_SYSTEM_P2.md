# StayOS — Visual Design System
## Part 2 of 4: High-Fidelity Screen Specifications

**Continuation of:** VISUAL_DESIGN_SYSTEM_P1.md  
**Spec format:** Each screen: Layout · Spacing · Colors · Typography · States · Interactions

> Measurements are in px. All spacing values map to design tokens from Part 1.

---

# 5. HIGH-FIDELITY SCREEN SPECIFICATIONS

## Specification Key

```
[BG: token]           = background color token
[FG: token]           = foreground/text color token
[T: type-token]       = typography token
[SP: Npx]             = spacing in pixels
[R: radius-token]     = border radius token
[SH: shadow-token]    = shadow token
[W: Npx] [H: Npx]    = width / height
```

---

## ZONE A — PUBLIC SCREENS

---

### A01 — Home / Landing Page

**Viewport:** 1440 × 900px design target

#### Section 1: Navigation Bar
```
┌─ NAV ──────────────────────────────────────────────────────────────────────┐
│  H: 72px | BG: transparent → white on scroll | SP-left: 48px | SP-right: 48px  │
│                                                                             │
│  [Logo: W128px]    [Search Pill: W480px H48px]    [Become a Host] [🌐] [👤] │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Nav — Search Pill Detail:**
- Container: `W: 480px` `H: 48px` `R: radius-full` `BG: white` `SH: shadow-md`
- Border: `1px solid --color-neutral-200`
- Dividers between segments: `1px solid --color-neutral-200` `H: 24px` centered
- Segments: [Where: 140px] | [Check-in: 110px] | [Check-out: 110px] | [Guests+Search: 120px]
- Segment hover: `BG: --color-neutral-100` rounded within pill
- Search icon button: W40px H40px `BG: --color-brand-600` `R: radius-full` icon white 20px
- Segment text: `T: type-label-md` `FG: --color-neutral-500`
- Segment value (filled): `T: type-label-md` `FG: --color-neutral-900`

**Nav — Become a Host button:**
- `T: type-label-md` `FG: --color-neutral-700` `R: radius-lg`
- Hover: `BG: --color-neutral-100` `SP: 8px 12px`
- Transition: `--duration-fast`

**Nav — User Menu (authenticated):**
- Container: `BG: white` `R: radius-full` `SH: shadow-sm` border `--color-neutral-200`
- `SP: 6px 6px 6px 16px` (tight right to avatar)
- Hamburger icon: 20px `FG: --color-neutral-600`
- Avatar: `W: 32px H: 32px R: radius-full` `BG: --color-brand-600`
- Gap between icon and avatar: `--space-2`

---

#### Section 2: Hero
```
┌─ HERO ──────────────────────────────────────────────────────────────────────┐
│  H: 620px  |  Full-width background image                                   │
│  Gradient scrim: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%) │
│                                                                             │
│  Content centered: max-width 640px, margin auto                            │
│                                                                             │
│  "Find your perfect stay"                                                   │
│  T: type-hero (56px/700) | FG: white | letter-spacing: -1.5px             │
│  margin-bottom: 24px                                                        │
│                                                                             │
│  [SEARCH BOX: W: 860px H: 64px R: radius-2xl BG: white SH: shadow-xl]    │
│  ┌──────────────┬─────────────┬─────────────┬───────────────────────────┐  │
│  │ 📍 Where?   │ 📅 Check in │ 📅 Check out │ 👥 Guests  [🔍 Search]   │  │
│  └──────────────┴─────────────┴─────────────┴───────────────────────────┘  │
│  Internal padding: 20px | Dividers: 1px --color-neutral-200 H:30px        │
│  Label T: type-label-sm FG: --color-neutral-900 weight 700                │
│  Value T: type-body-sm FG: --color-neutral-500                            │
│  Search button: W144px H: 44px BG: --color-brand-600 R: radius-lg        │
│  Button text: "Search" T: type-label-lg FG: white                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Section 3: Popular Destinations
```
SP-top: 80px | SP-bottom: 64px | max-width: 1344px margin: auto

"Popular Destinations"  T: type-display-sm/600  FG: --color-neutral-900
"Find your next adventure"  T: type-body-md/400  FG: --color-neutral-500
margin-bottom: 40px

Destination chips (horizontal scroll on mobile):
Each chip: H: 44px SP: 12px 20px R: radius-full
BG: --color-neutral-50  border: 1px --color-neutral-200
T: type-label-md/500  FG: --color-neutral-700
Hover: BG: --color-brand-50 border-color: --color-brand-200 FG: --color-brand-700
Transition: --duration-fast
```

#### Section 4: Trending Properties
```
SP-top: 64px | SP-bottom: 80px | max-width: 1344px margin: auto

Section header:
  Left: "Trending Properties"  T: type-display-sm/700  FG: --color-neutral-900
  Right: "See all →"  T: type-label-md/500  FG: --color-brand-600

Grid: 4 columns | gap: 24px | margin-top: 32px

Property Card (see Component Library — Card: Property)
```

#### Section 5: Trust Bar
```
H: 96px  BG: --color-neutral-50  border-top: 1px --color-neutral-200

3 items centered with SP: 48px between:
[🔒 Secure Payments]  [✅ Verified Hosts]  [📞 24/7 Support]
Icon: 24px --color-brand-600
T: type-label-md/500  FG: --color-neutral-700
Icon-to-text gap: 8px
```

#### Section 6: How It Works
```
SP: 96px 0 | max-width: 1344px margin: auto | BG: white

"How It Works"  T: type-display-md/700  text-align: center  margin-bottom: 16px
"Book with confidence in 3 simple steps"  T: type-body-lg  FG: --color-neutral-500  center

Steps row: 3 columns | gap: 48px | margin-top: 64px

Each step:
  Illustration: 120px × 120px  margin-bottom: 24px  centered
  Step number: W32px H32px R: radius-full BG: --color-brand-600
    T: type-label-md/700 FG: white  centered
  Title: T: type-display-sm/600  FG: --color-neutral-900  margin-top: 16px
  Body: T: type-body-md/400  FG: --color-neutral-500  max-width: 280px
```

#### Section 7: Become a Host Banner
```
H: 360px  R: radius-3xl  overflow: hidden  margin: 0 48px 80px
Background: linear-gradient(135deg, #1A3FCC 0%, #2C5FFF 60%, #4F7BFF 100%)

Left side (50%):
  Badge: "For Hosts" chip  BG: rgba(255,255,255,0.15)  T: type-label-sm/500  FG: white
  "Earn money from your property"  T: type-display-md/700  FG: white  margin-top: 16px
  "Join 12,000+ hosts on StayOS and start earning today."  T: type-body-lg  FG: rgba(255,255,255,0.8)
  [Get Started →] button: H:48px  BG: white  FG: --color-brand-700  T: type-label-lg/600  R: radius-lg  margin-top: 32px

Right side (50%): Illustration of host with property (SVG)
```

#### Section 8: Footer
```
BG: --color-neutral-900  SP: 64px 48px 40px
4-column grid:
  Col 1: Logo (white variant) + tagline T: type-body-sm FG: rgba(255,255,255,0.5)
  Col 2: Company (About, Careers, Blog, Press)
  Col 3: Support (Help Center, Safety, Cancellation, Contact)
  Col 4: Hosting (Become a Host, Responsible Hosting)

All links: T: type-body-sm/400  FG: rgba(255,255,255,0.6)  hover: white
Column headings: T: type-label-md/600  FG: white  margin-bottom: 16px

Bottom bar: border-top 1px rgba(255,255,255,0.1)  margin-top: 48px  padding-top: 32px
  Left: "© 2026 StayOS. All rights reserved."  T: type-caption  FG: rgba(255,255,255,0.4)
  Right: Social icons [Twitter] [Instagram] [LinkedIn] — each 20px white 40% opacity
```

---

### A02 — Search Results Page

**Layout:** Fixed sidebar left (280px) + main content (fluid) | Top nav sticky

#### Filter Sidebar
```
W: 280px  H: 100vh-72px  sticky top: 72px
BG: white  border-right: 1px --color-neutral-200
overflow-y: auto  SP: 24px

Section headings: T: type-heading-sm/600  FG: --color-neutral-900  margin-bottom: 12px
Section dividers: 1px --color-neutral-100  margin: 24px 0

Price Range:
  Dual-handle range slider
  Track: H:4px  BG: --color-neutral-200  R: radius-full
  Active track: BG: --color-brand-600
  Handles: W20px H20px R: radius-full BG: white border: 2px --color-brand-600 SH: shadow-md
  Min/max labels: T: type-body-sm/500  FG: --color-neutral-900  margin-top: 12px

Property Type:
  Pill chip group — wrapping
  Each chip: H:36px SP:8px 14px R:radius-full
  Default: BG: white border: 1.5px --color-neutral-300 T: type-label-sm/500 FG: --color-neutral-700
  Selected: BG: --color-brand-600 border: none FG: white

Amenities:
  Checkbox list, 2-column
  Checkbox: W18px H18px R: radius-sm border: 1.5px --color-neutral-300
  Checked: BG: --color-brand-600 border: --color-brand-600 ✓ white
  Label: T: type-body-sm/400 FG: --color-neutral-700

Rating:
  Star buttons — clickable
  Stars: 20px --color-accent-400 (filled) / --color-neutral-300 (empty)
  "4+ stars" etc. label: T: type-body-sm FG: --color-neutral-700

Instant Book toggle:
  Toggle: W44px H24px R: radius-full
  Off: BG: --color-neutral-300
  On: BG: --color-brand-600
  Knob: W20px H20px R: radius-full BG: white SH: shadow-sm
  Label: T: type-body-sm/500 FG: --color-neutral-900

[Clear all filters] link: T: type-label-sm/500 FG: --color-danger-600  margin-top: 24px
```

#### Results Header
```
H: 56px  border-bottom: 1px --color-neutral-100  SP: 0 32px  flex align-center space-between

Left: "124 properties in Cairo"  T: type-heading-sm/600  FG: --color-neutral-900
      "· Aug 1–5 · 2 guests"  T: type-body-sm/400  FG: --color-neutral-500

Center: [Filters ▼] pill button (mobile only — hidden on desktop)

Right:
  Sort: "Sort: Recommended ▼" — select-style button
    H: 36px  SP: 8px 12px  R: radius-md  border: 1px --color-neutral-300
    T: type-label-sm/500  FG: --color-neutral-700
  View toggle: [☰ List] [🗺 Map]
    Active view: BG: --color-neutral-900  FG: white
    Inactive: BG: white border: 1px --color-neutral-300  FG: --color-neutral-500
    H: 36px  W: 36px  R: radius-md
```

#### Property Grid (List View)
```
Columns: 3 (1280px+) | 2 (768–1279px) | 1 (<768px)
Gap: 24px
Padding: 32px top, 32px sides

Active filter chips (when filters applied):
  Row of chips below header
  BG: --color-brand-50  border: 1px --color-brand-200  FG: --color-brand-700
  ×  clear icon: 12px  FG: --color-brand-400
  SP: 6px 10px  R: radius-full  T: type-label-sm/500
```

#### Property Card — Search Results Variant
```
R: radius-xl  overflow: hidden  SH: shadow-sm
hover: SH: shadow-md  transform: translateY(-2px)
Transition: --card-transition (200ms ease-out)

Photo section:
  Aspect ratio: 3:2  overflow: hidden
  Image: object-fit: cover  W: 100%
  Hover: transform: scale(1.04)  Transition: 500ms ease
  
  Wishlist button (♥):
    Position: absolute top: 12px right: 12px
    W: 32px H: 32px  R: radius-full
    BG: rgba(255,255,255,0.85)  backdrop-filter: blur(4px)
    Icon: heart 16px
    Empty state: FG: --color-neutral-700
    Saved state: FG: #EF4444  fill: #EF4444
    Hover: BG: white  SH: shadow-sm
    Click animation: scale 1→1.4→1  spring easing  300ms
  
  "Instant Book" badge (if applicable):
    Position: absolute top: 12px left: 12px
    BG: --color-neutral-900/80  FG: white
    T: type-label-sm/600  SP: 4px 8px  R: radius-sm
    ⚡ icon 12px white

Info section:
  SP: 12px  (inside card below photo)
  
  Row 1: flex space-between align-start
    Name: T: type-heading-sm/600  FG: --color-neutral-900  max: 1 line ellipsis
    Rating: ⭐ T: type-label-sm/600  FG: --color-neutral-900
      ⭐ icon: 14px --color-accent-400
  
  Row 2: margin-top: 4px
    Location: T: type-body-xs/400  FG: --color-neutral-500
  
  Row 3: margin-top: 4px
    Dates available: T: type-body-xs/400  FG: --color-neutral-500
  
  Row 4: margin-top: 8px
    Price: T: type-heading-md/600  FG: --color-neutral-900  inline
    "/night": T: type-body-sm/400  FG: --color-neutral-500  inline margin-left: 2px
  
  Row 5 (on hover/selection): fade in
    Total: T: type-body-xs/400  FG: --color-neutral-500
    "$600 total before taxes"
```

---

### A03 — Property Detail Page

**Layout:** Full-width photos → 2-column content+widget → single-column bottom

#### Photo Gallery
```
H: 480px (desktop)  overflow: hidden
Grid: 1 large (55%) + 4 small (2×2, 45%)  gap: 4px

Large photo: H: 480px  object-fit: cover  R: radius-2xl on left side
Small photos: H: 238px each  object-fit: cover
  Top-right photo: R: radius-2xl on top-right corner
  Bottom-right photo: R: radius-2xl on bottom-right corner

"Show all photos" button:
  Position: absolute bottom: 16px right: 16px
  BG: white  SH: shadow-md
  T: type-label-sm/600  FG: --color-neutral-900
  SP: 8px 14px  R: radius-lg
  [⊞] icon: 16px  margin-right: 6px
```

#### Property Info Column (left, 58% width)
```
SP-top: 32px  SP-right: 48px

Title row:
  "Luxury Nile View Apartment"  T: type-display-md/700  FG: --color-neutral-900
  margin-bottom: 12px

Meta row:
  ⭐ 4.9  T: type-label-md/600  FG: --color-neutral-900
  · 127 reviews  T: type-label-md/400  FG: --color-neutral-500  underline (link)
  · Cairo, Egypt  T: type-label-md/400  FG: --color-neutral-500
  All inline, gap: 4px

Divider: 1px --color-neutral-200  margin: 24px 0

Host row:
  Avatar: W48px H48px R: radius-full  BG: --color-brand-600
  Right of avatar:
    "Hosted by Omar Hassan"  T: type-heading-sm/600  FG: --color-neutral-900
    "Superhost · 3 years hosting"  T: type-body-sm/400  FG: --color-neutral-500
  Gap: 12px

Divider: margin: 24px 0

Feature pills row (beds, baths, guests):
  Each: icon 20px --color-neutral-600 + text T: type-body-md/400 FG: --color-neutral-700
  Gap: 20px

Divider: margin: 24px 0

About section:
  "About this place"  T: type-heading-lg/600  margin-bottom: 12px
  Body: T: type-body-md/400  FG: --color-neutral-700  line-height: 1.7
  Line clamp: 4 lines default
  [Show more ↓] link: T: type-label-md/600 FG: --color-brand-600  margin-top: 8px

Divider: margin: 32px 0

Amenities section:
  "What this place offers"  T: type-heading-lg/600  margin-bottom: 20px
  Grid: 2 columns  gap: 16px
  Each amenity: icon 20px + label T: type-body-md/400
    Available: FG: --color-neutral-700
    Not available: FG: --color-neutral-400  text-decoration: line-through
  [Show all X amenities] button (outline) margin-top: 16px
```

#### Booking Widget (right, sticky, 38% width)
```
Position: sticky  top: 88px (below nav)
BG: white  R: radius-2xl  SH: shadow-xl
border: 1px --color-neutral-200
SP: 24px

Price row:
  "$120"  T: type-mono-lg/700  FG: --color-neutral-900
  " / night"  T: type-body-md/400  FG: --color-neutral-500
  Rating: ⭐ 4.9 · 127 reviews  T: type-body-sm/400  FG: --color-neutral-500  float right

Date picker inline:
  Grid: 2 equal columns
  Each box: border: 1px --color-neutral-300  R: radius-md  SP: 12px  H: 56px
  Label: T: type-label-sm/700  FG: --color-neutral-900  uppercase letter-spacing: 0.8px
  Value: T: type-body-sm/400  FG: --color-neutral-700
  Focus: border: 2px --color-brand-600
  Combined container: R: radius-xl  border: 1.5px --color-neutral-300
    Inner divider: 1px --color-neutral-200 vertical

Guests selector:
  W: 100%  H: 56px  border: 1.5px --color-neutral-300  R: radius-xl  SP: 0 16px
  flex space-between
  "Guests": T: type-label-sm/700 uppercase  FG: --color-neutral-900
  "2 guests ▼": T: type-body-sm/400  FG: --color-neutral-700

[Reserve] button:
  W: 100%  H: 52px  BG: linear-gradient(135deg, #2C5FFF, #1A3FCC)
  FG: white  T: type-label-lg/600  R: radius-xl
  margin-top: 16px
  SH: 0 4px 12px rgba(44,95,255,0.3)
  Hover: SH: 0 6px 20px rgba(44,95,255,0.4)  transform: translateY(-1px)

"You won't be charged yet"  T: type-caption/400  FG: --color-neutral-500  text-align: center  margin-top: 8px

Price breakdown:
  margin-top: 20px  border-top: 1px --color-neutral-100  padding-top: 20px
  Each row: flex space-between  margin-bottom: 12px
  Label: T: type-body-sm/400  FG: --color-neutral-700  underline (links to tooltip)
  Value: T: type-body-sm/400  FG: --color-neutral-700
  Total row: border-top: 1px --color-neutral-200  padding-top: 16px  margin-top: 4px
    Label: T: type-heading-sm/700  FG: --color-neutral-900
    Value: T: type-heading-sm/700  FG: --color-neutral-900
```

---

## ZONE B — AUTHENTICATION SCREENS

---

### B01 — Login Page

**Layout:** Centered card on `--surface-page` background

```
Page: BG: --surface-page  min-height: 100vh  flex center

Card: W: 440px  BG: white  R: radius-2xl  SH: shadow-xl  SP: 48px

Logo: centered  margin-bottom: 32px  W: 120px

Heading:
  "Welcome back"  T: type-display-sm/700  FG: --color-neutral-900  center
  "Sign in to your StayOS account"  T: type-body-md/400  FG: --color-neutral-500  center  margin-top: 8px

Social buttons: margin-top: 32px
  Each: W: 100%  H: 48px  BG: white  border: 1.5px --color-neutral-300  R: radius-lg
  Provider logo: W:20px  margin-right: 8px
  Label: T: type-label-md/500  FG: --color-neutral-700
  Hover: BG: --color-neutral-50  border-color: --color-neutral-400
  Gap: 12px between social buttons

Divider:
  "or continue with phone"
  Lines: 1px --color-neutral-200  flex-grow
  Text: T: type-label-sm/500  FG: --color-neutral-400  SP: 0 12px
  margin: 24px 0

Phone input:
  Label: "Phone number"  T: type-label-sm/600  FG: --color-neutral-700  margin-bottom: 6px
  Input row: flex
    Country code selector: W: 88px  H: 44px  border: 1.5px --color-neutral-300
      R: top-left radius-md bottom-left radius-md
      BG: --color-neutral-50
      flag emoji + dial code: T: type-body-sm/400  FG: --color-neutral-700
    Phone input: flex-grow  H: 44px  border: 1.5px --color-neutral-300
      border-left: none  R: top-right radius-md bottom-right radius-md
      T: type-body-md/400 (16px for mobile)

[Continue] button:
  W: 100%  H: 48px  BG: --color-brand-600
  T: type-label-lg/600  FG: white  R: radius-lg  margin-top: 20px

Signup link:
  "Don't have an account? Sign up"  T: type-body-sm/400  FG: --color-neutral-500
  "Sign up" = --color-brand-600  underline on hover
  text-align: center  margin-top: 24px
```

---

### B02 — OTP Verification Screen

```
Card: same container as Login

Heading:
  "Check your phone"  T: type-display-sm/700  FG: --color-neutral-900  center
  "We sent a 6-digit code to +20 100 XXX XXXX"  T: type-body-sm/400  FG: --color-neutral-500  center
  margin-top: 8px

  [Change number] link: T: type-label-sm/500  FG: --color-brand-600

OTP input:
  6 individual boxes  gap: 8px  margin-top: 32px  centered
  Each box: W: 52px  H: 64px  R: radius-xl
    border: 2px --color-neutral-300  T: type-display-sm/700  FG: --color-neutral-900  text-align: center
    Focus: border: 2px --color-brand-600  BG: --color-brand-50
    Filled: border: 2px --color-brand-600
    Error: border: 2px --color-danger-500  BG: --color-danger-50
    Shake animation on error: translateX ±6px  3 iterations  200ms

  Error message: T: type-body-sm/400  FG: --color-danger-600  text-align: center  margin-top: 12px

Resend row:
  margin-top: 24px  text-align: center
  Countdown: "Resend code in 0:47"  T: type-body-sm/400  FG: --color-neutral-400
  Resend link (active after countdown): T: type-label-sm/600  FG: --color-brand-600

[Verify] button: same style as Continue — auto-submits when 6 digits entered
```

---

### B03 — KYC Identity Verification

**Layout:** Stepped wizard — single card, 4 steps with top progress bar

```
Progress bar:
  W: 100%  H: 4px  R: radius-full
  Track: BG: --color-neutral-200
  Fill: BG: --color-brand-600  animated width transition 300ms ease

Step indicators:
  4 dots below bar  W:8px H:8px R:full
  Active: W:24px BG: --color-brand-600 (pill shape)
  Completed: BG: --color-success-500
  Upcoming: BG: --color-neutral-300

Step 1 — Document Type:
  Card: max-W: 560px centered
  "Verify your identity"  T: type-display-sm/700  center
  "We need to confirm who you are to keep StayOS safe for everyone."
    T: type-body-md  FG: --color-neutral-500  center  margin-top: 8px

  Document options: grid 3 cols  gap: 16px  margin-top: 32px
    Each option card:
      W: 100%  SP: 20px  R: radius-xl  border: 2px --color-neutral-200
      BG: white  cursor: pointer
      Icon: 32px centered  margin-bottom: 12px
      Label: T: type-label-md/600  FG: --color-neutral-900  center
      Sub: T: type-caption/400  FG: --color-neutral-500  center
      
      Selected: border: 2px --color-brand-600  BG: --color-brand-50
        Label: FG: --color-brand-700

Step 2 & 3 — Document Capture:
  Upload zone: W: 100%  H: 220px  R: radius-2xl
    border: 2px dashed --color-neutral-300  BG: --color-neutral-50
    Dashed border on hover: --color-brand-300  BG: --color-brand-50
    Center content: camera icon 48px --color-neutral-400  margin-bottom: 16px
    "Tap to take photo or upload"  T: type-body-md/500  FG: --color-neutral-600
    "JPG or PNG, max 10MB"  T: type-caption  FG: --color-neutral-400  margin-top: 4px
  
  Uploaded preview: replace zone with image thumbnail + retake link

Step 4 — Selfie:
  Same upload zone pattern
  "Make sure your face is clearly visible"  helper text

  Submission:
    Processing state: spinner center + "Analyzing your document…"  T: type-body-md FG: --color-neutral-500
    Progress bar: indeterminate animated
```

---

## ZONE C — GUEST SCREENS

---

### C01 — Guest Dashboard

**Layout:** Left sidebar 240px + main content fluid | BG: `--surface-page`

```
Main content padding: 40px 48px

Greeting:
  "Good morning, Ahmed ☀️"  T: type-display-md/700  FG: --color-neutral-900
  "Ready for your next adventure?"  T: type-body-lg/400  FG: --color-neutral-500  margin-top: 4px

Quick search bar:
  W: 560px  H: 52px  R: radius-2xl  BG: white  SH: shadow-sm
  border: 1px --color-neutral-200  margin-top: 24px
  placeholder: "Where would you like to go?"
  Search icon: 20px --color-neutral-400  right side
  Hover: SH: shadow-md

Upcoming Trip card (if booking exists):
  margin-top: 40px
  BG: linear-gradient(135deg, #1A3FCC 0%, #2C5FFF 100%)
  R: radius-2xl  SP: 32px  flex space-between align-center
  
  Left:
    "Your Next Trip"  T: type-label-md/600  FG: rgba(255,255,255,0.7)  uppercase
    "Nile View Apartment"  T: type-display-sm/700  FG: white  margin-top: 8px
    "Aug 1–5 · 4 nights · 2 guests"  T: type-body-md/400  FG: rgba(255,255,255,0.8)
    Countdown: "12 days away"  T: type-label-md/600  FG: --color-accent-400  margin-top: 16px
    [View Details] button: H:40px  BG: rgba(255,255,255,0.15)  FG: white
      R: radius-lg  margin-top: 20px  T: type-label-md/600
      Hover: BG: rgba(255,255,255,0.25)  border: 1px rgba(255,255,255,0.3)
  
  Right: Property thumbnail  W:160px H:120px R:radius-xl  object-fit:cover

Two-column grid: margin-top: 40px  gap: 32px  (past trips left | recommendations right)

Past Trips section (left col):
  "Past Trips"  T: type-heading-lg/600  margin-bottom: 20px
  Compact booking list:
    Each row: flex  gap: 12px  SP: 16px  R: radius-xl  BG: white  SH: shadow-xs
    Thumbnail: W:64px H:48px R:radius-lg object-fit:cover
    Info: name T:type-body-sm/600, date+location T:type-body-xs/400 FG:neutral-500
    Status badge: right aligned
    margin-bottom: 8px
  [View all trips] link: T:type-label-sm/600 FG:--color-brand-600 margin-top:12px

Recommendations section (right col):
  "You might like"  T: type-heading-lg/600  margin-bottom: 20px
  Property card grid: 1 column  gap: 16px  (compact variant)
```

---

### C04 — Checkout Page

```
Page: BG: --surface-page  max-width: 1100px  margin: auto  SP: 48px

Back link:
  ← "Luxury Nile View Apartment"  T: type-label-md/600  FG: --color-neutral-700
  hover: FG: --color-neutral-900
  margin-bottom: 32px

Two columns: gap: 48px

LEFT COLUMN (60%):

Section: "Trip details"
  BG: white  R: radius-2xl  SH: shadow-sm  SP: 28px  margin-bottom: 20px
  
  "Your trip"  T: type-heading-lg/600  FG: neutral-900  margin-bottom: 20px
  
  Dates row: flex space-between
    "Dates": T: type-label-md/600  FG: neutral-900
    "Aug 1–5, 2026": T: type-body-md/400  FG: neutral-700
    [Edit]: T: type-label-sm/600  FG: brand-600  underline hover
  
  Guests row: same pattern
  
  Divider: margin: 20px 0

Section: "Choose how to pay"
  BG: white  R: radius-2xl  SH: shadow-sm  SP: 28px  margin-bottom: 20px
  
  "Payment"  T: type-heading-lg/600  margin-bottom: 20px
  
  Payment options: radio group
    Each option: SP: 16px  R: radius-xl  border: 2px
    Default: border-color: --color-neutral-200
    Selected: border-color: --color-brand-600  BG: --color-brand-50
    
    Card option layout: flex  gap: 12px  align-center
      Radio: W:20px H:20px  R:full  border:2px neutral-300  selected: inner dot brand-600
      Left: card icons (Visa/MC/Amex SVGs)
      Label: T: type-body-md/600  FG: neutral-900
      Sub: "Ending in 4242"  T: type-body-sm/400  FG: neutral-500

  Add new card:
    Collapsed state: "+ Add new card" link  T: type-label-md/500  FG: brand-600
    Expanded: card number / expiry / CVV form fields

Section: "Promo code"
  BG: white  R: radius-2xl  SH: shadow-sm  SP: 28px  margin-bottom: 20px
  
  Input + [Apply] button row:
    Input: flex-grow  H:44px  R: radius-md left side
    Button: W:88px  H:44px  BG: --color-neutral-900  FG: white  R: radius-md right side
    T: type-label-md/600
    
  Success: green check + "10% discount applied"  FG: --color-success-600
  Error: red × + "Invalid promo code"  FG: --color-danger-600

Cancellation policy section:
  "Cancellation policy"  T: type-heading-sm/600  margin-bottom: 8px
  Body: T: type-body-sm/400  FG: neutral-600  line-height: 1.6

Terms checkbox:
  "By selecting Reserve, I agree to StayOS's Terms of Service, Cancellation Policy, and House Rules."
  T: type-body-sm/400  FG: neutral-600
  checkbox: 18px  brand-600 when checked

[Confirm and pay $600] button:
  W: 100%  H: 56px  BG: --color-brand-600
  T: type-label-lg/600  FG: white  R: radius-xl
  SH: 0 4px 16px rgba(44,95,255,0.3)
  Hover: transform: translateY(-1px)  SH increases
  Loading state: spinner center, text becomes "Processing…"  disabled

RIGHT COLUMN (40%):

Order Summary card:
  BG: white  R: radius-2xl  SH: shadow-sm  SP: 28px  sticky top: 88px
  
  Property preview: flex  gap: 16px
    Thumbnail: W:80px H:60px R:radius-lg object-fit:cover
    Right:
      Name: T: type-body-sm/600  FG: neutral-900  line-clamp:2
      Rating: ⭐ 4.9  T: type-body-xs/400  FG: neutral-500
  
  Divider: margin: 20px 0
  
  Price breakdown:
    Each row: flex space-between  margin-bottom: 12px
    Labels: T: type-body-sm/400  FG: neutral-700
    Values: T: type-body-sm/400  FG: neutral-700
    Discount row: FG: --color-success-600  both sides
    
    Total row (below divider): font-weight 700  font-size 18px
  
  Security badge:
    margin-top: 20px  flex  gap: 8px  align-center
    🔒 icon: 16px --color-neutral-400
    "Payments secured by Stripe"  T: type-caption/400  FG: neutral-400
```

---

## ZONE D — HOST SCREENS

---

### D01 — Host Dashboard

```
Layout: sidebar 240px + main content  BG: --surface-page

Content: SP: 40px 48px

Header row: flex space-between align-center
  Left:
    "Welcome back, Omar 👋"  T: type-display-md/700  FG: neutral-900
    [today's date]  T: type-body-md/400  FG: neutral-500  margin-top: 4px
  Right:
    [+ New Listing] button: H:44px  BG: brand-600  FG: white  R:radius-lg  T:type-label-md/600
    [📥 Messages (3)] button: H:44px  BG: white  border:1px neutral-200  R:radius-lg  FG:neutral-700

KPI Row: 4 cards  gap: 24px  margin-top: 32px

  Each KPI Card:
    BG: white  R: radius-xl  SH: shadow-sm  SP: 24px
    flex space-between align-start
    
    Left:
      Label: T: type-label-sm/600  FG: neutral-500  uppercase letter-spacing: 0.8px
      Value: T: type-mono-xl/700  FG: neutral-900  margin-top: 8px  tabular-nums
      Trend: margin-top: 8px  flex align-center  gap: 4px
        ↑ icon 14px: FG: success-600 (positive) / danger-600 (negative)
        "12% vs last month"  T: type-body-xs/400  FG: same color as icon
    
    Right: Icon in circle  W:44px H:44px R:full BG:brand-50  icon:22px brand-600
    
    KPI 1: "Revenue MTD" / "$3,240" / revenue icon
    KPI 2: "Occupancy" / "78%" / calendar icon
    KPI 3: "Reservations" / "4 pending" / BG: warning-50 icon: warning-500 (if pending > 0)
    KPI 4: "Avg Rating" / "⭐ 4.86" / star icon  BG: accent-100

Main grid: 2 cols  gap: 32px  margin-top: 32px

Left column (60%):

  "Today's Activity"  T: type-heading-lg/600  margin-bottom: 16px
  
  Activity card: BG: white  R: radius-xl  SH: shadow-sm  overflow: hidden
    
    Tab row: BG: --color-neutral-50  border-bottom: 1px neutral-100
      [Check-ins (2)] [Check-outs (1)] [Upcoming]
      Each tab: H:44px SP:0 20px T:type-label-md/500
      Active: FG: neutral-900  border-bottom: 2px brand-600
      Inactive: FG: neutral-500
    
    Content: SP: 4px 0
    
    Each reservation row:
      SP: 16px 20px  flex align-center  gap: 16px
      hover: BG: --color-neutral-50
      
      Avatar: W:40px H:40px R:full BG:brand-100  initials T:type-label-sm/600 brand-700
      
      Info:
        "Ahmed M."  T: type-body-sm/600  FG: neutral-900
        "Nile View Apt · arrives 3:00 PM"  T: type-body-xs/400  FG: neutral-500
      
      Status chip: right aligned  (see Badge component)
      Arrow: chevron-right 16px  FG: neutral-300

  "Revenue (Last 30 days)"  T: type-heading-lg/600  margin-top: 32px  margin-bottom: 16px
  
  Chart card: BG: white  R: radius-xl  SH: shadow-sm  SP: 24px
    Line chart: H: 200px  primary color: brand-600  area fill: brand-50
    Y axis: revenue values  X axis: dates  gridlines: neutral-100

Right column (40%):

  "Action Required"  T: type-heading-lg/600  margin-bottom: 16px
  
  Action items: BG: white  R: radius-xl  SH: shadow-sm  overflow: hidden
    Each item: SP: 16px 20px  flex align-center  gap: 12px
      border-bottom: 1px neutral-100
    
    Priority dot: W:8px H:8px R:full
    Icon: 20px
    Text: T: type-body-sm/500  FG: neutral-900
    Sub: T: type-body-xs/400  FG: neutral-500  margin-top: 2px
    [Action] link: right aligned  T: type-label-sm/600  FG: brand-600
    
    Urgent item: left border: 3px danger-500  BG: danger-50 (very subtle)

  "Unread Messages"  T: type-heading-lg/600  margin-top: 32px  margin-bottom: 16px
  
  Message previews: BG: white  R: radius-xl  SH: shadow-sm
    Each message: SP: 16px 20px  flex  gap: 12px  border-bottom: 1px neutral-100
      Avatar: W:40px H:40px R:full
      Right: name T:type-body-sm/600 + preview T:type-body-xs/400 FG:neutral-500 line-clamp:1
      Timestamp: T: type-caption  FG: neutral-400  float right top
      Unread dot: W:8px H:8px R:full BG:brand-600  float right
```

---

### D05 — Calendar Management

```
Layout: sidebar + full-width calendar view

Content: SP: 32px 48px

Header:
  "Nile View Apartment — Calendar"  T: type-display-sm/700  FG: neutral-900
  [← Back to Listings]  T: type-label-sm/500  FG: neutral-500
  
  Listing selector (if multiple): dropdown  H:44px  BG: white  border: neutral-300
  
  Controls row: flex space-between
    [← Previous month] [July 2026] [Next month →]
    Month nav: T: type-heading-md/600  FG: neutral-900
    Nav arrows: W:36px H:36px R:radius-md BG:white border:1px neutral-200  icon:neutral-600
    
    Right: [+ Block dates] button  [⚙️ Settings] button

Legend: flex  gap: 24px  margin-bottom: 24px
  Each: dot + label  T: type-body-sm/400  FG: neutral-600
  ● Available (neutral-100)  ● Booked (brand-600)  ● Blocked (neutral-400)  ● Pending (warning-400)

Calendar grid: 2 months side by side (desktop)
  Month container: BG: white  R: radius-xl  SH: shadow-sm  SP: 24px  flex-1

  Day-of-week header: 7 cols  T: type-label-sm/600  FG: neutral-400  uppercase  text-align: center  SP-bottom: 8px

  Day grid: 7 cols  row height: 56px
    
    Each day cell:
      H: 56px  text-align: center  position: relative  cursor: pointer
      Day number: T: type-body-sm/600  FG: neutral-900
      
      Available: hover BG: neutral-100  R: radius-md
      Booked: BG: brand-600  R: radius-md  FG: white
        Guest name snippet: T: type-caption FG: rgba(255,255,255,0.8) below number
      Blocked: BG: neutral-200  FG: neutral-400  cursor: not-allowed
      Today: ring: 2px brand-600  R: radius-md
      Selected range start: BG: brand-600 R: radius-full on left half
      Selected range mid: BG: brand-100
      Selected range end: BG: brand-600 R: radius-full on right half
      Past dates: FG: neutral-300  cursor: default

  Pricing override:
    Click a date → small popover:
      BG: white  SH: shadow-xl  R: radius-xl  SP: 16px  W: 220px
      "Override price for July 15"  T: type-heading-sm/600
      Input: prefix "$"  numeric  H:40px
      [Save] [Cancel] buttons
```

---

## ZONE E — ADMIN & BACK-OFFICE SCREENS

---

### E01 — Admin Dashboard

```
Layout: sidebar (dark variant) + content  BG: --surface-page

Dark sidebar:
  W: 240px  BG: --color-neutral-900  height: 100vh  position: fixed
  Logo: white variant  SP: 24px  margin-bottom: 32px
  
  Nav items:
    SP: 10px 16px  R: radius-lg  flex align-center  gap: 12px
    Icon: 20px  Label: T: type-label-md/500
    Default: FG: rgba(255,255,255,0.6)  icon-color: rgba(255,255,255,0.4)
    Hover: FG: rgba(255,255,255,0.9)  BG: rgba(255,255,255,0.06)
    Active: FG: white  BG: rgba(44,95,255,0.25)  icon: brand-400
    
    Badge on nav items: W:20px H:20px R:full BG:danger-500 FG:white T:type-label-sm/700

Content: margin-left: 240px  SP: 40px 48px

Page title row:
  "Admin Dashboard"  T: type-display-md/700  FG: neutral-900
  [current date + time]  T: type-body-sm/400  FG: neutral-500

Alert banners: margin-top: 20px
  BG: warning-50  border: 1px warning-200  border-left: 4px warning-500
  R: radius-lg  SP: 16px 20px  flex align-center  gap: 12px
  Icon: alert-triangle 20px warning-500
  Text: T: type-body-sm/500  FG: neutral-900  + sub T: type-body-sm/400 FG: neutral-600
  [Action] link: FG: brand-600  margin-left: auto
  Multiple alerts stack with 8px gap

KPI grid: 4 cards  gap: 24px  margin-top: 32px
  Larger KPI cards than host:
    SP: 28px  flex space-between align-center
    
    KPI 1: GMV  "$2.4M"  T: type-mono-xl/700
    KPI 2: Active Users  "12,450"
    KPI 3: Bookings Today  "847"
    KPI 4: Open Disputes  "12" — if > 0: icon BG: danger-50  icon: danger-500

Main grid: 3 cols  gap: 24px  margin-top: 32px
  Col 1 + 2 (66%): Revenue chart card
  Col 3 (33%): Quick actions + activity feed

Revenue chart card: BG: white  R: radius-xl  SH: shadow-sm  SP: 24px
  Header: "Platform Revenue"  T: type-heading-lg/600
  Period tabs: [7d] [30d] [90d] [12m]  small pill tabs
  Chart: area chart H:240px  brand-600 line  brand-50 fill
  Below chart: 3 micro stats in row (GMV, Fees, Avg Booking Value)

Quick Actions card: BG: white  R: radius-xl  SH: shadow-sm  SP: 24px
  "Quick Actions"  T: type-heading-sm/600  margin-bottom: 16px
  Buttons: W:100% H:40px each  gap: 8px
    [🔍 User Lookup]  [📋 Pending Listings (7)]  [⚖️ Active Disputes (3)]
    Style: BG: neutral-50  border: 1px neutral-200  R: radius-lg  T: type-label-sm/500  FG: neutral-700
    Hover: BG: brand-50  border: brand-200  FG: brand-700

Activity feed: BG: white  R: radius-xl  SH: shadow-sm  overflow: hidden
  "Recent Activity"  T: type-heading-sm/600  SP: 20px  border-bottom: 1px neutral-100
  Each item: SP: 12px 20px  flex  gap: 10px  border-bottom: 1px neutral-50
    Dot: W:8px H:8px R:full (color by event type)  margin-top: 6px
    Text: T: type-body-xs/400  FG: neutral-700  line-height: 1.5
    Time: T: type-caption  FG: neutral-400  float right  white-space: nowrap
```

---

### E05 — KYC Review Detail (Ops Screen)

```
Layout: sidebar + full-width detail panel (no split)

Content: SP: 32px 48px

Breadcrumb: Ops → KYC Queue → Case #KYC-00234

Case header:
  flex space-between align-start
  Left:
    "KYC Review — Ahmed Mohamed"  T: type-display-sm/700  FG: neutral-900
    "Submitted 2 hours ago · National ID"  T: type-body-sm/400  FG: neutral-500  margin-top: 8px
    Status badge: "Under Review" → warning variant
  Right:
    [Approve ✓]  [Reject ✗]  [Request Resubmit ↩]
    Approve: H:44px  BG: success-600  FG: white  R: radius-lg  T: type-label-md/600
    Reject: H:44px  BG: danger-600  FG: white  R: radius-lg
    Resubmit: H:44px  BG: white  border: 1px neutral-300  FG: neutral-700

2-column layout below: gap: 32px

Left (60%): Document images

  "Identity Document"  T: type-heading-md/600  margin-bottom: 16px
  
  Image tabs: [Front] [Back] [Selfie]
    small pill tabs  active: brand-600 bg  FG: white
  
  Image container: BG: neutral-900  R: radius-xl  overflow: hidden  aspect: 3:2
    Image: W:100%  object-fit: contain
    Zoom controls: bottom-right overlay buttons (+ / − / fullscreen)
    Image quality indicator:
      "Resolution: Good ✅" or "Resolution: Low ⚠️"
      T: type-label-sm/500  badge style  position: absolute top:12px left:12px

Right (40%): Extracted data + user profile

  "OCR Extracted Data"  T: type-heading-sm/600  margin-bottom: 16px
  
  Data fields: each row: flex space-between  SP: 12px 0  border-bottom: 1px neutral-100
    Label: T: type-label-sm/500  FG: neutral-500  uppercase
    Value: T: type-body-sm/600  FG: neutral-900
    Mismatch warning: ⚠️ icon  FG: warning-500  if extracted ≠ account data
  
  Fields: Full Name | ID Number | Date of Birth | Expiry Date | Nationality | Gender
  
  "Platform Account"  T: type-heading-sm/600  margin-top: 24px  margin-bottom: 16px
  
  Account data: same field list  compare to OCR
  
  "Rejection Reason"  (appears when Reject is clicked)
    Required field  R: radius-lg  H:100px (textarea)
    Reason selector: dropdown with preset reasons
      - "Document expired"
      - "Image too blurry"
      - "Name mismatch"
      - "Incomplete document"
      - "Suspected fraud"
      + "Other (specify)"

  Timeline:
    "Activity"  T: type-heading-sm/600  margin-top: 24px  margin-bottom: 16px
    Vertical timeline with dots:
      Account created
      KYC submitted
      Auto-check passed/failed
      Agent assigned
      [current] Under review
```

---

*Part 2 complete. Continue with Part 3: Component Library & Dashboards.*
