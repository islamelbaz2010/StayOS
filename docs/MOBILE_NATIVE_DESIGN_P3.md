# StayOS — Native Mobile Design System
## P3: Gesture System · Animations · Offline Experience · Push Notifications · Permissions · App Lifecycle

**Version:** 1.0 | **Status:** Production-Ready
**Continues from:** MOBILE_NATIVE_DESIGN_P2.md

---

# PART 6 — GESTURE SYSTEM

Every gesture in the StayOS native app is defined here. No interaction should require engineering to guess.

## 6.01 — Gesture Catalog

### TAP — Single

| Target | Result | Feedback |
|--------|--------|----------|
| Property card | Navigate to property detail | Ripple (Android) / highlight (iOS) |
| Tab bar item | Switch tab | Icon fill animation |
| Back button | Pop screen | Haptic: light |
| Bottom sheet handle | Begin drag | — |
| Photo in gallery | Open fullscreen | Hero expand animation |
| Wishlist ♥ | Toggle saved state | Spring scale + haptic: light |
| Booking CTA | Initiate checkout | Haptic: medium |
| Map pin | Show property mini-card | Pin bounce animation |
| Filter chip | Toggle filter | Fill animation |
| Checkbox | Toggle checked | Haptic: light |
| OTP digit | Input character, auto-advance | — |
| Star rating | Set rating | Haptic: light per star |
| Avatar | Open user/host profile | Slide right |
| Send message | Send | Haptic: light |
| Notification | Open deep-linked screen | — |
| Date in calendar | Select day | Ripple then fill |

---

### TAP — Double

| Target | Result | Feedback |
|--------|--------|----------|
| Property photo | Toggle wishlist (convenience shortcut) | ♥ animation |
| Map | Zoom in +1 level | Map animation |
| Message bubble | React with ♥ emoji | Emoji float animation |
| Video (future) | Toggle play/pause | — |

**Note:** Double tap is a discoverable shortcut only — single tap must always work independently. Never require double tap as the only way to perform an action.

---

### LONG PRESS

| Target | Duration | Result | Feedback |
|--------|----------|--------|----------|
| Property card | 350ms | Context menu (iOS) / action sheet | Haptic: medium |
| Chat message | 350ms | Message actions (copy, delete, report) | Haptic: medium |
| Photo in gallery | 350ms | Share / delete options | Haptic: medium |
| Tab bar item | 350ms | Quick actions for that section | Haptic: medium |
| Calendar day | 350ms | Date options sheet | Haptic: medium |
| Filter chip | 350ms | Info tooltip about filter | — |
| Wishlist item | 350ms | Remove from wishlist option | Haptic: medium |

**iOS context menu on property card (long-press preview):**
```
Blur background behind card
Card elevates with shadow
Preview actions above:
  [Wishlist: Save / Remove]
  [Share]
  [View Host Profile]
Card lifts slightly (scale 1.02) during hold
```

---

### SWIPE RIGHT

| Context | Threshold | Result | Feedback |
|---------|-----------|--------|----------|
| Any drill-down screen | 30pt from left edge | Navigate back (iOS system) | — |
| Conversation list row | 30% width | Reveal [Delete] action | Haptic: light on reveal |
| Booking list row | 30% width | Reveal [Cancel] action (if cancellable) | Haptic: light |
| Notification row | 30% width | Reveal [Read] / [Delete] | Haptic: light |
| Full swipe (>80%) | Auto-action | Execute revealed action | Haptic: medium |
| Gallery (fullscreen) | 30pt | Dismiss gallery (next → previous photo if not first) | — |

---

### SWIPE LEFT

| Context | Threshold | Result | Feedback |
|---------|-----------|--------|----------|
| Conversation list row | 30% width | Reveal [Mark Read] / [Mute] | Haptic: light |
| Gallery (fullscreen) | 30pt | Next photo | — |
| KYC document tabs | 30pt | Next document (front→back→selfie) | — |
| Onboarding carousel | 30pt | Next slide | — |
| Booking card in Messages | 30pt | Reveal booking actions | Haptic: light |

---

### SWIPE DOWN

| Context | Result | Threshold |
|---------|--------|-----------|
| Bottom sheet | Dismiss sheet | 30% of sheet height |
| Full-screen modal | Dismiss modal | 30% of screen height |
| Navigation screen (iOS, from top) | Dismiss (if presented modally) | System behavior |
| Pull-down (from top of scroll) | Pull-to-refresh | 60pt pull distance |
| Notification panel (iOS) | System notification center | System gesture |

**Swipe-to-dismiss blocking:**
When active payment is processing, bottom sheet `isDismissable = false`. No drag handle shown. Only explicit action (success/error) closes it.

