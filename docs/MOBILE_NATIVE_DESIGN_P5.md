# StayOS — Native Mobile Design System
## P5: Mobile Accessibility · App Store Readiness · Engineering Handoff

**Version:** 1.0 | **Status:** Production-Ready
**Continues from:** MOBILE_NATIVE_DESIGN_P4.md

---

# PART 16 — MOBILE ACCESSIBILITY

## 16.01 — VoiceOver (iOS)

### Core Implementation Rules

```
Every interactive element must have:
  accessibilityLabel:  WHAT it is (noun or noun phrase)
  accessibilityHint:   WHAT happens when activated (optional — only if not obvious)
  accessibilityValue:  CURRENT state (for toggles, sliders, pickers)
  accessibilityTraits: ROLE (button, link, header, image, selected, etc.)

Verbosity test:
  Good: "Reserve button"
  Bad: "Button" (no context)
  Bad: "Luxury Nile View Apartment Reserve Button Double Tap to Reserve" (too verbose)
```

### Screen-by-Screen VoiceOver Labels

**Home / Explore Screen:**
```
Search bar: label:"Search for stays", hint:"Enter location, dates and guests"
Property card: label:"{Property name}, {Location}, {Rating} stars, {Price} per night"
                hint:"Double tap to view property details"
Wishlist button: label:"Save {Property name} to wishlist" (unsaved)
                 label:"{Property name} saved to wishlist" (saved)
                 trait:.button
Navigation items: label:"Explore tab" / "Trips tab, 2 new" / "Messages, 3 unread"
```

**Property Detail:**
```
Gallery: label:"Property photos, {N} photos total"
         hint:"Swipe left or right to browse photos, double tap to expand"
Reserve button: label:"Reserve, $120 per night, total $600 for 5 nights"
Host card: label:"{Host name}, Superhost, {N} reviews"
           hint:"Double tap to view host profile"
Review section: label:"{N} reviews, {rating} out of 5 stars"
```

**Booking / Checkout:**
```
Price breakdown row: label:"Nightly rate, $120 times 5 nights, $600"
Service fee: label:"Service fee, $52. Double tap for explanation"
Total: label:"Total before taxes, $652"
Confirm button: label:"Confirm and pay $652"
Payment method: label:"Visa card ending in 4242, selected"
```

**OTP Screen:**
```
OTP container: role:.group, label:"6-digit verification code"
Each box: label:"Digit {N} of 6, {empty/filled}"
Countdown: label:"Resend code available in 47 seconds"
```

**Calendar:**
```
Month header: label:"July 2026"
Previous month: label:"Previous month"
Next month: label:"Next month"
Day cell (available): label:"July 15, available"
Day cell (booked): label:"July 15, booked"
Day cell (blocked): label:"July 15, blocked, not available"
Day cell (selected start): label:"July 15, check-in date selected"
Day cell (range): label:"July 17, within selected range"
```

### VoiceOver Navigation Order

```
All screen elements must be focusable in a logical reading order:
  Header → Primary content → Secondary content → Actions
  
Do NOT use accessibilityFrame tricks to re-order visual elements
Use proper SwiftUI view ordering or UIAccessibility.post for custom ordering
```

### Screen Reader Announcements

```
Dynamic content changes must announce themselves:

Search results loaded:
  UIAccessibility.post(notification: .announcement, argument: "124 properties found in Cairo")

Error state:
  UIAccessibility.post(notification: .announcement, argument: "Error: Invalid phone number")

Loading complete:
  UIAccessibility.post(notification: .screenChanged, argument: nil)
  (refocuses to top of screen)

Booking confirmed:
  UIAccessibility.post(notification: .announcement, argument: "Booking confirmed! Booking reference BK-00123")
```

---

## 16.02 — TalkBack (Android)

### Content Descriptions

```
All Views: contentDescription attribute (equivalent to iOS accessibilityLabel)
Interactive: View.setOnClickListener triggers description read
State: StateListContentDescription for toggling states

Property card contentDescription:
  "{PropertyName}. {City}. {Rating} stars. {Price} per night. Double tap to view details."

Wishlist button:
  Unsaved: "Add to wishlist"
  Saved: "Remove from wishlist"

Status badge:
  contentDescription: "Status: Confirmed"  (read full text, ignore color)
```

