# StayOS — Visual Design System
## Part 3 of 4: Component Library · Dashboards · Responsive · Motion

**Continuation of:** VISUAL_DESIGN_SYSTEM_P2.md

---

# 6. COMPONENT LIBRARY

Every component is specified for all states, all sizes, desktop and mobile, LTR and RTL.

---

## 6.01 — Button

### Anatomy
```
[  leading-icon  ][  label text  ][  trailing-icon  ]
   (optional)                        (optional)
```

### Variants × States

| Variant | Default | Hover | Active | Focus | Disabled | Loading |
|---------|---------|-------|--------|-------|----------|---------|
| **Primary** | BG:`#2C5FFF` FG:white | BG:`#1A3FCC` | BG:`#1E3A8A` | BG:`#2C5FFF` + ring | opacity:0.4 | spinner white |
| **Secondary** | BG:white border:`2px #2C5FFF` FG:`#2C5FFF` | BG:`#EEF2FF` | BG:`#E0E7FF` | same + ring | opacity:0.4 | spinner brand |
| **Destructive** | BG:`#DC2626` FG:white | BG:`#B91C1C` | BG:`#991B1B` | + ring danger | opacity:0.4 | spinner white |
| **Ghost** | BG:transparent FG:`#374151` | BG:`#F3F4F6` | BG:`#E5E7EB` | + ring neutral | opacity:0.4 | spinner neutral |
| **Link** | BG:none FG:`#2C5FFF` underline:none | underline | FG:`#1A3FCC` | FG:brand ring | opacity:0.4 | — |
| **Icon-only** | square R:radius-md | same hover rule | — | + ring | opacity:0.4 | spinner |

### Sizes

| Size | H | Min-W | H-padding | Font | Icon |
|------|---|-------|-----------|------|------|
| `xs` | 28px | 64px | 8px | 12px/500 | 14px |
| `sm` | 36px | 80px | 12px | 14px/500 | 16px |
| `md` | 44px | 96px | 16px | 15px/500 | 18px |
| `lg` | 52px | 120px | 24px | 16px/600 | 20px |
| `xl` | 60px | 160px | 32px | 18px/600 | 22px |

### Loading State
- Label text becomes invisible (opacity: 0), spinner centered
- Spinner: 16px (sm/md) or 20px (lg/xl), 2px stroke, rotates 360° in 700ms linear infinite
- Button remains same size (no layout shift)
- `cursor: wait`, `pointer-events: none`

### Icon Placement
- Leading icon: margin-right 8px (sm/md), 10px (lg/xl)
- Trailing icon: margin-left 8px (sm/md), 10px (lg/xl)
- Icon-only buttons: equal padding all sides, W=H

### RTL
- Leading/trailing icons swap positions
- Text direction: RTL
- Visual order mirrors: icon right becomes icon left

---

## 6.02 — Form Inputs

### Text Input

```
Label: type-label-sm/600  FG: neutral-600  margin-bottom: 6px
Optional mark: " (optional)"  type-body-xs/400  FG: neutral-400

Input container: H:44px  R:radius-md  BG:surface-input
border: 1.5px  transition: border-color 150ms, box-shadow 150ms

Leading icon (optional): 20px  FG:neutral-400  margin: 0 12px
Trailing icon (optional): 20px  FG:neutral-400  margin: 0 12px
Clear button (×): 16px  FG:neutral-400  appears when value exists

Placeholder: FG:neutral-400  type-body-md/400
Value: FG:neutral-900  type-body-md/400

Helper text: margin-top: 6px  type-body-xs/400  FG:neutral-500
Error text: margin-top: 6px  type-body-xs/400  FG:danger-600  + ⚠ icon 12px
```

**States:**
| State | Border | BG | Box-shadow |
|-------|--------|----|------------|
| Default | `1.5px #D1D5DB` | white | none |
| Hover | `1.5px #9CA3AF` | white | none |
| Focus | `2px #2C5FFF` | white | `shadow-focus-brand` |
| Filled | `1.5px #D1D5DB` | white | none |
| Error | `2px #EF4444` | `#FFF5F5` | `shadow-focus-error` |
| Disabled | `1.5px #E5E7EB` | `#F9FAFB` | none |
| Read-only | `1.5px #E5E7EB` | `#F9FAFB` | none |

### Textarea

Same as text input but:
- Height: min 100px, resizable vertically
- `resize: vertical` only
- Character count: bottom-right `FG:neutral-400` type-caption
  Turns `danger-600` when approaching limit

### Select

