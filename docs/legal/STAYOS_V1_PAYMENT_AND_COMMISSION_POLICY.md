# StayOS — V1 Payment & Commission Policy (Internal, FINAL for V1)

**Status:** Internal commercial policy — **DECIDED for V1** by Project Director authority on the business/product items below; genuine legal questions remain explicitly open and marked `LEGAL COUNSEL REQUIRED`. Not a legal document, not shown to users. This is the canonical source of truth — the Terms of Service, Host Agreement, and Cancellation & Refund Policy are reconciled to match it exactly; if any of those documents ever appears to say something different, this document controls.

**Decision date:** 2026-08-24 (Legal & Commercial Decision Gate sprint).

---

## 1. Canonical V1 Commercial Policy Table

| Item | Final V1 Rule | Status |
|---|---|---|
| Guest service fee | 4% of accommodation subtotal, added to what the Guest pays | DECIDED |
| Host commission | 10% of accommodation subtotal, deducted from Host payout | DECIDED |
| Platform take | 2% of accommodation subtotal, deducted from Host payout (total StayOS take: 12% host-side + 4% guest-side) | DECIDED |
| Alpha host incentive | **First 3 completed bookings per Host** are charged **0% host commission**; the 2% platform take still applies, so the Host receives 98% of the accommodation subtotal for those bookings | DECIDED (implemented in `src/app/finance/services.py`) |
| Alpha guest incentive | **First 10 completed guest bookings globally** are charged **0% guest service fee**; the Guest pays only the accommodation subtotal (and any cleaning fee) | DECIDED (implemented in `src/app/payments/services.py`) |
| Payment destination | Guest pays a real StayOS-controlled bank account / Vodafone Cash number (Model A) | DECIDED (business) / **LEGAL COUNSEL REQUIRED** (CBE licensing classification) |
| Payment method | Manual bank transfer or Vodafone Cash; reference number + proof upload; admin verification | DECIDED (already the product's live mechanism) |
| Payment deadline | Guest must submit payment proof within **24 hours** of Host acceptance | DECIDED |
| Payment deadline — missed | Booking is cancelled (host or admin action; no automatic timer exists — see Engineering, P1) | DECIDED |
| Proof resubmission | Up to **3 attempts** within **48 hours** of the first rejection; after that, booking is cancelled | DECIDED |
| Guest cancellation — Flexible | 100% refund of the **accommodation amount** if cancelled ≥24 hours before check-in; 0% if cancelled after that cutoff | DECIDED |
| Guest cancellation — Moderate | 100% refund of the accommodation amount if cancelled ≥5 days before check-in; 0% if cancelled after that cutoff | DECIDED |
| Guest cancellation — Strict | 50% refund of the accommodation amount if cancelled ≥1 week before check-in; 0% if cancelled after that cutoff | DECIDED |
| Guest service fee on guest-initiated cancellation | **Non-refundable**, regardless of tier or timing — it compensates StayOS for the booking/verification service already performed | DECIDED |
| Host cancellation (of a confirmed, paid booking) | Guest receives **100% refund** of everything (accommodation amount + guest service fee). StayOS charges the Host no commission on the cancelled booking. No monetary penalty on the Host beyond forfeited commission; repeated host cancellations (2+ in the alpha phase) trigger manual admin review of the listing | DECIDED |
| Property unavailable / double-booked / materially misleading listing | Same as Host cancellation: Guest gets 100% refund of everything; listing flagged for manual review; StayOS operations assists the Guest in finding an alternative where practical (manual, not a product feature) | DECIDED |
| No-show (Guest) | Declared by the Host, confirmed by StayOS admin via support contact; **no refund** of accommodation amount or service fee | DECIDED |
| No-show (Host / property inaccessible) | Treated as Host failure — see "Property unavailable" row (100% guest refund) | DECIDED |
| Duplicate payment | Admin identifies the duplicate transfer during proof review (matching reference numbers) and refunds the extra amount to the original payer within standard refund timing | DECIDED |
| Refund timing | **5 business days** after refund approval | DECIDED — this is the value for `{{refund_days}}` |
| Service-fee refundability (general rule) | **Refundable in full only when the cancellation is not the Guest's choice** (Host cancels, StayOS cancels, property unavailable/host failure). **Non-refundable when the Guest initiates the cancellation**, even within a 100%-accommodation-refund window | DECIDED |
| Host payout timing | **Within 3 business days** of payment verification | DECIDED |
| Off-platform payment | Not supported for bookings made through StayOS; StayOS's payment verification and cancellation protections apply only to payments made through the Platform's instructed account | DECIDED |
| Host authorization for V1 | Every Host completes KYC (identity only) **and** submits the Host Agreement's ownership/authorization declaration. **For the first 1–10 listings specifically** (founder's personal network per the supply strategy), the founder additionally manually confirms ownership/authorization directly with the owner before publication — a zero-engineering operational step, not a product feature. Listings sourced later through agencies/OLX/other channels rely on declaration + identity KYC only, until/unless a documented ownership-verification feature is built (P2) | DECIDED |