### TalkBack Gestures

| Gesture | TalkBack Action |
|---------|----------------|
| Right swipe | Next element |
| Left swipe | Previous element |
| Up + right | Navigate to next section |
| Down + right | Navigate to previous section |
| Double tap | Activate |
| Double tap + hold | Custom action |

**App must NOT block TalkBack gestures with custom gesture recognizers.**

### Live Regions (Android)

```
Dynamic content that updates without focus change:
  View.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE)
  → Search result count update
  → Timer countdown (OTP resend)
  → Sync status in offline banner
  
  ACCESSIBILITY_LIVE_REGION_ASSERTIVE for critical errors only
```

---

## 16.03 — Dynamic Type / Large Text

### Font Scaling Rules

```
All text sizes are specified in sp (Android) / Dynamic Type (iOS)
User can set font to up to 310% larger (accessibility sizes)

Layout rules at large text:
  Never clip text — always allow wrapping
  Never use fixed heights for text containers — use min-height
  Never truncate primary information — let it wrap to 2+ lines
  Card titles: allow 2 lines max at large text
  Price display: always 1 line (numbers don't wrap)
  Navigation labels: allow wrapping to 2 lines (iOS tab bar)
  Button text: 1 line, button grows in height

Test requirements:
  Test all screens at:
    iOS: Accessibility → Larger Text → Maximum size
    Android: Settings → Accessibility → Font size → Largest

Layout adaptations at 200%+ scale:
  Bottom tab bar: labels appear below icons (2-row layout)
  Card info: text wraps, card height grows
  Price widget: numbers stack if needed
  Input labels: wrap allowed
  Navigation bar title: wraps to 2 lines acceptable
```

---

## 16.04 — Color Blindness Support

### Patterns Beyond Color

| Information | Color | Additional signal |
|-------------|-------|------------------|
| Booking confirmed | Green | ✓ Checkmark icon |
| Error state | Red | ⚠️ Warning icon |
| Pending | Amber | ⏳ Clock icon |
| Cancelled | Grey | ✗ X icon |
| Price up | Green | ↑ Arrow |
| Price down | Red | ↓ Arrow |
| New message | Blue dot | Bold weight on sender name |
| Selected filter | Blue | Border + bold text |
| Active star | Yellow fill | Shape (filled vs empty star) |

### Color Blindness Test

Test all UI with:
- Protanopia (red-blind): verify green/red distinctions are still clear via icons
- Deuteranopia (green-blind): most common — test all success/error states
- Tritanopia (blue-blind): test blue interactive elements via shape

**Tools:** iOS Accessibility → Differentiate Without Color | Android accessibility scanner

---

## 16.05 — Switch Control (iOS) / Switch Access (Android)

```
All interactive elements must be reachable via single-switch scanning.

Group configuration:
  Tab bar: one group, navigate between tabs
  Navigation bar: one group (back + title + actions)
  Content area: groups by card

Scanning order: top-left to bottom-right following visual layout
No custom scanning order overrides

Custom actions (long-press options via switch):
  UIAccessibilityCustomAction added to property cards:
    "Save to Wishlist"
    "Share Property"
    "View Host Profile"
  
  This exposes long-press features to switch control users
```

---

## 16.06 — RTL Support (Arabic)

### Text Direction

```
iOS:
  Application inherits RTL from device language setting
  NSBundle.main.preferredLocalizations[0] == "ar" → RTL
  
  UIView.semanticContentAttribute = .forceRightToLeft
  Or: automatic via Locale.isRTL

Android:
  android:supportsRtl="true" in AndroidManifest
  layoutDirection="locale" on root views
  All start/end attributes used (not left/right)
```

### Component RTL Adaptations (Mobile-specific)