```
H:44px  R:radius-md  border: 1.5px neutral-300
flex space-between align-center  SP: 0 12px
Selected value: type-body-md/400  FG:neutral-900
Placeholder: FG:neutral-400
Trailing chevron-down: 16px  FG:neutral-400  transition: rotate 200ms on open

Dropdown:
  position: absolute  top: 100%+4px  left: 0  right: 0
  BG:white  R:radius-xl  SH:shadow-xl  border:1px neutral-200
  max-height: 280px  overflow-y: auto  z-index: var(--z-dropdown)
  
  Each option: H:40px  SP:0 16px  flex align-center
    type-body-sm/400  FG:neutral-700
    Hover: BG:neutral-50
    Selected: BG:brand-50  FG:brand-700  + check icon right 16px brand-600
    Disabled: FG:neutral-300  cursor:not-allowed
  
  Option group header: type-label-xs/600  FG:neutral-400  uppercase  SP:8px 16px
```

### Checkbox

```
Box: W:18px H:18px  R:radius-sm  border:1.5px neutral-300
Transition: 100ms

States:
  Unchecked: BG:white  border:neutral-300
  Hover: border:neutral-400
  Checked: BG:brand-600  border:brand-600  ✓ white 10px centered
  Indeterminate: BG:brand-600  border:brand-600  — white 2px centered
  Focused: + shadow-focus-brand
  Disabled: BG:neutral-100  border:neutral-200  cursor:not-allowed
  Disabled+Checked: BG:neutral-300  border:neutral-300

Label: margin-left: 10px  type-body-md/400  FG:neutral-700  cursor:pointer
```

### Radio

```
Circle: W:18px H:18px  R:radius-full  border:1.5px neutral-300
Selected: border:brand-600  inner dot W:8px H:8px R:full BG:brand-600  centered
Same states as checkbox but round
```

### Toggle Switch

```
Track: W:44px H:24px  R:radius-full
Off: BG:neutral-300
On: BG:brand-600
Transition: background 200ms ease

Knob: W:20px H:20px  R:radius-full  BG:white  SH:shadow-sm
Off position: translateX(2px)
On position: translateX(22px)
Transition: transform 200ms cubic-bezier(0.34,1.56,0.64,1)  (spring)

Focus: + shadow-focus-brand on track
Disabled: opacity 0.5

Label: margin-left: 10px  type-body-md/400  FG:neutral-700
```

### Date Picker

```
Calendar popup:
  BG:white  R:radius-2xl  SH:shadow-xl  SP:24px
  W:320px (single) / 640px (range, 2 months)

Month nav:
  flex space-between align-center  margin-bottom: 16px
  "July 2026"  type-heading-md/600  FG:neutral-900
  Nav arrows: W:32px H:32px R:radius-md  hover:BG:neutral-100  icon:20px neutral-600

Day headers: 7 cols  type-label-sm/600  FG:neutral-400  text-align:center  margin-bottom:8px

Day grid:
  7 cols  gap: 2px
  Each day: W:40px H:40px  flex center  R:radius-full
    type-body-sm/600  FG:neutral-900
    Hover: BG:neutral-100
    Today: border:2px brand-600
    Selected: BG:brand-600  FG:white
    Range start/end: BG:brand-600  FG:white  R: one side flat
    Range middle: BG:brand-50  FG:neutral-700  R:0
    Disabled: FG:neutral-300  cursor:not-allowed
    Other month: FG:neutral-300
```

### Phone Input

```
Country code selector: W:88px H:44px  R:radius-md left side
  BG:neutral-50  border:1.5px neutral-300  border-right:none
  Flag emoji (20×15 visual): + dial code  type-body-md/400  FG:neutral-700
  Chevron: 12px FG:neutral-400
  Dropdown: same as Select dropdown pattern

Phone field: flex-grow H:44px  border-left:none R:radius-md right side
  border:1.5px neutral-300
  Joined visually with country selector (no gap)
  type-body-md/400 (16px — iOS zoom prevention)
```

---

## 6.03 — Cards

### Property Card — 3 Variants

**Variant A: Grid card (Search results, homepage)**
```
R:radius-xl  overflow:hidden  BG:white  SH:shadow-sm
Hover: SH:shadow-md  transform:translateY(-3px)
Transition: all 200ms ease-out  cursor:pointer

Photo: aspect-ratio:3/2  overflow:hidden  position:relative
  img: W:100% H:100% object-fit:cover
  Hover: transform:scale(1.05) transition:500ms ease
  
  Overlay buttons (visible always):
    Wishlist ♥: top:12px right:12px  W:32px H:32px R:radius-full
      BG:rgba(255,255,255,0.85) backdrop-filter:blur(4px) SH:shadow-sm
      icon:heart 16px  empty:neutral-600  filled:danger-500(fill)
    
    Photo count badge: bottom:12px right:12px (optional)
      BG:rgba(0,0,0,0.6) FG:white R:radius-sm SP:4px 8px type-caption/600

Info: SP:12px

  Row 1: space-between align-start
    Name: type-heading-sm/600 FG:neutral-900  max 1-line ellipsis  flex-1 mr:8px
    Rating: flex align-center gap:4px  star:14px accent-400  type-label-sm/700 FG:neutral-900
  
  Row 2: margin-top:4px
    Location: type-body-xs/400 FG:neutral-500
  
  Row 3: margin-top:4px
    Dates: type-body-xs/400 FG:neutral-500
  
  Row 4: margin-top:8px  flex align-baseline
    Price: type-heading-sm/600 FG:neutral-900
    "/night": type-body-xs/400 FG:neutral-500 ml:3px
```

