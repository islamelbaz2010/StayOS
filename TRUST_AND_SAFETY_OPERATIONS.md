# TRUST AND SAFETY OPERATIONS — StayOS

**Prepared by:** Executive Marketplace Operations Board  
**Date:** 2026-08-03  
**Purpose:** Define the operational processes for host verification, listing verification, photo review, fraud detection, suspensions, appeals, and incident handling.

---

## 1. Trust & Safety Philosophy

Trust is the core currency of the StayOS marketplace. Egyptian travelers have been burned by fake listings, payment fraud, and misrepresented properties. StayOS must defend against fraud more aggressively than Western platforms because the baseline fraud rate in Egypt's informal accommodation market is higher.

**Evidence from the repository:**
- `knowledge/trust/fraud_detection.md` — six fraud categories, detection, prevention, response
- `knowledge/trust/identity_verification_guide.md` — KYC flow and manual review
- `knowledge/hospitality/property_quality_standards.md` — three-gate quality system
- `knowledge/customer_success/host_lifecycle.md` — intervention triggers

**Core principle:** Trust is manufactured through verification, rapid incident response, and visible fairness.

---

## 2. Host Verification

### 2.1 Required Documents

Per `knowledge/trust/identity_verification_guide.md`:

| Host Type | Required Documents |
|-----------|-------------------|
| Egyptian individual | National ID (front and back) |
| Non-Egyptian individual | Passport + Egyptian residency permit |
| GCC national | GCC national ID or passport |
| Corporate host | Commercial register + authorized signatory ID |

### 2.2 KYC Flow

1. Host submits ID document.
2. AWS Textract extracts name, ID number, DOB, expiry.
3. Host submits live selfie.
4. AWS Rekognition compares selfie to ID photo.
5. Confidence ≥ 90%: verified.
6. Confidence 70–89%: manual review.
7. Confidence < 70%: rejected.

### 2.3 Manual KYC Review

- Review ID image quality.
- Compare extracted name to account name.
- Compare selfie to ID photo.
- Check for signs of tampering or fake documents.
- Verify document type is accepted.

**SLA:** Manual review within 4 hours.

**Outcomes:**
- **Approve:** Host KYC status = `verified`.
- **Reject:** Host notified with reason, can retry.
- **Escalate:** Forward to Trust & Safety if fraud suspected.

### 2.4 Payout Name Matching

Per BR-ID-02: Payout bank account details must match the verified legal name exactly. Finance validates this before any payout.

---

## 3. Listing Verification

### 3.1 Three-Gate Quality System

Per `knowledge/hospitality/property_quality_standards.md`:

- **Gate 1: Documentation** — photos, ID, ownership/authorization proof.
- **Gate 2: Physical Verification** — in-person or video inspection.
- **Gate 3: Guest-Ready Check** — 24–48h before first booking.

### 3.2 Gate 1: Documentation

**Host identity verified:**
- ID matches host.

**Property ownership/authorization verified:**
- Owned: deed or utility bill in host's name.
- Rented: lease + landlord authorization.
- Managed: property management agreement.
- Corporate: master management agreement.

**Why it matters:** Listing unauthorized sublets exposes guests to eviction and StayOS to legal liability.

### 3.3 Gate 2: Physical Verification

**Structural:**
- [ ] Functioning entrance lock.
- [ ] Windows and exterior doors close and lock.
- [ ] No structural damage, mold, water damage.
- [ ] Working electricity and plumbing.
- [ ] Working air conditioning.
- [ ] Elevator access if above 3rd floor.

**Safety:**
- [ ] Fire extinguisher in kitchen (1kg ABC minimum).
- [ ] Smoke detector functioning.
- [ ] Emergency exit accessible.
- [ ] Building fire escape if > 4 stories.
- [ ] Child safety if family-friendly.

**Photography:**
- [ ] Minimum 8 photos, recommended 15–20.
- [ ] All rooms photographed.
- [ ] Exterior and entrance photographed.
- [ ] Natural daylight or professional lighting.
- [ ] No digital alterations beyond color correction.
- [ ] Primary photo representative.

### 3.4 Gate 3: Guest-Ready Check

**Physical readiness:**
- [ ] Unit cleaned to standard.
- [ ] Amenities present and functional.
- [ ] Fresh linens and towels.
- [ ] Toiletries stocked.
- [ ] Kitchen items present and clean.
- [ ] Keys/codes tested.
- [ ] AC tested.
- [ ] TV/internet working.

**Information readiness:**
- [ ] Welcome guide in Arabic and English.
- [ ] Emergency contacts posted.
- [ ] Building access instructions documented.
- [ ] Parking instructions if applicable.
- [ ] Nearby services information.

### 3.5 Listing Verification Outcomes

| Outcome | Action |
|---------|--------|
| Pass | Approve and publish |
| Conditional pass | Host fixes within 72h, re-inspect |
| Fail | Reject, host can reapply after remediation |

---

## 4. Photo Review

### 4.1 Photo Review Standards

