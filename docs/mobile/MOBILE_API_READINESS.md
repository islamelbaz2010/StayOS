# StayOS — Mobile API Readiness Register

**Purpose:** canonical API contract register for the production mobile application
(Expo/React Native per FD-11). Verified against the deployed backend at
`https://stayos-demo-production.up.railway.app` on the `product-completion-review`
branch (HEAD `eb5aebe`).

**Base URL:** `{API_URL}/api/v1`

## Global contract

| Concern | Contract | Status |
|---|---|---|
| Auth | Bearer JWT (access + refresh). `POST /auth/refresh` rotates. `POST /device-token` registers push tokens. | READY |
| Error envelope | `{ "error": { "code", "message", "message_ar", "details" } }` — bilingual by design; mobile should surface `message`/`message_ar` per locale. | READY |
| Pagination | Listings search: opaque `cursor` (base64 offset) + `limit` (≤100) → `next_cursor`. Messages: `limit`/`offset`. Most admin/host lists: `limit`/`offset`. | READY |
| Localization | User `preferred_language` on profile; public content accepts `?lang=en\|ar`; notification templates resolve recipient language server-side. | READY |
| Rate limiting | `listings_rate_limit` on public search/detail; 429 → `RATE_LIMITED` error code. | READY |
| Dev endpoints | `POST /auth/dev-token` exists — gated by environment; **must not ship in production builds** (FD-16). | READY (env-gated) |

## Endpoint register

Legend: **Auth** = bearer token required; **Role** = role/permission gate beyond auth.
Status: READY / NEEDS FIX / EXTERNAL DEPENDENCY / NOT REQUIRED.

### Auth & profile

| Endpoint | Purpose | Auth | Status |
|---|---|---|---|
| `POST /auth/otp/send` `POST /auth/otp/verify` | Phone OTP login (Akedly) | — | READY |
| `POST /auth/register` `POST /auth/login` `POST /auth/password` | Email/password register, login, set/change | —/—/Auth | READY |
| `POST /auth/firebase` | Social sign-in exchange | — | EXTERNAL DEPENDENCY (FD-17: Firebase creds absent) |
| `POST /auth/refresh` `POST /auth/logout` | Session lifecycle | —/Auth | READY |
| `GET /auth/me` `GET /auth/me/account` `PATCH /auth/me/account` `PATCH /auth/me/role` | Profile + account | Auth | READY |
| `PUT /auth/me/preferences` | Guest preferences (Local Fit input) | Auth | READY |
| `GET /auth/me/export` `DELETE /auth/me` | Data export / account deletion | Auth | READY |
| `POST /auth/device-token` | Push token registration | Auth | READY |

### Discovery & listings (guest)

| Endpoint | Purpose | Auth | Status |
|---|---|---|---|
| `GET /listings` | Search + filters + sort (cursor pagination) | Optional | READY |
| `GET /listings/price-distribution` | Price histogram for filter UI | Optional | READY |
| `GET /listings/{unit_id}` | Listing detail | Optional | READY |
| `GET /listings/{unit_id}/availability` | Calendar availability | Optional | READY |
| `GET /listings/{unit_id}/fit` | Local Fit score/explanation | Auth | READY |
| `GET /availability/{unit_id}` | Availability feed | Optional | READY |
| `GET /locations/autocomplete` `/popular` `/tree` | Location picker | Optional | READY |
| `POST /favorites/{unit_id}` `GET /favorites` | Save/unsave + list | Auth | READY |

### Booking & payment

| Endpoint | Purpose | Auth | Status |
|---|---|---|---|
| `POST /reservations` `GET /reservations` `GET /reservations/{id}` `POST /reservations/{id}/cancel` `POST /reservations/{id}/promo` | Reservation lifecycle | Auth (guest) | READY |
| `POST /bookings` `GET /bookings` `GET /bookings/guest` `GET /bookings/{id}` `PATCH /bookings/{id}` | Booking lifecycle | Auth | READY |
| `GET /bookings/{id}/cancellation-preview` `POST /bookings/{id}/cancel` | Cancel with policy preview | Auth | READY |
| `POST /bookings/{id}/check-in` `/check-out` `/no-show` `POST /bookings/{id}/complete` `GET /bookings/{id}/stay` | Stay ops | Auth (role-gated) | READY |
| `POST /bookings/offers` `GET /bookings/offers` `POST /bookings/offers/{id}/accept` `/decline` | Host custom offers (FD-07) | Auth | READY |
| `GET /payments/quote` | Server-authoritative quote | Auth | READY |
| `GET /payments/booking/{booking_id}` `GET /payments/{id}` | Payment state | Auth | READY |
| `POST /payments/{id}/proof/presign` `POST /payments/{id}/proof` `GET /payments/{id}/proof/download` | Manual payment proof | Auth | EXTERNAL DEPENDENCY (S3 unconfigured) |
| Paymob hosted checkout | Payment collection | — | READY (TEST merchant); EXTERNAL for live creds |

