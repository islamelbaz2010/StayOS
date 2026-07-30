# Fraud Detection — StayOS

**Domain**: Trust & Safety
**Audience**: Trust & Safety Team, Support, Operations, Finance, Founders
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Monthly (fraud patterns change; quarterly minimum if low volume)
**Tags**: fraud, trust-and-safety, fake-listings, identity-fraud, payment-fraud, refund-abuse, prevention

---

## Purpose

This article defines every fraud pattern StayOS is exposed to, how each type is detected, what the correct response is, and how to prevent recurrence. Fraud knowledge must be current because fraud patterns evolve. New patterns must be added to this document within 30 days of discovery.

---

## Background

The MENA accommodation market has endemic fraud across multiple vectors: fake listings that don't exist, hosts who collect deposits and disappear, guests who damage property and dispute payment, identity fraud, and payment chargebacks. StayOS enters a market where the baseline consumer expectation is that fraud is possible and probably common.

This creates both a threat and an opportunity: StayOS must defend against fraud more aggressively than Western platforms because the baseline fraud rate in Egypt's informal accommodation market is higher. But successfully defeating fraud becomes one of the most powerful trust signals we can communicate.

---

## Core Concept: Fraud Typology

StayOS faces fraud from six directions:

```
1. Supply-Side Fraud (fake or unauthorized listings)
2. Demand-Side Fraud (fraudulent bookings, damage, refund abuse)
3. Identity Fraud (fake IDs, impersonation)
4. Payment Fraud (stolen cards, chargebacks, payment laundering)
5. Internal Fraud (team members abusing access)
6. Platform Manipulation (fake reviews, search gaming)
```

---

## Detailed Explanation

### 1. Supply-Side Fraud

**Pattern 1A: Non-Existent Listing**
A fraudster lists a property they do not own or that does not exist. Guest pays. "Host" directs guest to a different (worse or non-existent) property. Guest complains. Fraudster claims the guest is lying and requests payout.

**Detection signals**:
- Host cannot provide ownership documentation or lease
- Address verification fails (Google Maps shows different building type than claimed)
- Photos reverse-search to other listing sites under different names
- Host declines inspection or becomes evasive when inspection is scheduled

**Prevention**:
- Gate 1 document verification (ownership deed or lease required before listing goes live)
- In-person or video inspection before first booking (Gate 2)
- Photo reverse-image search during listing review

**Response if detected after a guest has booked**:
1. Immediately cancel the booking and issue full refund to guest
2. Remove the listing permanently
3. Ban the host's phone number, ID, and email from the platform
4. Document the case in the fraud registry

---

**Pattern 1B: Bait-and-Switch**
Host lists a premium property. Guest books. Upon arrival, the host claims the booked property is "unavailable" and offers a lower-quality alternative.

**Detection signals**:
- Host claims unavailability within 24 hours of check-in (after the platform calendar showed available)
- Host proactively offers alternatives without any system trigger
- Guest reports upon arrival that property is different from what was booked

**Prevention**:
- Calendar integrity enforced at database level (no availability shown without confirmed availability)
- Booking confirmation sent to guest with specific property address — host cannot change it
- Guest instructed to verify exact address upon arrival and report immediately if different

**Response**:
- Full refund plus compensation (StayOS bears cost, claims against host)
- Escalate to a platform warning + suspension
- On third offense: permanent ban

---

### 2. Demand-Side Fraud

**Pattern 2A: Property Damage + Dispute**
Guest intentionally damages property, then disputes the security deposit charge, claiming damage was pre-existing.

**Detection signals**:
- Guest disputes damage claim immediately (before platform even sends a claim)
- Guest has history of damage claims on previous stays (check prior booking history)
- Damage claimed by host is inconsistent with the type of stay (e.g., massive water damage on a 1-night stay)

