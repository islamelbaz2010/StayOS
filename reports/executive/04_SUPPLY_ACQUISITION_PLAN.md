# 04 — SUPPLY ACQUISITION PLAN

**Board:** Executive Project Director, COO, Marketplace Operations Director  
**Date:** 2026-08-03  
**Purpose:** Define how StayOS acquires its first 50–100 listings

---

## 1. Supply Acquisition Thesis

The biggest risk to StayOS is not technology — it is supply. A marketplace with zero listings is dead. The engineering plan builds the pipe. This plan fills it.

**Target:** 50 live listings by Week 4 of Closed Alpha.  
**Zone:** Greater Cairo (New Cairo + 6th October priority).  
**Method:** Founder-led, agency-first, manual onboarding.

---

## 2. Supply Funnel

```
Prospect identified (100 contacts)
    ↓ 20% conversion
Host signed up (20 hosts)
    ↓ 75% conversion
KYC submitted (15 hosts)
    ↓ 90% conversion
KYC approved (13 hosts)
    ↓ 85% conversion
Listing created (11 hosts, ~50 listings)
    ↓ 90% conversion
Listing approved (10 hosts, ~45 listings)
    ↓ 90% conversion
Listing live with photos (10 hosts, ~40 listings)
    + 10 listings from CSV import (agency portfolios)
    = 50 live listings
```

**Funnel assumption:** 100 contacts → 50 live listings. This requires the founder to contact 100 potential hosts over 4 weeks. That is 25 contacts per week, or 5 per day. Achievable for a founder in single-market focus.

---

## 3. Supply Sources

### Source 1: Founder's Personal Network (Week 1)

| Attribute | Value |
|-----------|-------|
| Who | Friends, family, professional contacts who own property in Cairo |
| Expected contacts | 20 |
| Expected conversion | 30% (high trust) |
| Expected listings | 6–8 |
| Effort | Low — phone calls and WhatsApp |
| Why first | Highest trust, fastest conversion, tolerates platform bugs |

### Source 2: Property Management Agencies (Week 2–3)

| Attribute | Value |
|-----------|-------|
| Who | Small-to-mid property management companies in New Cairo and 6th October |
| Expected contacts | 10 agencies |
| Expected conversion | 30% (3 agencies sign up) |
| Expected listings | 15–25 (each agency has 5–10 units) |
| Effort | Medium — requires meetings, presentations, relationship building |
| Why second | Single relationship unlocks multiple listings. Agencies want new demand channels. |

**Target agencies:**
- Companies managing 5–20 short-term rental units in New Cairo
- Companies managing 5–20 units in 6th October
- Companies already listing on Airbnb/Booking.com but looking for new channels

**Pitch to agencies:**
> "StayOS is a new Egyptian platform for short-term rentals. We're launching in Cairo with 50 listings. We charge 10% commission — lower than Airbnb's 15%. We handle payment in EGP, which Airbnb doesn't. We're looking for 3 agency partners for our Closed Alpha. Your listings get priority placement. No upfront cost."

### Source 3: Individual Owners (Week 2–4)

| Attribute | Value |
|-----------|-------|
| Who | Individual property owners in New Cairo and 6th October |
| Expected contacts | 50 |
| Expected conversion | 15% |
| Expected listings | 7–8 |
| Effort | High — cold outreach, WhatsApp groups, Facebook groups |
| Why third | Slower conversion, more hand-holding, but builds organic supply base |

**Channels for individual owner outreach:**
- Facebook groups: "Cairo Real Estate", "Short Term Rental Egypt", "New Cairo Properties"
- WhatsApp groups: Real estate agent groups
- Word of mouth: Ask onboarded hosts to refer other owners
- Physical: Visit compounds and talk to building managers

### Source 4: CSV Import from Agency Data (Week 3)

| Attribute | Value |
|-----------|-------|
| Who | Agencies that provide property data in spreadsheet format |
| Expected listings | 10–15 |
| Effort | Low — once data is collected, CSV import is automated |
| Why fourth | Depends on agency relationships being established first |

**Process:**
1. Agency provides Excel/CSV with property details
2. Founder formats data into StayOS CSV schema
3. Founder uploads via admin CSV import endpoint
4. Founder requests photos from agency via WhatsApp
5. Founder uploads photos manually for each listing
6. Founder sets listing to PENDING_VERIFICATION
7. Founder approves listings

---

## 4. Onboarding Workflow

### For Individual Owners

```
Step 1: Initial contact (WhatsApp or phone)
    → Founder explains StayOS, commission rate, alpha status
    → Owner expresses interest

Step 2: Account creation (5 minutes)
    → Founder guides owner to sign up via phone OTP
    → Owner selects HOST role

Step 3: KYC upload (10 minutes)
    → Founder guides owner to KYC page
    → Owner uploads national ID front, back, and selfie
    → Founder reviews and approves within 24 hours

Step 4: Listing creation (20–30 minutes)
    → Founder guides owner through listing form
    → Owner enters title, description, location, price, amenities
    → Owner uploads 5+ photos
    → Owner sets availability (block already-booked dates)

Step 5: Submit and verify (5 minutes)
    → Owner submits listing for review
    → Founder reviews and approves within 24 hours
    → Listing goes live

Step 6: Post-onboarding
    → Founder adds owner to WhatsApp host group
    → Founder sends welcome message with tips
    → Founder checks in after 3 days to collect feedback
```

**Total time per host: 45–60 minutes of active work, spread over 1–3 days.**

### For Agencies