- Every room must appear.
- Exterior and entrance must appear.
- Natural or professional lighting.
- No filters that misrepresent the property.
- No stock or AI-generated images.
- Primary photo must be the most honest, not the most flattering.

### 4.2 Photo Fraud Detection

**Reverse-image search:**
- Check all photos against Airbnb, Booking.com, Google Images.
- If a photo appears on another listing under a different name, flag for review.

**Photo metadata:**
- Confirm photo was taken recently.
- Confirm location metadata matches property address where available.

**Inconsistency detection:**
- Compare photos to inspection notes.
- Flag if rooms in photos do not match the described layout.

### 4.3 Photo Review Outcomes

| Outcome | Action |
|---------|--------|
| Approve | Publish photos |
| Request better photos | Notify host, hold listing |
| Reject | Remove photos, flag listing |
| Fraud suspected | Escalate to Trust & Safety |

---

## 5. Fraud Detection Workflow

### 5.1 Fraud Categories

Per `knowledge/trust/fraud_detection.md`:

1. **Supply-Side Fraud:** fake or unauthorized listings.
2. **Demand-Side Fraud:** fraudulent bookings, damage, refund abuse.
3. **Identity Fraud:** fake IDs, impersonation.
4. **Payment Fraud:** stolen cards, chargebacks, payment laundering.
5. **Internal Fraud:** team members abusing access.
6. **Platform Manipulation:** fake reviews, search gaming.

### 5.2 Supply-Side Fraud Detection

**Pattern: Non-existent listing**
- Host cannot provide ownership documentation.
- Address verification fails.
- Photos reverse-search to other sites under different names.
- Host declines inspection.

**Pattern: Bait-and-switch**
- Host claims unavailability within 24h of check-in.
- Host offers alternative without system trigger.
- Guest reports property is different from booked.

**Pattern: Unauthorized listing**
- Host cannot produce deed, lease, or authorization.
- Property manager lists units outside their agreement.
- Real owner disputes claim.

### 5.3 Demand-Side Fraud Detection

**Pattern: Property damage + dispute**
- Guest disputes damage claim immediately.
- Guest has history of damage claims.
- Damage inconsistent with stay duration.

**Pattern: Refund abuse**
- Guest complains only after stay completes.
- Complaint is vague or impossible to verify.
- Guest has filed similar post-stay complaints before.
- No contact with support during stay.

### 5.4 Identity Fraud Detection

- Document does not match selfie.
- Document appears tampered or photocopied.
- Multiple accounts use the same ID.
- ID number does not match known format.
- Same face appears on multiple accounts.

### 5.5 Payment Fraud Detection

- Stolen card patterns (mismatched billing, rapid multiple cards).
- Chargebacks.
- Payment from high-risk regions.
- Guest refunds then disputes.
- Host and guest colluding to extract payout.

### 5.6 Internal Fraud Detection

- Staff approving listings they have a financial interest in.
- Staff issuing refunds beyond authority.
- Staff accessing data outside their role.
- Staff modifying payouts to their own accounts.

### 5.7 Fraud Response Workflow

```
1. Detection (automated signal or manual report)
   ↓
2. Classification (category, severity, exposure)
   ↓
3. Containment (suspend account, freeze payout, block listing)
   ↓
4. Investigation (collect evidence, interview parties)
   ↓
5. Decision (ban, warn, resolve, escalate)
   ↓
6. Communication (notify affected user, law enforcement if needed)
   ↓
7. Documentation (add to fraud registry)
   ↓
8. Prevention (update detection rules, retrain staff)
```

### 5.8 Fraud Registry

Every fraud case must include:
- Case ID
- Date detected
- Fraud category and pattern
- Affected accounts and listings
- Evidence (documents, photos, messages)
- Decision and reason
- Action taken
- Follow-up required

---

## 6. Suspensions

### 6.1 Suspension Triggers

- KYC or listing verification fraud.
- Guest or host physical safety incident.
- Repeated policy violations.
- Chargeback fraud.
- Bait-and-switch or non-existent listing.
- Illegal activity at a property.
- Severe property misrepresentation.
- Repeated 1–2 star reviews with evidence of systemic issues.

### 6.2 Suspension Types

| Type | Duration | Use Case |
|------|----------|----------|
| Temporary | 7–30 days | Investigation pending, first serious violation |
| Indefinite | Until appeal approved | Confirmed fraud, safety incident |
| Permanent | Never reinstated | Illegal activity, repeated fraud |

### 6.3 Suspension Process

1. Trust & Safety reviews evidence.
2. Decision made by T&S Lead or Founder.
3. Affected user notified with reason.
4. Listings set to `SUSPENDED` or `ARCHIVED`.
5. Ongoing bookings handled (refund, relocation, host compensation).
6. Payouts frozen until resolution.
7. Case documented in fraud/incident registry.

### 6.4 Listing Suspension

- A listing can be suspended without suspending the host.
- Reasons: failed re-inspection, guest safety issue, repeated misrepresentation.
- Host must remediate and request re-verification.

### 6.5 Host Suspension