---

### SWIPE UP

| Context | Result |
|---------|--------|
| Home indicator area (iOS) | System home (never override) |
| Map (when map is full-screen) | Pan map |
| Bottom bar area → up | Open quick search (home screen only) |
| Image in fullscreen | Dismiss to thumbnail (grid) |

---

### DRAG

| Target | Axis | Result |
|--------|------|--------|
| Bottom sheet handle | Y | Resize sheet (snap points) |
| Photo in host listing wizard | X + Y | Reorder photos |
| Calendar range selection | X | Select date range |
| Price slider handle | X | Adjust price range |
| Map | X + Y | Pan map |

**Drag rules:**
- Start drag: 8pt movement threshold before drag begins (prevents accidental drag on tap)
- Drag feedback: element follows finger with spring physics (slight drag-behind)
- Release with velocity: momentum carries animation to snap point

---

### PINCH

| Context | Result | Min fingers |
|---------|--------|-------------|
| Map | Zoom in/out | 2 |
| Property photo (fullscreen) | Zoom in | 2 |
| KYC document preview | Zoom in to verify | 2 |
| Gallery | Zoom into photo | 2 |

**Pinch zoom limits:**
- Map: min zoom level 5, max level 21 (standard)
- Photo: min scale 1.0 (never go below original), max scale 4.0

---

### PULL TO REFRESH

```
All list screens: Explore, Trips, Messages, Reservations, Listings

Visual:
  Pull distance: 0–60pt (rubber band feel, resistance increases)
  At 60pt: spinner appears and rotation begins
  Release: spinner continues, refresh fires, list updates
  
Animation:
  Spinner: StayOS brand spinner (see 4.11)
  Pull distance indicator: progress arc fills as user pulls
  
Haptic: medium on reaching 60pt threshold (indicates "now release to refresh")

Loading indicator position: above top of list content
After refresh: smooth scroll to top if user was not at top
```

---

### INFINITE SCROLL

```
Trigger point: user reaches 80% of current list length
Pre-fetch: load next page while user is still browsing current
Loading indicator: 3 skeleton cards appended to list bottom
Error: snackbar "Failed to load more. Tap to retry"
End of list: "All X results shown" centered text, no spinner
```

---

### DISMISS KEYBOARD

| Method | Platform |
|--------|----------|
| Tap outside input | Both |
| Drag scroll list down | iOS |
| System back button | Android |
| "Done" toolbar button | Both |
| Swipe down on keyboard (iOS) | iOS |

---

### MAP GESTURES

| Gesture | Result |
|---------|--------|
| Pan (drag) | Move map |
| Pinch/spread | Zoom in/out |
| Double-tap | Zoom in +1 |
| Two-finger tap | Zoom out -1 |
| Rotate (two finger rotate) | Rotate map |
| Tap pin | Show property mini-card |
| Tap property mini-card | Navigate to property detail |
| Tap outside mini-card | Dismiss mini-card |

---

### GALLERY GESTURES (Fullscreen)

| Gesture | Result |
|---------|--------|
| Swipe left | Next photo |
| Swipe right | Previous photo |
| Swipe down | Dismiss gallery |
| Swipe up | Show photo info/caption |
| Pinch | Zoom in |
| Double-tap | Zoom in 2× (toggle) |
| Drag (while zoomed) | Pan within zoomed photo |

---

# PART 7 — MOBILE ANIMATIONS

## 7.01 — Animation Philosophy

**Four rules for mobile animation:**
1. **Purposeful:** Every animation communicates something (state change, hierarchy, direction). No decoration.
2. **Fast:** Mobile interactions must feel instant. Maximum 400ms for most transitions. 
3. **Natural:** Use spring physics for interactive elements, ease curves for navigation.
4. **Interruptible:** If user taps during an animation, the animation stops and responds immediately.

---

## 7.02 — Screen Transitions

### Push (Drill-down navigation)

```
iOS standard slide (UINavigationController default):
  Current screen: slides left to x:-30% + opacity:0  300ms  ease-in
  New screen: enters from right x:100%→0  300ms  ease-out
  
  Back swipe (interactive): follows finger, rubber band at edges
  Back button tap: reverse slide  250ms

Android standard (Material 3):
  Current: fade + scale 100%→96%  220ms  easeIn
  New: scale 96%→100% + fade  220ms  easeOut
  Predictive back: new Android 13+ back preview
```

### Modal Present (Full-screen modal)

