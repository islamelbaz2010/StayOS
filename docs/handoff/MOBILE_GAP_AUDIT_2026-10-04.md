# Mobile Gap Audit — 2026-10-04

Read-only audit of `apps/mobile` against the CURRENT production API
(OpenAPI: 223 paths / 257 operations). No mobile code modified.

## Verdict: READY — substantive app; all existing endpoint calls resolve.
No genuine blocker for Phase 4.

## Feature matrix
| FEATURE | CURRENT STATE | API READY | MOBILE READY | GAP | PRIORITY | ACTION |
|---|---|---|---|---|---|---|
| Auth (OTP, refresh, logout, dev-token) | SecureStore JWT, axios interceptor refresh | YES | YES | — | — | none |
| Push device registration | `expo-notifications` + `device-token` | YES | YES | verify prod `EXPO_*` | P2 | verify on device |
| Guest search/listings/favorites | Search, ListingDetail, Favorites, popular/autocomplete | YES | YES | — | — | none |
| Booking flow | BookingScreen + `/bookings`, quote via `/payments/quote` | YES | YES | — | — | none |
| Payments | PaymentScreen hosted Paymob checkout (webview handoff) | YES | YES | verify iframe vs new checkout-session fields | P1 | parity check |
| Trips | TripsScreen + TripDetail (`/bookings/guest`) | YES | YES | — | — | none |
| Messaging | Inbox + MessageScreen (`/messages/conversations*`) | YES | YES | support type not surfaced | P1 | see Support |
| **Support chat** | SupportScreen = **WhatsApp deep link only** | YES (`/messages/support`, `/queue`, `/status`) | **PARTIAL** | in-app support threads missing | **P1** | implement support inbox |
| **Help Center** | no screens | N/A (web-bundled catalog) | **MISSING** | no help UI | P2 | catalog port or webview |
| Host dashboard/today | HostTodayScreen (`/host/today`) | YES | YES | — | — | none |
| Host listings CRUD | Listings, editor, photos, availability, co-hosts screens | YES | YES | — | — | none |
| Host reservations | HostReservationDetail + `/host/reservations` (status+page only) | PARTIAL | PARTIAL | `/host/bookings` has governorate/area/unit/search — mobile uses the simpler endpoint | P1 | adopt `/host/bookings` params |
| Host earnings | HostEarningsScreen (`/host/earnings`) | YES | YES | — | — | none |
| Host profile/payout prefs | HostProfileScreen (`/host/profile`) | YES | YES | — | — | none |
| KYC | KycScreen (`/kyc/initiate|status`) — manual upload matches prod manual mode | YES | YES | none while manual; revisit if Sumsub activated | — | none |
| Notifications | notifications screen + unread count | YES | YES | — | — | none |
| EN/AR + RTL | `i18n.ts`, AsyncStorage, `I18nManager` | YES | YES | — | — | none |
| Deep links | scheme `stayos`, id `com.stayos.mobile` | YES | YES | — | — | none |
| Android builds | `eas.json` preview APK + 2 CI workflows + existing APK | YES | YES | — | — | none |
| iOS build | config present, no EAS prod profile | YES | PARTIAL | no production profile/provisioning yet | P2 | provision when needed |
| Prod EAS profile | preview only | — | PARTIAL | `production` profile not defined | P1 | add before store release |

## Classifications
- READY: auth, search, booking, payments, trips, messaging, host suite, KYC, i18n, deep links, Android.
- PARTIAL: support (API new, mobile still WhatsApp), host reservation filters, iOS/prod build profiles.
- MISSING: help center UI.
- BLOCKED: **none**.

## Note on Support
Web support system (`053_support_conversations`) shipped after the mobile
build. Mobile must consume `POST /messages/support`, list
`type=support` conversations, reply via the existing messages endpoints,
and apply the user-side status rules — all read-only-verified contracts.
WhatsApp link can remain as a fallback channel.
