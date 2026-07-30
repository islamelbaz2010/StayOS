# StayOS — Native Mobile Design System
## P4: iOS Spec · Android Spec · Flutter Mapping · React Native Mapping

**Version:** 1.0 | **Status:** Production-Ready
**Continues from:** MOBILE_NATIVE_DESIGN_P3.md

---

# PART 12 — iOS SPECIFICATION

*Follows Apple Human Interface Guidelines (HIG) — Latest (iOS 17/18)*

## 12.01 — iOS Navigation Architecture

```
Tab-based root navigation:
  UITabBarController — root
  └── Tab 1: Explore → UINavigationController
      └── ExploreViewController
          └── SearchResultsViewController
              └── PropertyDetailViewController
                  └── CheckoutViewController (modal)
  
  └── Tab 2: Trips → UINavigationController  
      └── TripsViewController
          └── BookingDetailViewController
  
  └── Tab 3: Create (host only) → UINavigationController
      └── ListingWizardViewController (modal, full-screen)
  
  └── Tab 4: Messages → UINavigationController
      └── InboxViewController
          └── ConversationViewController
  
  └── Tab 5: Profile → UINavigationController
      └── ProfileViewController
          └── SettingsViewController

Modal presentations:
  Checkout: .formSheet on iPad, .pageSheet on iPhone
  KYC: .fullScreen
  Gallery: .fullScreen + custom transition
  Filters: custom bottom sheet (UISheetPresentationController)
```

---

## 12.02 — iOS Navigation Bar

```
Appearance:
  UINavigationBarAppearance
  backgroundColor: UIColor(hex: "#FFFFFF") with alpha 0.92
  shadowColor: .clear (no bottom line — use scroll-triggered shadow instead)
  backgroundEffect: UIBlurEffect(style: .systemMaterial)
  
  titleTextAttributes: [
    .font: UIFont(name: "Inter-SemiBold", size: 17),
    .foregroundColor: UIColor(hex: "#111827")
  ]
  
  largeTitleTextAttributes: [
    .font: UIFont(name: "Inter-Bold", size: 34),
    .foregroundColor: UIColor(hex: "#111827")
  ]

Back button:
  tintColor: UIColor(hex: "#2C5FFF")
  backButtonTitle: truncated previous title (max 12 chars) or "Back"
  chevron: system "chevron.backward" symbol

Scroll behavior:
  Root tabs: .largeTitles enabled (collapses on scroll)
  Detail screens: .inline (always small title)
```

---

## 12.03 — iOS Tab Bar

```
UITabBarAppearance:
  backgroundColor: UIColor.systemBackground with alpha 0.92
  backgroundEffect: UIBlurEffect(style: .systemMaterial)
  stackedLayoutAppearance:
    normal: iconColor = UIColor(hex: "#9CA3AF"), titleColor = UIColor(hex: "#9CA3AF")
    selected: iconColor = UIColor(hex: "#2C5FFF"), titleColor = UIColor(hex: "#2C5FFF")
  
  shadowImage: nil (use hairline from appearance)

Tab items:
  Explore: "house" / "house.fill" (SF Symbols)
  Trips: "airplane" / "airplane.circle.fill" 
  [+]: custom FAB circle (not standard tab item — use UIButton overlay)
  Messages: "message" / "message.fill"
  Profile: "person" / "person.fill"

Badge:
  UITabBarItem.badgeValue: "5" or "" for dot
  badgeColor: UIColor(hex: "#EF4444")
```

---

## 12.04 — iOS UISheetPresentationController (Bottom Sheet)

```
Available: iOS 15+

Detents:
  .medium() → approximately 50% screen height
  .large() → approximately 92% screen height
  Custom: .custom(identifier:resolver:) for precise control

StayOS configuration:
  sheetPresentationController.detents = [.medium(), .large()]
  sheetPresentationController.selectedDetentIdentifier = .medium
  sheetPresentationController.prefersGrabberVisible = true
  sheetPresentationController.prefersScrollingExpandsWhenScrolledToEdge = true
  sheetPresentationController.largestUndimmedDetentIdentifier = .medium
  (undimmed at medium = background interactive at medium)

Corner radius: 20pt (system default = 10pt → override)
  override viewDidAppear:
    sheetPresentationController?.containerView?.layer.cornerRadius = 20

Blocking sheet (payment processing):
  isModalInPresentation = true
  No grabber, no detents change
  Only programmatic dismiss
```