**Prevention**:
- Pre-cleaning "as-found" photographs (time-stamped) required at every turnover
- Security deposit collected at booking for all stays ≥3 nights or properties in Premium tier
- Guest's identity fully verified (KYC) before any booking is confirmed

**Response**:
- Review time-stamped pre-cleaning photos versus damage photos
- If damage is confirmed new: process deposit charge against guest, transfer to host
- If damage cannot be confirmed as new (no pre-cleaning photos taken): StayOS bears cost and issues a protocol violation warning to the cleaning team
- Flag guest for enhanced screening on future bookings

---

**Pattern 2B: Refund Abuse**
Guest books, completes the stay, then claims the property was unsatisfactory to extract a partial refund. Common pattern: book on Friday, claim issues on Sunday after weekend is complete.

**Detection signals**:
- Guest complains only after the stay is fully completed (no complaints during)
- Guest complaint is vague or impossible to verify ("it smelled bad," "the bed was uncomfortable")
- Guest has filed similar post-stay complaints before
- No contact with support was made during the stay (undermines "I couldn't reach anyone")

**Prevention**:
- Proactive 30-minute check-in message creates a record of no issues at arrival
- Support contact is required DURING the stay for any refund to apply to stay-quality issues
- All support contacts time-stamped and documented

**Response**:
- Review all support contact history during the stay
- If guest did not report issues during stay: no refund for stay-quality claims
- If guest has pattern of post-stay refund claims: restrict to no-refund policy on future bookings, flag for enhanced review before booking

---

**Pattern 2C: Fraudulent Booking (Stolen Payment)**
A booking is made with a stolen payment card. Cardholder disputes the transaction with their bank. StayOS is hit with a chargeback.

**Detection signals**:
- Card belongs to a person in a different city or country than the booking location
- Booking made at unusual hour (2–5am) for the card's time zone
- Guest name on booking does not match the card name
- Payment attempted from a new device with no prior platform history
- Multiple failed payment attempts before success (card testing)

**Prevention**:
- Require full name on card to match guest registration name
- Flag bookings where payment method is from a significantly different region than the property
- Implement velocity checks (>3 failed payment attempts = block card for 24 hours)
- Card CVV verification mandatory

**Response if chargeback received**:
- Collect all evidence: booking record, KYC verification, check-in photo, access log
- Submit chargeback dispute with evidence to payment provider (Paymob or Stripe)
- Win rate on chargebacks with KYC-verified guests is high — evidence package is key
- If chargeback is lost: cancel future bookings associated with that guest account

---

### 3. Identity Fraud

**Pattern 3A: Fake National ID**
A user submits a fake or altered Egyptian national ID to pass KYC verification.

**Detection signals**:
- AWS Textract OCR cannot extract standard national ID fields (could be image quality OR altered ID)
- Name on ID does not match name on bank account (payout routing)
- ID number does not pass Luhn/checksum validation (Egyptian national IDs follow a known pattern)
- Face comparison (AWS Rekognition) match score below threshold

**Prevention**:
- Automated OCR + face comparison (implemented in FC-01 via AWS Textract + Rekognition)
- Manual review queue for OCR confidence scores below 85%
- Cross-reference ID number against publicly available format validation
- Random sampling: 5% of passed KYC submissions reviewed manually

**Response if fake ID detected**:
- Suspend account immediately
- Cancel all pending bookings (full guest refunds)
- Report to financial compliance team
- If host: report to relevant Egyptian authorities if evidence is strong

---

