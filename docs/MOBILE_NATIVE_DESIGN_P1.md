# StayOS — Native Mobile Design System
## P1: Design Principles · Layout System · Responsive Grid

**Version:** 1.0 | **Status:** Production-Ready
**Extends:** VISUAL_DESIGN_SYSTEM_P1–P4.md
**Target:** Flutter / React Native engineers + QA + Mobile Product

> Every principle, measurement, and rule here supersedes desktop equivalents when building native mobile applications. No UX question should remain after reading this document.

---

# PART 1 — MOBILE DESIGN PRINCIPLES

## 1.1 Mobile-First Philosophy

StayOS mobile is not a port of the web product. It is a **native-first** experience designed for hands, motion, and context.

**The three mobile truths:**
1. **Context is everything** — users open the app on a bus, in a hotel lobby, at 2am before a trip. Design for interrupted, one-glance sessions.
2. **Thumbs are the primary input** — every interaction is designed for thumb reach before any other consideration.
3. **Network is unreliable** — every screen must gracefully handle latency, failure, and zero connectivity.

**Design mode:**
- Think: gestures first, buttons second
- Think: content first, chrome second
- Think: one task per screen, not one screen for all tasks

---

## 1.2 Thumb Reach Zones

All critical interactive elements must live in the **Green Zone**.

### iPhone 15 Pro (393×852pt) — Reference Device

```
┌─────────────────────┐  ← Top: 0
│  ░░░░░░░░░░░░░░░░░  │
│  ░  RED ZONE  ░░░░  │  0–180pt: Hard to reach with thumb
│  ░░░░░░░░░░░░░░░░░  │
│  ─────────────────  │
│                     │
│   YELLOW ZONE       │  180–360pt: Reachable with stretch
│                     │
│  ─────────────────  │
│                     │
│   GREEN ZONE  ████  │  360–640pt: Natural thumb reach
│   ████████████████  │
│   ████████████████  │
│                     │
│  ─────────────────  │
│  HOME INDICATOR     │  640–852pt: Bottom safe area
└─────────────────────┘
```

| Zone | Y Range | Color | Rule |
|------|---------|-------|------|
| Red | 0–180pt | 🔴 | Never place primary CTAs, navigation, or frequent actions here |
| Yellow | 180–360pt | 🟡 | Secondary actions, titles, status — acceptable for rare interactions |
| Green | 360–640pt | 🟢 | All primary CTAs, tab bar, bottom navigation, booking CTA, forms |
| Safe bottom | 640–852pt | — | Home indicator only — do not place tappable elements in home bar area |

**Reachability mode (iOS):** When Reachability is triggered (double-tap home bar), top half slides down ~45%. Design still assumes standard position; Reachability is a user accommodation, not a design crutch.

---

## 1.3 Touch Ergonomics

### Touch Target Rules

| Rule | Minimum | Recommended | Critical CTAs |
|------|---------|-------------|---------------|
| Touch target size | 44×44pt | 48×48pt | 56×56pt |
| Spacing between targets | 8pt | 12pt | 16pt |
| Edge targets (scrollable areas) | +8pt padding from edge | — | — |

