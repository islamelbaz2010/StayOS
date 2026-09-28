# StayOS Hosting Experience — Product Spec (R2)

Status: IMPLEMENTED (R2 batch)
Scope: host-facing experience layer on top of the existing marketplace,
booking, listing, payment, KYC, and earnings systems. R2 is a navigation,
education, and readiness layer — it does not duplicate any operational
engine.

## 1. Hosting information architecture

```
Become a Host            /become-a-host          public, role-aware CTA
└── Identity             /kyc, /host/kyc         manual KYC (unchanged)

Hosting (HostLayout nav)
├── Dashboard            /host                   ops summary + action items
├── Guide (Hub)          /host/guide             R2 hub: readiness + topics
│   └── Topic pages      /host/guide/<topic>     R2 education pages
├── Properties           /host/listings          listing CRUD + review states
│   └── New listing      /host/listings/new
├── Calendar             /host/calendar
├── Reservations         /host/bookings
├── Earnings             /host/earnings          server-authoritative + simulator
├── Messages             /messages
├── Identity             /host/kyc
├── Profile              /host/profile           links to R1 profile systems
├── Responsibilities     /host-standards         CMS page
└── Help Center          /help
```

Entry points:

- Header (guest + anonymous): "Become a host" → `/become-a-host`
- Footer workspace column: same canonical link for non-internal users;
  hosts get `/host`, `/host/listings`, `/host/guide`, `/host-standards`
- Account menu: hosts get `/host`, `/host/listings`, `/host/guide`,
  `/host/earnings`
- Account settings hosting card → `/host` (host) or `/become-a-host`
  (non-host)

## 2. Become a Host (`/become-a-host`)

Public page (GuestLayout). No fake steps — it mirrors the real lifecycle:

1. Create account
2. Verify identity (manual KYC — explicitly states there is no
   automated/instant approval)
3. Activate hosting (role upgrade, happens on the KYC page)
4. Create listing (draft allowed)
5. Submit for review → live

Each step shows a real state badge when signed in:

- `Done` — backed by `user.kyc_status`, `user.role`, real listing rows
- `In review` — KYC `pending` or listing `PENDING_VERIFICATION`
- `To do` — step not completed

CTA adapts by auth/role/KYC state: sign in → verify identity → continue
verification → create listing → open dashboard. Host-listing data is only
fetched for authenticated hosts (the guest endpoint would 403).

The page includes a product-level earnings explainer reflecting Model B:
host sets accommodation + cleaning; 6% host commission on accommodation
only; guests see an all-inclusive price (guest fee + VAT included); host
net = accommodation + cleaning − 6% commission. No invented payout timing,
no earnings promises, no insurance claims.

## 3. Hosting Hub (`/host/guide`)

Host/admin only (ProtectedRoute). Two layers:

### 3.1 Host readiness

Deterministic checklist over real backend state — no invented score:

| Item            | Source                                   | Ready / Pending / Attention                |
|-----------------|------------------------------------------|--------------------------------------------|
| Identity        | `user.kyc_status`                        | verified / pending / unverified-or-rejected |
| Listing created | `GET /listings/host/listings`            | ≥1 listing / none                          |
| Listing live    | listing `status`                         | LISTED / PENDING_VERIFICATION / otherwise  |
| Photos          | `cover_image`                            | set / missing                              |
| Pricing         | `base_price_egp > 0`                     | set / missing                              |
| Payout method   | `GET /auth/me/account` `payout_method`   | set / missing                              |

Each row links to the real operational route that resolves it.

### 3.2 Guide sections & topics

Sections: Getting started · Manage your stay · Improve your hosting ·
Earnings & payouts · Safety & responsibilities.

15 topics (`lib/hosting/guideTopics.ts` — registry of id, section, point
count, action routes): verification, listing-setup, calendar,
instant-book, reservations, messaging, check-in-out, house-rules,
listing-quality, reviews, pricing, earnings, payouts, safety,
responsible-hosting.

Every topic page: intro + original guidance bullets + action buttons that
deep-link to the existing operational tool. No duplicated logic anywhere —
topics never implement the feature, they explain and link.

A support strip links Help Center, Contact Support, and Hosting standards.

## 4. Existing vs new

ALREADY EXISTED (reused, unchanged): host dashboard + `useHostToday`,
listing CRUD + moderation lifecycle (DRAFT → PENDING_VERIFICATION →
LISTED / REJECTED / UNLISTED / ARCHIVED), pending change-sets and photo
moderation, calendar + availability, reservations (`/host/bookings`),
earnings + simulator (server-authoritative), payout preferences in
account settings (masked), messages, reviews + admin report queue,
KYC manual review + role upgrade, host profile page, public host
profiles with privacy masking, host-standards CMS page, help/support.

NEW IN R2: `/become-a-host`, `/host/guide` hub, `/host/guide/<topic>`
pages, guide topic registry, host-nav "Guide" entry, header/footer/
account-menu integration.

EXTENDED: `useHostListings` gained an optional `enabled` flag (same
pattern as `usePendingKyc`); the canonical host-entry destination moved
from `/kyc` to `/become-a-host` in header, footer, and account settings.

## 5. Authorization & privacy

- `/host/guide/*` is wrapped in `ProtectedRoute allowedRoles=["host",
  "admin"]`, consistent with the host dashboard.
- `/become-a-host` is public but only calls the host listings endpoint
  for authenticated hosts; all state badges read from auth context and
  server data.
- No new backend endpoints — cross-host access control remains enforced
  by the existing `/listings/host/*`, `/bookings/host/*`,
  `/finance/*`, and `/kyc/*` authorization, which was covered by prior
  backend tests and is unchanged.
- Payout data stays masked (existing R1/backend behavior); the guide only
  checks the presence of `payout_method`.
- No sensitive guest data is surfaced on any R2 page.

## 6. Trust & no-fake-capability decisions

- Readiness uses only real fields: role, `kyc_status`, listing status,
  `cover_image`, `base_price_egp`, `payout_method`. No numeric score, no
  badges, no invented "verified" claims beyond the KYC state.
- Safety content explicitly states StayOS does not provide insurance —
  no AirCover equivalent, no damage/earnings protection claims.
- Pricing content documents Model B in product terms only; all monetary
  values remain server-calculated.
- Legal/tax obligations are described neutrally ("check what applies to
  your property") — no legal advice. LEGAL CONTENT PENDING for any formal
  policy text.
- Airbnb was used only as an IA benchmark; all wording is original.

## 7. i18n / RTL

- New namespaces `becomeHost` and `hostGuide` exist in en + ar with exact
  key parity (verified by automated comparison).
- Natural Egyptian-market Arabic; no hardcoded English in R2 surfaces.
- All layouts use existing logical-property utilities (`ps`, `pe`, `me`,
  `start`, `end`) — RTL-safe.
- Responsive: hub grids collapse 3→1 columns; readiness rows and topic
  pages use mobile-first spacing; HostLayout mobile nav gains the Guide
  pill automatically.

## 8. Deferred / requires future product decision

- Co-hosts, experiences, services, referrals, gift cards — out of scope.
- Insurance/protection products — requires a real product decision.
- Automated KYC — founder decision: manual only for alpha.
- Host pre-approval of guests — founder decision: not offered.
- Response-rate/acceptance-rate trust signals — no underlying metric
  exists; not surfaced.
- Formal responsible-hosting legal text — LEGAL CONTENT PENDING.