| Component | LTR | RTL | Implementation |
|-----------|-----|-----|---------------|
| Bottom tab bar | Explore L→R | Reversed R→L | Mirror tab order |
| Navigation bar back | ← left | → right | Semantic flip |
| Chat bubble — sent | Right aligned | Left aligned | `Alignment.centerRight/Left` |
| Chat bubble — received | Left aligned | Right aligned | Swap alignment |
| Swipe actions | Swipe LEFT reveals actions | Swipe RIGHT reveals actions | Detect RTL context |
| Pull-to-refresh | Spinner standard | Spinner standard | No change |
| Progress bar | Fills left→right | Fills right→left | `TextDirection` sensitive |
| List item trailing icon | Right side | Left side | `Directionality` |
| FAB position | Bottom right | Bottom left | `Directionality.of(context)` |
| Segmented control | Left→right | Right→left | Mirror |
| Price | Always LTR | Always LTR (bidi-isolate) | Explicit `LTR` wrapping |

### Arabic Typography on Mobile

```
Font loading: Cairo (400, 600, 700) loaded at app start
Line height: 1.8 for body text (Arabic needs more)
Font size: same as English — Cairo is proportionally correct
Letter spacing: 0 (always — Arabic never uses letter-spacing)

Mixed content:
  Arabic sentence with English product name:
    "لقد حجزت Nile View Apartment"
    → Nile View Apartment wraps in bidi-isolate
    → Renders: ـApartment View Nile ـحجزت لقد
    → Correct display with bidi algorithm

Numbers in Arabic context:
  Default: Western Arabic numerals (0-9)
  Optional setting: Eastern Arabic (٠١٢٣٤٥٦٧٨٩)
  Prices: always LTR regardless
```

---

## 16.07 — Reduced Motion (Mobile)

```
Detection:
  iOS: UIAccessibility.isReduceMotionEnabled
  Android: AnimatorDurationScale == 0 (Settings → Developer Options → Animator scale off)
         OR AccessibilityManager.isEnabled with animation disabled

When reduced motion is active:

All animations replaced with:
  Duration: max 150ms
  Type: opacity fade only (no translate, scale, or spring)
  
Specific cases:
  Screen transitions: crossfade only (150ms)
  Bottom sheet: appear instantly, no slide (100ms opacity)
  Booking success: static checkmark, no draw animation, no confetti
  Skeleton shimmer: static grey rectangle
  Hero image expand: instant appearance (no size animation)
  Wishlist ♥: instant fill (no bounce)
  Progress indicators: remain (functional, not decorative)
  Loading spinners: remain (functional)

Implementation pattern:
  Inject animation duration multiplier (0 or 1) into all Animated values
  When reduced: all durations → 0 except functional loaders
```

---

## 16.08 — Keyboard / Hardware Input

```
External keyboard support (iPad + foldables):

Tab: move to next interactive element
Shift+Tab: previous element
Space/Return: activate button
Escape: dismiss modal/sheet
Arrow keys: navigate list items, calendar days
Cmd+F: open search (iPad)
Cmd+R: refresh current screen (iPad)

Hardware back button (Android):
  Screen with unsaved form: show "Discard changes?" dialog
  Search results: clear search and return to previous state
  Bottom sheet: dismiss sheet
  All other: standard back navigation

Game Controller (future consideration — not v1)
```

---

# PART 17 — APP STORE READINESS

## 17.01 — App Icon

### iOS App Icon Requirements

```
Primary icon: 1024×1024px (App Store submission)
Auto-generates all required sizes from 1024px source

Design:
  Background: solid #2C5FFF (brand primary)
  No transparency (App Store rejects transparent icons)
  No rounded corners in source (iOS applies its own mask)
  
  Icon mark: StayOS "S" logo mark
  Position: centered
  Size: 60% of canvas (614×614px centered in 1024px canvas)
  Color: white
  
  No text in icon
  No screenshots in icon
  No device frames

Required sizes (auto-generated from 1024px):
  20×20  (iPhone notification)
  29×29  (iPhone settings)
  40×40  (iPhone spotlight)
  60×60  (iPhone home screen @1x)
  120×120 (iPhone home screen @2x)
  180×180 (iPhone home screen @3x)
  76×76   (iPad home screen @1x)
  152×152 (iPad home screen @2x)
  167×167 (iPad Pro home screen)
  1024×1024 (App Store)
```

### Android Adaptive Icon