**Variant B: Compact list card (Dashboard recent trips)**
```
flex  gap:12px  SP:12px  BG:white  R:radius-xl  SH:shadow-xs
Hover: BG:neutral-50

Photo: W:72px H:56px  R:radius-lg  object-fit:cover  flex-shrink:0

Info: flex-1
  Name: type-body-sm/600  FG:neutral-900  line-clamp:1
  Meta: type-body-xs/400  FG:neutral-500  margin-top:2px

Right: flex-col align-end
  Status badge
  Chevron: 14px neutral-300  margin-top:auto
```

**Variant C: Booking confirmation card**
```
BG:linear-gradient(135deg, #1A3FCC 0%, #2C5FFF 100%)
R:radius-2xl  SP:32px  flex space-between
SH:0 8px 32px rgba(44,95,255,0.3)

Left:
  Eyebrow: type-label-sm/600 FG:rgba(255,255,255,0.7) uppercase ls:0.8px
  Title: type-display-sm/700 FG:white margin-top:8px
  Meta: type-body-sm/400 FG:rgba(255,255,255,0.8) margin-top:4px
  CTA: ghost white button margin-top:20px

Right: Property thumbnail W:140px H:100px R:radius-xl object-fit:cover
```

### Dashboard KPI Card

```
BG:white  R:radius-xl  SH:shadow-sm  SP:24px
flex space-between align-center

Left:
  Label: type-label-sm/600 FG:neutral-500 uppercase ls:0.8px mb:8px
  Value: type-mono-xl/700 FG:neutral-900 tabular-nums
  Trend (if applicable): flex align-center gap:4px mt:8px
    Icon: arrow-up/down 14px
    Text: type-body-xs/400
    Positive: icon+text FG:success-600
    Negative: icon+text FG:danger-600
    Neutral: FG:neutral-500

Right:
  Icon container: W:44px H:44px R:radius-xl
  Default: BG:brand-50  icon:22px brand-600
  Warning: BG:warning-50  icon:warning-500
  Success: BG:success-50  icon:success-600
  Danger: BG:danger-50  icon:danger-500
```

---

## 6.04 — Navigation Components

### Top Navigation Bar

```
H:72px(desktop) / 60px(mobile)
BG: var(--surface-nav)  border-bottom: 1px neutral-200  SH:shadow-xs
position:sticky  top:0  z-index:var(--z-fixed)
SP: 0 48px(desktop) / 0 16px(mobile)

Logo: W:120px  flex-shrink:0

Search pill (desktop center):
  W:480px  H:48px  R:radius-full
  BG:white  SH:shadow-md  border:1px neutral-200
  (full spec in A01 above)

Right actions: flex align-center gap:8px

Hero/transparent variant (homepage scroll-off):
  BG:transparent  border-bottom:none  SH:none
  logo: white  text: white
  Transition: all 200ms ease on scroll
```

### Sidebar — Light Variant

```
W:240px (expanded) / 64px (collapsed)
H:100vh  position:fixed  left:0  top:72px
BG:white  border-right:1px neutral-200
overflow-y:auto  overflow-x:hidden
Transition: width 200ms ease

User section: SP:16px 20px  border-bottom:1px neutral-100
  Expanded:
    Avatar: W:40px H:40px R:radius-full  BG:brand-600
    Initials/photo: centered type-label-md/600 white
    Right: name type-body-sm/600 FG:neutral-900
           role type-caption FG:neutral-500
    Gap:12px
  Collapsed:
    Avatar centered  no text

Nav section: SP:8px 12px

Section label (expanded only):
  type-label-xs/600 FG:neutral-400 uppercase ls:0.8px SP:8px 12px mb:4px

Nav item:
  H:40px  R:radius-lg  flex align-center
  Expanded: SP:0 12px  gap:10px
  Collapsed: justify-center W:40px margin:auto
  
  Default: FG:neutral-600  BG:transparent  icon:neutral-400
  Hover: BG:neutral-50  FG:neutral-900  icon:neutral-600
  Active: BG:brand-50  FG:brand-700  icon:brand-600  border-left:3px brand-600
  
  Icon: 20px
  Label (expanded): type-label-md/500
  Badge: W:20px H:20px R:full BG:danger-500 FG:white type-label-sm/700
         (collapsed: dot W:8px H:8px top-right of icon)

Collapse toggle: bottom: 16px  centered (on scroll)
  Button: W:28px H:28px R:radius-md BG:white border:1px neutral-200 SH:shadow-sm
  Icon: chevrons-left (expanded) / chevrons-right (collapsed) 14px neutral-500
```