```
Step 1: Meeting (30–60 minutes)
    → Founder presents StayOS value proposition
    → Agency agrees to pilot with 5–10 units
    → Agency provides property data (Excel/CSV)

Step 2: Data import (2–4 hours)
    → Founder formats data into CSV schema
    → Founder imports via admin endpoint
    → Listings created in DRAFT status

Step 3: Photo collection (1–2 days)
    → Founder requests photos from agency via WhatsApp
    → Agency sends photos per unit
    → Founder uploads photos manually for each listing

Step 4: Agency host account (15 minutes)
    → Founder creates HOST account for agency manager
    → Founder completes KYC for agency manager
    → Founder transfers ownership of imported listings to agency account
    (Manual process: update host_id in database or via admin endpoint)

Step 5: Verification (30 minutes)
    → Founder reviews all imported listings
    → Founder approves listings in bulk
    → Listings go live

Step 6: Post-onboarding
    → Founder adds agency manager to WhatsApp host group
    → Founder shares weekly performance report
    → Founder checks in after 1 week
```

**Total time per agency: 3–5 days elapsed, 4–6 hours of active work.**

---

## 5. Supply Quality Standards

### Minimum Listing Requirements (Alpha)

| Requirement | Standard | Enforced By |
|-------------|----------|-------------|
| Photos | Minimum 3 photos, 1 exterior, 2 interior | Founder review |
| Title | Minimum 10 characters, descriptive | Form validation |
| Description | Minimum 50 characters | Form validation |
| Price | base_price_egp > 0, reasonable for market | Founder review |
| Location | Governorate + city + district required | Form validation |
| Accuracy | Photos match description and address | Founder review |
| Host KYC | Verified before listing goes live | System (state machine) |

### Red Flags (Reject Listing)

| Flag | Action |
|------|--------|
| Photos appear stock/watermarked | Reject, request real photos |
| Price significantly below market (< 300 EGP/night) | Reject, investigate |
| Address is vague or incomplete | Reject, request specific address |
| Description is copy-pasted from another listing | Reject, request original |
| Host KYC documents are unclear or suspicious | Reject KYC, request resubmission |

---

## 6. Host Retention Strategy

### During Alpha

| Tactic | When | Method |
|--------|------|--------|
| Personal welcome | Day 1 | WhatsApp message from founder |
| Check-in call | Day 3 | Phone call — how is it going? Any issues? |
| First booking celebration | First booking | WhatsApp message + personal thank you |
| Weekly performance update | Every Sunday | WhatsApp message with views, bookings, revenue |
| Fast payout | Within 48 hours of checkout | Manual bank transfer |
| Feedback collection | After first booking | WhatsApp survey (3 questions) |
| Host community | Ongoing | WhatsApp host group for peer support |

### Post-Alpha (V1.1)

| Tactic | When |
|--------|------|
| Automated notifications | On every booking and status change |
| Host dashboard | Self-service listing management |
| Performance analytics | Views, bookings, revenue, occupancy |
| Reviews and ratings | Guest feedback visible on listing |
| Pricing suggestions | Based on market data |

---

## 7. Supply Acquisition Schedule

| Week | Activity | Target Contacts | Target Listings |
|------|----------|----------------|----------------|
| Week 0 | Prepare contact list (100 names) | 0 | 0 |
| Week 1 | Contact personal network (20). Onboard 5. Create 5 listings manually. | 20 | 5 |
| Week 2 | Contact agencies (10). Contact individual owners (20). Onboard 5 more. | 30 | 15 cumulative |
| Week 3 | Agency meetings. CSV import from first agency. Contact 20 more owners. Onboard 5 more. | 30 | 30 cumulative |
| Week 4 | Final push. CSV import from second agency. Onboard remaining. | 20 | 50 cumulative |

---

## 8. Supply Acquisition Budget

| Item | Cost | Notes |
|------|------|-------|
| Founder time | $0 (sweat equity) | 50% of time during Weeks 1–4 |
| WhatsApp Business | $0 (using personal WhatsApp during alpha) | |
| Travel (visits to agencies, properties) | ~$200 | Uber/taxi in Cairo |
| Host incentive (optional) | ~$500 | $10 credit per host who completes onboarding |
| Agency pilot incentive (optional) | ~$300 | Reduced commission (5% instead of 10%) for first 3 months |
| Photography (for listings without photos) | ~$300 | Hire a photographer for 10 listings |
| **Total** | **~$1,300** | Well within $150K budget |

---

## 9. Risk: Supply Acquisition Fails

### Scenario: Fewer than 20 hosts contacted by Week 2

**Root cause:** Founder is spending too much time on operations or engineering coordination.

**Mitigation:**
- Founder must block 3 hours per day for host outreach (morning: calls, afternoon: WhatsApp follow-ups)
- Engineering handles all bug fixes without founder involvement
- Founder delegates platform monitoring to a simple uptime check

### Scenario: Hosts sign up but don't complete listings

**Root cause:** The listing form is too complex or hosts can't upload photos.

**Mitigation:**
- Founder creates listings on behalf of hosts (collects data via WhatsApp)
- Founder uploads photos manually
- Simplify the form further if needed

### Scenario: Agencies refuse to share data

**Root cause:** Agencies don't trust a new platform or don't want to share owner data.

**Mitigation:**
- Offer to list under StayOS account initially (agency doesn't need to create an account)
- Show them the platform with 10 live listings as proof of concept
- Offer 0% commission for first month as pilot incentive

### Scenario: Individual owners churn after onboarding

**Root cause:** No bookings in first 2 weeks, hosts lose interest.

**Mitigation:**
- Founder drives 10 bookings from warm contacts in first 2 weeks
- Founder personally matches guests to listings
- Founder guarantees first booking for first 10 hosts (personally finds a guest)