```
iOS:
  Slides up from bottom: y:100%→0  350ms  decelerate curve
  Dismiss: slides down y:0→100%  280ms  accelerate curve
  Interactive dismiss: drag-to-dismiss follows finger

Android:
  Fade + slight scale up: scale(0.92)→1 + opacity 0→1  250ms
```

### Sheet Open / Close

```
Open:
  translateY(100%)→0  300ms  cubic-bezier(0.0, 0.0, 0.2, 1)
  Backdrop: opacity 0→0.5  250ms

Close:
  translateY(0)→100%  250ms  cubic-bezier(0.4, 0.0, 1, 1)
  Backdrop: opacity 0.5→0  200ms

Interactive drag:
  Sheet follows finger Y position exactly (no spring during drag)
  On release with velocity > 300pt/s: animate to closed
  On release slow: snap to nearest snap point (spring, stiffness:400 damping:40)
```

### Tab Switch

```
No slide animation — content appears immediately
Icon: cross-dissolve outline→fill  150ms
Active indicator (Android): width 0→64dp  200ms spring
Content: opacity 0→1  100ms  (prevents jarring flash)
```

---

## 7.03 — Card Animations

### Card Expand (property detail from search)

```
iOS (if using native shared element):
  Property photo expands from card position to full-screen hero
  Coordinates calculated from card frame to destination frame
  Duration: 350ms  spring(stiffness:320, damping:32)
  
  During expansion:
    Photo: scales + repositions to final position
    Card content (title, price) fades out 150ms
    Destination content (full title, details) fades in after 200ms
    
  Collapse (back navigation):
    Reverse — photo contracts to card position
    If card has scrolled off screen: fade instead of hero animation
```

### Card Press State

```
Scale: 1→0.97  duration:80ms  ease-in
Release: 0.97→1  duration:200ms  spring(stiffness:400 damping:24)
Background: highlight color flashes (iOS) / ripple from touch point (Android)
```

---

## 7.04 — Hero Animation (Property Gallery)

```
Trigger: tap photo anywhere on property detail
Animation: photo expands from tap position to full-screen

Phase 1 (0–200ms):
  Photo scales from original size to full-screen
  Background fades: opacity 0→1 (black)
  Status bar: transitions to light-on-dark
  
Phase 2 (200–350ms):
  Other gallery controls fade in (close ×, photo count, share)
  
Dismiss:
  Swipe down to drag-dismiss
  Photo follows finger Y
  At 30% down: opacity decreases
  Release: photo animates back to original position
  
  OR:
  Tap [×] → reverse fade + scale collapse
```

---

## 7.05 — Booking Success Animation Sequence

```
Timing sequence:

0ms     — Payment confirmed by API
0–80ms  — Processing overlay begins fade-out
80ms    — Screen background appears (white / brand gradient)
100ms   — Circle scales in from center: scale(0)→scale(1)  300ms spring
          Circle: W:120px H:120px R:60px BG:#10B981
400ms   — Checkmark SVG path draws in: stroke-dashoffset animation  400ms ease-out
600ms   — Confetti particles launch (24 pieces)
          Colors: brand blue, accent amber, success green, white
          Physics: initial velocity upward + random angle, gravity downward
          Duration: 1400ms
800ms   — "Booking Confirmed!" text slides up + fades in  250ms ease-out
900ms   — Booking reference fades in  200ms
1000ms  — Action buttons fade in  200ms

Haptic sequence:
  100ms: success notification
  500ms: success notification (double-tap feel)
  
Auto-advance: after 2500ms → Trips tab (unless user interacts)
```

---

## 7.06 — Payment Success Animation

```
(Same screen as booking but for wallet/payout transactions)

0ms:    White overlay appears
100ms:  Circular progress fills to 100%  400ms
500ms:  Circle morphs: progress ring → solid circle  200ms
700ms:  ✓ check draws inside circle
900ms:  Amount + description appears below
1100ms: [Done] button appears

Haptic: success notification at 500ms
```

---

## 7.07 — Loading Animations

### Skeleton → Content Reveal

```
Content elements fade in as they load (not all at once):
  Text: opacity 0→1  300ms  staggered (each 50ms after previous)
  Images: opacity 0→1  400ms  after initial text visible
  Skeleton: fades out as each element reveals (crossfade, simultaneous)
  
Order of reveal:
  1. Navigation bar (instant)
  2. Main heading
  3. Primary action button (shows skeleton, then real button)
  4. Body content
  5. Images (last — network dependent)
```

### Pull to Refresh

```
Phase 1 — Pulling (0–60pt drag):
  Progress arc: fills proportionally to pull distance
  No rotation yet
  
Phase 2 — Threshold reached (60pt):
  Haptic: medium
  Progress arc completes
  
Phase 3 — Released, loading:
  Arc rotates continuously (750ms per revolution)
  List content slightly offset down to show spinner
  
Phase 4 — Complete:
  Spinner fade-out  200ms
  List snaps back to top  250ms spring
```