### Sidebar — Dark Variant (Admin/Finance zones)

```
BG:#111827  border-right:none
User section: border-bottom:1px rgba(255,255,255,0.08)
Section label: FG:rgba(255,255,255,0.3)
Nav item default: FG:rgba(255,255,255,0.5)  icon:rgba(255,255,255,0.35)
Nav item hover: BG:rgba(255,255,255,0.06)  FG:rgba(255,255,255,0.85)
Nav item active: BG:rgba(44,95,255,0.2)  FG:white  border-left:3px #4F7BFF  icon:#818CF8
```

### Bottom Tab Bar (Mobile)

```
H:64px + safe-area-inset-bottom
position:fixed  bottom:0  left:0  right:0
BG:white  border-top:1px neutral-200
display:flex(mobile only, hidden desktop/tablet)

5 tabs evenly spaced (flex):
  Each tab: flex-1  flex-col align-center justify-center  gap:4px
  Tap target: full H  W:100%  cursor:pointer
  
  Icon: 24px
  Label: type-label-sm/500  (12px)
  
  Default: icon+label FG:neutral-400
  Active: icon+label FG:brand-600  icon:filled variant
  
  Notification dot: W:8px H:8px R:full BG:danger-500
    position:absolute top:8px right:calc(50%-16px)
```

### Breadcrumb

```
flex align-center gap:8px  height:24px

Each item: type-body-sm/400 FG:neutral-500
  Hover: FG:neutral-700 underline
  
Current page: type-body-sm/500 FG:neutral-900  no hover/underline

Separator: / character  FG:neutral-300  (not a link)

Collapsed (>3 levels): "… /" replaces middle items
  … is a button that expands on click
```

---

## 6.05 — Status Badges

```
Base: inline-flex align-center gap:5px
SP:4px 10px  R:radius-full  white-space:nowrap

dot: W:7px H:7px R:full  flex-shrink:0
text: type-label-sm/500

Variants:

● Confirmed    dot:#059669  text:#047857  BG:#D1FAE5  border:none
● Pending      dot:#D97706  text:#B45309  BG:#FEF3C7
● Cancelled    dot:#6B7280  text:#4B5563  BG:#F3F4F6
● Checked In   dot:#2C5FFF  text:#1D4ED8  BG:#DBEAFE
● Disputed     dot:#DC2626  text:#B91C1C  BG:#FEE2E2
● Completed    dot:#059669  text:#047857  BG:#D1FAE5
● Under Review dot:#D97706  text:#B45309  BG:#FEF3C7
● Verified     icon:check-circle filled  text:#047857  BG:#D1FAE5  no dot
● Draft        dot:#6B7280  text:#4B5563  BG:#F3F4F6
● Active       dot:#059669  text:#047857  BG:#D1FAE5
● Suspended    dot:#DC2626  text:#B91C1C  BG:#FEE2E2
● Approved     icon:check filled  text:#047857  BG:#D1FAE5
● Rejected     icon:x filled     text:#B91C1C  BG:#FEE2E2

Size variants:
  sm: SP:3px 8px  dot:6px  type-label-xs/500 (11px)
  md: SP:4px 10px  dot:7px  type-label-sm/500 (12px)  ← default
  lg: SP:6px 12px  dot:8px  type-label-md/500 (14px)
```

---

## 6.06 — Modal / Dialog

### Standard Modal

```
Backdrop: position:fixed inset:0 BG:rgba(0,0,0,0.5) z-index:var(--z-overlay)
  Backdrop click: close (if not critical)
  Fade in: opacity 0→1  150ms ease-out

Modal container:
  position:fixed top:50% left:50% transform:translate(-50%,-50%)
  z-index:var(--z-modal)
  BG:white  R:radius-2xl  SH:shadow-2xl
  max-height:90vh  overflow:hidden  display:flex flex-col
  
  Open animation: scale 0.96→1 + opacity 0→1  200ms ease-out
  Close animation: scale 1→0.96 + opacity 1→0  150ms ease-in

Sizes:
  sm: W:400px
  md: W:560px
  lg: W:720px
  xl: W:960px
  full: W:100vw H:100vh R:0 top:0 left:0 transform:none

Modal header: SP:24px 28px  border-bottom:1px neutral-100  flex align-center
  Title: type-display-sm/600 FG:neutral-900  flex-1
  Close: X button W:36px H:36px R:radius-md FG:neutral-400  hover:BG:neutral-100

Modal body: SP:28px  overflow-y:auto  flex-1

Modal footer: SP:20px 28px  border-top:1px neutral-100
  flex justify-end gap:12px
  [Cancel] secondary button  +  [Primary action] button
```

