# STAYOS — PAYMENT & COMMERCIAL MODEL

**Version**: 1.0.0
**Date**: 2026-09-21
**Status**: CANONICAL — Founder Decision Closure package
**Canonical code**: `src/app/finance/commercial.py`, `src/app/config.py`

> This document describes the **product/business flow** decision only. The
> legal/regulatory characterization of holding third-party funds, collecting
> money on behalf of hosts, settlement, and payout remains subject to
> lawyer / accountant / CBE analysis and the legal entity. No legal
> conclusion is asserted here.

---

## 1. Commercial model (FD-19)

StayOS economics total **12% of the accommodation amount**, allocated
internally as **6% host-side + 6% guest-side**.

- The allocation is internal ledger/reporting data only.
- The guest-facing price is **all-inclusive**: the listed/advertised price
  IS the final guest total. The 12% is never added on top.
- The platform share applies to the **accommodation amount only** — never
  to cleaning fees, taxes, deposits, or pass-through charges.
- Host net = guest total − internal platform share.

Config (`config.py`):

| Setting | Value | Use |
|---|---|---|
| `PLATFORM_TOTAL_SHARE_PCT` | 0.12 | Canonical total economics |
| `HOST_SIDE_SHARE_PCT` | 0.06 | Internal allocation |
| `GUEST_SIDE_SHARE_PCT` | 0.06 | Internal allocation |
| `GUEST_SERVICE_FEE_PCT` / `HOST_COMMISSION_PCT` / `PLATFORM_TAKE_RATE_PCT` | — | **Removed** — dead pre-all-inclusive settings; historical rows carry stored amounts, not rates |

All money is integer minor units (EGP); no floats in financial math.

### Price semantic

The listing's `nightly_price_egp` is the **guest-facing advertised price**
(option B in the Founder package). The engine computes the internal split
from it — no gross-up is applied:

```
accommodation = nightly × nights − applicable discount
platform_share = round(accommodation × 0.12)
guest_total    = accommodation + cleaning_fee
host_net       = guest_total − platform_share
```

`guest_all_in_price_for_host_target(target)` is available for the
simulator's host-net → guest-price direction.

## 2. Guest-facing pricing rule (HARD REQUIREMENT)

Every guest-facing surface — search, listing, booking, checkout,
confirmation, trip — shows:

```
Total
EGP X,XXX.XX
Includes all fees
```

The guest NEVER sees: service fee, StayOS fee, any percentage, commission,
host payout, StayOS margin, or any fee breakdown line. There is no "view
fee details" control.

API enforcement:

- `BookingQuote` exposes only `unit_id`, dates, `nights`,
  `nightly_rate_egp`, `total_egp`.
- `PaymentResponse` breakdown fields (`accommodation_amount_egp`,
  `cleaning_fee_egp`, `guest_service_fee_egp`, `host_amount_egp`) are
  serialized **only** for staff/admin viewers with payments permission
  (`include_breakdown`); guests and hosts receive `null`.
- Web checkout/trip pages and mobile booking/payment screens render the
  total + "Includes all fees" only.

The host DOES see economics — via the Earnings Simulator
(`POST /host/earnings/simulate`) and earnings views — never the guest.

## 3. Payment flow (FD-01, product decision)

```
Guest → StayOS checkout / PSP (Paymob primary, Egypt alpha)
     → payment successful → payment recorded (VERIFIED)
     → booking CONFIRMED, events: payment.verified + booking.payment_confirmed
     → finance consumer creates/holds escrow (funds held)
     → guest check-in → 24h protection window → payout eligibility
     → host payout
```

The guest never pays the host directly. The host never receives booking
funds immediately. Payout execution additionally requires: Paymob merchant
account + payout capability + legal/accounting approval + real destination
accounts — all currently BLOCKED external dependencies.

Escrow release splits host payable vs platform revenue through the
canonical engine (`finance/services.py`).

## 4. Payment state machine

Domain concepts supported across `payments` + `finance`:

`PAYMENT_PENDING → PAYMENT_PROCESSING → PAYMENT_PAID → FUNDS_HELD →
CHECKIN_CONFIRMED → PAYOUT_ELIGIBLE → PAYOUT_PROCESSING →
PAYOUT_COMPLETED`, plus `PAYOUT_HELD`, `PAYOUT_FAILED`,
`REFUND_PENDING`, `REFUNDED`, `DISPUTED`, `PAYMENT_FAILED`,
`PAYMENT_EXPIRED`.