---

## 7.08 — Notification In-App Animation

```
Slide down from below status bar:
  BG:white  SH:shadow-lg  R:0 0 16px 16px (bottom corners)
  W:100%  H:80px
  translateY(-80px)→0  350ms spring

Content: avatar(40px) + title(15px/600) + body(13px/400) + time(12px) + app icon(16px top-right)
Tap target: full banner  →  deep link

Auto-dismiss: 4s
  Fade-out: opacity 1→0  300ms
  Slide-up: translateY(0)→-80px  200ms delay:50ms

Swipe up to dismiss: follows finger
```

---

## 7.09 — Map Transition

```
Map loading (first open):
  Tile loading: tiles appear from center outward (radial reveal)
  Pins: drop in from above with bounce  staggered 50ms each
  
Search → Map view transition:
  List collapses (height reduces 300ms)
  Map expands from thumbnail to full  300ms ease-out
  Pins appear: scale 0→1  spring per pin, 30ms stagger

Map → Property transition:
  Map blurs (filter:blur 0→4px  200ms)
  Property mini-card slides up (sheet reveal 250ms)
```

---

## 7.10 — Haptic Feedback System

### iOS Haptic Specifications

| Event | Haptic Type | Intensity |
|-------|-------------|-----------|
| Button tap (primary) | UIImpactFeedbackGenerator | .medium |
| Button tap (secondary/ghost) | UIImpactFeedbackGenerator | .light |
| Toggle switch | UIImpactFeedbackGenerator | .light |
| Wishlist save | UIImpactFeedbackGenerator | .medium |
| Star rating select | UIImpactFeedbackGenerator | .light (each star) |
| OTP digit entry | UIImpactFeedbackGenerator | .light (each) |
| OTP error (shake) | UINotificationFeedbackGenerator | .error |
| Pull-to-refresh threshold | UIImpactFeedbackGenerator | .medium |
| Sheet snap point reached | UIImpactFeedbackGenerator | .light |
| Drag delete reveal | UIImpactFeedbackGenerator | .medium |
| Payment confirmed | UINotificationFeedbackGenerator | .success |
| Payment failed | UINotificationFeedbackGenerator | .error |
| Booking confirmed | UINotificationFeedbackGenerator | .success × 2 |
| KYC photo captured | UIImpactFeedbackGenerator | .medium |
| Long press threshold | UIImpactFeedbackGenerator | .heavy |
| Navigation back | UIImpactFeedbackGenerator | .light |
| Tab switch | — | (none — too frequent) |
| Keyboard key | — | (none — system handles) |

### Android Haptic Specifications

Use `HapticFeedbackConstants`:

| Event | Constant |
|-------|----------|
| Button tap | `VIRTUAL_KEY` |
| Toggle | `CLOCK_TICK` |
| Success | `CONFIRM` (API 30+) |
| Error | `REJECT` (API 30+) |
| Long press | `LONG_PRESS` |
| Pull-to-refresh trigger | `CLOCK_TICK` |

---

## 7.11 — iOS vs Android Motion Differences

| Animation | iOS | Android |
|-----------|-----|---------|
| Navigation push | Slide right (UIKit default) | Slide + fade (Material 3) |
| Modal present | Slide up from bottom | Scale + fade from center |
| Navigation pop | Slide left reveal previous | Slide + fade (reverse) |
| Back gesture | Interactive edge swipe | Predictive back (Android 13+) |
| Ripple on tap | UIView opacity flash | Material ink ripple from touch point |
| Spring physics | UISpringTimingParameters | `SpringForce` / `OvershootInterpolator` |
| Sheet dismiss | Drag down with rubber band | Drag down (no rubber band) |
| Keyboard animation | Spring curve (matches system) | Linear (matches system) |

---

## 7.12 — Reduced Motion

When `preferesReducedMotion` (iOS) or `Accessibility > Remove animations` (Android):

| Animation | Reduced version |
|-----------|----------------|
| Screen transitions | Opacity crossfade only, 150ms |
| Sheet open | Instant appear (opacity 0→1, 100ms) |
| Card press | Opacity dim only (0.7), no scale |
| Booking success | Static checkmark appears (no draw animation) |
| Confetti | Removed entirely |
| Skeleton shimmer | Static grey (no animation) |
| Pull to refresh | Spinner appears instantly (no progress arc) |
| Hero expand | Crossfade only (no size animation) |
| Spring effects | Linear ease, 150ms |