### Bottom Sheet (Mobile Modal)

```
Backdrop: same as modal backdrop

Sheet:
  position:fixed bottom:0 left:0 right:0
  BG:white  R:radius-3xl on top  R:0 bottom
  SH:shadow-2xl  z-index:var(--z-modal)
  max-height:90vh  overflow:hidden  display:flex flex-col
  
  Open: translateY 100%→0  300ms cubic-bezier(0.0,0.0,0.2,1)
  Close: translateY 0→100%  200ms cubic-bezier(0.4,0.0,1,1)
  
  Drag handle: W:36px H:4px R:radius-full BG:neutral-300  mx:auto mt:12px mb:8px
  
  Header: same as modal header but SP:16px 20px
  Body: SP:20px  overflow-y:auto
  Footer: SP:16px 20px  safe-area padding bottom
```

---

## 6.07 — Toast / Notification

```
Position: fixed  top:80px right:16px  z-index:var(--z-toast)
Stack: gap:8px  flex-col  align items right

Each toast:
  min-W:320px  max-W:420px
  BG:white  R:radius-xl  SH:shadow-xl  border:1px neutral-200
  SP:14px 16px  flex align-center gap:12px
  
  Icon container: W:32px H:32px R:radius-lg  flex-shrink:0
    Success: BG:success-50  icon:check-circle success-500
    Error:   BG:danger-50   icon:x-circle danger-500
    Warning: BG:warning-50  icon:alert-circle warning-500
    Info:    BG:info-50     icon:info-circle info-500
  
  Content: flex-1
    Title: type-body-sm/600 FG:neutral-900
    Body (optional): type-body-xs/400 FG:neutral-500 mt:2px
  
  Dismiss ×: W:24px H:24px FG:neutral-400 hover:neutral-600  flex-shrink:0

  Enter: translateX(calc(100%+16px))→0  opacity 0→1  300ms ease-out
  Exit: translateX(calc(100%+16px))  opacity 1→0  200ms ease-in
  
  Auto-dismiss timing:
    Success: 4000ms
    Info: 5000ms
    Warning: 6000ms
    Error: 8000ms (no auto-dismiss option)
  
  Progress bar (auto-dismiss): H:2px BG:neutral-200 at bottom
    Fill: countdown animation left-to-right  duration matches auto-dismiss
```

---

## 6.08 — Data Table

```
Container: BG:white  R:radius-xl  SH:shadow-sm  overflow:hidden

Table header row: H:48px  BG:neutral-50  border-bottom:2px neutral-200
  Each th: SP:0 16px  flex align-center gap:6px
    Text: type-label-sm/600  FG:neutral-500  uppercase ls:0.5px
    Sort icon: arrows-up-down 14px FG:neutral-400
      Active sort: single arrow  FG:neutral-700
    Sortable: hover FG:neutral-700  cursor:pointer

Table rows: H:52px  border-bottom:1px neutral-100
  Hover: BG:neutral-50
  Selected: BG:brand-50
  
  Each td: SP:0 16px  type-body-sm/400  FG:neutral-700
  First td: FG:neutral-900  type-body-sm/600
  
  Action cell (last): flex align-center justify-end gap:8px
    Icon button: W:32px H:32px R:radius-md  hover:BG:neutral-100  icon:16px FG:neutral-500
    [•••] more menu button: same style

Checkbox column (selectable tables):
  W:48px  checkbox centered  SH:none
  Select all in header
  Selected row: checkbox checked + BG:brand-50

Bulk action bar (appears when rows selected):
  H:52px BG:brand-600 text:white  position:sticky top:48px z-index:10
  flex align-center SP:0 16px gap:16px
  "X rows selected"  type-label-sm/600 white
  Action buttons: ghost white variant

Empty state (inside table area):
  Min-height:240px  flex-col center
  Illustration 80px  mb:16px
  type-heading-sm/600 FG:neutral-600
  type-body-sm/400 FG:neutral-400  mt:4px
  CTA button if applicable mt:16px

Pagination: SP:12px 16px border-top:1px neutral-100 flex align-center space-between
  Left: "Showing 1–20 of 124 results"  type-body-sm/400 FG:neutral-500
  Right: page buttons
    Page btn: W:36px H:36px R:radius-md type-label-sm/500
    Default: FG:neutral-600
    Current: BG:brand-600 FG:white
    Hover: BG:neutral-100
    Disabled: FG:neutral-300
    [←Prev] [1][2][3][…][9][Next→]
    
  Per-page selector: H:36px type-label-sm/500 border:1px neutral-200 R:radius-md SP:0 12px
```