Every transition is traceable to booking, payment, host, payout/refund,
transaction reference, timestamp, status. Webhooks are signature-verified
and idempotent (duplicate/replay-safe); payouts and refunds are
duplicate-safe; payout cannot run before eligibility.

## 5. Discounts & offers (FD-07, FD-08, FD-20)

- Listing discount, weekly discount, monthly discount: host-set
  percentages on `unit_listings`. **One** applicable discount per booking —
  no stacking. Discounted accommodation feeds the canonical engine.
- Custom offer: host sends an all-inclusive total inside an inquiry
  conversation (`booking.booking_offers`). Guest accept → booking
  (ACCEPTED, `custom_total_egp` + `offer_id`) → payment request at the
  offered total. Decline/expire supported.

## 6. Host economics surfaces

- Earnings Simulator (`POST /host/earnings/simulate`): host target →
  guest all-in price, StayOS economics, discount, estimated payout.
- Host Performance Center (`GET /host/performance`): canonical
  transactional aggregates — bookings, revenue, occupancy, nightly price,
  cancellation/response rates. No AI recommendations.
- Payout preferences (FD-26): `auth.accounts.payout_*` collection for
  bank/wallet/Paymob channel — storage only; execution gated.

## 7. External blockers (unchanged by this package)

- Legal entity, CBE characterization of funds holding, collection/payout
  accounts, tax/VAT treatment, contractual wording, PDPL/KYC legal
  interpretation — **BLOCKED — LEGAL/REGULATORY**.
- Paymob merchant approval + production credentials — **BLOCKED —
  PROVIDER/CREDENTIAL**.
- Firebase (social sign-in) — **BLOCKED — PROVIDER/CREDENTIAL** (RB-19).
- AWS storage vars — **BLOCKED** (RB-02).

Config boundaries ensure no live financial operation can occur until
prerequisites exist; placeholder account values are never production-usable.

## 8. Paymob provider integration (TEST sandbox)

Paymob is the primary Egypt-alpha provider (FD-01/FD-25). Integration is
configuration-gated — no live payment can occur until production
credentials exist.

- **Flow:** backend → Payment Intention API (`/v1/intention/`) → Paymob
  unified checkout URL (`publicKey` + `client_secret`) → guest pays →
  transaction processed callback → HMAC-SHA512 verify → idempotent
  reconciliation → existing reservation/finance states.
- **TEST integration id:** `5935402`, merchant `1231991` (set via
  `PAYMOB_INTEGRATION_ID` — config-driven, never hardcoded). EGP only.
- **Amount:** server-authoritative — always the canonical
  `reservation.total_amount_egp` in minor units; the client never supplies
  an amount.
- **Callback hardening** (`POST /finance/webhooks/paymob`): HMAC-SHA512
  over Paymob's ordered transaction fields via the `hmac` query param;
  integration-id match against configured id; currency must be EGP;
  amount must equal the stored intent; reservation/provider-ref
  correlation falls back to the reservation's pending intent (callback
  carries the transaction id, the stored ref is the intention id);
  Redis idempotency on transaction ref; pending transactions are
  acknowledged without confirming (and without consuming the idempotency
  key); refund/void callbacks are acknowledged and ignored; success →
  CAPTURED + CONFIRMED + `payment.captured`/`reservation.confirmed`
  events → finance consumers.
  Failure → FAILED + pending reservation cancelled + lock released.
- **Refunds:** cancellation issues `POST /api/acceptance/void_refund/refund`
  (`Authorization: Token {PAYMOB_SECRET_KEY}`) against the persisted
  `transaction_ref`. Provider-confirmed → intent REFUNDED; provider
  rejection → REFUND_PENDING (fail-closed) + admin reconcile endpoint
  `POST /finance/payment-intents/{id}/refund`. Verified on TEST (full
  refund txn `540324238`, partial `540324851`). Ledger records a
  `guest_refund_payable` liability until the refund is confirmed, then
  settles to cash.
- **Payouts:** Paymob Payouts is a separately provisioned product
  (OAuth2 password grant at the payouts host) — the Accept API key does
  not authorize it. Without `PAYMOB_PAYOUT_*` credentials the payout path
  fails closed: request → FAILED + wallet funds restored + replay-safe.
- **Environment separation:** `sk_test_*` keys refuse to run in
  production; `sk_live_*` keys refuse to run elsewhere. Missing config
  fails closed.