---

## 12.05 — iOS Context Menus (Long Press)

```
UIContextMenuConfiguration on property cards:

Preview:
  UITargetedPreview(view: propertyImageView)
  Blurs background automatically

Menu items:
  UIMenu with UIActions:
    "Save to Wishlist" → heart.fill icon → brand action
    "Share" → square.and.arrow.up icon → share sheet
    "View Host" → person icon → navigate
    separator
    "Report Listing" → flag icon → destructive

Menu presentation:
  On long press 350ms: preview pops up, menu appears above/below
  Haptic: UIImpactFeedbackGenerator .medium
  
UIContextMenuInteraction added to each property card
```

---

## 12.06 — Dynamic Island Integration

```
Live Activities framework (iOS 16.1+)

ActivityAttributes:
  StayOSBookingAttributes:
    bookingId: String
    propertyName: String
    propertyImageURL: URL

  ContentState:
    status: BookingStatus  (confirmed / checkin_today / checked_in)
    checkInDate: Date
    daysUntilCheckIn: Int

Views:
  compactLeading: PropertyIconView (property thumbnail 16pt)
  compactTrailing: StatusLabel ("Check-in 3PM" 13pt SF Pro)
  
  minimal: StayOS app icon 16pt
  
  expanded:
    Header: PropertyThumbnail(40×40pt) + PropertyName + Dates
    Content: Status badge + countdown or "Have a great stay!"
    Footer: [View Booking] Button

Lock Screen widget:
  Same as expanded view, tappable → opens booking detail

Update frequency:
  On booking confirmation: create activity
  24h before check-in: update content state
  On check-in: update to "You're checked in!"
  On checkout: end activity
```

---

## 12.07 — Apple Pay Integration

```
Availability: check PKPaymentAuthorizationController.canMakePayments()

Payment request configuration:
  merchantIdentifier: "merchant.com.stabyos.app"
  supportedNetworks: [.visa, .masterCard, .amex]
  merchantCapabilities: [.capability3DS]
  countryCode: "EG" (or user's country)
  currencyCode: "USD" (primary) / "EGP" (local)

Line items:
  PKPaymentSummaryItem(label: "Nile View Apt · 4 nights", amount: 480)
  PKPaymentSummaryItem(label: "Cleaning fee", amount: 40)
  PKPaymentSummaryItem(label: "Service fee", amount: 52)
  PKPaymentSummaryItem(label: "Taxes", amount: 28)
  PKPaymentSummaryItem(label: "StayOS", amount: 600, type: .final)

Button:
  PKPaymentButton(paymentButtonType: .buy, paymentButtonStyle: .black)
  Shown above card payment option when available
  H: 52pt (matches primary button height)
  R: 14pt (matches brand radius)
  
After authorization:
  Pass token to backend → Stripe for processing
  Handle PKPaymentAuthorizationResult: .success / .failure
```

---

## 12.08 — Face ID / Touch ID (iOS Biometrics)

```
LAContext usage:

Check availability:
  context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)
  
Request:
  context.evaluatePolicy(
    .deviceOwnerAuthenticationWithBiometrics,
    localizedReason: "Sign in to StayOS"
  )

Reason strings:
  Face ID: "Authenticate to access your StayOS account"
  Touch ID: "Use your fingerprint to sign in"

Fallback:
  context.localizedFallbackTitle = "Use PIN"
  On fallback tap: present PIN entry screen

Failure handling:
  3 biometric failures → show PIN/password
  Biometric lockout → show "Use your device passcode" (system handles)
```

---

## 12.09 — iOS Haptic Feedback Triggers (Code-level mapping)

*Reference from Part 7.10 — implementation class reference only*

```
UIImpactFeedbackGenerator(style: .light).impactOccurred()
  → tap secondary button, toggle, wishlist

UIImpactFeedbackGenerator(style: .medium).impactOccurred()
  → tap primary button, wishlist save, photo capture

UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
  → long press threshold

UINotificationFeedbackGenerator().notificationOccurred(.success)
  → booking confirmed, payment success

UINotificationFeedbackGenerator().notificationOccurred(.error)
  → OTP wrong, payment failed

UINotificationFeedbackGenerator().notificationOccurred(.warning)
  → destructive action confirmation
  
UISelectionFeedbackGenerator().selectionChanged()
  → calendar day selection, picker scroll
```

---