- A host suspension applies to all listings.
- Reasons: fraud, illegal activity, repeated policy violations.
- Active bookings must be handled before suspension is final.

---

## 7. Appeals

### 7.1 Appeal Process

1. Suspended user submits appeal via platform or WhatsApp.
2. Trust & Safety reviews within 48 hours.
3. Request additional evidence if needed.
4. Decision: uphold, reduce, or reverse suspension.
5. User notified with reason.

### 7.2 Appeal Evidence

- New KYC documents.
- Ownership proof.
- Inspection report.
- Guest/host communication.
- Photo evidence.

### 7.3 Appeal Outcomes

| Outcome | Action |
|---------|--------|
| Upheld | Suspension continues, user informed |
| Reduced | Shorter suspension or listing-only suspension |
| Reversed | Account and/or listing reinstated, record updated |

---

## 8. Incident Handling

### 8.1 Incident Severity

Per `knowledge/operations/incident_management.md`:

| Level | Name | Example | Response Time |
|-------|------|---------|--------------|
| P0 | Critical | Platform down, guest safety incident | 5 min |
| P1 | Major | Payment failure, 3+ turnover failures | 15 min |
| P2 | Moderate | Notification delay, single equipment failure | 1 hour |
| P3 | Minor | Non-urgent bug, single complaint | 4 hours |

### 8.2 Incident Types

**Type A: Operational**
- Guest lockout
- Property equipment failure
- Turnover failure
- Host unreachable at check-in
- Property damage

**Type B: Platform**
- API errors
- Payment processing failure
- Database issues
- Notification failure

**Type C: Trust & Safety**
- Guest physical safety threat
- Fraud in active booking
- Host misconduct
- Illegal activity

**Type D: External**
- Regulatory contact
- Press inquiry
- Building emergency
- Political/civil unrest

### 8.3 Incident Response

1. **Detect** — from guest/host report, monitoring, or operations observation.
2. **Classify** — severity and type within 2 minutes.
3. **Notify** — appropriate team within SLA.
4. **Command** — incident commander assigned.
5. **Resolve** — with status updates every 15–30 minutes.
6. **Document** — post-incident report.
7. **Learn** — update procedures and detection rules.

### 8.4 Guest Safety Incidents

- Respond immediately.
- Relocate guest if necessary (up to EGP 800/night authorized by Operations Manager).
- Contact host and building manager.
- Document evidence.
- Suspend host or listing if warranted.
- Notify Founder.

### 8.5 Property Damage Incidents

- Collect "as-found" and damage photos.
- Determine if damage is new.
- If confirmed new: charge security deposit, transfer to host.
- If not confirmed: StayOS bears cost, protocol warning.
- Flag guest for enhanced screening.

---

## 9. Dispute Resolution

### 9.1 Dispute Types

- Property not as described.
- Cleanliness issue.
- Refund request.
- Damage claim.
- Cancellation dispute.
- Noise or neighbor complaint.

### 9.2 Dispute Process

1. Guest or host opens dispute.
2. Support triages within SLA.
3. Trust & Safety investigates.
4. Both parties submit evidence.
5. Decision within 72 hours.
6. Payout/refund processed.
7. Case documented.

### 9.3 Dispute Decision Rules

- If property was materially misrepresented: full refund, host warning.
- If minor issue and host resolved quickly: partial refund or credit.
- If guest caused damage: charge deposit.
- If neither party at fault: fair split or credit.

---

## 10. Trust & Safety Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| KYC approval rate | ≥ 85% | Trust & Safety |
| KYC review turnaround | < 4h | Trust & Safety |
| Listing verification pass rate | ≥ 80% first attempt | Trust & Safety |
| Listing verification turnaround | < 48h | Trust & Safety |
| Fraud detection rate | All confirmed frauds flagged | Trust & Safety |
| False positive rate | < 5% of KYC rejections | Trust & Safety |
| Dispute resolution time | < 72h | Trust & Safety |
| Chargeback rate | < 1% of transactions | Finance + T&S |
| Suspended account appeal turnaround | < 48h | Trust & Safety |

---

## 11. Team and Responsibilities

| Role | Responsibility |
|------|----------------|
| Trust & Safety Director | Own all T&S processes, final suspension decisions |
| KYC Reviewer | Identity verification manual review |
| Listing Verifier | Property and photo review |
| Fraud Investigator | Fraud case investigation |
| Dispute Resolution Specialist | Guest/host disputes |
| Incident Commander (P0/P1) | Founder or Operations Manager |

---

## 12. Escalation Paths

| Situation | First Responder | Escalate To | When |
|-----------|----------------|-------------|------|
| Fraud detected | Trust & Safety | Founder | Major fraud or > EGP 5,000 exposure |
| Guest safety threat | Operations Manager | Founder | Immediately |
| Host misconduct | Trust & Safety | Founder | Repeated or severe |
| Chargeback | Finance | Trust & Safety | All chargebacks |
| Regulatory contact | Founder | Legal counsel | Immediately |
| Press inquiry | Founder | Legal counsel | Immediately |
| Data breach | Engineering | Founder + Legal | Immediately |