### Messaging

| Endpoint | Purpose | Auth | Status |
|---|---|---|---|
| `GET /messages/conversations` `GET /messages/conversations/unread` | Inbox + unread count (limit/offset) | Auth | READY |
| `GET /messages/conversations/{id}` `GET /messages/conversations/{id}/messages` | Thread + history | Auth (participant) | READY |
| `POST /messages/conversations/{id}/messages` `POST /messages/conversations/{id}/read` | Send + mark read | Auth (participant) | READY |
| `GET /messages/bookings/{booking_id}/conversation` `POST /messages/inquiries` | Booking thread / pre-booking inquiry | Auth | READY |
| `GET /messages/templates` | Canned replies | Auth | READY |

### Reviews

| Endpoint | Purpose | Auth | Status |
|---|---|---|---|
| `POST /reviews/bookings/{booking_id}/reviews` | Post-stay review (eligibility + dup prevention enforced) | Auth | READY |
| `GET /reviews/listings/{unit_id}/reviews` `GET /reviews/guests/{guest_id}/reviews` | Public review lists | Optional | READY |
| `POST /reviews/{review_id}/report` | Report review (FD-04) | Auth | READY |
| `PATCH /reviews/...` (admin report actions) | Moderation | DISPUTES perm | READY — admin-only |

### Host

| Endpoint | Purpose | Auth | Status |
|---|---|---|---|
| `GET /host/today` `GET /host/dashboard` `GET /host/performance` | Host dashboards | Host | READY |
| `GET /host/bookings` `GET /host/reservations` `GET /host/reservations/{id}` | Booking mgmt | Host | READY |
| `GET /host/earnings` `POST /host/earnings/simulate` | Earnings + simulator (FD-21) | Host | READY |
| `GET /host/profile` `PATCH /host/profile` | Host profile | Host | READY |
| `POST /listings` `PATCH /listings/{id}` `GET /listings/host/listings` `POST /listings/{id}/submit` `/publish` `/unpublish` `/archive` | Listing lifecycle | Host | READY |
| `POST /listings/{id}/photos/presign` `POST /listings/{id}/photos` `GET /listings/{id}/photos` reorder/cover/delete | Photos | Host | EXTERNAL DEPENDENCY (S3) |
| `POST /listings/{id}/calendar` `PATCH/DELETE .../calendar/{rule_id}` `/bulk-availability` `/bulk-pricing` | Calendar rules | Host | READY |
| `GET /host/listings/{id}/readiness` `GET /host/listings/{id}` | Readiness (FD-22) + detail | Host | READY |
| `POST/GET/PATCH/DELETE /host/listings/{id}/co-hosts*` | Co-hosts | Host | READY |
| `GET /finance/wallets/me` `GET /finance/wallets/{id}/ledger` | Wallet + ledger | Auth (own) | READY |
| `POST /finance/payouts` `GET /finance/payouts` | Payout request/status | Host | INTERNAL READY; EXTERNAL DEPENDENCY (Paymob Payouts not provisioned) |

### KYC

| Endpoint | Purpose | Auth | Status |
|---|---|---|---|
| `POST /kyc/initiate` `POST /kyc/documents/{id}/submit` `GET /kyc/status` | KYC submission | Auth | READY (upload EXTERNAL — S3) |
| `/kyc/pending` `/documents/{id}/process` `/approve` `/reject` `/images` | Review queue | KYC perm | READY — admin-only |

### Public content (CMS)

| Endpoint | Purpose | Auth | Status |
|---|---|---|---|
| `GET /content/pages?lang=` | Published page list | — | READY |
| `GET /content/pages/{slug}?lang=` | Published localized page | — | READY |

Draft/preview/admin CMS endpoints are staff-only and NOT REQUIRED for mobile v1.

### Admin / operations / disputes

Admin surfaces (`/admin/*`, `/operations/*`, `/disputes/*`, `/staff/*`) are
web-console scope. NOT REQUIRED for mobile v1 unless a staff mobile app is
planned — flag as Founder decision if so.

## Verdict

All guest + host + messaging + review + wallet surfaces needed for mobile v1 are
**READY**. External dependencies affecting mobile builds: S3 (photo/proof
uploads), Paymob live credentials, Paymob Payouts, Firebase social sign-in.
No API contract changes are required before mobile production implementation.