## 12.10 — iOS Dark Mode

```
All colors via UIColor / SwiftUI Color using adaptive color assets:
  Each color defined with Light and Dark variants in Assets.xcassets

Key mappings:
  surfacePage: Light #F9FAFB / Dark #0F1117
  surfaceCard: Light #FFFFFF / Dark #1A1D27
  textPrimary: Light #111827 / Dark #F9FAFB
  textSecondary: Light #6B7280 / Dark #9CA3AF
  brandPrimary: Light #2C5FFF / Dark #4F7BFF

UITraitCollection:
  Observe traitCollectionDidChange to update:
    Navigation bar appearance
    Tab bar appearance
    Custom drawn elements

Status bar:
  UIStatusBarStyle.lightContent (dark mode)
  UIStatusBarStyle.darkContent (light mode)
  Managed per UIViewController
```

---

## 12.11 — iOS Accessibility

```
VoiceOver:
  All UIViews: accessibilityLabel (what it is)
  Interactive: accessibilityHint (what it does)
  State: accessibilityValue (current value)
  
  Property card: 
    label: "Nile View Apartment, Cairo, 4.9 stars, $120 per night"
    hint: "Double tap to view property details"
  
  Wishlist button:
    label: "Save to wishlist" / "Saved to wishlist"
    traits: .button
    
  Star rating (input):
    accessibilityLabel: "Rating: 4 stars out of 5"
    accessibilityAdjustable: true (swipe up/down adjusts)

Dynamic Type:
  All labels: adjustsFontForContentSizeCategory = true
  Font: UIFont.preferredFont(forTextStyle:) mapped to Inter
  Minimum: never clamp — allow full Dynamic Type range

Switch Control:
  All interactive elements reachable via switch scanning
  Group related items: UIAccessibilityContainer

Reduce Motion:
  UIAccessibility.isReduceMotionEnabled
  When true: replace animations per Part 7.12 specs
```

---

# PART 13 — ANDROID SPECIFICATION

*Follows Material Design 3 — Android HIG*

## 13.01 — Android Navigation Architecture

```
Navigation Component (Jetpack):
  NavGraph with 5 bottom-nav destinations

Bottom nav graph:
  explore_graph:
    startDestination: ExploreFragment
    → SearchResultsFragment
    → PropertyDetailFragment
    → CheckoutActivity (separate back stack)
  
  trips_graph:
    startDestination: TripsFragment
    → BookingDetailFragment
  
  create_graph (host):
    startDestination: ListingWizardActivity (full screen)
  
  messages_graph:
    startDestination: InboxFragment
    → ConversationFragment
  
  profile_graph:
    startDestination: ProfileFragment
    → SettingsFragment
    → KYCActivity (full screen)

Fragment transactions:
  Push: slide left (custom animation)
  Pop: slide right (custom animation)
  Modal: bottom enter / bottom exit

Predictive Back (Android 13+):
  onBackPressedDispatcher handles all back navigation
  Predictive back preview enabled for all standard transitions
  Custom drawables for back gesture preview
```

---

## 13.02 — Material 3 Top App Bar

```
SmallTopAppBar (default drill-down screens):
  H: 64dp
  navigationIcon: ArrowBack, 24dp, #374151
  title: Inter 22sp/400 #111827
  actions: IconButton list, 24dp icons, 48dp touch targets
  colors: TopAppBarDefaults.topAppBarColors(
    containerColor = Color.White,
    scrolledContainerColor = Color.White,
    navigationIconContentColor = #374151,
    titleContentColor = #111827,
    actionIconContentColor = #374151
  )
  scrollBehavior: TopAppBarDefaults.pinnedScrollBehavior()
  
  On scroll: Material elevation overlay appears (subtle shadow + tonal shift)

CenterAlignedTopAppBar (auth screens):
  title centered
  no navigationIcon (or close button)

LargeTopAppBar (home / section roots):
  Expanded: H 152dp, title 28sp at bottom
  Collapsed: H 64dp, title 22sp centered
  scrollBehavior: exitUntilCollapsedScrollBehavior()
```

---

## 13.03 — Material 3 Bottom Navigation

```
NavigationBar:
  H: 80dp + system inset
  containerColor: Color.White
  
NavigationBarItem per tab:
  icon: Outline → Filled on select
  label: Inter 12sp/500
  
  indicatorColor: #EEF2FF (brand-50)
  selectedIconColor: #2C5FFF
  selectedTextColor: #2C5FFF
  unselectedIconColor: #6B7280
  unselectedTextColor: #6B7280

Badge:
  BadgedBox with Badge composable
  content: "5" or null for dot only
  containerColor: #EF4444
  contentColor: Color.White
```