## 2. Commission Rate — Decision

**KEPT: 10% Host commission + 2% platform take + 4% Guest service fee.**

**Alpha promotional override (resolved 2026-08-26):** the closed alpha uses two limited incentives already implemented in the codebase:
- **First 3 completed bookings per Host:** 0% host commission (the 2% platform take still applies).
- **First 10 completed guest bookings globally:** 0% guest service fee.
After those thresholds, the standard V1 rates above apply.

- **Current rate:** exactly this — found already configured, identically, across every environment file (`src/app/config.py`, `.env`, `.env.staging`, `.env.example`).
- **Proposed alternative considered:** none materially better identified. A higher rate (e.g., Booking.com's 10–25%, averaging ~15%) would improve margin but reduce host adoption at a stage where StayOS has 0 real listings and needs to win hosts over discovery-sourced competitors, not extract maximum rent from them. A lower rate would under-monetize relative to comparable marketplaces for no clear benefit.
- **Financial impact:** ~12% of gross accommodation value retained by StayOS (10%+2%) plus a separate 4% guest-side fee — squarely within the Airbnb (≈15.5% host-only, or 3%+6–12% split) / Booking.com (10–25%) competitive range found in prior research.
- **Operational impact:** zero — no code change needed to keep an already-configured value; it is already what a real transaction would compute if the dormant `finance` module were wired up, and it is simple enough to compute by hand for the alpha's 1–10 transactions.
- **Legal disclosure impact:** must be clearly and separately disclosed to the Guest before payment (accommodation amount + 4% fee shown as distinct line items) per Consumer Protection Law 181/2018's pre-contract disclosure requirements — this is a `LEGAL COUNSEL REQUIRED` confirmation of exact disclosure format, not of the rate itself.
- **Decision status:** DECIDED for V1. Not merely "found and left open" any longer — this document adopts it as StayOS's official V1 commercial rate.

## 3. Payment Flow (unchanged from the prior sprint, restated as final)

`Guest → real StayOS-controlled account (bank/Vodafone Cash) → Guest submits reference + proof → StayOS admin verifies → commission computed (§ 2) → StayOS forwards Host's net amount, within 3 business days (§ 1)`

**Not described as regulated "escrow."** StayOS holds funds briefly, manually, before forwarding — whether this requires Central Bank of Egypt payment-facilitator licensing remains `LEGAL COUNSEL REQUIRED` (§ 5).

## 4. Alpha Operating Procedure (First 1–10 Transactions) — Executable Manually, No New Engineering

1. **Guest booking** — Guest submits a booking request through the existing app (`bookings` module, unchanged).
2. **Host acceptance** — Host (or admin, for the first personally-sourced listings) accepts within a reasonable time; 24-hour payment clock (§ 1) starts on acceptance.
3. **Payment instructions** — Guest sees the payment instructions screen, now pointing to a **real** StayOS-controlled account (§ 1 of the prior sprint's Product Impact Audit — swapping the placeholder text is the one required config/content change, still not done as of this document; see P0 Action Plan).
4. **Payment proof** — Guest transfers the amount (accommodation subtotal + 4% guest fee) and uploads reference + proof, within 24 hours.
5. **Admin verification** — Admin checks the transfer against the bank/Vodafone Cash statement, checks for duplicate reference numbers (§ 1, duplicate-payment row), and verifies or rejects (existing `payments/services.py` flow, unchanged).
6. **Booking confirmation** — On verification, booking moves to `confirmed` (existing code, unchanged).
7. **Commission calculation** — Admin manually computes Host payout from the accommodation subtotal, applying the alpha incentive if this is one of the Host's first 3 completed bookings:
   - **First 3 completed bookings per Host:** Host payout = subtotal − 2% = 98% of subtotal.
   - **All other bookings:** Host payout = subtotal − 10% − 2% = 88% of subtotal.
   (Formula matches the `finance` module logic — the code waives host commission but not platform take for the first 3 bookings.)
8. **Host payout** — Admin transfers the computed net amount to the Host's bank/Vodafone Cash account within 3 business days of verification (§ 1).
9. **Cancellation** — Handled per § 1's tier rules; admin manually determines which tier applies and whether it's guest- or host-initiated.
10. **Refund** — Admin manually transfers the refund amount within 5 business days of approval (§ 1).
11. **Accounting/reconciliation** — For 1–10 transactions, a simple manual ledger (spreadsheet: booking ID, guest amount received, commission retained, host amount paid, dates) is sufficient. [PROJECT DECISION — no accounting software required for this scale; revisit at Closed Alpha scale-up, P2.]
12. **Exception handling** — Any case not covered by § 1's rules (e.g., a genuinely novel dispute) is resolved by the founder directly, on a case-by-case basis, for the first 1–10 transactions; formalize into policy only if it recurs.

## 5. Regulatory Risk — Preserved as Open

**`LEGAL COUNSEL REQUIRED` — unchanged from the prior sprint, not resolved by this decision pass (this is explicitly outside Project Director authority):** whether StayOS receiving and forwarding Guest funds via a StayOS-controlled account — even at 1–10-transaction alpha scale — falls within the Central Bank of Egypt's Law 194/2020 / June 2025 PSP/PSO licensing framework (EGP 10–30M capital requirement for entities holding customer funds). **Model A remains the preferred architecture and is not replaced.** The fallback (Guest pays Host directly + Guest pays StayOS its own 4% fee directly, so StayOS never touches Host funds) is preserved as a **contingency only**, to be activated if and only if counsel advises Model A carries unacceptable risk at current scale.

## 6. Long-Term Model — Unchanged

Paymob marketplace/split-payment integration remains the target for scaling past the manual alpha (§ 4), routing funds through a licensed PSP so Paymob — not StayOS — is the entity holding customer funds. **Not confirmed as technically available; see `PAYMOB_REQUIREMENTS_REQUEST.md`.** Not integrated in this sprint.

## 7. Off-Platform / Disintermediation — Restated as Decided Policy

Because the Host's payout is computed and released only after StayOS verifies the Guest's payment (§ 4, steps 5–8), a Host cannot bypass commission by directing a Guest to pay them directly for a StayOS-originated booking — there is no payout to receive until StayOS has already deducted its share. The Terms of Service states this plainly (§ 8) as a description of how the product works, not as a punitive clause.

## 8. Unresolved Provider Dependencies (unchanged)

Paymob (not yet contacted), AWS/S3 (deferred, unrelated to this decision), Akedly (decision closed in a prior sprint, out of scope here).
