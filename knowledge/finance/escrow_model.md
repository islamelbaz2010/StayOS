# Escrow Model — StayOS

**Domain**: Finance
**Audience**: Finance Team, Support, Operations, Founders, Hosts
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Quarterly
**Tags**: escrow, payments, finance, trust, BR-FIN-01, payout, refund, host-protection, guest-protection

---

## Purpose

This article explains how StayOS's escrow model works, why it exists, what it protects against, and how every edge case is handled. Anyone explaining payments to hosts or guests, handling a payment dispute, or working in finance must understand the escrow model completely.

---

## Background

Egypt's informal accommodation market has a persistent payment trust problem: guests pay in full (cash or transfer) before check-in, the host has all the money, and the guest has only a verbal promise. When something goes wrong, the guest has no leverage and no recourse. Hosts who act in bad faith — or simply disappear — face no consequences.

StayOS's escrow model solves this problem by holding the guest's payment and releasing it to the host only after a verified, successful check-in. This creates:
- **For guests**: Financial security — their money is protected until the property is confirmed as described
- **For hosts**: Payment certainty — confirmed bookings will pay out; no worry about guests not paying
- **For StayOS**: Trust infrastructure — the mechanism that makes both sides willing to transact with a stranger

**Business Rule BR-FIN-01**: Gross reservation yields are locked in platform escrow and barred from distribution until exactly 24 hours post-check-in.

---

## Core Concept: The Escrow Lifecycle

```
Guest Pays → Money Held in Escrow → Check-in Confirmed → 24-Hour Wait → Host Payout Released
                    ↑                        ↑                                    ↑
             If cancelled:           If major issue:                    If payout halted:
             Guest refunded           Guest may be                      BR-FIN-03 applies
                                      refunded instead
```

---

## Detailed Explanation

### Step 1: Guest Payment Collection