---

## 13.04 — Material 3 FAB

```
FloatingActionButton:
  shape: RoundedCornerShape(16.dp)  (Material 3 default)
  containerColor: #2C5FFF
  contentColor: Color.White
  elevation: FloatingActionButtonDefaults.elevation(
    defaultElevation = 6.dp,
    pressedElevation = 2.dp
  )
  
ExtendedFloatingActionButton:
  icon: Icon(Icons.Add, 24.dp)
  text: "New Listing"  Inter 15sp/600
  Collapsed: icon only (on scroll down)
  Expanded: icon + text (on scroll up or at top)
  Animation: width change with spring

onClick: HapticFeedbackType.LongPress (medium haptic equivalent)
```

---

## 13.05 — Material 3 Bottom Sheet

```
ModalBottomSheet composable:
  sheetState: rememberModalBottomSheetState(skipPartiallyExpanded=false)
  
  shape: RoundedCornerShape(topStart=20.dp, topEnd=20.dp)
  containerColor: Color.White
  dragHandle: @Composable { BottomSheetDefaults.DragHandle() }
  
  Drag handle: W:32dp H:4dp R:2dp BG:#D1D5DB
  
  scrimColor: Color.Black.copy(alpha=0.5f)
  
Snap points:
  SheetValue.PartiallyExpanded → 50%
  SheetValue.Expanded → 90%
  SwipeToClose → SwipeToClose (confirmValueChange)

Scaffold integration:
  BottomSheetScaffold for persistent sheets (calendar)
  ModalBottomSheet for transient sheets (filters, confirmations)
```

---

## 13.06 — Material 3 Cards

```
Card (elevated):
  elevation: CardDefaults.cardElevation(
    defaultElevation = 2.dp,
    pressedElevation = 4.dp
  )
  shape: RoundedCornerShape(16.dp)
  colors: CardDefaults.cardColors(containerColor = Color.White)
  
  onClick ripple: rememberRipple(bounded=true, color=#2C5FFF with alpha 0.12)

Property card interaction:
  onClick: navigate to detail
  onLongClick: show context menu (MaterialDropdownMenu)
```

---

## 13.07 — Material Motion (Android)

```
Navigation transitions using Navigation Component:

Push (ExploreFragment → PropertyDetailFragment):
  enter: slide_from_right (300ms, FastOutSlowInInterpolator)
  exit: slide_to_left (250ms, FastOutLinearInInterpolator)
  popEnter: slide_from_left (300ms)
  popExit: slide_to_right (250ms)

Modal enter/exit:
  enter: slide_from_bottom (350ms, LinearOutSlowInInterpolator)
  exit: slide_to_bottom (250ms, FastOutLinearInInterpolator)

Shared element transition (property card → detail):
  SharedElementTransition with TransitionSet
  changeBounds + changeImageTransform
  Interpolator: FastOutSlowInInterpolator
  Duration: 350ms
  
Predictive Back Animation:
  onBackPressedCallback with predictive back progress listener
  Animate exit screen toward back direction during gesture
  Reveal previous screen underneath
  Cancel: spring back on gesture cancel
```

---

## 13.08 — Android Dynamic Color (Material You)

```
Policy: StayOS branding is NOT overridden by Dynamic Color

Implementation:
  MaterialTheme colors are explicitly set, NOT derived from wallpaper
  
  val StayOSColorScheme = lightColorScheme(
    primary = Color(0xFF2C5FFF),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFEEF2FF),
    secondary = Color(0xFF059669),
    surface = Color(0xFFF9FAFB),
    background = Color(0xFFF9FAFB),
    error = Color(0xFFDC2626)
    // all colors explicitly defined
  )

Do NOT use dynamicLightColorScheme() or dynamicDarkColorScheme()
Rationale: brand identity consistency across all Android versions
```

---

## 13.09 — Android Back Gesture & Predictive Back