---

# PART 8 — OFFLINE EXPERIENCE

## 8.01 — Offline State Detection

```
Detection method:
  iOS: NWPathMonitor (preferred) / Reachability
  Android: ConnectivityManager + NetworkCallback
  
States:
  connected     → normal operation
  limited       → connected but no internet (captive portal) → treat as offline
  offline       → no connection
  reconnecting  → was offline, attempting reconnect
  
Offline state is available to all screens via global context/provider
```

---

## 8.02 — Offline Banner

```
Appears: immediately on connection loss
Position: below navigation bar (not over content)
H: 36px
BG: #1F2937
FG: white
flex center  gap:8px
Icon: wifi-off 16px #9CA3AF
Text: "No internet connection · Showing saved content"  Inter 13px/500

Animation: slide down from top  250ms  spring
Dismiss: slides up when connection returns

Reconnected banner (same position):
BG: #059669
Text: "You're back online ·  Syncing..."  + spinner 14px white
Auto-dismiss: 3000ms
On dismiss: slide up  200ms
```

---

## 8.03 — Cached Content Strategy

### What is Cached

| Content | Cache duration | Storage |
|---------|---------------|---------|
| Active bookings (full detail) | Until checkout + 30 days | Local DB |
| Recent trip history | Last 10 trips | Local DB |
| Wishlists + saved properties | Until manually removed | Local DB |
| Last 50 messages per thread | 30 days | Local DB |
| Property details (viewed) | 7 days | Local DB |
| Last search results | Current session | Memory |
| Profile data | Until logout | Local DB |
| Host: listing data | 24 hours | Local DB |
| Host: calendar data | 24 hours | Local DB |
| Push notification history | 30 days | Local DB |

### Cache Invalidation

| Trigger | Action |
|---------|--------|
| App foreground (after >5min background) | Fetch fresh data for current screen only |
| Pull-to-refresh | Force refresh current list |
| Booking status change (push notification) | Invalidate booking cache immediately |
| User edits (listing, profile) | Invalidate edited item cache |
| App update | Clear stale schema caches |

---

## 8.04 — Offline Listings Browsing

```
User opens Explore while offline:
  Shows previous search results with banner:
  "Showing saved results from [relative time ago]"
  
  Cards: render normally from cache
  Images: show cached images or low-quality placeholder
  
  Search attempt while offline:
    Banner slides up: "Search requires internet connection"
    [Retry] button appears
    Previously viewed results remain
  
  Property detail (previously viewed):
    Full detail from cache
    Booking CTA: disabled  FG:#9CA3AF
    "Booking requires internet connection" note below CTA
    Gallery: cached images only
  
  Property detail (never viewed):
    Empty state: "We couldn't load this property. Check your connection."
    [Retry] button
```

---

## 8.05 — Offline Mutations (Sync Queue)

All write operations attempted while offline are queued and retried automatically.

### Queued Operations

| Operation | Queued? | User feedback |
|-----------|---------|--------------|
| Send message | ✅ | Clock icon on bubble, "Sending when online" |
| Wishlist save | ✅ | Optimistic update, syncs silently |
| Wishlist remove | ✅ | Optimistic update, syncs silently |
| Review draft | ✅ | "Saved as draft" — submits on reconnect |
| KYC document upload | ✅ | "Upload queued" progress indicator |
| Booking attempt | ❌ | Error: "Payment requires internet" — not queued |
| Profile edit save | ✅ | "Saved — will sync when online" |
| Host: block dates | ✅ | Optimistic, syncs on reconnect |
| Host: price override | ✅ | Optimistic, syncs on reconnect |

### Sync Queue UI

```
Profile → Settings → "Pending uploads" (visible only when queue > 0)

Each pending item:
  Icon (file type) + description + "Pending sync"
  Progress bar if partially uploaded
  [Retry now] if failed
  [Cancel] to remove from queue

Sync on reconnect:
  Progress toast: "Syncing X items..."
  Success: "All changes synced ✓"
  Partial failure: "2 of 3 items synced. Tap to retry failed items"
```

---

## 8.06 — Conflict Resolution

When a queued mutation conflicts with a server change:

| Scenario | Resolution Strategy |
|----------|-------------------|
| Guest deleted wishlist item while offline, same item updated on server | Local delete wins — item removed |
| Host blocked dates offline, booking made by guest during that time | Server wins — host notified of conflict, booking preserved |
| Message sent offline, same thread updated on server | Messages merge by timestamp |
| Profile edit offline, admin updated same field | Server version shown, local changes available to reapply |