```
Adaptive icon structure:
  foreground layer: 108×108dp canvas, icon in center 72×72dp
  background layer: solid #2C5FFF
  
  Foreground: StayOS "S" mark, white, 72dp
    Centered in 108dp canvas (18dp padding all sides)
    Padding ensures safe zone for masking
    
  Masks applied by device: circle, rounded square, squircle, etc.
  
  Legacy icon (Android <8): 48×48dp traditional icon
    Same design, no adaptive container
  
  Play Store icon: 512×512px
    Same design as iOS: #2C5FFF background, white "S" mark

Files required:
  ic_launcher.xml (adaptive icon)
  ic_launcher_round.xml
  ic_launcher_foreground.xml
  ic_launcher_background.xml
  ic_launcher-playstore.png (512×512)
```

---

## 17.02 — Splash Screen / Launch Screen

### iOS Launch Screen

```
LaunchScreen.storyboard (static, shown before app loads):

Background: #2C5FFF (brand primary)
Center: StayOS logo mark (white SVG/PDF)
  W: 80pt × 80pt

No animations (iOS renders this statically)
No text
No loading indicators

Transition to app:
  App code takes over → fade from launch screen to first real screen
  Expo SplashScreen.preventAutoHideAsync() + SplashScreen.hideAsync()
  Logo scale animation during transition: 0.8→1 (app-side, after launch screen fades)
```

### Android Launch Screen

```
launch_background.xml (drawable):
  Layer list:
    Item 1: solid color #2C5FFF
    Item 2: centered bitmap/vector = StayOS mark white, W:80dp

styles.xml:
  <style name="LaunchTheme">
    <item name="android:windowBackground">@drawable/launch_background</item>
    <item name="android:windowSplashScreenAnimatedIcon">@drawable/stabyos_icon</item>
    <item name="android:windowSplashScreenBackground">#2C5FFF</item>
    <item name="android:windowSplashScreenIconBackgroundColor">#2C5FFF</item>
  </style>

Android 12+ Splash Screen API:
  windowSplashScreenAnimatedIcon: animated Lottie (if used)
  windowSplashScreenBrandingImage: StayOS wordmark (optional, shown at bottom)
```

---

## 17.03 — App Store Screenshots

### iOS Screenshot Requirements

```
Required device sizes:
  6.9" (iPhone 16 Pro Max): 1320×2868px
  6.5" (iPhone 14 Plus): 1284×2778px
  5.5" (iPhone 8 Plus): 1242×2208px (required for older device fallback)
  12.9" (iPad Pro 6th gen): 2048×2732px (if iPad supported)

Number of screenshots: 3–10 (minimum 1, recommend 8)
Format: PNG or JPEG, no alpha
```

### Screenshot Content Strategy

```
Screen 1 — Hero: Search / Explore
  Background: full app screenshot
  Top text overlay: "Find your perfect stay"  (white, bold)
  Bottom caption: "Search thousands of verified properties"

Screen 2 — Property Detail
  Full property detail screen (beautiful Nile view property)
  Caption: "Every detail, at a glance"

Screen 3 — Booking Confirmed
  Booking confirmation screen with confetti
  Caption: "Book with confidence in seconds"

Screen 4 — Messages
  Conversation thread with host
  Caption: "Chat directly with your host"

Screen 5 — Map View
  Search results on map, custom pins
  Caption: "Find the perfect neighborhood"

Screen 6 — Host Dashboard (if dual-audience app)
  Revenue chart + occupancy stats
  Caption: "Earn more from your property"

Screen 7 — Calendar (Host)
  Calendar with bookings
  Caption: "Full control of your availability"

Screen 8 — Booking Detail (Guest)
  Trip detail with check-in info
  Caption: "Everything you need for your stay"

Design for screenshots:
  Device frame: use official Apple device frames (Sketch/Figma templates)
  Status bar: clean (time: 9:41, full battery, full signal — iOS standard)
  Background behind frame: gradient #2C5FFF → #1A3FCC (brand gradient)
  Caption font: Inter Bold, white, centered
  Language: English (primary) + Arabic (separate set for AR localization)
```

### Google Play Screenshots

```
Feature graphic: 1024×500px
  BG: linear-gradient(135deg, #1A3FCC, #2C5FFF)
  Logo: StayOS horizontal lockup (white, centered)
  Tagline: "Find your perfect stay"

Phone screenshots: 16:9 ratio recommended, portrait preferred
  Minimum: 320×568px
  Maximum: 3840×2160px
  Recommend: 1080×1920px

Tablet screenshots: 1440×2560px (if tablet-optimized)

Same content as iOS screenshots
Google Play: option to add short video preview (30s)
```