```
Predictive Back (Android 13+):
  All NavigationController-managed destinations: automatic
  
  Modal/Dialog back:
    ModalBottomSheet: back gesture closes sheet (animated)
    Dialog: back gesture dismisses (system default)
    Full-screen activities: predictive back shows previous screen underneath
  
  Custom back: implement OnBackPressedCallback
    Shopping flow (checkout): back shows "Leave checkout?" dialog
    Form with changes: back shows "Discard changes?" dialog
    KYC wizard: back goes to previous step (not app back)
    
  Blocked back: payment processing overlay
    No back gesture response while processing
    After processing completes: re-enable back

enableOnBackInvokedCallback = true in AndroidManifest
```

---

# PART 14 — FLUTTER COMPONENT MAPPING

*No code. Widget names and behavior only. For reference by Flutter engineers.*

## 14.01 — Navigation

| StayOS Component | Flutter Widget | State | Animation | Notes |
|-----------------|----------------|-------|-----------|-------|
| App root | `MaterialApp` / `CupertinoApp` | Adaptive per platform | — | Use `PlatformApp` (platform_ui pkg) |
| Bottom tab bar | `NavigationBar` (Material) / `CupertinoTabBar` (iOS) | `int _selectedIndex` | Material: indicator slide; iOS: icon crossfade | |
| Navigation stack | `Navigator` 2.0 with `GoRouter` | Route stack | Push/pop slide | |
| Navigation bar (top) | `SliverAppBar` / `AppBar` | — | Large title collapse | `forceElevated: true` on scroll |
| Back button | `BackButton` / `CupertinoNavigationBarBackButton` | — | Platform-native | |

## 14.02 — Layout

| StayOS Component | Flutter Widget | Required State | Animation | Notes |
|-----------------|----------------|---------------|-----------|-------|
| Bottom sheet | `showModalBottomSheet` + `DraggableScrollableSheet` | snap points as list | Spring drag | `initialChildSize`, `minChildSize`, `maxChildSize` |
| Safe area | `SafeArea` | — | — | Wrap all screen roots |
| Keyboard avoidance | `Scaffold(resizeToAvoidBottomInset: true)` | — | — | |
| Pull to refresh | `RefreshIndicator` | `_isRefreshing` bool | Circular progress | Custom color: `color: brandPrimary` |
| Infinite scroll | `NotificationListener<ScrollEndNotification>` | page counter, hasMore bool | Skeleton append | |

## 14.03 — Cards

| StayOS Component | Flutter Widget | Required State | Animation | Notes |
|-----------------|----------------|---------------|-----------|-------|
| Property card | `InkWell` + `Card` + `Column` | wishlisted bool, imageLoaded bool | `AnimatedScale` on press | Custom clip for radius |
| Property card image | `CachedNetworkImage` | loading/error/success | Shimmer placeholder | Use `cached_network_image` package |
| Wishlist toggle | `AnimatedSwitcher` + `IconButton` | `isWishlisted` bool | Scale spring | `TweenAnimationBuilder` for bounce |
| Booking card | `GestureDetector` + `Container` | booking status enum | — | |

## 14.04 — Forms

| StayOS Component | Flutter Widget | Required State | Animation | Notes |
|-----------------|----------------|---------------|-----------|-------|
| Text input | `TextField` with `InputDecoration` | focus node, validation state | Border color transition | Custom `InputBorder` |
| OTP input | Custom widget (6 `TextField` in `Row`) | `List<TextEditingController>`, `List<FocusNode>` | Shake on error | Auto-advance: `FocusScope.of(context).nextFocus()` |
| PIN input | Custom widget (4 animated circles) | `String _pin` | Circle fill animation | |
| Calendar (guest) | `TableCalendar` (package) | range selection dates | Day highlight | `table_calendar` package |
| Calendar (host) | Custom `GridView` | blocked/booked/available map | Color transitions | |
| Date picker (iOS) | `CupertinoDatePicker` in bottom sheet | `DateTime selected` | Sheet slide | |
| Date picker (Android) | `showDateRangePicker` (Material) | `DateTimeRange` | System animation | |
| Guest selector | `BottomSheet` + custom counter rows | `Map<String,int> guests` | Counter `AnimatedSwitcher` | |
| Price slider | `RangeSlider` | `RangeValues _currentRange` | Thumb spring (custom) | Custom thumb painter |
| Toggle | `Switch.adaptive` | `bool _value` | Adaptive per platform | `Switch.adaptive()` auto-picks platform style |
| Checkbox | `Checkbox` | `bool? _checked` | Check draw | |

## 14.05 — Navigation Components

