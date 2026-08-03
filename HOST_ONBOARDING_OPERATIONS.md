# HOST ONBOARDING OPERATIONS — StayOS

**Prepared by:** Executive Marketplace Operations Board  
**Date:** 2026-08-03  
**Purpose:** Define the end-to-end operational process from first host contact to first booking and host success.

---

## 1. Onboarding Philosophy

Host onboarding is the most critical operational process in Stage 1. A host who is not activated quickly will churn. A listing that is not verified will not convert. The onboarding process must be fast, human, and quality-controlled.

**Evidence from the repository:**
- `knowledge/customer_success/host_lifecycle.md` — six host lifecycle stages and intervention triggers
- `knowledge/hospitality/property_quality_standards.md` — three-gate quality system
- `knowledge/trust/identity_verification_guide.md` — KYC flow and manual review
- `MARKETPLACE_SUPPLY_STRATEGY.md` — host onboarding funnel and verification process

**Target:** ≤ 10 days from registration to listing live for Stage 1.

---

## 2. Host Onboarding Funnel

```
Lead
  ↓
Qualification
  ↓
Documents
  ↓
KYC
  ↓
Property Verification
  ↓
Photography
  ↓
Pricing Review
  ↓
Quality Review
  ↓
Publishing
  ↓
First Booking
  ↓
Host Success
```

---

## 3. Stage 1: Lead

### 3.1 Lead Sources

- Founder network
- Property manager referrals
- Broker submissions
- Inbound WhatsApp
- Host landing page form
- Facebook/Instagram ads
- Organic social content

### 3.2 Lead Capture

Every lead must capture:
- Full name
- Phone number
- Neighborhood / city
- Property type
- Number of units
- How they heard about StayOS
- Preferred contact time

### 3.3 Lead Routing

| Lead Type | Owner | Action |
|-----------|-------|--------|
| Institutional (5+ units) | Supply Director / Founder | Call within 4 hours |
| Property manager (3–10 units) | Supply Manager | Call within 24 hours |
| Individual host (1–2 units) | Onboarding Specialist | WhatsApp within 24 hours |
| Broker-referred | Broker Program Manager | Verify lead, then assign |

---

## 4. Stage 2: Qualification

### 4.1 Qualification Checklist

- [ ] Property is in the target geographic area.
- [ ] Property type matches accepted categories (apartment, villa, chalet, hotel room, serviced apartment).
- [ ] Host has authority to list (owner, authorized lessor, property manager).
- [ ] Property can be available within 30 days.
- [ ] Host is willing to complete KYC and verification.
- [ ] Host accepts commission terms (or zero-commission pilot).

### 4.2 Disqualify If

- Property is outside target area and cannot waitlist.
- Host cannot provide ownership or authorization documentation.
- Property fails basic safety standards (no functioning AC, no lock, structural damage).
- Host refuses verification or inspection.
- Property is a shared room in an uncontrolled environment.

### 4.3 Qualification Outcome

| Outcome | Next Step |
|---------|-----------|
| Qualified | Schedule onboarding call |
| Needs documentation | Send document checklist, follow up in 48h |
| Outside area | Waitlist for next geography |
| Disqualified | Record reason, close lead |

---

## 5. Stage 3: Documents

### 5.1 Host Identity Documents

Per `knowledge/trust/identity_verification_guide.md`:

- Egyptian national ID (front and back)
- Passport (for non-Egyptians)
- GCC national ID
- Corporate commercial register + authorized signatory ID (for companies)

### 5.2 Property Ownership / Authorization

Per `knowledge/hospitality/property_quality_standards.md`:

- Owned: ownership deed or recent utility bill in host's name
- Rented: lease agreement + landlord authorization to sublease
- Managed: property management agreement with defined authorization scope
- Corporate: master management agreement

### 5.3 Document Collection

- Host uploads via platform or sends via WhatsApp.
- Operations team confirms receipt within 24 hours.
- Missing documents are flagged with specific request.
- Documents stored securely in KYC S3 bucket.

### 5.4 Document Review SLA

- Initial review: 24 hours
- Missing document follow-up: 48 hours
- Rejected documents: host notified with reason and retry instructions

---