---

## 17.04 — App Store Metadata

### iOS App Store Connect

```
App name: "StayOS — Find & Book Stays"
  Max 30 characters

Subtitle: "Hotels, Apartments & Villas"
  Max 30 characters

Category: Primary: Travel
          Secondary: Lifestyle

Keywords (100 char limit, comma-separated):
  "hotels,apartments,booking,vacation,rental,stay,travel,Airbnb,accommodation,host,villa"

Promotional text (5000 chars, editable without new build):
  "StayOS connects guests with verified properties across Egypt and the Middle East.
  Search thousands of apartments, villas, hotels, and private rooms. 
  Book instantly, pay securely, and experience your destination like a local."

Description (4000 chars):
  Full marketing description covering:
    - Search + discovery
    - Booking security
    - Host verification
    - Trust & safety
    - Host earning potential
    - Supported regions
    - Features list (bullet points)

What's new (release notes):
  Version X.X.X — [Date]
  "What's new in this release:
  • [Feature 1]
  • [Feature 2]
  • Bug fixes and performance improvements"

Support URL: https://stabyos.com/support
Marketing URL: https://stabyos.com
Privacy Policy URL: https://stabyos.com/privacy
```

### Google Play Console

```
App name: "StayOS — Book Stays & Hotels"
  Max 30 characters

Short description (80 chars):
  "Find and book verified apartments, villas & hotels near you."

Full description (4000 chars): same content as iOS, reformatted

Category: Travel & Local → Accommodation
Tags: travel, hotel, booking, rental, accommodation

Content rating: Everyone

Data safety form:
  Location: collected (search only, not background)
  Personal info: name, email, phone (account creation)
  Financial info: payment processing via Stripe (not stored locally)
  Messages: encrypted messages stored on device
  Photos: camera and gallery access (KYC and listings)

Release notes: same as iOS
```

---

## 17.05 — Versioning

```
Semantic versioning: MAJOR.MINOR.PATCH

Build numbers:
  iOS: CFBundleVersion — increment with every build (100, 101, 102...)
  Android: versionCode — increment with every release (1, 2, 3...)

Version naming:
  1.0.0 — MVP launch
  1.1.0 — First feature update (new screens/flows)
  1.1.1 — Bug fix release
  2.0.0 — Major redesign or breaking change

App Store review timeline:
  iOS: 1–3 days (expedited review: 24h for critical fixes)
  Android: 3–7 days (may be longer for new accounts)

Release strategy:
  iOS: Phased release (start 1%, increase over 7 days to 100%)
  Android: Staged rollout (1% → 5% → 20% → 50% → 100%)
  Rollback: immediately halt rollout if crash rate >0.5%
```

---

# PART 18 — ENGINEERING HANDOFF

## 18.01 — Build Order (Priority Matrix)

### Phase 1 — Foundation (Weeks 1–3)

| # | Component | Priority | Complexity | Dependency |
|---|-----------|----------|------------|-----------|
| 1 | Design tokens (colors, typography, spacing) | P0 | Low | None |
| 2 | Navigation structure (tabs + stack) | P0 | Medium | Tokens |
| 3 | Splash screen + launch screen | P0 | Low | Tokens |
| 4 | Auth: Login screen (phone + OTP) | P0 | Medium | Navigation |
| 5 | Auth: OTP verification screen | P0 | Medium | Login |
| 6 | Safe area handling (all screens) | P0 | Low | Navigation |
| 7 | Button component (all variants/states) | P0 | Low | Tokens |
| 8 | Text input component (all states) | P0 | Low | Tokens |
| 9 | Offline banner + connectivity detection | P0 | Medium | None |
| 10 | Push notification registration | P0 | Medium | Auth |

---

### Phase 2 — Core Guest Experience (Weeks 4–7)