### Variables (names only — values live in Railway)

| Variable | Purpose |
|----------|---------|
| `PAYMOB_SECRET_KEY` | Intention API auth (`sk_test_*`/`sk_live_*`) — backend only |
| `PAYMOB_PUBLIC_KEY` | Unified checkout URL (`pk_test_*`/`pk_live_*`) — safe to expose |
| `PAYMOB_HMAC_SECRET` | Callback HMAC-SHA512 verification — backend only |
| `PAYMOB_INTEGRATION_ID` | TEST integration `5935402` |
| `PAYMOB_IFRAME_ID` | Legacy iframe fallback |
| `PAYMOB_API_KEY` | Legacy auth-token flow / transaction inquiry |
| `PAYMOB_PAYOUT_CLIENT_ID` / `PAYMOB_PAYOUT_CLIENT_SECRET` / `PAYMOB_PAYOUT_USERNAME` / `PAYMOB_PAYOUT_PASSWORD` | Payouts OAuth2 — not provisioned (external blocker) |

Production Paymob merchant approval, production credentials, payout
onboarding, and legal/accounting/CBE characterization remain external
blockers — unchanged.

## 9. Financial visibility & Admin Reports

**Source of truth.** All financial surfaces read the same canonical facts —
there is no second math:

- Per-booking economics: `finance.services.booking_economics` (generation-
  aware over the persisted payment row — Model B, DEC-023 additive and
  pre-VAT containment rows each resolve from their own stored facts).
- Recognised revenue/VAT: `finance.ledger_entries` accounts
  `platform_revenue` / `vat_payable` / `host_payable`.
- Settlement state: `escrow_accounts` lifecycle via
  `derive_payout_state` — `paid | refunded | disputed | ready | held |
  waiting_checkin`.

**Recognition is not gated on payout.** VAT, StayOS revenue, host/guest
commission and host net are known as soon as the booking's payment facts
exist — "funds held / payout pending" never suppresses the economics.

**Surfaces consuming the canonical facts.**

| Surface | Endpoint | Permission |
|---------|----------|------------|
| Host Earnings | `GET /payments/host` (+ economics) | host |
| Admin Earnings | `GET /admin/earnings` (+ drill-down) | payments |
| Operations → Booking → Financial Summary | `GET /admin/bookings/{id}/financial` | payments |
| Reports Center | `GET /admin/reports/*` | reports |

**Admin Reports** (`/admin/reports`): `GET /admin/reports/catalog` returns
the full registry (columns, filters, sortable keys, money columns, date
basis, implemented flag). `GET /admin/reports/{key}` returns a paginated
`ReportResult` (rows + filtered-set totals + filters_applied +
generated_at). `GET /admin/reports/{key}/export?format=csv|xlsx` streams
the filtered set (bounded at 10k rows) with a metadata header (report key,
generated timestamp, date basis, applied filters, row counts).

- **RBAC:** new `reports` staff permission; admins implicit. Sidebar link
  is permission-gated UX — enforcement is server-side on every route.
- **Filters** are real query parameters; date semantics are declared per
  report (`date_basis`) and shown in the UI.
- **Not implemented is stated, not faked:** `rebooked_bookings` is listed
  disabled — bookings have no rebooking linkage field.
- Scans are bounded (`MAX_SCAN = 5000`), sorted/paginated server-side;
  computed columns (stay_phase, payout status) filter in memory after the
  SQL window. No N+1: joins/subqueries carry names, titles, escrow and
  per-booking adjustment sums.

### Semantics — one truth, explicit terms

- **Signed ledger.** Ledger reports (`stayos_revenue`) sign rows by entry
  type — credit = +amount, debit = −amount — and expose gross credits,
  gross debits and net as labeled totals. The signed net reconciles with
  the Admin Earnings `platform_revenue` ledger balance.
- **VAT is three different numbers, labelled as such.** `vat_calculated`
  is booking-economics VAT (`booking_economics`, includes bookings whose
  VAT is later reversed). `vat_reversed` is the refunded share — the VAT
  portion returned to the guest on refund. `vat_payable` is the
  VAT_PAYABLE ledger net (recognised at capture, reduced by reversals).
- **Booking economics ≠ recognised financials.** `booking_financials`
  and `booking_economics_summary` report gross booking economics for the
  selected set (unpaid/cancelled/refunded included) — their totals are
  gross booking value, never collected revenue. `revenue_summary` is the
  recognition report: net signed ledger balances for `platform_revenue` /
  `vat_payable` / `host_payable`, plus collected captures, refunds and
  net activity, on the ledger-recognition date basis.