---

## 6.09 — Empty States

**Template structure for all empty states:**
```
Container: flex-col align-center  SP:48px 24px  text-align:center

Illustration: SVG W:160px H:160px  mb:24px
  Style: outline only, 1.5px stroke neutral-300, accent spot color brand-600 or warning-400

Title: type-display-sm/600  FG:neutral-700  mb:8px

Body: type-body-md/400  FG:neutral-400  max-width:360px  line-height:1.7  mb:24px

Primary CTA: brand primary button  lg size
Secondary link (optional): type-label-md/500 FG:brand-600 mt:12px
```

**All Required Empty States:**

| Screen | Title | Body | CTA |
|--------|-------|------|-----|
| No trips | "No trips yet" | "When you book your first stay, it will appear here." | Explore stays |
| No wishlists | "Your lists are empty" | "Save places you love as you browse." | Start exploring |
| No messages | "No messages" | "When you make a booking or contact a host, messages appear here." | Explore stays |
| No listings | "List your first property" | "Start earning by sharing your space with guests." | Create listing |
| No reservations | "No reservations yet" | "When guests book your properties, reservations will appear here." | — |
| No results (search) | "No places match" | "Try adjusting your filters or searching a different location." | Clear filters |
| No notifications | "You're all caught up" | "We'll let you know when something needs your attention." | — |
| No payouts | "No payouts yet" | "Add a bank account and start hosting to receive your first payout." | Add bank account |
| No KYC cases | "Queue is clear" | "All identity verification cases have been reviewed." | — |
| Support queue empty | "No open tickets" | "All support cases have been resolved." | — |

---

## 6.10 — Loading / Skeleton States

### Skeleton Pulse Animation

```css
/* Token reference — implemented in CSS */
shimmer-bg: linear-gradient(
  90deg,
  var(--color-neutral-100) 25%,
  var(--color-neutral-200) 50%,
  var(--color-neutral-100) 75%
)
animation: shimmer 1.5s ease-in-out infinite
background-size: 400% 100%
```

### Skeleton — Property Card
```
Photo area: W:100% aspect:3/2  R:radius-xl BG:shimmer
Below photo: SP:12px
  Line 1: W:80%  H:16px  R:radius-sm BG:shimmer  mb:8px
  Line 2 (rating row): W:50%  H:12px R:radius-sm BG:shimmer  mb:8px
  Line 3 (price): W:40%  H:20px R:radius-sm BG:shimmer
```

### Skeleton — Data Table
```
Header row: H:48px BG:neutral-50
5 skeleton rows:
  Each: H:52px border-bottom:1px neutral-100
  Columns: 3 pills at 25% / 40% / 15% widths  H:14px R:radius-sm BG:shimmer
```

### Skeleton — KPI Card
```
SP:24px flex space-between
  Left:
    W:80px H:12px R:sm BG:shimmer mb:12px  (label)
    W:120px H:36px R:md BG:shimmer mb:12px  (value)
    W:100px H:12px R:sm BG:shimmer  (trend)
  Right: W:44px H:44px R:radius-xl BG:shimmer
```

