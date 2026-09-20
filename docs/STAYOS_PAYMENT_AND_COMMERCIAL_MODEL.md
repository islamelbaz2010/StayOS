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
| `GUEST_SERVICE_FEE_PCT` | 0.04 | **Legacy** — old rows only |
| `HOST_COMMISSION_PCT` | 0.10 | **Legacy** — old rows only |
| `PLATFORM_TAKE_RATE_PCT` | 0.02 | **Legacy** — old rows only |

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