| StayOS Component | Flutter Widget | Required State | Animation | Notes |
|-----------------|----------------|---------------|-----------|-------|
| Bottom navigation | `NavigationBar` | `int _selectedIndex` | Indicator animation | Material 3 |
| Top app bar (scrollable) | `SliverAppBar` | collapsed bool | Title shrink | |
| FAB | `FloatingActionButton.extended` | expanded bool | Width animation | |
| Tab bar (horizontal) | `TabBar` + `TabBarView` | `TabController` | Underline slide | |
| Filter chips (row) | `SingleChildScrollView` + `FilterChip` | `Set<String> selected` | Fill animation | |
| Action sheet | `showModalBottomSheet` (custom) or `showCupertinoModalPopup` | — | Platform-adaptive | |
| Alert dialog | `AlertDialog` (Material) / `CupertinoAlertDialog` | — | Platform-adaptive | Use `adaptive_dialog` package |

## 14.06 — Media

| StayOS Component | Flutter Widget | Required State | Animation | Notes |
|-----------------|----------------|---------------|-----------|-------|
| Photo gallery | `PageView.builder` + `InteractiveViewer` | current page, zoom scale | Swipe + pinch | Hero transition from card |
| Camera overlay | `camera` package + custom overlay | camera state, capture state | Shutter animation | |
| Gallery picker | `image_picker` / `photo_manager` package | selected list | Selection animation | `multi_image_picker` |
| Image zoom | `PhotoView` (package) | scale, position | Spring snap | `photo_view` package |

## 14.07 — Feedback & State

| StayOS Component | Flutter Widget | Required State | Animation | Notes |
|-----------------|----------------|---------------|-----------|-------|
| Toast (top) | Custom overlay `OverlayEntry` | message, type, visible | Slide + fade | `overlay_support` package |
| Snackbar | `ScaffoldMessenger.showSnackBar` | message, action | Slide up | Material-style |
| Progress bar | `LinearProgressIndicator` | value (0.0–1.0) | Fill animation | |
| Spinner | `CircularProgressIndicator` | — | Continuous rotation | Custom color + strokeWidth |
| Skeleton | `Shimmer.fromColors` | loading bool | Shimmer animation | `shimmer` package |
| Offline banner | `AnimatedContainer` below AppBar | `_isOffline` bool | Height expand/collapse | |
| Success overlay | Custom `FullScreenOverlay` | success state | Checkmark draw + confetti | `confetti` package |
| Haptics | `HapticFeedback.*` | — | — | `flutter/services.dart` |

## 14.08 — Accessibility (Flutter)

| Requirement | Widget | Implementation |
|-------------|--------|---------------|
| Semantic label | `Semantics(label:)` | Wrap all custom widgets |
| Focus order | `FocusTraversalGroup` | Group screen regions |
| Dynamic Type | `textScaleFactor` from `MediaQuery` | Scale typography |
| Reduced motion | `MediaQuery.disableAnimations` | Reduce/remove animations |
| Touch target | Minimum `GestureDetector` area | `ConstrainedBox(minHeight:44, minWidth:44)` |

---

# PART 15 — REACT NATIVE COMPONENT MAPPING

*No code. Component names and behavior only.*

## 15.01 — Navigation

| StayOS Component | React Native Package | State | Animation | Notes |
|-----------------|---------------------|-------|-----------|-------|
| App root + navigation | `@react-navigation/native` | navigation state | — | |
| Bottom tabs | `@react-navigation/bottom-tabs` | tab index | Icon crossfade | `tabBarStyle`, `tabBarActiveTintColor` |
| Stack navigation | `@react-navigation/native-stack` | stack | Slide (iOS) / fade (Android) | |
| Native stack | `@react-navigation/native-stack` | — | Native driver | Prefer native over JS stack |
| Back button | System back (Android) + header back (iOS) | — | Platform native | |

## 15.02 — Layout

| StayOS Component | React Native Package | State | Animation | Notes |
|-----------------|---------------------|-------|-----------|-------|
| Safe area | `react-native-safe-area-context` | insets from `useSafeAreaInsets()` | — | Required in all screen roots |
| Bottom sheet | `@gorhom/bottom-sheet` | snap points, index | Spring drag | `BottomSheetModal` |
| Keyboard avoidance | `KeyboardAvoidingView` | behavior: 'padding' (iOS) / 'height' (Android) | — | |
| Keyboard dismiss | `ScrollView(keyboardShouldPersistTaps:'handled')` | — | — | |
| Pull to refresh | `RefreshControl` inside `ScrollView` or `FlatList` | `refreshing` bool | Spinner | `tintColor: '#2C5FFF'` |
| Infinite scroll | `FlatList(onEndReached)` | `page`, `hasMore`, `loading` | Skeleton footer | `onEndReachedThreshold: 0.2` |