### Page-Level Skeleton
- Full page layout reproduced as skeleton shapes
- Navigation renders normally (not skeletonized — it's pre-rendered)
- Content area: skeleton pattern matching expected layout
- Duration: max 300ms before real data should arrive; if >300ms show skeleton

---

## 6.11 — Star Rating

### Display (read-only)

```
5 stars inline  gap:2px
Filled: ★ 16px  FG:--color-accent-400 (#FACC15)
Empty: ★ 16px  FG:--color-neutral-300
Half: clip-path or SVG half-star

Alongside score: "4.9" type-label-sm/700 FG:neutral-900 ml:4px
Review count: "(127 reviews)" type-body-xs/400 FG:neutral-500 ml:4px
```

### Input (interactive)

```
5 stars  W:36px H:36px each  cursor:pointer

Idle: ★ 32px FG:neutral-300
Hover up to N: fill stars 1-N  FG:accent-400
  Transition: fill color 50ms
Selected: fill stars 1-N  FG:accent-400  scale:1.1

Underneath: label text per rating:
  1: "Terrible"  2: "Poor"  3: "OK"  4: "Good"  5: "Excellent"
  T: type-body-sm/500  FG:neutral-600  text-align:center
  Transition: opacity 0→1 150ms when stars hovered
```

---

# 7. RESPONSIVE DESIGN RULES

## 7.1 Layout Shift Rules

**Absolute rules — never violate:**
1. No horizontal scroll on any breakpoint
2. Text never overlaps images or other text
3. Buttons always ≥44px touch target on mobile
4. Input text ≥16px on mobile (iOS zoom prevention)
5. Modals become bottom sheets at <768px
6. Sidebars become drawers at <768px
7. Tables become card lists at <640px

## 7.2 Component Responsive Behavior

| Component | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| Property grid | 3–4 col | 2 col | 1 col |
| KPI cards | 4 col | 2×2 | 1 col scroll-x |
| Nav | Top+sidebar | Top+icon sidebar | Top minimal+bottom tabs |
| Search bar | 480px center pill | 100% top bar | Full-screen overlay |
| Modals | Centered overlay | Centered overlay | Bottom sheet |
| Filters | Left sidebar 280px | Collapsible panel | Bottom sheet |
| Booking widget | Sticky right column | Below info | Sticky bottom CTA bar |
| Data tables | Full | Reduced cols | Card list view |
| Charts | Full-width in col | Full-width | Simplified (fewer data points) |
| Calendar | 2 months side-by-side | 2 months | 1 month full-width |
| Messages | 3-pane (list+thread+detail) | 2-pane | 1 pane (list→thread drill) |

## 7.3 Navigation Responsive Rules

```
≥1280px (Desktop M):
  Top nav: Logo + search pill + right actions
  Sidebar: 240px expanded, always visible
  Bottom tabs: hidden
  Content: margin-left:240px

1024–1279px (Desktop S):
  Top nav: Logo + search pill + right actions
  Sidebar: 64px icon-only
  Content: margin-left:64px

768–1023px (Tablet):
  Top nav: Logo + compact search + right actions
  Sidebar: 64px icon-only, hover expands to 240px overlay
  Bottom tabs: hidden
  Content: margin-left:64px

<768px (Mobile):
  Top nav: Logo + hamburger (opens drawer)
  Sidebar: hidden, hamburger → full-width overlay drawer
  Bottom tabs: visible  H:64px + safe area
  Content: no margin-left, full-width
```

## 7.4 Ultra-Wide (≥1920px)

```
Content max-width: 1440px  centered with auto margins
Side gutters: fill with --surface-page background
Grid: remains 12-column within 1440px container
Navigation: sidebar + top nav remain standard widths
Charts: cap at 100% of their column, not full ultra-wide
```

## 7.5 Foldables / Dual-screen

```
Detected via: window.visualViewport  + CSS env(viewport-segment-*)
When folded (phone mode): treat as mobile <480px
When unfolded: treat as tablet 768–1023px
Avoid placing interactive elements in fold seam zone (center 24px)
Test: Galaxy Fold (inner: 884×2208, outer: 260×512)
```

## 7.6 Print Media

```
@media print:
  Navigation: hidden
  Sidebars: hidden
  Booking confirmation / receipts: print-friendly
  BG: white  FG: black  Remove all shadows
  Show URLs for links
  Page-break-before: heading sections
```

---

# 8. MOTION DESIGN

## 8.1 Motion Hierarchy

**Three tiers of motion — use sparingly and purposefully:**

| Tier | Type | Duration | When |
|------|------|----------|------|
| **Micro** | Button feedback, focus rings, hover states | 50–150ms | Always |
| **Component** | Modals, toasts, drawers, dropdowns | 150–300ms | On open/close |
| **Page** | Route transitions, major view changes | 200–400ms | Navigation |

**Rule:** Never animate more than 2 things simultaneously. Chain when needed.

## 8.2 Easing Reference

```
Ease curves for each use case:

Entering elements (decelerate — starts fast, ends slow):
  cubic-bezier(0.0, 0.0, 0.2, 1)  — drawers sliding in, modals appearing

Exiting elements (accelerate — starts slow, ends fast):
  cubic-bezier(0.4, 0.0, 1, 1)   — drawers sliding out, dismissed toasts

Reposition (standard — symmetrical):
  cubic-bezier(0.4, 0.0, 0.2, 1)  — accordion, tab switching, layout shifts

Delight (spring — overshoot):
  cubic-bezier(0.34, 1.56, 0.64, 1)  — wishlist heart, success checkmark, badge bounce
  MAX overshoot: 5% — subtle, not cartoonish

Linear:
  linear — progress bars, loading spinners
```

## 8.3 Complete Interaction Specifications

### Page Transitions (Route Changes)

```
Current page out:
  opacity: 1→0  transform: translateY(0)→translateY(-8px)
  Duration: 150ms  Ease: accelerate

Next page in:
  opacity: 0→1  transform: translateY(8px)→translateY(0)
  Duration: 200ms  Ease: decelerate
  Delay: 0ms (starts as old page exits)

Drill-down (e.g. list → detail):
  Current: translateX(0)→translateX(-20px)  opacity 1→0  150ms
  Next: translateX(30px)→translateX(0)  opacity 0→1  200ms

Back navigation:
  Same as drill-down but reversed X direction
```

### Modal / Dialog

```
Open:
  Backdrop: opacity 0→0.5  150ms ease-out
  Modal: scale(0.96)→scale(1)  opacity 0→1  200ms ease-out
  
Close:
  Backdrop: opacity 0.5→0  150ms ease-in (delay 50ms)
  Modal: scale(1)→scale(0.96)  opacity 1→0  150ms ease-in
```

### Bottom Sheet (Mobile)

```
Open:
  Backdrop: opacity 0→0.5  200ms
  Sheet: translateY(100%)→translateY(0)  300ms  ease: decelerate
  
Close:
  Sheet: translateY(0)→translateY(100%)  250ms  ease: accelerate
  Backdrop: opacity 0.5→0  200ms
  
Drag to dismiss:
  Follow touch Y (only downward)
  Drag >30% height → snap close with accelerate ease
  Drag <30% → snap back with spring ease
```

### Sidebar Expand / Collapse

```
Width: 64px↔240px  200ms  ease-in-out
Label text: opacity 0→1 (delay 100ms, duration 100ms) on expand
             opacity 1→0 (duration 80ms) on collapse
Chevron icon: rotate 0°→180° / 180°→0°  200ms ease-in-out
```

### Dropdown Menu

```
Open:
  translateY(-4px)→translateY(0)  opacity 0→1
  Duration: 150ms  Ease: decelerate
  transform-origin: top (top-aligned) / bottom (upward-opening)

Close:
  translateY(0)→translateY(-4px)  opacity 1→0
  Duration: 100ms  Ease: accelerate
```

### Accordion / Expandable Section

```
Open:
  Height: 0→auto (use max-height trick)
  max-height: 0→500px  300ms  ease-out
  opacity: 0→1  150ms  delay: 50ms
  Chevron: rotate 0°→180°  200ms  ease-in-out

Close:
  max-height: 500px→0  200ms  ease-in
  opacity: 1→0  100ms
  Chevron: rotate 180°→0°  200ms
```

### Success / Confirmation Animations

```
Booking confirmed:
  1. Checkmark SVG draw: stroke-dashoffset animation  400ms  ease-out
  2. Circle pulse: scale 1→1.1→1  opacity 0.5→0  600ms
  3. Confetti: 50 particles, random directions, gravity fall  1200ms
  4. "Booking Confirmed" text: opacity 0→1  300ms  delay 300ms

Wishlist saved (♥ fill):
  1. scale 1→1.4  100ms spring
  2. color change (outline→fill red): 100ms
  3. scale 1.4→1  200ms spring
  Total: 300ms

KYC submitted checkmark:
  Shield icon draws: stroke animation  500ms  ease-out
  Fill: color sweeps in  200ms  delay 400ms
  
Payment processing:
  Full-screen overlay: opacity 0→0.95  200ms
  Spinner: continuous rotation 700ms linear infinite
  Text: "Processing your payment…"
  On success: spinner crossfades to checkmark  400ms
  Overlay fade out: 500ms delay 600ms
```

### Skeleton → Content Reveal

```
Content appears: opacity 0→1  300ms  ease-out
Skeleton fades: opacity 1→0  200ms  ease-in
Crossfade (simultaneous but skeleton 100ms head start on fade-out)
No scale change — position-stable reveal only
```

### OTP Input Shake (Error)

```
translateX: 0 → 6px → -6px → 5px → -5px → 3px → -3px → 0
Duration: 400ms  Ease: ease-in-out
Repeat: 1 time
Also: border-color flashes danger then holds
```

### Number Counter Animation (KPI Widgets)

```
On mount / data load:
  Count from 0 to target value
  Duration: 800ms
  Ease: cubic-bezier(0.0, 0.2, 0.8, 1.0)  (slow start, slow end)
  Update: requestAnimationFrame
  Format: apply full formatting at each step (commas, currency, %)
```

## 8.4 Reduced Motion

```
@media (prefers-reduced-motion: reduce) {
  All transitions: duration 50ms max, opacity only (no transform/scale)
  Skeleton animation: disabled (static neutral color)
  Counter animation: instant final value
  Confetti: instant checkmark, no particles
  Spinner: still shown (functional loading indicator)
  Bottom sheet: instant (no slide, still appears)
}
```

---

*Part 3 complete. Continue with Part 4: Accessibility, Design Tokens final, Prototype Spec, Dark Mode, RTL.*