**Pattern 3B: Impersonation (Someone Using Another's ID)**
User passes KYC using a real ID that belongs to someone else (stolen ID, family member's ID).

**Detection signals**:
- Face comparison score from selfie versus ID photo is below threshold (primary defense)
- Multiple accounts with the same ID number (duplicate detection)
- Payout account name does not match ID name

**Prevention**:
- Selfie face comparison is the primary control (AWS Rekognition)
- Duplicate ID number detection across all registered accounts
- Payout account name must match legal name on ID exactly (BR-ID-02)

---

### 4. Payment Fraud

**Pattern 4A: Paymob Chargeback Fraud**
Guest pays via Paymob, completes stay, then disputes the charge with their bank claiming unauthorized transaction.

**Detection signals**:
- Dispute filed more than 48 hours after checkout (post-stay timing)
- Guest made no contact with support during or immediately after stay
- Payment was made with a card, not a local wallet (Fawry, InstaPay chargebacks are rarer)

**Prevention**:
- Collect signed digital booking confirmation before payment is processed
- Document all guest touchpoints (check-in message, support contacts, checkout message) — creates a dispute-defense evidence trail
- Implement Paymob's HMAC webhook signature verification to prevent fake payment confirmations

**Response**:
- Submit evidence package to Paymob: booking record, KYC, digital confirmation, check-in record
- StayOS win rate on disputed stays with full evidence package: approximately 70%

---

**Pattern 4B: Payment Laundering**
A bad actor books accommodation using a stolen card and then cancels (if refundable) to launder money back to a different account. Or books at inflated prices (host is colluding) to create a clean money trail.

**Detection signals**:
- Booking immediately followed by cancellation requesting refund to different payment method
- Unusual price for a property relative to market (grossly overpriced)
- Host-guest relationship exists outside the platform (same family, same community)
- Multiple bookings of the same property by accounts with similar registration details

**Prevention**:
- Refunds always processed to the original payment method, never to a different account
- Pricing outlier detection: flag listings priced >3x the market average for the area
- Monitor for unusual patterns: same guest booking same host repeatedly

---

### 5. Platform Manipulation

**Pattern 5A: Fake Review Injection**
A host (or competitor) creates fake guest accounts to post positive reviews on their own listings or negative reviews on competitor listings.

**Detection signals**:
- Guest account with no completed booking left a review (should be technically impossible but check for system bypasses)
- Multiple reviews from accounts created on the same day with no booking history
- Reviews using very similar language patterns (copy-paste with small variations)
- IP address of reviewing accounts clusters around the same location

**Prevention**:
- Reviews only accepted from accounts with verified completed stays
- Rate limit review submissions per account
- NLP anomaly detection on review text (similar phrasing patterns)
- Block review submission from the host's own devices (IP-based check)

**Response**:
- Remove fake reviews immediately
- Suspend the accounts involved
- Warn or suspend the host if they organized the fake reviews

---

## Decision Tree: Fraud Triage

```
Potential fraud detected. What type?

Guest files dispute claiming property not as described?
  → Check: Was the guest in the property for more than 2 hours before complaining?
        YES → Not a "not as described" claim. Likely post-stay refund abuse. Investigate.
        NO  → Could be legitimate. Escalate to Trust & Safety for property verification.

Host's listing flags during review?
  → Photo reverse-search reveals duplicate listing? → Fake listing fraud. Reject immediately.
  → Owner cannot provide documentation? → Block listing. Request documents.

Payment is disputed (chargeback received)?
  → Collect evidence package. Submit to payment provider.
  → Was the stay completed (check-in and check-out confirmed)? → Evidence strong, contest.
  → Was the stay not completed? → Investigate whether booking was fraudulent.

Identity verification score is low?
  → Below 70% match → Reject automatically, require re-submission.
  → 70-85% match → Send to manual review queue.
  → Above 85% → Auto-approve (with random 5% manual spot-check).

Suspected payment laundering?
  → Freeze the payout pending investigation.
  → Review all transactions involving the host account.
  → If confirmed: ban both accounts and report to Paymob/Stripe.
```

---

## Best Practices

1. **Document every fraud case.** The fraud registry is the institutional memory that makes detection faster over time. A fraud pattern that was discovered in Month 3 should be detectable in Month 1 if it repeats.

2. **Never ban without evidence.** A legitimate host or guest accused of fraud who is banned without evidence creates legal liability and word-of-mouth damage. Every ban must be supported by documented evidence.

3. **Treat the first offense differently from repeat offenses.** A guest who claims a refund for a stay they genuinely didn't enjoy is different from a guest with 3 prior refund claims for vague reasons. Escalation must be calibrated.

4. **Fraud patterns evolve seasonally.** Peak seasons (Eid, summer, major events) attract fraudsters because high demand creates urgency and reduces scrutiny. Increase manual review sampling during peak periods.

5. **Share fraud patterns with the team.** Every fraud case is a training opportunity. Monthly fraud review meetings with support and operations teams ensure the whole team can recognize emerging patterns.

---

## Common Mistakes

**Mistake 1: Treating all disputes as fraud**
Most disputes are genuine disagreements about service quality, not fraud. Treating a legitimate complaint as fraud destroys the relationship and creates legal risk. Distinguish: fraud involves intentional deception; disputes involve differing interpretations of what was promised.

**Mistake 2: Relying solely on automated detection**
Automated systems catch the obvious patterns. Sophisticated fraud (a colluding host and guest operating slowly and carefully) requires human pattern recognition. Manual review of flagged accounts is non-optional.

**Mistake 3: Slow response to fraud reports**
A host who reports a fraudulent guest, or a guest who reports a fake listing, and doesn't hear back for 3 days will escalate to social media. Fraud reports must receive a response within 4 hours.

**Mistake 4: Processing refunds before investigation**
A guest who claims fraud and immediately receives a full refund creates a playbook for others. Refunds in fraud situations must follow an investigation, not precede it. Communicate clearly: "We are investigating this claim and will respond within 24 hours."

---

## FAQs

**Q: What evidence do we submit for a chargeback dispute?**
A: (1) Signed booking confirmation with booking terms, (2) KYC verification record with timestamp, (3) Check-in confirmation (WhatsApp message showing guest acknowledged arrival), (4) Any support contacts during the stay showing the guest had an opportunity to report issues, (5) Checkout confirmation, (6) Review left by the guest if any.

**Q: What do we do when a host accuses a guest of damage but has no photos?**
A: Without pre-cleaning as-found photos showing the damage was NOT present before the guest's stay, StayOS cannot adjudicate in the host's favor. The host's damage claim is rejected. This is documented clearly in the host agreement. The consequence is that operations teams are required to take pre-cleaning photos on every turnover (BR-OPS-03).

**Q: Can a guest be banned for too many cancellations (not fraud, just behavior)?**
A: Not banned, but flagged. A guest who cancels ≥3 bookings in 90 days requires additional screening before future bookings. Their cancellation behavior may indicate they are testing availability or holding capacity speculatively.

---

## Checklist

### Fraud Investigation Checklist
- [ ] Incident type identified from typology
- [ ] All evidence collected and time-stamped
- [ ] Account history reviewed (prior fraud signals?)
- [ ] Evidence reviewed by Trust & Safety lead (not the same person who received the report)
- [ ] Decision made: fraud confirmed / not confirmed / inconclusive
- [ ] If confirmed: account action taken (warning / suspension / ban)
- [ ] If confirmed: financial action taken (refund / payout hold / chargeback dispute)
- [ ] Case documented in fraud registry with pattern classification

---

## References

- `docs/03_customer_experience/TRUST_FRAMEWORK.md`
- `docs/02_product/BUSINESS_RULES.md`
- `src/app/auth/services.py` — KYC verification implementation
- `src/app/kyc/services.py` — Textract OCR and Rekognition face comparison
- `src/app/finance/providers.py` — Paymob and Stripe webhook verification

## Related Documents

- `knowledge/trust/dispute_resolution.md`
- `knowledge/trust/identity_verification_guide.md`
- `knowledge/finance/refund_and_chargeback.md`
- `knowledge/support/escalation_playbook.md`
