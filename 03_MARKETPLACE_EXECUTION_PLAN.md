# 03 — MARKETPLACE EXECUTION PLAN

**Board:** Executive Project Director, Product Director, COO, Marketplace Operations Director  
**Date:** 2026-08-03  
**Purpose:** Define how StayOS launches a working marketplace, not just working software

---

## 1. Marketplace Thesis

StayOS is a short-term rental marketplace for the Egyptian market. The MVP proves one thing: **a guest can find a listing, book it, pay in EGP, and a verified host receives a payout.** Everything else is secondary.

The marketplace succeeds when:
- Supply exists (50+ live listings)
- Demand exists (10+ completed bookings)
- Trust exists (verified hosts, real photos, manual quality gate)
- Money flows (EGP payment collected, payout to host)
- The cycle repeats (guests return, hosts add more listings)

The marketplace fails when:
- Supply is 0 (no hosts onboarded)
- Demand is 0 (no guests find or book listings)
- Trust is broken (fake listings, fraud)
- Money doesn't flow (payment broken, no payouts)
- The cycle stops (guests don't return, hosts churn)

---

## 2. Two-Sided Market Strategy

### Supply Side (Hosts)

**Cold-start approach:** Founder-led, agency-first.

| Phase | Approach | Target | Timeline |
|-------|----------|--------|----------|
| Cold start | Founder personally recruits 5–10 hosts from personal network | 10 listings | Week 1–2 |
| Early growth | Founder approaches property management agencies in Cairo | 20 listings | Week 2–3 |
| Scale | CSV import of agency portfolios + host self-service | 50 listings | Week 3–4 |

**Why agency-first:** A single agency with 10–20 units provides more supply in less time than 20 individual hosts. Agencies are also more tolerant of early-stage platform limitations because they are motivated by new demand channels.

### Demand Side (Guests)

**Cold-start approach:** Founder's personal network, warm contacts.

| Phase | Approach | Target | Timeline |
|-------|----------|--------|----------|
| Cold start | Founder personally invites 10 warm contacts to book | 3 bookings | Week 2–3 |
| Early growth | Founder posts on social media, WhatsApp groups | 5 bookings | Week 3–4 |
| Scale | Word of mouth from first 10 guests | 10 bookings | Week 4 |

**Why warm contacts first:** The first 10 bookings are about proving the transaction loop, not about marketing efficiency. Warm contacts will tolerate bugs, manual confirmations, and limited selection. Cold traffic will not.

---

## 3. Liquidity Target

| Metric | Target | Measurement |
|--------|--------|-------------|
| Live listings | 50 by Week 4 | Count of listings with status=LISTED |
| Verified hosts | 15 by Week 4 | Count of users with kyc_status=VERIFIED |
| Search-to-listing-view conversion | > 30% | Analytics (listing_views / user_searches) |
| Listing-view-to-booking-initiated | > 10% | Analytics (booking_funnel_events) |
| Booking-initiated-to-completed | > 50% | Reservations (confirmed / initiated) |
| Total completed bookings | 10 by Week 4 | Reservations with status=CONFIRMED + checked_out |
| Time from signup to live listing | < 3 days | Manual tracking by founder |
| Host response time to booking | < 4 hours | Manual tracking |

---

## 4. Marketplace Operations Model

### Who Does What During Closed Alpha

| Function | Owner | Method |
|----------|-------|--------|
| Host recruitment | Founder | Phone calls, WhatsApp, in-person visits |
| Host onboarding | Founder | Personal assistance: help with signup, KYC, listing creation |
| KYC review | Founder | Admin page: view documents, approve/reject |
| Listing verification | Founder | Admin page: view listing, approve/reject |
| Listing creation (for hosts who can't use web) | Founder | Collect data via WhatsApp, create via CSV import or direct API |
| Photo collection (for CSV-imported listings) | Founder | Request photos via WhatsApp, upload manually |
| Guest acquisition | Founder | Personal network, social media |
| Guest support | Founder | WhatsApp, phone |
| Host support | Founder | WhatsApp, phone |
| Payment confirmation | Founder | Admin endpoint (manual) or Paymob callback |
| Payout processing | Founder | Manual bank transfer to host |
| Fraud monitoring | Founder | Manual review of all listings and KYC |
| Platform monitoring | Founder | Daily check of platform availability |
| Bug reporting | Founder → Engineering | WhatsApp group with engineering |
| Operations playbook | Founder | Updated daily with lessons learned |

### Why This Works for Alpha

- 50 listings is manageable manually
- 10 bookings is manageable manually
- The founder is the highest-trust operator
- No handoffs = no communication overhead
- Fastest feedback loop: founder sees everything, fixes everything

### Why This Fails at Scale

- Founder becomes bottleneck at 100+ listings
- No delegation path without tooling
- No audit trail without ticketing
- No SLA tracking without a system
- This is why S3-012, S3-013, S3-014, S3-015 are deferred to P1/V1.1

---

## 5. Trust and Safety Model

### During Closed Alpha

| Trust Layer | Method | Owner |
|-------------|--------|-------|
| Host identity verification | Manual KYC review (ID + selfie) | Founder |
| Listing quality verification | Manual listing review (photos, description, price) | Founder |
| Property authenticity | Founder visits or sends someone to visit first 10 properties | Founder |
| Payment security | Escrow model (funds held until check-in) | System (exists) |
| Fraud prevention | Manual review of every listing and host | Founder |
| Guest verification | Phone OTP (same as host) | System (exists) |
| Dispute resolution | Founder mediates directly | Founder |

### Post-Alpha (V1.1)

| Trust Layer | Method |
|-------------|--------|
| Host identity verification | AWS Textract + Rekognition automation |
| Listing quality verification | Quality score algorithm |
| Fraud prevention | Duplicate detection, photo reverse-image search |
| Dispute resolution | Support ticket system with SLA |

---

## 6. Revenue Model

| Stream | Rate | Collected By | Payout To |
|--------|------|-------------|-----------|
| Platform commission | 10% of booking value | StayOS (deducted at payment) | StayOS account |
| Host payout | 90% of booking value | StayOS escrow | Host bank account (manual transfer) |
| Cleaning fee | Set by host | Included in booking | Host |
| Service fee | 0% during alpha | — | — |

**During alpha, all payouts are manual bank transfers initiated by the founder.** No automated payout system is needed for 10 bookings. The escrow model and ledger exist in the codebase but the actual money movement is manual.

---

## 7. Geographic Focus

### Zone 1: Greater Cairo

| Area | Priority | Why |
|------|----------|-----|
| New Cairo (5th Settlement, Rehab) | 1 | High concentration of short-term rental supply. Popular with visiting professionals and families. |
| 6th October | 2 | Second largest supply concentration. Popular with GCC visitors. |
| Zamalek, Maadi | 3 | Tourist-friendly areas. Good for first guest bookings. |
| Nasr City | 4 | Mid-tier supply. Good for volume. |

**Strategy:** Focus all host recruitment on New Cairo and 6th October for the first 50 listings. Do not spread across multiple cities. Depth in one zone creates search density, which creates booking conversion.

---

## 8. Success Metrics Dashboard

The founder needs a simple daily view. During alpha, this can be a manual SQL query or a simple admin page.

### Daily Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| New hosts signed up | 1–2/day | Count of users with role=HOST created today |
| New listings created | 1–2/day | Count of units created today |
| Pending KYC reviews | < 5 | Count of kyc_documents with status=PENDING |
| Pending listing reviews | < 5 | Count of unit_listings with status=PENDING_VERIFICATION |
| Live listings | Growing to 50 | Count of unit_listings with status=LISTED |
| Searches today | Growing | Count of user_searches today |
| Bookings initiated today | Growing | Count of reservations created today |
| Bookings completed today | Growing | Count of reservations confirmed today |
| Platform uptime | 99% | Manual check |

### Weekly Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Total live listings | 50 by Week 4 | Count |
| Total verified hosts | 15 by Week 4 | Count |
| Total completed bookings | 10 by Week 4 | Count |
| Search-to-booking conversion | > 5% | Completed bookings / total searches |
| Average listing price | Track | Average base_price_egp of live listings |
| Host NPS | > 50 | Manual survey via WhatsApp |
| Guest NPS | > 50 | Manual survey via WhatsApp |
| Time to first booking (per host) | < 7 days | Manual tracking |

---

## 9. Go-to-Market Sequence

```
Week 0 (Engineering Sprint):
  Engineering builds platform (15 days)
  Founder prepares supply list (20 hosts to contact)
  Founder prepares demand list (10 warm contacts to book)

Week 1 (Soft Launch):
  Platform deployed
  Founder creates 5 listings manually
  Founder tests full booking flow
  Founder contacts 20 potential hosts
  Founder onboards first 5 hosts

Week 2 (Supply Ramp):
  15 listings live
  Founder contacts 30 more potential hosts
  Founder approaches 2–3 property agencies
  Founder begins promoting to warm contacts

Week 3 (First Bookings):
  30 listings live
  First 3 guest bookings completed
  First payout to host
  Founder collects feedback

Week 4 (Alpha Validation):
  50 listings live
  10 total bookings completed
  MVP v1 Gate achieved
  Go/no-go decision for V1.1
```

---

## 10. Exit Criteria for Closed Alpha

The Closed Alpha is complete when ALL of the following are true:

- [ ] 50 live listings on the platform
- [ ] 15 verified hosts
- [ ] 10 completed bookings (guest stayed and checked out)
- [ ] Payment collected in EGP for all 10 bookings
- [ ] Payout transferred to at least 5 verified hosts
- [ ] 0 P0 safety or fraud incidents
- [ ] Host NPS >= 50 (manual survey)
- [ ] Guest NPS >= 50 (manual survey)
- [ ] Operations playbook documented
- [ ] Founder has identified and begun hiring an operations person

When all criteria are met, the company transitions to V1.1 planning.