**Conflict UI:**
```
Alert dialog (blocking):
  "We found a conflict"
  Description of what changed
  [Keep my version]  [Use server version]
  
For non-critical conflicts: silent server-wins with snackbar notification
```

---

## 8.07 — Reconnect Animation

```
When connection returns:
  Offline banner transforms:
    BG transitions: #1F2937 → #059669  400ms
    Icon changes: wifi-off → wifi  crossfade 200ms
    Text changes: "No internet" → "Back online · Syncing..."

  Sync begins immediately
  
  Spinner appears in banner while syncing
  Banner auto-dismisses after 3s OR when sync complete (whichever later)
  
  List content refreshes:
    Skeleton overlay appears briefly over current content
    Fresh data replaces cache
    Smooth crossfade (not a jarring reload)
```

---

# PART 9 — PUSH NOTIFICATIONS

## 9.01 — Notification Types & Priority

| Type | Priority | Channel (Android) | Alert style |
|------|----------|------------------|-------------|
| Booking confirmed | High | `booking` | Banner + sound + badge |
| New message | High | `messages` | Banner + sound + badge |
| Check-in reminder | High | `trips` | Banner + sound |
| Booking request (host) | High | `host_requests` | Banner + sound + badge |
| KYC status update | Medium | `account` | Banner only |
| Listing approved | Medium | `host_updates` | Banner only |
| Payout sent | Medium | `finance` | Banner only |
| Review request | Low | `reviews` | Notification center only |
| Platform marketing | Low | `promotions` | Notification center only |
| Emergency / Safety | Critical | `emergency` | Full-screen alert + sound |

---

## 9.02 — Notification Design Specs

### Standard Notification (iOS Lock Screen / Banner)

```
App icon: 40×40px (StayOS icon)
Title: Inter 15px/600  max 1 line
Body: Inter 14px/400  max 2 lines
Timestamp: relative ("Just now", "2m ago")
Thumbnail: 40×40px rounded (property photo or user avatar)

Example — New Message:
  [StayOS icon] StayOS
  Ahmed Mohamed sent a message
  "Hi! Is the apartment available for early check-in?"
  [Property thumbnail]

Example — Booking Confirmed:
  [StayOS icon] StayOS
  Booking Confirmed! 🎉
  Nile View Apartment · Aug 1–5 · BK-00123
  [Property thumbnail]
```

### Rich Notification (iOS only, with expanded view)

```
Expanded on long-press or pull-down:

Booking Confirmed (expanded):
  ┌─────────────────────────────────────────┐
  │ [Property large image — 300×150px]      │
  │ Booking Confirmed!                       │
  │ Nile View Apartment, Cairo              │
  │ Aug 1–5, 2026 · BK-00123               │
  │ [View Booking]  [Message Host]          │
  └─────────────────────────────────────────┘

New Message (expanded):
  ┌─────────────────────────────────────────┐
  │ [Avatar] Ahmed Mohamed — Nile View Apt  │
  │ "Hi! Is the apartment available..."     │
  │ [Reply text input]                      │
  │ [Reply] [Mark Read]                     │
  └─────────────────────────────────────────┘
```

### Notification Action Buttons

| Notification | Action 1 | Action 2 |
|-------------|----------|----------|
| New booking (host) | Accept | Decline |
| New message | Reply | Mark Read |
| Check-in reminder | View Details | Navigate |
| Review request | Write Review | Remind Me Later |
| KYC rejected | Resubmit | Learn More |
| Payment failed | Retry | Contact Support |

---

## 9.03 — Notification Groups

```
iOS: Group by category (threadIdentifier)
  "Messages" group: all unread message notifications
  "Bookings" group: all booking activity
  "Host Updates" group: all host-specific notifications

Android: Notification groups + summary notification
  Group summary: "5 new notifications" when 3+ stacked

Group display:
  iOS summary: "5 messages from 3 conversations"
  Android summary: bullet list of 3 most recent + "and 2 more"
```

---

## 9.04 — Silent / Data Notifications

Used for background app refresh without visible alert:

| Trigger | Background action |
|---------|-----------------|
| Booking status change | Update booking in local cache |
| New message | Update message count badge |
| Calendar sync (host) | Refresh calendar cache |
| Property data update | Refresh cached property |
| KYC status change | Refresh verification status |

**Priority:** Silent notifications have no alert, only data payload. App processes in background within OS time limits (30s iOS, unlimited Android).

---

## 9.05 — Deep Links from Notifications

