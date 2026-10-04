# 18 — Commercial Model (AUTHORITATIVE — DO NOT CHANGE)

Founder-authorized **Model B**:

| Item | Rule |
|---|---|
| Host input | Host enters **gross accommodation price** (what they price the stay at) |
| Host-side StayOS economics | **6%** of accommodation |
| Guest-side StayOS economics | **6%** of accommodation |
| Total internal StayOS economics | **12%** of accommodation |
| Cleaning | per-stay cleaning fee |
| VAT | 14% per the current product model — subject to accountant/legal confirmation |
| Guest-facing UX | **all-inclusive price** — guest sees one total |

## Hard privacy rule
Guests must NEVER see: 6%, 12%, host commission, StayOS revenue, or any
internal fee allocation. Enforcement is in the quote/breakdown code paths
and verified by tests — do not add fee lines to guest-facing payloads.

## Implementation
- Pricing computes in `bookings`/`reservations` services; guest total =
  accommodation + cleaning + taxes — internal splits applied server-side
  only.
- Ledger posting at capture separates `platform_revenue` (12%) from
  `host_funds_payable` (host gross − host share) — see `17_FINANCIAL_LEDGER.md`.
- Management report (`/admin/reports/management`) reconciles these exact
  numbers — it is the reference implementation of the model.

## Authority
This model is a founder decision with test coverage
(`test_full_booking_lifecycle_12pct_economics`). Any change requires a new
founder decision — never adjust coefficients in code or docs unilaterally.