| # | Component | Priority | Complexity | Dependency |
|---|-----------|----------|------------|-----------|
| 11 | Search overlay (full-screen) | P0 | High | Nav + Tokens |
| 12 | Search results screen (list view) | P0 | High | Search overlay |
| 13 | Property card component | P0 | Medium | Tokens |
| 14 | Property detail screen | P0 | Very High | Property card |
| 15 | Photo gallery (fullscreen) | P0 | Medium | Property detail |
| 16 | Date picker bottom sheet | P0 | Medium | Bottom sheet |
| 17 | Guest selector bottom sheet | P0 | Low | Bottom sheet |
| 18 | Checkout screen | P0 | Very High | Auth + KYC |
| 19 | Payment integration (Stripe) | P0 | High | Checkout |
| 20 | Booking confirmation screen | P0 | Medium | Payment |
| 21 | Trips screen | P0 | Medium | Auth |
| 22 | Booking detail screen | P0 | High | Trips |

---

### Phase 3 — Identity & Trust (Weeks 6–8)

| # | Component | Priority | Complexity | Dependency |
|---|-----------|----------|------------|-----------|
| 23 | KYC intro screen | P0 | Low | Auth |
| 24 | Document type selection | P0 | Low | KYC intro |
| 25 | Camera overlay (KYC) | P0 | High | Permissions |
| 26 | Document capture + preview | P0 | Medium | Camera |
| 27 | Selfie capture | P0 | Medium | Camera |
| 28 | KYC submission + pending state | P0 | Medium | Capture |

---

### Phase 4 — Communication (Weeks 8–10)

| # | Component | Priority | Complexity | Dependency |
|---|-----------|----------|------------|-----------|
| 29 | Messages / inbox list | P0 | Medium | Auth |
| 30 | Chat bubble component | P0 | Medium | Tokens |
| 31 | Message input bar | P0 | Medium | Keyboard |
| 32 | Conversation thread screen | P0 | High | Inbox + Bubbles |
| 33 | Push notification deep links | P0 | High | Notifications |
| 34 | In-app notification banner | P0 | Medium | Overlay |

---

### Phase 5 — Host Experience (Weeks 10–14)

| # | Component | Priority | Complexity | Dependency |
|---|-----------|----------|------------|-----------|
| 35 | Host dashboard | P1 | High | Auth |
| 36 | Listings management screen | P1 | Medium | Host auth |
| 37 | Listing wizard (9-step) | P1 | Very High | Camera + Map |
| 38 | Calendar management | P1 | High | Date picker |
| 39 | Host calendar — block dates | P1 | Medium | Calendar |
| 40 | Revenue & analytics screen | P1 | High | Charts |
| 41 | Payouts screen | P1 | Medium | Finance API |
| 42 | Host reservations list | P1 | Medium | Bookings |
| 43 | Reservation detail (host view) | P1 | Medium | Reservations |

---

### Phase 6 — Polish & Quality (Weeks 14–16)

| # | Component | Priority | Complexity | Dependency |
|---|-----------|----------|------------|-----------|
| 44 | Wishlists screen | P1 | Medium | Auth |
| 45 | Wishlist save animation | P1 | Low | Property card |
| 46 | Reviews screen (guest) | P1 | Medium | Trips |
| 47 | Review submission form | P1 | Medium | Booking |
| 48 | Profile screen | P1 | High | Auth |
| 49 | Settings screen | P1 | Medium | Profile |
| 50 | Wallet screen | P2 | Medium | Finance |
| 51 | All skeleton states | P1 | Medium | All screens |
| 52 | All empty states | P1 | Low | All screens |
| 53 | All error states | P1 | Low | All screens |
| 54 | Dark mode (all screens) | P1 | High | All tokens |
| 55 | RTL/Arabic (all screens) | P1 | High | All layouts |
| 56 | Accessibility audit + fixes | P0 | High | All screens |
| 57 | Haptic feedback (all triggers) | P1 | Low | All interactions |
| 58 | Animation polish pass | P2 | Medium | All screens |

---

## 18.02 — Complexity Ratings

| Level | Criteria | Examples |
|-------|----------|---------|
| **Low** | Single state, no API, static content | Splash, empty states, skeleton templates |
| **Medium** | API calls, 2–4 states, standard layout | Trips list, booking detail, profile |
| **High** | Complex state machine, animations, platform differences | Property detail, checkout, chat |
| **Very High** | 10+ states, multi-step flow, camera/maps/payments | KYC wizard, listing creation wizard, checkout with 3DS |