- **Host net vs host payable vs host funds held.** `host_net_egp` is
  booking economics; `host_payable` is the ledger liability credited at
  escrow release (payout-eligible, net of payouts); `host_funds_held` is
  the recognised-but-restricted host share still inside open escrows —
  three different lifecycle states, never conflated.
- **Every total is labelled.** `ReportDef.total_labels` maps each money
  total to an explicit i18n label; exports emit labeled totals rows.

### Recognition timing (canonical model)

The StayOS lifecycle separates recognition from payout:

```text
PAYMENT CAPTURED (authoritative Paymob/payment success event)
│
├── StayOS Revenue  → RECOGNISED  (platform_revenue credit)
├── VAT             → RECOGNISED  (vat_payable credit)
└── Host Net        → HELD        (stays inside the escrow liability)
         │
         ▼
   Guest check-in confirmed → 24h protection window → escrow release
         │
         ▼
   HOST_PAYABLE credit (payout-eligible, wallet withdrawable)
         │
         ▼
   Host payout (host_payable debit / platform_cash credit)
```

- **Capture** (`ESCROW_CREATE`) posts `platform_cash` debit + `escrow`
  credit — cash in, full guest amount held as the escrow liability.
- **Recognition** (`ESCROW_RECOGNIZE`, `_ensure_capture_recognition`)
  posts at successful capture: `escrow` debit for the StayOS share + VAT,
  `platform_revenue` credit, `vat_payable` credit. The escrow liability
  balance steps down to exactly the host net — the restricted host
  obligation. No wallet is touched, so host funds are never withdrawable
  before the protection window.
- **Release** (`ESCROW_RELEASE`) is only the host-funds transfer: `escrow`
  debit (host net) / `host_payable` credit with the host wallet — that is
  what makes the funds payout-eligible after check-in + 24h. Revenue and
  VAT are not reposted.
- **Cancellation/refund** on a recognised escrow reverses the recognised
  components: the held host share is voided from the escrow liability,
  the refunded share's VAT debits `vat_payable` (proportional on partial
  refunds), revenue reverses to the retained-taxable amount, and the
  guest refund credits `guest_refund_payable` (or `platform_cash` once
  provider-confirmed). Pre-recognition escrows keep the legacy posting.
- **Idempotency:** recognition is guarded by the `escrow-recognize`
  transaction key plus a ledger-existence check — webhook retries, worker
  replays, check-in fallback, release/cancel self-healing and the
  backfill can all trigger it exactly once.
- **Backfill:** `backfill_capture_recognition`
  (`scripts/backfill_capture_recognition.py`) posts `ESCROW_RECOGNIZE`
  for open escrows created under the legacy release-time model, skipping
  cancelled bookings and already-recognised escrows. Auditable via
  `provider_metadata.source = backfill`.

### Drill-downs explain their KPI

- `GET /finance/escrow` returns the canonical decomposition per escrow
  (`host_amount_egp`, `platform_share_egp`, `vat_egp`, listing title,
  booking/payment status) via `escrow_decompositions` — the same split
  `_resolve_escrow_split` uses. Funds-held rows show
  `amount = host + StayOS share + VAT`.
- `GET /finance/ledger` rows carry `reservation_id` so every ledger row
  names its booking; debits render negative and the drill-down totals to
  the signed net.
- VAT drill: recognised credits / reversed debits / net payable — no
  "held VAT" (recognition is not gated on host payout). Host payable
  drill: ledger balance (payout-eligible) plus the restricted host share
  inside open escrows, labelled "host funds held".

### Management report (PDF)

`GET /admin/reports/management` returns an executive aggregation —
KPIs (collected, recognised StayOS revenue, VAT payable, host funds
held, host payable, funds held, refunded), signed revenue decomposition
and monthly series, VAT calculated/recognised/reversed/payable plus the
"within held funds" cash-position figures, bookings by status and
governorate, settlement lifecycle, refunds/adjustments, top bookings —
composed entirely from the canonical facts (identical aggregates to
Admin Earnings when unfiltered; a date range windows each metric on its
declared basis). The web management-report page renders it as a
print-optimised executive document (EN/AR, RTL-safe) whose "Download PDF"
uses browser print; CSV/XLSX remain the raw/analytical exports.