```
URL scheme: stabyos://
Universal links: stabyos.com (fallback web)

Notification → Deep link mapping:

booking.confirmed:
  stabyos://trips/booking/{bookingId}
  → Open Trips tab → push Booking Detail

message.received:
  stabyos://messages/{threadId}
  → Open Messages tab → push Thread

kyc.approved:
  stabyos://profile/verification
  → Open Profile tab → push Verification screen

listing.approved:
  stabyos://host/listings/{listingId}
  → Open Host tab → push Listing Detail

payout.sent:
  stabyos://host/payouts
  → Open Host tab → push Payouts screen

review.request:
  stabyos://trips/booking/{bookingId}/review
  → Open Trips → Booking Detail → open Review sheet
```

---

# PART 10 — PERMISSIONS

## 10.01 — Permission Request Strategy

**Golden rule:** Request permission at the moment it is needed, with context visible on screen — never on app launch.

**Pre-prompt:** Always show a StayOS custom explanation screen BEFORE triggering the OS permission dialog. This increases acceptance rate significantly.

---

## 10.02 — Camera Permission

```
When requested: User taps "Take photo" for KYC / property photos / profile picture
Context: Visible camera UI below, natural context

Pre-prompt screen:
  Icon: camera SVG illustration (80px)
  Title: "StayOS needs camera access"
  Body: "To verify your identity and take property photos, we need access to your camera."
  [Allow Camera Access] → triggers OS dialog
  [Not Now] → offers gallery option instead

OS dialog (iOS): "StayOS Would Like to Access the Camera"  [Don't Allow] [OK]
OS dialog (Android): runtime permission request

Denied state:
  Icon: camera-off illustration
  Title: "Camera access denied"
  Body: "To use this feature, enable camera access in Settings."
  [Open Settings] → deep link to app settings
  [Use Gallery Instead] → fallback option

Never ask again (iOS — "Don't Allow" selected twice):
  Always show settings deep link
  Never trigger OS dialog again (OS blocks this)
```

---

## 10.03 — Gallery / Photo Library Permission

```
When requested: User taps "Choose from Library"
iOS variants: Limited access vs full access

Pre-prompt:
  Icon: image-gallery illustration
  Title: "Access your photos"
  Body: "Choose photos from your library for property listings, profile picture, or verification documents."
  [Choose Photos] → triggers limited access
  [Allow Full Access] → full photo library

iOS limited access handling:
  "You've given StayOS access to [X] photos."
  [Select More Photos] link
  
Denied: same Settings deep link pattern as Camera
```

---

## 10.04 — Location Permission

```
When requested: First time user taps "Use my location" in search, OR opens map

Pre-prompt:
  Icon: map-pin SVG illustration
  Title: "Find stays near you"
  Body: "Allow location access to show properties near you and get directions to your booking."
  [Use My Location] → triggers OS dialog
  [Enter Location Manually] → text search fallback

iOS permission types:
  "When In Use" only — never request "Always" (no background location needed)
  
Android:
  FINE_LOCATION (precise) — required for map accuracy

Denied state:
  Search bar shows "Enter a location" placeholder
  Map: shows default view (city level)
  Directions: offers external maps app instead of in-app directions

Always explain why: never background location tracking without explicit host feature requirement
```

---

## 10.05 — Notifications Permission

```
When requested: After booking confirmed (first booking), OR after first message received

Pre-prompt (shown on successful booking):
  Icon: bell illustration with celebration
  Title: "Stay informed about your trip"
  Body: "Get notified about your check-in, messages from your host, and booking updates."
  [Turn On Notifications] → OS dialog
  [Not Now] → dismiss (re-prompt in 7 days if another booking made)

iOS: UNUserNotificationCenter requestAuthorization

Android: POST_NOTIFICATIONS (Android 13+)

Denied handling:
  No in-app alerts for push content
  Show in-app banners for critical items (new message badge, etc.)
  Settings reminder (non-intrusive) in Profile → Notifications
```

---

## 10.06 — Biometric Authentication

```
When requested: User enables "Use Face ID / Fingerprint" in Settings → Security

Pre-prompt:
  Title: "Sign in faster with Face ID"
  Body: "Use Face ID to sign in without entering your password."
  [Enable Face ID] → OS biometric enrollment
  [Not Now] → remains password-only

iOS: LAContext.evaluatePolicy
Android: BiometricPrompt

Usage thereafter:
  On app foreground (after background >5 min):
    Show biometric prompt
    Success: authenticate silently
    Failure: show PIN/password fallback

Biometric prompt design:
  iOS: System Face ID/Touch ID sheet (do not customize)
  Android: System BiometricPrompt dialog (do not customize)
  
Fallback: PIN input or password on biometric failure (3 attempts max)
```

---

## 10.07 — Microphone Permission