## 6. Stage 4: KYC

### 6.1 KYC Process

Per `knowledge/trust/identity_verification_guide.md`:

1. Document photo submitted.
2. AWS Textract extracts name, ID number, DOB, expiry.
3. Host submits live selfie.
4. AWS Rekognition compares selfie to ID photo.
5. Confidence ≥ 90%: verified.
6. Confidence 70–89%: manual review within 4 hours.
7. Confidence < 70%: rejected, host retries.

### 6.2 Manual KYC Review

- Reviewer compares ID and selfie.
- Confirms name matches payout account name (BR-ID-02).
- Flags suspicious documents for Trust & Safety.
- Decision: approve, reject, request additional proof.

### 6.3 KYC SLA

- Automated: immediate
- Manual review: < 4 hours
- Rejected retry: host notified within 1 hour

---

## 7. Stage 5: Property Verification

### 7.1 Gate 2: Physical Verification

Per `knowledge/hospitality/property_quality_standards.md`:

- In-person inspection preferred.
- Video walkthrough accepted for properties > 50km from Cairo team base.

### 7.2 Verification Checklist

**Structural:**
- [ ] Functioning entrance lock
- [ ] All windows and exterior doors close and lock
- [ ] No structural damage, mold, water damage
- [ ] Working electricity and plumbing
- [ ] Working air conditioning
- [ ] Elevator access if above 3rd floor

**Safety:**
- [ ] Fire extinguisher in kitchen (minimum 1kg ABC)
- [ ] Smoke detector installed and functioning
- [ ] Emergency exit accessible
- [ ] Building fire escape if > 4 stories
- [ ] Child safety checks if family-friendly

**Cleanliness:**
- [ ] No pest infestation
- [ ] No embedded odors
- [ ] Baseline cleanliness acceptable

### 7.3 Verification Outcome

| Outcome | Next Step |
|---------|-----------|
| Pass | Schedule photography |
| Conditional pass (minor issues) | Host fixes within 72h, re-inspection |
| Fail | Listing rejected, host can reapply after remediation |

---

## 8. Stage 6: Photography

### 8.1 Photography Standards

Per `knowledge/hospitality/property_quality_standards.md`:

- Minimum 8 photos, recommended 15–20.
- Every room photographed (bedroom, bathroom, kitchen/living, entrance).
- Exterior and building entrance photographed.
- Natural daylight or professional lighting.
- No digital alterations beyond color correction.
- Primary photo must be the most representative view.

### 8.2 Photography Options

| Option | When | Cost |
|--------|------|------|
| StayOS photographer | First 50 listings, premium properties | Free for pilot, then EGP 500–1,000 |
| Host-provided photos | After quality review approval | Free |
| Video walkthrough | Remote properties | Free |

### 8.3 Photo Review

- Operations or Host Success reviews all photos.
- Photos must match the property seen at inspection.
- Stock photos or photos from other sites are rejected.
- Reverse-image search on all photos.

---

## 9. Stage 7: Pricing Review

### 9.1 Pricing Guidance

Per `knowledge/customer_success/host_lifecycle.md`:

- Research 5 comparable listings in the same area.
- Price 5–10% below market for first 3 months.
- Goal: first booking and first review quickly.
- After 5 reviews, raise to market rate.

### 9.2 Pricing Review Checklist

- [ ] Base price set in EGP.
- [ ] Weekend multiplier if applicable.
- [ ] Minimum stay configured.
- [ ] Price is within 5–10% below comparable market rate.
- [ ] Eid/peak surcharges documented.

### 9.3 Pricing Intervention

If host sets price > 30% above market:
- Host Success calls host.
- Explains occupancy risk.
- Offers data on comparable properties.
- Documents recommendation.

---

## 10. Stage 8: Quality Review

### 10.1 Quality Score

Per `MARKETPLACE_SUPPLY_STRATEGY.md`:

- Photos (30%)
- Description completeness (20%)
- Price competitiveness (15%)
- Calendar availability (15%)
- Host verification (10%)
- Amenities (10%)

### 10.2 Minimum Listing Quality Standard