When a guest confirms a booking, the full booking amount is collected immediately:
- Nightly rate × number of nights
- Cleaning fee (set by host or StayOS standard)
- Guest service fee (3–5% — StayOS's guest-side revenue)
- Applicable tax

**Total is disclosed to the guest before payment** — no surprise fees at checkout.

Payment is processed through Paymob (primary) or Stripe (for international cards). The funds are received into StayOS's platform account. This is the escrow pool — StayOS holds these funds in trust for both parties until the booking event chain resolves.

**What "in escrow" means operationally**: The funds are in StayOS's bank account but are tracked per-booking on the platform ledger as a liability. They are owed to the host (minus commission) upon successful check-in, or owed back to the guest upon valid cancellation or dispute. StayOS does not use escrow funds for operating expenses.

---

### Step 2: Cancellation Window (Before Check-In)

**If the guest cancels before check-in**:

The cancellation refund policy applies:
- >7 days before check-in: 100% refund to guest
- 3–7 days before check-in: 50% refund to guest, 50% payout to host
- <3 days before check-in: 0% refund, 100% payout to host (minus commission)
- <24h before check-in with >7 days notice given: 100% refund (protection clause)

**If the host cancels before check-in**:
- 100% refund to guest, regardless of timing
- Host receives no payout for the cancelled booking
- Host account receives a cancellation penalty (3 cancellations in 30 days = suspension review)

**Refund timeline**: Refund initiated within 2 hours of confirmed cancellation. Funds appear in guest's account within 1–5 business days depending on payment method.

---

### Step 3: Check-In and the 24-Hour Trigger

**Check-in is confirmed when**:
- Guest marks "checked in" in the app, OR
- Host confirms check-in via WhatsApp + platform, OR
- Automatic check-in trigger fires at scheduled check-in time + 2 hours without a dispute (automatic confirmation)

**The 24-hour clock starts at confirmed check-in.**

During this 24-hour window:
- The guest has the property and can verify that it matches the listing
- Any major issue reported during this window (property not as described, safety issue, host no-show) triggers the dispute process and pauses the escrow release
- No dispute opened in this window → automatic payout release at T+24 hours

**Why 24 hours, not immediate?**
The 24-hour window gives the guest enough time to discover any material discrepancy between the listing and reality. A guest who checks in at 3pm on Friday has until 3pm Saturday to report any issue. After 24 hours, the assumption is that the property is as described and the host has earned their payout.

**Why not longer than 24 hours?**
Host cash flow matters. A host with 10 nights of bookings who does not receive payment for 7+ days will leave the platform. 24 hours is the minimum guest protection window that also maintains host satisfaction with payment timing.

---

### Step 4: The 24-Hour Hold — Dispute Window

During the 24 hours post-check-in, if a guest opens a dispute:

**Dispute opened → Escrow release paused**

The Finance and Trust & Safety teams coordinate:
1. Trust & Safety investigates the dispute (evidence collection, decision)
2. Finance holds the payout until dispute is resolved
3. Decision is made (full refund to guest / partial refund / full payout to host)
4. Finance executes the financial outcome immediately upon Trust & Safety's decision

**Disputes opened after 24 hours** do not pause the escrow release (payout has already been initiated). They are handled as post-stay disputes with separate financial resolution outside the escrow model.

---

### Step 5: Payout Release

After the 24-hour window closes without a dispute (or after a dispute is resolved in the host's favor):

**Payout calculation**:
```
Guest Payment (total)
- Guest Service Fee (retained by StayOS)
- Host Commission (retained by StayOS)
- Any applicable refunds or deductions
= Host Net Payout
```

**Payout routing**:
- Funds transferred to host's verified bank account
- Paymob or bank transfer depending on host preference and account type
- Host receives payout notification via WhatsApp and platform notification

**Payout timing**:
- Initiated: immediately upon trigger (T+24h or dispute resolution)
- Received by host: 1–3 business days (banking clearing time)

**Payout held (BR-FIN-03)**: If the host's tax status fields or payout routing profile have any error state, the payout is held until the error is resolved. Host is notified immediately with specific instructions on what to fix.

---

### Special Scenarios

**Multi-Night Stays**
For stays ≥7 nights, a single escrow event covers the full stay. The 24-hour window starts from the first night's check-in. Payout is released 24 hours after check-in for the full booking amount.

**Same-Day Booking**
Guest books for same-day check-in. The 24-hour window functions identically — the clock starts at check-in, not at booking time. The only operational difference is that there is no advance cancellation window.

**Extended Stay (Monthly Rental)**
For stays ≥28 nights, the payout is split: 50% released at T+24h from check-in, 50% released at the midpoint of the stay. This protects the guest from a 30-day prepayment risk while giving the host cash flow throughout a long stay.

**Group Booking**
Treated as a single booking. The escrow model is identical regardless of group size.

---

## Real-World Scenarios

### Scenario A: Smooth Booking (Most Common)
Guest pays EGP 3,200 for a 4-night stay (EGP 800/night).
- EGP 3,200 collected at booking confirmation
- Guest checks in on Friday at 4pm
- 24-hour clock starts
- No dispute filed by Saturday 4pm
- Payout initiated: EGP 3,200 × (1 - commission rate) = EGP 2,880 (at 10% host commission)
- Host receives EGP 2,880 within 1–3 business days
- StayOS retains EGP 320 (host commission) + guest service fee from guest's payment

### Scenario B: Dispute Within 24 Hours
Guest pays EGP 5,600 for a 7-night stay. Checks in Wednesday 2pm. At 4pm, reports AC not working in the master bedroom.
- 24-hour payout is paused
- Operations dispatches technician. Fixed by 6pm.
- Guest confirms issue resolved at 6pm.
- Trust & Safety reviews: issue resolved within SLA (4 hours)
- Dispute closed: host receives full payout (minus commission) at T+24h from original check-in
- Guest receives goodwill credit of EGP 150 for the 2-hour inconvenience

### Scenario C: Major Dispute (Property Not as Described)
Guest pays EGP 8,000 for a 5-night stay. Arrives to a property significantly different from photos: the second bedroom shown in photos is a storage room in reality. Guest cannot accommodate their group.
- 24-hour payout paused
- Trust & Safety verifies: listing photos clearly show 2 bedrooms; current property has 1 accessible bedroom
- Decision: full refund to guest + host suspension pending review
- EGP 8,000 refunded to guest's payment method within 2 hours
- Host receives no payout for this booking
- Host account suspended for 30 days pending investigation

### Scenario D: Guest Cancels (Paymob Chargeback)
Guest cancels 2 days before check-in. Per policy: no refund (< 3 days). 1 week later, chargeback filed with the bank claiming unauthorized transaction.
- StayOS Finance collects evidence: booking confirmation, cancellation record, policy agreement signed at booking, KYC verification
- Chargeback submitted to Paymob with full evidence package
- Paymob rules in StayOS's favor: guest's bank reverses the chargeback (high probability with full documentation)
- If chargeback is lost: host still receives their payout per policy; StayOS absorbs the chargeback loss

---

## Decision Tree: Escrow Events

```
Booking confirmed and payment collected?
  → Funds in escrow. Track in ledger as liability.

Guest cancels before check-in?
  → Check cancellation timing vs. policy
  → >7 days: full refund immediately
  → 3–7 days: 50% refund, 50% to host
  → <3 days: full payout to host, no refund

Host cancels before check-in?
  → Full refund to guest immediately
  → No payout to host
  → Host penalty applied

Check-in confirmed?
  → Start 24-hour countdown

Dispute filed within 24 hours of check-in?
  → Pause escrow release
  → Trust & Safety investigation
  → Decision determines financial outcome

No dispute after 24 hours?
  → Release payout to host automatically
  → Guest service fee retained

Payout routing has error (BR-FIN-03)?
  → Hold payout
  → Notify host with specific fix required
  → Release when error corrected
```

---

## Best Practices

1. **Communicate the escrow model proactively to every host.** Many Egyptian hosts have never worked with escrow before. They will worry about when they get paid. Explain at onboarding: "You receive your payout within 1–3 business days after the guest checks in. Here's exactly how it works." Written explanation, not just verbal.

2. **Never describe escrow as "holding your money."** For hosts, frame it as: "Your payment is secured the moment a guest books. You are guaranteed to receive it 24 hours after check-in." For guests, frame it as: "Your payment is protected until you're safely checked in and satisfied."

3. **Payout routing errors must be resolved before the payout, not after.** A host whose payout is held because of a tax error (BR-FIN-03) is angry. If the payout routing is verified clean at onboarding, this never happens. Verify payout routing during host onboarding, not on first payout.

4. **Track every escrow event on the platform ledger.** At any moment, the Finance team should be able to answer: how much total escrow is currently held? How much is scheduled to release in the next 48 hours? This is a regulatory and operational requirement.

5. **Maintain a separation between escrow funds and operating funds.** Escrow funds are held in trust. They must never be used for operating expenses. Maintain separate ledger tracking even if the funds are in the same bank account.

---

## Common Mistakes

**Mistake 1: Releasing payout before the 24-hour window closes**
The 24-hour window exists specifically to catch first-24-hour disputes. Releasing early (even by mistake) means the host has been paid for a stay that might be refunded — creating an accounting complexity and a dispute about recovering funds from the host.

**Mistake 2: Explaining the cancellation policy incorrectly to hosts**
Some team members tell hosts they receive payment immediately after checkout. They receive payment after check-in (not checkout) plus 24 hours. This matters for multi-night stays — the host does not wait until the end of a 7-night stay to be paid; they are paid 24 hours after check-in begins.

**Mistake 3: Processing refunds without updating the escrow ledger**
A refund that doesn't update the per-booking escrow balance creates accounting inconsistencies. Every refund must be logged against the specific booking in the finance system.

**Mistake 4: Not having a double-entry ledger**
Every financial transaction must have two entries (debit and credit). "Guest paid EGP 3,200" creates: debit Cash account EGP 3,200 / credit Guest Escrow Liability EGP 3,200. "Payout released to host" creates: debit Guest Escrow Liability / credit Host Payable. Single-entry "we received money / we sent money" tracking is insufficient for auditing, tax compliance, and financial reporting.

---

## FAQs

**Q: What happens to the escrow if StayOS goes out of business?**
A: This is a regulatory question that requires a legal opinion in Egypt. In mature escrow models, escrow funds are held in a segregated account (separate from operating accounts) so they are protected from business insolvency. StayOS should establish this structure as soon as escrow volume reaches significant levels.

**Q: Do we earn interest on escrowed funds?**
A: Legally, interest on escrow funds is complex — the funds belong to the parties (host/guest), not to StayOS. In early-stage operations with short escrow periods (1–7 days typically), the interest is negligible. As volumes grow, a formal escrow arrangement with a licensed escrow agent may be required by regulation.

**Q: What if a guest pays by Fawry (cash) and needs a refund?**
A: Cash payment refunds are processed by bank transfer to an account the guest provides. StayOS contacts the guest to collect their bank account details. Processing time for cash refunds: 2–5 business days. This is a known limitation of cash payment methods and should be disclosed at booking.

**Q: Who bears the cost of a chargeback that StayOS loses?**
A: In the current model, StayOS absorbs lost chargebacks where the guest payment cannot be recovered. This is part of the platform risk. The take rate (13–17% blended) must be sufficient to cover an expected chargeback loss rate. Target chargeback loss rate: ≤0.5% of total transactions.

---

## Checklist

### Per-Booking Escrow Checklist
- [ ] Payment collected at booking confirmation
- [ ] Booking ledger updated: Guest Escrow Liability debited
- [ ] Cancellation window tracked (refund policy applied if cancellation received)
- [ ] Check-in confirmed (automated or manual)
- [ ] 24-hour countdown started and logged
- [ ] Dispute status monitored during 24-hour window
- [ ] 24-hour window closed without dispute → payout initiated
- [ ] Host payout ledger updated: Escrow Liability debited, Host Payable credited
- [ ] Payout confirmation sent to host
- [ ] Transaction archived with all event timestamps

---

## References

- `docs/02_product/BUSINESS_RULES.md` — BR-FIN-01 (escrow time lock), BR-FIN-02 (tax), BR-FIN-03 (payout halts)
- `src/app/finance/models.py` — EscrowLedger, HostPayout models
- `src/app/finance/services.py` — Escrow lifecycle implementation
- `src/app/reservations/services.py` — Cancellation refund policy

## Related Documents

- `knowledge/finance/payout_operations.md`
- `knowledge/finance/refund_and_chargeback.md`
- `knowledge/trust/dispute_resolution.md`
- `knowledge/training/finance_training.md`