```
When requested: Voice message feature (v2) OR KYC voice verification (v2)
Not required in v1 — do not request

If added in future:
  Pre-prompt: "Record voice messages"
  Context: visible in messaging screen
  Fallback: text-only messaging if denied
```

---

## 10.08 — Contacts Permission

```
Not requested in v1.
If added for "Invite a friend": request with full context explanation.
Never request silently.
```

---

# PART 11 — APP LIFECYCLE

## 11.01 — Cold Start Sequence

```
Definition: App not in memory at all. User taps icon.

Timeline:
  0ms:      OS launches process
  0–200ms:  Splash screen shows (system LaunchScreen.storyboard / launch_background)
  200ms:    App code begins executing
  200–400ms: Check auth token in secure storage (Keychain/Keystore)
  400ms:    
    If valid token → pre-fetch home data in background
    If expired → attempt silent refresh
    If no token → show login

  400–800ms: Navigation stack initialized
  800–1200ms: First screen renders with skeleton
  800–1800ms: API data arrives, skeleton→content
  
Target: interactive within 1.5s on mid-range device (Pixel 6a, iPhone SE 3rd gen)
```

### Splash Screen Design

```
BG: #2C5FFF (brand primary)
Center: StayOS logo mark only (not wordmark)
  W: 80px  H: 80px  (icon mark, white)
  Scale animation: 0.8→1  400ms  spring (starts at 200ms)
  
Do NOT show:
  Loading spinner on splash
  Percentage progress
  Marketing messages
  
Duration: minimum 200ms, maximum 600ms
Transition: fade to first screen (200ms)
```

---

## 11.02 — Warm Start

```
Definition: App in memory/background, user returns.

Timeline:
  0ms: OS brings app to foreground
  0–50ms: Resume animation plays (if any)
  50ms: Check session validity
  
Session check:
  < 5 minutes background: resume exactly where left off (no re-auth)
  5–30 minutes: resume screen + silently refresh data in background
  > 30 minutes: require biometric re-authentication OR if disabled: resume normally
  > 24 hours: full token refresh, show brief skeleton reload
  Expired token: force to login screen

Warm start target: <200ms to interactive
```

---

## 11.03 — Background App State

```
When app goes to background:
  Save current navigation state (route + params)
  Pause all non-critical network requests
  Save any in-progress form data to local storage
  Cancel any pending animations
  Sync pending queue items if connected

Background refresh (iOS Background App Refresh):
  Frequency: system-determined (typically every 15min)
  Tasks: sync messages, update booking cache, prefetch next screen data
  
Background fetch (Android WorkManager):
  Periodic sync: every 15 minutes when charging + WiFi
  Tasks: same as iOS
```

---

## 11.04 — Session Timeout & Token Refresh

```
Access token lifetime: 1 hour
Refresh token lifetime: 30 days

Silent refresh:
  When access token expires while app is active:
    Use refresh token to get new access token
    User sees nothing — seamless
    
  If refresh token expired:
    Save current navigation state
    Show: "Your session has expired. Please sign in again."
    [Sign In] button
    After re-auth: restore to previous navigation state

Forced logout triggers:
  Account suspended by admin
  Password changed on another device
  Security breach detected
  User manually logs out
  
Forced logout UI:
  Clear all local auth tokens
  Clear sensitive cached data (messages, bookings remain for UX continuity but marked stale)
  Navigate to login screen
  Show reason: "You've been signed out. [Reason if applicable]"
```

---

## 11.05 — Deep Links & Universal Links

```
Deep link formats:

Universal Link (web):
  https://stabyos.com/property/{slug}
  https://stabyos.com/booking/{bookingId}
  https://stabyos.com/host/listings/{id}
  
URL Scheme (app-to-app):
  stabyos://property/{slug}
  stabyos://booking/{id}
  stabyos://trips
  stabyos://messages/{threadId}
  stabyos://auth/verify

QR Code format:
  Encodes universal link (HTTPS)
  On scan: open property detail or booking check-in screen

Handling rules:
  Auth required: if not authenticated → login → redirect to intended deep link
  Invalid ID: show "Page not found" error with [Explore] CTA
  Expired link: "This link has expired" with relevant alternative
```

---

## 11.06 — App Resume After Notification Tap

```
States when notification is tapped:

State A — App in foreground (active):
  Navigate to deep link screen directly
  If already on that screen: refresh data

State B — App in background (suspended):
  Resume app → navigate to deep link screen
  Show transition to deep linked content

State C — App not running (killed):
  Cold start → skip onboarding if authed → navigate to deep link screen
  Splash screen shows during this time

State D — App not installed:
  Universal link opens in Safari/browser
  App Store badge shown: "Download StayOS"
```