---

## 18.03 — Platform Dependencies

```
Network:
  Stripe SDK → payment processing
  Google Maps / Mapbox → map display  
  Firebase Cloud Messaging (FCM) → push notifications (Android)
  APNs → push notifications (iOS)

Device capabilities:
  Camera → KYC, property photos, profile picture
  Photo library → property photos, profile picture
  Location → map, nearby search
  Biometrics → optional auth
  Notifications → booking updates, messages

Backend:
  Auth API → before any authenticated screen
  KYC API → before checkout
  Property API → search results, detail, booking
  Booking API → checkout, trips
  Payment API (Stripe) → checkout
  Messages API → WebSocket for real-time
  Push token registration → on notification permission grant
```

---

## 18.04 — Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| App Store rejection (iOS) | Medium | High | Follow HIG strictly, test privacy labels, prepare appeal materials |
| Camera permission denial by users | High | Medium | Strong pre-prompt, always offer gallery fallback |
| Stripe 3DS interruption in checkout | High | High | Handle all 3DS states, test with test cards |
| Deep link routing failures | Medium | High | Extensive deep link testing matrix |
| RTL layout breaks | Medium | High | Arabic-first review of all screens |
| Dynamic Type overflow | Medium | Medium | Test at all Dynamic Type sizes in CI |
| Dark mode color inconsistency | Low | Medium | Design token audit before release |
| Offline sync conflicts | Low | High | Define all conflict resolution rules (Part 8) |
| FCM token refresh failures | Medium | Medium | Background token refresh with retry |
| KYC photo quality too low for OCR | High | High | Client-side quality check before upload |

---

## 18.05 — QA Acceptance Criteria

### Per-Screen QA Checklist

Each screen requires sign-off on all items:

```
Functional:
  [ ] All happy paths work as specified
  [ ] All error paths show correct error states
  [ ] All empty states display correctly
  [ ] Loading states show before content
  [ ] Data persists correctly on app background/foreground
  [ ] Deep links navigate to correct screen

Platform:
  [ ] iOS: tested on iPhone SE (smallest), iPhone Pro Max (largest)
  [ ] iOS: tested on iPad (if supported)
  [ ] Android: tested on small (360px, API 24), standard (412px, API 30), large (API 34)
  [ ] Both: tested in portrait and landscape (where supported)

Accessibility:
  [ ] VoiceOver (iOS): all elements labeled, logical reading order
  [ ] TalkBack (Android): all elements labeled, correct focus order
  [ ] Dynamic Type: tested at maximum accessibility size
  [ ] Reduced motion: all animations disabled correctly
  [ ] Color-only info check: no information conveyed by color alone

Visual:
  [ ] Dark mode: all surfaces correct, no #000000 hardcoding
  [ ] RTL: layout mirrored correctly for Arabic
  [ ] Skeleton states: match layout of real content
  [ ] Haptics: correct feedback at correct moments

Performance:
  [ ] Screen renders within 800ms on mid-range device
  [ ] No janky animations (60fps minimum, 120fps target on ProMotion)
  [ ] Memory: no leaks detected on repeated navigation
  [ ] Network: graceful behavior on 3G (slow connection simulation)
```

---

## 18.06 — Definition of Done (Mobile Screens)

A screen is **Done** when all of the following are true:

| # | Criteria |
|---|----------|
| 1 | Matches design spec (spacing, colors, typography within 2px tolerance) |
| 2 | All component states implemented (loading, empty, error, success) |
| 3 | Dark mode works correctly |
| 4 | Arabic/RTL layout correct |
| 5 | VoiceOver / TalkBack labels applied |
| 6 | Dynamic Type tested at max scale |
| 7 | Reduced motion respected |
| 8 | Haptic feedback at specified triggers |
| 9 | Offline behavior tested |
| 10 | Deep link tested (where applicable) |
| 11 | Unit test coverage ≥80% on business logic |
| 12 | Snapshot test added |
| 13 | QA sign-off obtained |
| 14 | Product sign-off obtained |
| 15 | No crash in last 48h of testing |

---

## 18.07 — Screen Complexity → Development Estimate Reference