A listing is launch-ready when it has:
- 5+ photos (8+ preferred)
- Arabic title and description
- Verified location
- Accurate max guests, bedrooms, bathrooms
- Base price in EGP
- Default availability set
- Host KYC approved
- Cancellation policy documented

### 10.3 Quality Review Outcome

| Score | Action |
|-------|--------|
| ≥ 70 | Approve and publish |
| 50–69 | Request improvements, re-review in 24h |
| < 50 | Reject, provide specific feedback |

---

## 11. Stage 9: Publishing

### 11.1 Listing States

Per `MARKETPLACE_SUPPLY_STRATEGY.md`:

```
DRAFT → PENDING_VERIFICATION → LISTED → UNLISTED → SUSPENDED → ARCHIVED
```

### 11.2 Publishing Checklist

- [ ] KYC approved.
- [ ] Property verification passed.
- [ ] Photos approved.
- [ ] Pricing reviewed.
- [ ] Quality score ≥ 70.
- [ ] Calendar default availability set.
- [ ] Host WhatsApp communication enabled.
- [ ] Days-to-first-booking timer started.

### 11.3 Host Notification

- WhatsApp: "Your listing is now live on StayOS! Here are 3 ways to get your first booking."
- Email with host dashboard link.
- Host success follow-up call scheduled for day 7.

---

## 12. Stage 10: First Booking

### 12.1 Activation Monitoring

Per `knowledge/customer_success/host_lifecycle.md`:

| Day | Action |
|-----|--------|
| 1–7 | Congratulate, share 3 optimization tips |
| 8–14 | Host Success call if no booking |
| 15–21 | Emergency intervention: pricing, photos, discount voucher |
| 22+ | High churn risk: personal call from Host Success Manager |

### 12.2 First Booking Protocol

- Confirm booking with host via WhatsApp.
- Verify property is guest-ready 24–48h before check-in.
- Send guest check-in instructions.
- Monitor check-in for issues.
- After checkout: request review.
- Congratulate host and share review.

---

## 13. Stage 11: Host Success

### 13.1 Success Milestones

| Milestone | Trigger | Action |
|-----------|---------|--------|
| First stay completed | Guest review received | Congratulate, share occupancy data |
| 3 completed stays | NPS survey | Referral ask if NPS ≥ 8 |
| 50% occupancy in 30 days | Performance report | Pricing optimization, Preferred Host badge |
| 3 months active | Maturity | Monthly reports, feature access |

### 13.2 Churn Prevention

- Calendar fully blocked for 14+ days → call.
- No booking in 21 days → emergency intervention.
- 1–2 star review → call before host responds.
- Host NPS ≤ 6 → call within 24 hours.

---

## 14. Onboarding SLA

| Stage | Target SLA |
|-------|------------|
| Lead to qualification | 24 hours |
| Qualification to documents | 48 hours |
| Documents to KYC review | 24 hours |
| KYC to property verification | 48 hours |
| Verification to photography | 72 hours |
| Photography to quality review | 24 hours |
| Quality review to publish | 4 hours |
| **Total: lead to live** | **≤ 10 days** |

---

## 15. Team and Workload

| Role | Onboarding Capacity |
|------|---------------------|
| Onboarding Specialist | 8–10 hosts/week |
| Host Success Manager | 50 active hosts/month |
| Field Photographer/Inspector | 15–20 properties/week |
| KYC Reviewer | 20–30 reviews/day |

---

## 16. Checklists

### Host Onboarding Checklist

- [ ] Lead qualified and assigned.
- [ ] Host identity documents collected.
- [ ] Property ownership/authorization documents collected.
- [ ] KYC approved.
- [ ] Property verification passed.
- [ ] Photos collected and approved.
- [ ] Pricing reviewed and accepted.
- [ ] Quality score ≥ 70.
- [ ] Listing published.
- [ ] Host notified and day-7 follow-up scheduled.

### First Booking Readiness Checklist

- [ ] Guest-ready check completed 24–48h before arrival.
- [ ] All amenities present and functional.
- [ ] Keys/codes tested.
- [ ] AC set and tested.
- [ ] Welcome guide in place.
- [ ] Emergency contacts posted.
- [ ] Host reachable on check-in day.
- [ ] Cleaning team assigned if turnover needed.
