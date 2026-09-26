# StayOS Account & Profile Specification (R1)

Status: IMPLEMENTED (R1 batch). Scope: account/profile surface only — no
commercial, payment-provider, KYC-automation, or legal-rule changes.

## Account IA

`/{locale}/account-settings` is the hub. Sections:

| Section | Route | Status |
|---|---|---|
| Personal information | `/account-settings/personal` | IMPLEMENTED |
| Login & security | `/account-settings/security` | IMPLEMENTED |
| Privacy | `/account-settings/privacy` | IMPLEMENTED |
| Notifications | `/account-settings/notifications` | IMPLEMENTED |
| Account activity & policies | `/account-settings/activity` | IMPLEMENTED |
| Language & currency | `/account-settings/language` | IMPLEMENTED |
| Payments & payouts | `/account-settings/payments` | IMPLEMENTED |
| Taxes | card → personal page (`tax_id` field) | IMPLEMENTED |
| Hosting / Become a host | `/host` or `/kyc` | IMPLEMENTED (entry only) |

Header account menu: Profile, Favorites+Trips (guest), Messages,
Notifications, Account Settings, Language & currency, Payments (guest),
Host dashboard/listings/earnings (host), Admin (staff w/ permissions),
Help, Support, Become a host, Sign out. Footer: Privacy + Terms CMS pages
(`/{locale}/p/privacy`, `/{locale}/p/terms`).

## Profile

`/{locale}/profile` — photo, display name, role/KYC badges, account
status, About-you (bio, spoken languages, location, interests),
personal information, password. Public surface:
`GET /profiles/host/{id}` — honors `profile_public`; exposes only
name/bio/avatar/languages/location, never legal name, contact details,
addresses, or financial data.

## Personal Information fields

| Field | Mutability |
|---|---|
| display_name | editable (PATCH /auth/me) |
| legal_name | editable until KYC verified, then locked |
| date_of_birth | editable (PATCH /auth/me/account) |
| email / phone | read-only (sign-in identity; support change) |
| address / mailing_address | editable (street, city, governorate, postal_code) |
| emergency_contact | editable (name, phone, relationship) |
| tax_id | editable |
| national_id | editable before verification |
| kyc_status | read-only |

## Privacy controls (enforced server-side)

- `profile_public` — hides public host-profile detail fields when off.
- `read_receipts` — when off, `ParticipantResponse.last_read_at` is
  masked (null) for counterparties in conversations; own timestamp kept.
- Data export — `GET /auth/me/export` (no raw device tokens, no refresh
  token hashes, no presigned URLs, no other users' PII).
- Deactivation — `DELETE /auth/me` (refused with active bookings or
  live listings; anonymizes user, revokes sessions, keeps financial records).

## Notifications

Categories (`src/app/notifications/constants.py`):

- Locked (always delivered): `account_policies`, `reservations`,
  `reminders` — security/payment/booking-critical.
- Toggleable: `messages`, `host_activity`, `offers` —
  `PUT /auth/me/notification-preferences` persists per-user on
  `User.notification_prefs`; the dispatch path drops suppressed events
  on every channel. Unknown event types default to `account_policies`
  (delivered) — fail-safe, never silently dropped.

`InAppNotificationItem.category` feeds the Activity surface, which
groups/filters in-app notification history by category.

## Language & Currency

Locales: `ar`, `en` (validated in `UserProfileUpdate.locale`). Persisted
on `User.locale`; the settings page applies the choice and navigates the
same route under the new locale. Currency is fixed EGP — no multi-currency
pricing. RTL is layout-driven (`dir` attribute); toggles use `rtl:` variants.

## Login & Security

- Password set/change (`POST /auth/password`; change requires current
  password; resets revoke sessions).
- Sessions — `GET /auth/me/sessions` lists live refresh tokens
  (created/expiry only — no token material).
- `POST /auth/me/logout-all` revokes every refresh token.

## Payments / Payouts / Taxes

- Payments: links to `/payments` history. No stored cards — Paymob hosted.
- Payouts: declared destination on `Account` (collection only; provider
  payout execution NOT provisioned). `payout_account_number` and
  `payout_wallet_msisdn` serialize masked (`••••last4`) everywhere.
- Taxes: `tax_id` field only. No tax-document generation.

## API additions

- `PATCH /auth/me` — display_name, bio, languages, location, interests,
  locale, guest_preferences.
- `GET/PATCH /auth/me/privacy` — `profile_public`, `read_receipts`.
- `GET/PUT /auth/me/notification-preferences` — effective category map.
- `GET /auth/me/sessions`, `POST /auth/me/logout-all`.
- `PATCH /auth/me/account` — + `mailing_address`, `emergency_contact`.
- `GET /auth/me/export` — extended export payload.

All endpoints require authentication and are strictly self-scoped.
Payout destination values are masked in every response.

## Database

Migration `051_account_profile_r1` (additive, reversible):

- `auth.users`: `location`, `interests` (JSON), `notification_prefs`
  (JSON), `profile_public` (default true), `read_receipts` (default true).
- `auth.accounts`: `mailing_address` (JSON), `emergency_contact` (JSON).

## NOT IMPLEMENTED (deliberate)

- Passkeys, MFA, social-login management, device fingerprinting.
- User blocking, search-engine indexing controls, marketing-channel
  opt-outs (no marketing channel exists).
- Saved payment instruments / tokenization.
- Payout execution, tax document generation, VAT certificates.
- Multi-currency pricing.
- Profile completeness scores / badges (not required by any workflow).

## FUTURE / REQUIRES PRODUCT DECISION

- Host-facing "professional hosting" tools beyond current dashboard.
- Referral/gift/coupon surfaces.
- Broader read-receipt semantics (per-conversation overrides).

## REQUIRES LEGAL REVIEW

- `privacy` and `terms` CMS pages: structure exists (`/p/{slug}`);
  copy must be drafted as original StayOS documents — do not adapt
  third-party legal text.