**Why 44pt:** Apple HIG minimum. Below this, error rate increases significantly (Fitt's Law applied to touch).

**Larger targets, smaller visuals:** A button can look 32pt tall visually but have a 44pt tap zone using invisible padding. The visual and touch target are independent.

### Common Touch Mistakes (Never do these)

- ❌ Putting a close button (×) in the top-left corner within thumb-only reach
- ❌ Placing filter chips with 8pt spacing (too easy to miss-tap adjacent chip)
- ❌ Using link-style text for primary booking actions
- ❌ Requiring precise drag on a narrow handle (min 44pt drag handle)

---

## 1.4 Safe Area Rules

### iOS Safe Areas

```
┌─────────────────────────────┐
│ ████ STATUS BAR █████████   │  H: 59pt (Dynamic Island devices)
│ ████ DYNAMIC ISLAND ██████  │  H: 54pt (notch devices) / 20pt (no notch)
├─────────────────────────────┤
│                             │  ← safeAreaInset.top
│   CONTENT SAFE AREA         │
│                             │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│                             │  ← safeAreaInset.bottom
│ ████ HOME INDICATOR █████   │  H: 34pt (Home Indicator devices)
│ ████████████████████████    │  H: 0pt (Home button devices)
└─────────────────────────────┘
```

| Device Family | Top Safe Area | Bottom Safe Area |
|--------------|---------------|-----------------|
| Dynamic Island (iPhone 14 Pro+) | 59pt | 34pt |
| Notch (iPhone X–14) | 44pt | 34pt |
| Home button (iPhone SE, older) | 20pt | 0pt |
| iPad (with/without home button) | 24pt | 20pt |

**Rule:** Never hardcode safe area values. Always use `SafeArea` widget (Flutter) or `useSafeAreaInsets` (RN). Let the OS report the correct values.

### Android Safe Areas

```
Status bar: 24dp (standard) — translucent in StayOS
Navigation bar: 48dp (gesture bar) / 0dp (full gesture mode)
Cutout insets: device-specific, use WindowInsets API
```

---

## 1.5 Gesture Navigation

### StayOS Gesture Priority Order

1. **OS-level gestures** — always win (swipe from left edge = back on iOS, home swipe = home on Android). Never conflict.
2. **App navigation gestures** — sheet dismiss, drawer open, pull to refresh.
3. **Content gestures** — gallery swipe, map pinch, card swipe.

### Gesture Conflict Prevention

| Situation | Risk | Solution |
|-----------|------|----------|
| Horizontal scroll inside vertical scroll | Conflict | Require 15° angle deviation to start horizontal scroll |
| Bottom sheet + iOS home bar swipe | Conflict | Detect gesture origin; if from bottom 20pt: iOS gesture wins |
| Map swipe + page swipe | Conflict | Map is always full-screen; no surrounding swipeable container |
| Gallery swipe + tab swipe | Conflict | Gallery disables tab gesture while open; restore on close |

---

## 1.6 Native Patterns — Respect Platform Conventions

### iOS Patterns to Follow

| Pattern | iOS Convention | StayOS Implementation |
|---------|---------------|----------------------|
| Navigation | Push/pop with edge-swipe back | All drill-down screens use UINavigationController equivalent |
| Modals | Sheet presented from bottom | Bottom sheet for confirmations, forms |
| Actions | Action sheet from bottom | Destructive actions always use iOS-style action sheet |
| Date picker | Native iOS wheel picker | Use native date picker inside bottom sheet |
| Share | Native share sheet | Integrate with system share API |
| Haptics | UIImpactFeedbackGenerator | Defined in Part 7 |
| Context menus | Long-press 3D Touch menu | Property cards support long-press preview |

### Android Patterns to Follow

| Pattern | Android Convention | StayOS Implementation |
|---------|------------------|----------------------|
| Navigation | Back gesture (swipe from edge, predictive back) | Support predictive back animation |
| Modals | Bottom sheet (Material) | Same bottom sheet pattern as iOS |
| FAB | Floating Action Button | For primary creation actions |
| Snackbar | Bottom snackbar | System notifications use snackbar |
| Top bar | Material TopAppBar | Host/admin zone uses top bar |
| Date picker | Material date picker | Calendar dialog |

---

## 1.7 One-Hand Usage Principles

### The "One-Thumb Rule"

Every primary flow must be completable with one thumb, one hand.

**Applies to:**
- Search: thumb reaches search bar in bottom safe zone
- Booking: Reserve CTA always at bottom
- Payment: Confirm at bottom, never top
- Messaging: Send button bottom-right
- Calendar: Month navigation at bottom, not top header

**Exceptions (acceptable two-hand interactions):**
- Photo upload (camera requires two hands)
- Map exploration (pinch-zoom is two-finger but expected)
- Long-form text entry (keyboard + thumbs)

### Bottom-Weight Layout

50% of all interactions on any given screen should occur in the bottom 40% of the display.

```
┌───────────────────┐
│  20% — Context    │  What is this screen / breadcrumb / title
│  ─────────────────│
│  40% — Content    │  Information to consume
│  ─────────────────│
│  40% — Actions    │  ← MOST interactions live here
└───────────────────┘
```

---

## 1.8 Micro Moments

Mobile users operate in micro moments — brief windows of intent. StayOS must serve them:

| Moment | User intent | Screen | Max time to value |
|--------|-------------|--------|-------------------|
| "I want to know" | Research a destination | Search + results | <3 seconds to first results |
| "I want to go" | Book a specific stay | Property detail → Reserve | <90 seconds to confirmation |
| "I want to do" | Manage an active booking | My Trips | <2 taps to booking info |
| "I want to buy" | Complete payment | Checkout | <60 seconds if card saved |

**Design implication:** Never bury the most common action behind more than 2 taps from the home screen.

---

## 1.9 Offline-First UX

### Offline Principles

1. **Never show a broken screen.** Show cached content with a subtle offline indicator.
2. **Queue all mutations.** Booking attempts, messages, wishlist changes — queue and sync when reconnected.
3. **Never lose user input.** Form drafts persist to local storage on every keystroke.
4. **Show optimistic UI.** Wishlist add, message send — show success immediately, reconcile in background.

### Offline Content Strategy

| Content Type | Offline Behavior |
|-------------|-----------------|
| Previous search results | Show last cached results with "Offline · Showing saved results" banner |
| Saved wishlists | Fully accessible offline |
| Active bookings | Full detail available offline (cached on confirmation) |
| Active messages | Last 50 messages per thread cached |
| Property detail | Cached if viewed in last 7 days |
| New search | Show "No internet. Check your connection." empty state with retry |
| Payment | Block with clear message: "Payment requires internet connection" |
| KYC upload | Queue upload, show "Will upload when connected" |

---

## 1.10 Performance Perception

### Loading Philosophy

| Metric | Target | Absolute Maximum |
|--------|--------|-----------------|
| App cold start to interactive | <1.5s | 3s |
| Tab switch | <100ms | 300ms |
| Search results first paint | <800ms | 2s |
| Property detail paint | <600ms | 1.5s |
| Image above fold load | <400ms | 1s |
| Skeleton duration before content | 0 (instant if cached) | 3s |

**Progressive loading order:**
1. Layout + skeleton (instant, 0ms)
2. Text content (from cache or API)
3. Low-res image placeholder (progressive JPEG)
4. Full-resolution image

**Never:** Show a blank white screen. Never show a loading spinner without content skeleton behind it.

### App Startup Sequence

```
Phase 1 — Splash (0–500ms):
  Show app icon centered on brand color background
  Begin token refresh in background
  Pre-warm navigation stack

Phase 2 — Auth Check (500–800ms):
  If valid token: navigate to last tab
  If expired: silent refresh attempt
  If failed: navigate to Login

Phase 3 — First Screen (800–1500ms):
  Skeleton content shows immediately
  API calls fire in parallel
  Content populates as each resolves
  Images lazy-load after text
```

---

## 1.11 Navigation Hierarchy

### Stack Depth Rules

| Zone | Max stack depth | Example |
|------|----------------|---------|
| Tab root | 0 (no stack) | Home, Trips, Messages, Profile |
| Second level | 1 deep | Property detail, Booking detail |
| Third level | 2 deep | Gallery, Host profile, Reviews |
| Forms / flows | Modal sheet | Checkout, Listing wizard, KYC |
| Maximum ever | 3 deep | Never exceed — leads to confusion |

### Navigation Bar Back Button

- **iOS:** Always shows "Back" or shortened previous screen title — never just "←"
- **Android:** Back arrow in top-left OR rely on system back gesture
- **Both:** Back button is always accessible and always takes user one level up (never closes app unless at root)

---

## 1.12 Platform Differences — When iOS ≠ Android

| Element | iOS Behavior | Android Behavior |
|---------|-------------|-----------------|
| Back navigation | Swipe from left edge (system) | Swipe from either edge or back gesture |
| Modals | Presented upward, swipe down to dismiss | Bottom sheet, back button dismisses |
| Action menus | Bottom action sheet | Bottom sheet OR contextual menu |
| Date pickers | Wheel picker (native) | Calendar picker (Material) |
| Alerts | Centered dialog | Bottom sheet or snackbar |
| Switches | iOS toggle shape | Material switch (different thumb) |
| Progress | UIProgressView | LinearProgressIndicator (Material) |
| Checkmarks | iOS checkmark style | Material checkbox |
| Fonts | SF Pro (system) for system UI, Inter for content | Roboto (system), Inter for content |
| Haptics | UIFeedbackGenerator | HapticFeedback API |
| Share | UIActivityViewController | Intent.ACTION_SEND |
| Notifications | UNUserNotificationCenter | NotificationManager |
| Biometrics | Face ID / Touch ID | BiometricPrompt |
| Status bar | Light/dark content | Light/dark content |
| Predictive back | N/A | Predictive Back Animation (Android 13+) |
| Dynamic color | N/A | Material You (Android 12+) — apply with caution |

**StayOS rule on Dynamic Color (Android):** We respect Material You system colors for system UI elements only. StayOS brand colors (`#2C5FFF`) are never overridden by Dynamic Color. Brand identity takes priority.

---

# PART 2 — MOBILE LAYOUT SYSTEM

## 2.1 Screen Anatomy

```
┌─────────────────────────────┐  ← Physical top
│ ████ Status Bar ████████    │  H: 44–59pt (iOS) / 24dp (Android)
├─────────────────────────────┤
│ Navigation Bar / Top Bar    │  H: 44pt (iOS) / 56–64dp (Android)
├─────────────────────────────┤
│                             │
│                             │
│   CONTENT AREA              │  Fills remaining space
│   (scrollable)              │
│                             │
│                             │
├─────────────────────────────┤
│ Bottom Navigation Bar       │  H: 49pt (iOS) / 80dp (Android)
├─────────────────────────────┤
│ ████ Home Indicator ██████  │  H: 34pt (iOS) / 0–48dp (Android)
└─────────────────────────────┘  ← Physical bottom
```

---

## 2.2 Status Bar

### iOS Status Bar

| Context | Style |
|---------|-------|
| Light backgrounds | Dark content (black icons + time) |
| Dark backgrounds | Light content (white icons + time) |
| Hero image screens | Light content (white) with gradient behind |
| Bottom sheets | Status bar style does not change |

**Dynamic Island integration:** Content in header must never overlap or intrude into Dynamic Island space. Minimum 62pt top clearance on Dynamic Island devices.

### Android Status Bar

| Context | Style |
|---------|-------|
| Default | Translucent — app background shows through |
| Transparent | Used on hero/photo screens |
| Light | `windowLightStatusBar = true` for dark icons |
| Dark | White icons on dark backgrounds |

---

## 2.3 Navigation Bar (Top)

### iOS Navigation Bar

```
┌─────────────────────────────────────┐
│ [← Back]    Screen Title   [Action] │
│  44pt left  centered       44pt right│
│        H: 44pt                      │
└─────────────────────────────────────┘
```

**Specs:**
- Height: 44pt
- Title: `SF Pro Display 17pt / Semibold` or Inter 17pt/600 (StayOS brand font)
- Back button: chevron-left + truncated previous title, `color: #2C5FFF`
- Right action: text button OR icon button (44pt target)
- Large title mode: title 34pt/700 when scrolled to top, collapses to 17pt on scroll
- Background: `rgba(255,255,255,0.92)` with blur effect (UIBlurEffect.systemMaterial)

### Android Top App Bar (Material 3)

```
┌─────────────────────────────────────────┐
│ [Nav icon]  Title/Subtitle  [Actions]   │
│  24dp left  start-aligned   24dp right  │
│        H: 64dp                          │
└─────────────────────────────────────────┘
```

**Specs:**
- Small App Bar: H: 64dp
- Medium App Bar: H: 112dp (expanded, collapses on scroll)
- Large App Bar: H: 152dp (used on feature screens)
- Title: Inter 22sp/400 (small), Inter 28sp/400 (medium/large)
- Nav icon: 24dp, `#2C5FFF` or neutral
- Overflow: 3-dot menu → dropdown

---

## 2.4 Bottom Navigation

### iOS Tab Bar

```
┌─────────────────────────────────────────────┐
│  [Explore] [Trips]  [+]  [Messages][Profile]│
│    24pt      24pt  44pt    24pt      24pt   │
│   label    label  FAB    label     label    │
│        H: 49pt + 34pt safe area             │
└─────────────────────────────────────────────┘
```

**Specs:**
- Height: 49pt (visual) + bottom safe area
- Background: `rgba(255,255,255,0.92)` with blur
- Border-top: `1px #E5E7EB`
- Icon size: 24pt (SF Symbols or custom SVG)
- Label: SF Pro Text 10pt / 500, Inter 10pt for branded
- Active: icon filled, label `#2C5FFF`
- Inactive: icon outline, label `#9CA3AF`
- Badge: red `#EF4444` circle, W:18pt, text 10pt/700 white
- Tap target: full bar height per tab

**Tab items (Guest):** Explore · Trips · [center+] · Messages · Profile  
**Tab items (Host):** Dashboard · Listings · [center+] · Inbox · Account

### Android Bottom Navigation Bar

```
┌─────────────────────────────────────────────┐
│  [Explore]  [Trips]  [Msgs]  [Profile]      │
│    icon      icon    icon     icon          │
│    label     label   label    label         │
│        H: 80dp + nav bar inset              │
└─────────────────────────────────────────────┘
```

**Specs:**
- Height: 80dp + system nav bar inset
- Icon: 24dp, filled when active
- Label: Inter 12sp/500
- Active indicator: pill-shaped highlight (Material 3) `#EEF2FF`, W:64dp H:32dp
- Ripple: `#2C5FFF` 20% opacity on press

---

## 2.5 Bottom Sheet System

### Sheet Types

```
1. COMPACT SHEET (snap: 40% screen height)
   Use: Quick actions, filters, simple confirmations
   ┌─────────────────────────────────┐
   │  ╌ Handle (W:36pt H:4pt)       │
   │  Title                          │
   │  Content (scrollable)           │
   │  [Primary CTA]                  │
   └─────────────────────────────────┘

2. HALF SHEET (snap: 50% screen height)
   Use: Date picker, guest selector, sort options
   Same anatomy as compact but taller first snap

3. EXPANDED SHEET (snap: 92% screen height)
   Use: Full forms (checkout, listing creation), detail views
   Behaves like a full modal
   Has its own navigation bar at top

4. FULL SHEET (100% — edge-to-edge)
   Use: Camera, map, gallery, KYC document capture
   Status bar: transparent or matches content
```

### Sheet Anatomy

```
┌─────────────────────────────────────────────┐ ← top of sheet
│              ────────────────               │   Handle bar: W:36pt H:4pt
│                                             │   R:full BG: neutral-300
│  [← Close]    Title              [Action]  │   Nav row: H:44pt SP:16pt sides
│  ─────────────────────────────────────────  │   Divider
│                                             │
│  Sheet content                              │   Scrollable content area
│                                             │
│  ─────────────────────────────────────────  │
│  [Primary CTA button — full width]          │   Footer: SP:16pt + safe area
└─────────────────────────────────────────────┘
```

**Sheet Rules:**
- Handle: always visible at top. W: 36pt, H: 4pt, R: 2pt, BG: `#D1D5DB`
- Background: white (light) / `#1A1D27` (dark mode)
- Corner radius: 20pt (top corners only)
- Drag to dismiss: drag handle OR drag content area downward
- Threshold: 30% down → snap to close; <30% → spring back
- Blocking sheet (cannot dismiss): no handle, no drag-dismiss (e.g., payment processing)
- Maximum 2 sheets can be stacked (e.g., filter sheet opens date picker sheet)

### Sheet Snap Points

| Sheet Type | Snap 1 | Snap 2 | Dismissal |
|-----------|--------|--------|-----------|
| Compact | 35% | N/A | Drag down |
| Half | 50% | 90% | Drag down from 50% |
| Expanded | 92% | N/A | Drag down |
| Full | 100% | N/A | Close button only |

---

## 2.6 Keyboard Behavior

### Rule 1: Content never hides under keyboard

When keyboard opens, the focused input must be visible above the keyboard. Implementation:
- `KeyboardAvoidingView` (React Native) wrapping all forms
- `resizeToAvoidBottomInset: true` + proper padding (Flutter)
- Scroll to focused input automatically

### Keyboard Layout Adjustment

```
WITHOUT KEYBOARD:
┌─────────────────────┐
│ Nav bar             │
│                     │
│ Form content        │
│                     │
│ [Submit button]     │ ← at bottom
│ Home indicator      │
└─────────────────────┘

WITH KEYBOARD:
┌─────────────────────┐
│ Nav bar             │
│ Form content        │  ← compressed/scrolled
│ [focused input]     │  ← just above keyboard
├─────────────────────┤
│                     │  ← keyboard: 291pt (portrait, standard)
│     KEYBOARD        │     336pt (QuickType)
│                     │     216pt (small phones)
└─────────────────────┘
```

### Keyboard Types per Input

| Input Field | Keyboard Type | Extras |
|-------------|--------------|--------|
| Phone number | `numericPhone` | Country dial code picker left |
| Email | `emailAddress` | Auto-lowercase |
| OTP | `numberPad` | Auto-advance, no return key |
| PIN | `numberPad` | Secure, no autocomplete |
| Price | `decimalPad` | Currency symbol prefix |
| Search | `search` | Magnifier return key |
| Name | `namePhonePad` | Auto-capitalize words |
| Message | `default` | Multiline, send button right |
| Address | `default` | Auto-fill address enabled |

### Keyboard Dismiss Patterns

- **iOS:** Tap outside keyboard OR drag content list down
- **Android:** System back button OR tap outside
- **Both:** "Done" / "Search" toolbar button above keyboard

### Input Accessory Toolbar (iOS, above keyboard)

```
┌─────────────────────────────────────────┐
│ [◁ Prev field] [Next field ▷]  [Done]  │  H: 44pt
└─────────────────────────────────────────┘
```
Required on all multi-field forms (checkout, listing creation, profile).

---

## 2.7 Dynamic Island & Notch

### Dynamic Island (iPhone 14 Pro+)

```
Device top:
┌─────────────────────────────┐
│      ┌──────────┐           │
│      │  ISLAND  │           │  Compact: 37×12pt
│      └──────────┘           │  Pill: 126×37pt
│                             │
│  CONTENT starts here: 59pt  │
```

**Live Activity — StayOS integration:**

| State | Dynamic Island Content |
|-------|----------------------|
| Booking confirmed | Property icon + "Booked!" text |
| Check-in today | Property icon + "Check-in at 3PM" |
| Booking countdown | Property icon + "3 days until trip" |
| Message received | Avatar + sender name (compact) |
| Payment processing | Spinner + "Processing..." |

**Live Activity design:**
- Compact view: Icon (12×12pt) + short label (Inter 13pt/600 white)
- Expanded view (long press): Property photo + name + dates + CTA

### Notch (iPhone X–14)

- Top content padding: 44pt (notch area)
- Never place interactive content behind notch
- Status bar icons auto-adjust to notch shape

---

## 2.8 Landscape Orientation

### Landscape Rules

| Screen | Landscape Support | Behavior |
|--------|------------------|----------|
| Property gallery | ✅ Required | Full-screen photo, pinch-zoom |
| Map view | ✅ Required | Full-screen map, wider field |
| Camera (KYC) | ✅ Required | Landscape capture supported |
| Checkout | ❌ Lock portrait | Payment form — security + complexity |
| OTP | ❌ Lock portrait | Focused flow |
| Video calls | ✅ Required | Future — not v1 |
| All dashboards | ⚠️ Tablet only | Phone: portrait-lock |

### Landscape Layout Adaptation

```
PORTRAIT:                    LANDSCAPE:
┌─────────────┐              ┌────────────────────────────┐
│ [Photo]     │              │ [Photo]  │  Info + widget  │
│ Property    │  →           │          │  Title          │
│ Info        │              │  2:3 img │  Price          │
│ Widget      │              │          │  [Reserve]      │
│ [Reserve]   │              └────────────────────────────┘
└─────────────┘
```

---

## 2.9 Floating Action Button (FAB)

### Placement

```
Position: fixed  bottom: 16pt + safe area  right: 16pt
Size: 56pt × 56pt (regular FAB) / 40pt × 40pt (mini FAB)
R: radius-full (28pt)
BG: #2C5FFF  icon: 24pt white
SH: 0 4pt 12pt rgba(44,95,255,0.3)
Z: above content, below navigation
```

### FAB Usage in StayOS

| Screen | FAB Action | Icon |
|--------|-----------|------|
| Host → Listings | Create new listing | `plus` |
| Host → Messages | New message | `edit` |
| Host → Reservations | View calendar | `calendar` |
| Admin → Users | Add user | `user-plus` |

### FAB Behavior

- **On scroll down:** FAB shrinks to icon-only (collapses label if extended)
- **On scroll up:** FAB expands back to extended form
- **On tap:** Execute primary action (no sub-menu — use action sheet instead)

---

## 2.10 Floating CTA (Bottom Sticky)

Used instead of tab bar on transactional screens (property detail, checkout).

```
┌─────────────────────────────────────────────────┐
│  $120/night  ⭐4.9 (127)     [Reserve →]        │
│  ───────────────────────────────────────────────│
│         Home indicator safe area                │
└─────────────────────────────────────────────────┘
```

**Specs:**
- Height: 64pt + bottom safe area
- Background: white (light) / `#1A1D27` (dark)
- Border-top: `1px #E5E7EB`
- Left content: price + rating info
- Right: primary button (H:48pt, min-W:120pt)
- Z: above content, below native status bar

---

## 2.11 Snackbar vs Toast vs In-App Notification

| Type | Position | Duration | Interaction | Usage |
|------|----------|----------|-------------|-------|
| **Snackbar** | Bottom (8pt above nav) | 4s | Optional action | Android-first, informational (wishlist saved) |
| **Toast** | Top (below status bar) | 3s | None | Brief confirmations (message sent) |
| **In-App Notification** | Top banner with icon | Persistent until tapped | Tap to open | Real push notifications received while in-app |
| **Error Banner** | Below nav bar | Persistent | Retry button | Network error, payment failure |

### Snackbar Spec

```
Position: bottom  margin-bottom: 8pt + nav bar height + safe area
W: screen-width - 32pt  max-W: 420pt
H: 48pt (1 line) / auto (2 lines, max)
BG: #1F2937  FG: white
R: radius-lg (8pt)
SH: shadow-lg
SP: 12pt 16pt

Text: Inter 14pt/400 white  flex-1
[Action] button: Inter 14pt/600 #A5B4FC (brand light)  min-W: 48pt
```

---

## 2.12 Search Overlay

### Mobile Search Pattern

Search on mobile is always a **full-screen takeover**, not an inline result.

```
1. User taps search bar (any screen)
2. Search input expands to full screen (300ms slide-up)
3. Keyboard immediately opens
4. Recent searches appear below input
5. User types: real-time suggestions appear (debounce 300ms)
6. User selects: transitions to search results
7. [Cancel] button: collapse back to previous screen
```

**Search overlay anatomy:**

```
┌─────────────────────────────────────────┐  ← Status bar
│ [← Back]  [🔍 Where?                ]  │  H: 56pt  SP: 16pt
│           [Aug 1–5 · 2 guests        ]  │  H: 44pt  secondary row
├─────────────────────────────────────────┤
│ Recent Searches                         │  Section header 12pt/600 neutral-500
│ ──────────────────────────────────────  │
│ 🕐 Cairo, Egypt          ×             │  Row H: 52pt
│ 🕐 Sharm El-Sheikh       ×             │
│ ──────────────────────────────────────  │
│ Popular Now                             │
│ 📍 Alexandria                          │
│ 📍 Hurghada                            │
│ 📍 Luxor                               │
└─────────────────────────────────────────┘
```

---

## 2.13 Camera Overlay (KYC)

```
Full-screen camera (edge-to-edge)

┌─────────────────────────────────────────┐
│ [×]                            [Flash]  │  Controls: 44pt targets
│                                         │
│     ┌───────────────────────────┐       │
│     │                           │       │
│     │   Document frame guide    │       │
│     │   (animated corner marks) │       │
│     │                           │       │
│     └───────────────────────────┘       │
│                                         │
│  "Align your document within the frame" │  Instruction: 16pt/500 white
│  Progress: [──────────────] Analyzing   │  If auto-capture
│                                         │
│         [Capture Button 72pt]           │  Bottom center, 72pt circle
│                                         │
└─────────────────────────────────────────┘
```

**Auto-capture:** If document is detected within frame for 1.5 seconds continuously → automatic capture with success haptic.

---

# PART 3 — RESPONSIVE MOBILE GRID

## 3.1 Grid Principles

- Base unit: **4pt** on iOS (pt), **4dp** on Android (dp)
- All measurements in this section are platform-independent logical pixels
- Column gutters: always 16px minimum on mobile
- Content margins: always 16px minimum from screen edge

## 3.2 Breakpoint Specifications

### 320px — iPhone SE 1st gen / Small Android

| Property | Value |
|----------|-------|
| Columns | 4 |
| Margin (sides) | 16px |
| Gutter | 12px |
| Content width | 320 - 32 = 288px |
| Card width (1-col) | 288px |
| Card width (2-col) | 138px |
| Primary button width | 288px (full width) |
| Image ratio | 3:2 (192×128px) |
| Touch target | 44px minimum |
| Font scale | 0.9× of base scale |

**320px special rules:**
- Never use 3-column grids
- All modals: full-screen
- Navigation labels: hidden if text wraps (icon only mode at 320px)
- Property grid: always 1-column
- KPI cards: stack vertically (never 2-col)

---

### 360px — Standard Android (Samsung, Pixel baseline)

| Property | Value |
|----------|-------|
| Columns | 4 |
| Margin (sides) | 16px |
| Gutter | 16px |
| Content width | 328px |
| Card width (1-col) | 328px |
| Card width (2-col) | 156px |
| Primary button width | 328px |
| Image ratio | 3:2 (219×146px) |
| Touch target | 48dp minimum (Android baseline) |
| Font scale | 1.0× base |

---

### 375px — iPhone 6/7/8/SE 2nd/3rd gen / Standard iOS

| Property | Value |
|----------|-------|
| Columns | 4 |
| Margin (sides) | 16px |
| Gutter | 16px |
| Content width | 343px |
| Card width (1-col) | 343px |
| Card width (2-col) | 163.5px → 164px |
| Card width (half-width) | 163px |
| Primary button width | 343px |
| Image ratio | 3:2 (229×153px) |
| Touch target | 44pt minimum |
| Font scale | 1.0× base |

**375px property card:**
- Width: 343px
- Photo: 343×229px (3:2)
- Info section: 12px padding, 131px height
- Total card height: 360px

---

### 390px — iPhone 14 / 15 Standard

| Property | Value |
|----------|-------|
| Columns | 4 |
| Margin (sides) | 20px |
| Gutter | 16px |
| Content width | 350px |
| Card width (1-col) | 350px |
| Card width (2-col) | 167px |
| Primary button width | 350px |
| FAB position | bottom: 24px, right: 20px |
| Image ratio | 3:2 or 16:9 (both work) |
| Touch target | 44pt minimum |
| Font scale | 1.0× base |

---

### 412px — Google Pixel / Android Large Standard

| Property | Value |
|----------|-------|
| Columns | 4 |
| Margin (sides) | 20px |
| Gutter | 16px |
| Content width | 372px |
| Card width (1-col) | 372px |
| Card width (2-col) | 178px |
| Primary button width | 372px |
| Image ratio | 3:2 (251×168dp) |
| Touch target | 48dp minimum |
| Font scale | 1.0× base |

---

### 430px — iPhone 15 Plus / Pro Max

| Property | Value |
|----------|-------|
| Columns | 4 (portrait) / 6 (landscape) |
| Margin (sides) | 24px |
| Gutter | 16px |
| Content width | 382px |
| Card width (1-col) | 382px |
| Card width (2-col) | 183px |
| Card width (3-col) | 116px (search filters only) |
| Primary button width | 382px |
| Image ratio | 3:2 (255×170px) |
| Touch target | 44pt minimum |
| Font scale | 1.05× base |

**430px special:** 2-column property grid becomes viable here for compact list views.

---

### 480px — Large phones / Small tablets (rare but exists)

| Property | Value |
|----------|-------|
| Columns | 6 |
| Margin (sides) | 24px |
| Gutter | 20px |
| Content width | 432px |
| Card width (2-col) | 206px |
| Property grid | 2 columns |
| Primary button | 432px or centered 320px |
| Image ratio | 4:3 |
| Touch target | 44pt minimum |
| Font scale | 1.05× base |

---

### 768px — iPad Mini / iPad Air Portrait / Tablet

| Property | Value |
|----------|-------|
| Columns | 8 |
| Margin (sides) | 32px |
| Gutter | 24px |
| Content width | 704px |
| Card width (2-col) | 340px |
| Card width (3-col) | 218px |
| Property grid | 2–3 columns |
| Sidebar (if used) | 260px |
| Main content (with sidebar) | 444px |
| Primary button | 320px centered or full row |
| Image ratio | 4:3 |
| Touch target | 44pt |
| Font scale | 1.1× base |

**Tablet navigation change:** Bottom tab bar is replaced by a sidebar navigation on 768px+. Tab bar still shown on iPad in slide-over/split-view.

---

## 3.3 Dynamic Type / Font Scaling

### iOS Dynamic Type Support

| iOS Text Style | StayOS Token | 375px value | Scale at xSmall | Scale at xxxLarge |
|----------------|-------------|-------------|-----------------|-------------------|
| Title1 | `type-display-md` | 28px | 25px | 38px |
| Title2 | `type-display-sm` | 22px | 20px | 30px |
| Headline | `type-heading-lg` | 17px | 15px | 25px |
| Body | `type-body-md` | 17px | 14px | 25px |
| Subheadline | `type-body-sm` | 15px | 13px | 21px |
| Footnote | `type-caption` | 13px | 12px | 19px |
| Caption | `type-label-sm` | 12px | 11px | 17px |

**Rule:** All font sizes scale proportionally with Dynamic Type. Only exception: icons — never scale beyond 1.2× to prevent layout breaks.

### Android Font Scaling

```
User setting: Settings → Display → Font size
Scale factor: 0.85× (small) to 1.3× (largest)

Implementation:
  All font sizes in sp (scalable pixels) — never dp for text
  Test layout at 1.3× scale before shipping
  Maximum line count must increase, never clip text
```

---

## 3.4 Component Width Rules at Each Breakpoint

| Component | 320px | 375px | 390px | 430px | 768px (tablet) |
|-----------|-------|-------|-------|-------|---------------|
| Full-width button | 288px | 343px | 350px | 382px | 320px centered |
| Property card (1-col) | 288px | 343px | 350px | 382px | — |
| Property card (2-col) | — | — | — | 183px | 340px |
| Property card (3-col) | — | — | — | — | 218px |
| Modal / Sheet | full-w | full-w | full-w | full-w | 560px centered |
| Bottom Sheet | full-w | full-w | full-w | full-w | 560px centered |
| Search bar | 256px | 311px | 318px | 350px | 480px |
| KPI card | 288px | 343px | 350px | 183px(2-col) | 218px(3-col) |
| Avatar (small) | 36px | 36px | 36px | 40px | 40px |
| Avatar (large) | 64px | 72px | 72px | 80px | 96px |
| Toast / Snackbar | 288px | 343px | 350px | 382px | 420px centered |
| FAB | 56px | 56px | 56px | 56px | 56px |
| Bottom nav height | 49+safe | 49+safe | 49+safe | 49+safe | — (sidebar) |
| Input height | 44px | 44px | 44px | 48px | 48px |
| OTP box (6 boxes) | 38px | 44px | 46px | 52px | 64px |