| Screen | Complexity | Est. Dev Days | Est. QA Days |
|--------|------------|---------------|--------------|
| Splash / Launch | Low | 0.5 | 0.5 |
| Login | Medium | 2 | 1 |
| OTP Verification | Medium | 1.5 | 1 |
| KYC Wizard | Very High | 5 | 2 |
| Home / Explore | High | 4 | 2 |
| Search Overlay | High | 3 | 1.5 |
| Search Results | High | 4 | 2 |
| Filters Sheet | Medium | 2 | 1 |
| Map View | High | 4 | 2 |
| Property Detail | Very High | 6 | 3 |
| Gallery (fullscreen) | Medium | 2 | 1 |
| Checkout | Very High | 7 | 3 |
| Payment (Stripe) | High | 4 | 2 |
| Booking Confirmed | Medium | 2 | 1 |
| Trips List | Medium | 2 | 1 |
| Booking Detail | High | 3.5 | 1.5 |
| Cancellation Flow | Medium | 2 | 1 |
| Wishlists | Medium | 2 | 1 |
| Messages Inbox | Medium | 2.5 | 1.5 |
| Chat Thread | High | 5 | 2 |
| Profile | High | 3 | 1.5 |
| Settings | Medium | 2.5 | 1 |
| Host Dashboard | High | 4 | 2 |
| Host Listings | Medium | 2.5 | 1 |
| Listing Wizard (9 steps) | Very High | 8 | 4 |
| Calendar Management | High | 5 | 2.5 |
| Revenue Analytics | High | 4 | 2 |
| Payouts | Medium | 2.5 | 1 |
| Reservations (host) | Medium | 2.5 | 1.5 |
| **TOTAL GUEST EXPERIENCE** | — | ~52 days | ~26 days |
| **TOTAL HOST EXPERIENCE** | — | ~29 days | ~14 days |
| **FOUNDATION + INFRA** | — | ~10 days | ~5 days |
| **POLISH (dark/RTL/a11y)** | — | ~15 days | ~8 days |
| **GRAND TOTAL** | — | **~106 days** | **~53 days** |

*Estimates assume 1 developer per area, senior level. Scale linearly with team size.*

---

## 18.08 — Final Pre-Launch Checklist

```
App Store / Play Store:
  [ ] App icon: all required sizes exported and tested
  [ ] Launch screen: tested on all target devices
  [ ] Screenshots: all 8 per device, localized for EN and AR
  [ ] App Store metadata: complete and reviewed
  [ ] Privacy policy: updated, accessible via in-app link
  [ ] Terms of service: complete, accessible
  [ ] Data safety form (Android): complete and accurate
  [ ] App Store review guide: NSCameraUsageDescription, NSPhotoLibraryUsageDescription, etc.

Security:
  [ ] No API keys in app bundle (all server-side)
  [ ] JWT tokens in Keychain (iOS) / Keystore (Android) — NOT AsyncStorage
  [ ] Certificate pinning enabled for API endpoints
  [ ] Jailbreak / root detection for payment screens
  [ ] No sensitive data in crash logs

Performance:
  [ ] Cold start <1.5s on iPhone SE 3rd gen
  [ ] Cold start <2s on Google Pixel 6a (mid-range Android target)
  [ ] Crash-free rate >99.5% from beta testing
  [ ] Memory usage <200MB at peak (property gallery)
  [ ] Battery: no significant drain during background (verified via Instruments / Android Profiler)

Compliance:
  [ ] GDPR: data deletion workflow tested
  [ ] App privacy labels: accurate and filed
  [ ] Apple ATT prompt: present if analytics tracking used
  [ ] Minors: appropriate rating confirmed
  [ ] Encryption compliance: declare if app uses encryption
```

---

*End of MOBILE_NATIVE_DESIGN_P5.md*

*Total Mobile Native Design System: P1–P5 (5 files)*
*18 parts complete — production-ready for Flutter and React Native engineering.*

**Document set:**
- P1: Design Principles · Layout System · Responsive Grid
- P2: Component Library · User Flows
- P3: Gesture System · Animations · Offline · Notifications · Permissions · Lifecycle
- P4: iOS Spec · Android Spec · Flutter Mapping · RN Mapping
- P5: Accessibility · App Store · Engineering Handoff