## 15.03 — Cards

| StayOS Component | React Native Component | State | Animation | Notes |
|-----------------|----------------------|-------|-----------|-------|
| Property card | `Pressable` + `View` | wishlisted, imageLoaded | `Animated.spring` scale on press | |
| Card image | `Image` (expo-image preferred) | loading, error | Progressive fade-in | `expo-image` for caching |
| Wishlist toggle | `Pressable` + `Animated.View` | saved bool | Spring scale bounce | |
| Swipe actions | `react-native-gesture-handler` `Swipeable` | swipe state | — | `Swipeable` component |

## 15.04 — Forms

| StayOS Component | React Native Component | State | Animation | Notes |
|-----------------|----------------------|-------|-----------|-------|
| Text input | `TextInput` | value, focus, error | Border color animation | `Animated` border color |
| OTP input | Custom (6 `TextInput` in `View`) | pin array, refs | Shake animation | `useRef` for focus management |
| Date picker | `@react-native-community/datetimepicker` | date, mode | Platform native | `DateTimePickerModal` |
| Slider | `@react-native-community/slider` | value range | Thumb following | Custom styled |
| Toggle | `Switch` | value bool | Platform native | `trackColor`, `thumbColor` |
| Checkbox | Custom `Pressable` + `Animated` | checked bool | Check draw animation | |

## 15.05 — Media

| StayOS Component | React Native Package | Notes |
|-----------------|---------------------|-------|
| Image gallery | `react-native-image-viewing` | Fullscreen gallery with swipe |
| Camera (KYC) | `expo-camera` | With overlay compositing |
| Image picker | `expo-image-picker` | Multi-select support |
| Maps | `react-native-maps` | Google Maps on Android, Apple Maps on iOS |
| Video player | `expo-av` | Future feature |

## 15.06 — Native Modules

| Feature | Package | Notes |
|---------|---------|-------|
| Haptics | `expo-haptics` | Covers all haptic types from Part 7.10 |
| Biometrics | `expo-local-authentication` | Face ID + Touch ID + Fingerprint |
| Push notifications | `expo-notifications` | FCM (Android) + APNs (iOS) |
| Secure storage | `expo-secure-store` | JWT tokens — never AsyncStorage |
| App tracking | `expo-tracking-transparency` | iOS ATT prompt if analytics used |
| Live Activities | Native module (no RN package yet) | Custom native module required |
| Apple Pay | `@stripe/stripe-react-native` | `PaymentSheet` with Apple Pay |
| Google Pay | `@stripe/stripe-react-native` | Same `PaymentSheet` |
| Deep links | `expo-linking` | Universal links + URL schemes |
| Splash screen | `expo-splash-screen` | Controlled programmatic dismiss |
| Font loading | `expo-font` | Inter + Cairo font loading |

## 15.07 — Animations (React Native)

| StayOS Animation | RN Implementation | Package |
|-----------------|-------------------|---------|
| Page transitions | `@react-navigation/native-stack` custom animation | Built-in |
| Spring animations | `Animated.spring()` with useNativeDriver:true | Built-in |
| Gesture-driven | `react-native-gesture-handler` + `react-native-reanimated` | RNGH + Reanimated 3 |
| Shared element (hero) | `react-native-shared-element` | Separate package |
| Confetti | `react-native-confetti-cannon` | Package |
| Skeleton shimmer | `react-native-skeleton-placeholder` | Package |
| Lottie animations | `lottie-react-native` | For complex SVG animations |

## 15.08 — Performance Guidelines (React Native)

| Concern | Solution |
|---------|----------|
| FlatList performance | `windowSize:3`, `maxToRenderPerBatch:5`, `initialNumToRender:6` |
| Image caching | `expo-image` with memory + disk cache |
| Animation | Always `useNativeDriver: true` (except layout animations) |
| JS thread blocking | Move heavy ops to `runOnJS` in Reanimated or background thread |
| Re-renders | `React.memo` on card components, `useCallback` on handlers |
| Bundle size | Dynamic imports for admin screens, split bundles |
