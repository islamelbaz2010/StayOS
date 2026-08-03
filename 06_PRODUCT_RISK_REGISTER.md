# 06 — PRODUCT RISK REGISTER

**Committee:** Executive Steering Committee — StayOS  
**Date:** 2026-08-03  
**Mandate:** Identify and rank all product, operational, marketplace, founder, legal, trust, technology, and financial risks.

---

## 1. Risk Ranking Methodology

Each risk is scored on two dimensions:
- **Probability** (1-5): How likely is this to occur?
- **Impact** (1-5): How severe is the consequence if it occurs?

**Risk Score = Probability × Impact** (max 25)

| Score | Severity | Action |
|-------|----------|--------|
| 20-25 | CRITICAL | Must mitigate before launch |
| 15-19 | HIGH | Must have mitigation plan before launch |
| 10-14 | MEDIUM | Monitor and mitigate during alpha |
| 5-9 | LOW | Accept and monitor |
| 1-4 | MINIMAL | Accept |

---

## 2. Product Risks

| # | Risk | Probability | Impact | Score | Severity | Mitigation |
|---|------|-------------|--------|-------|----------|------------|
| P-01 | **No guest-visible differentiator from Airbnb.** Platform launches with grid search, placeholder Arabic, no map, no reviews, no visible trust signals. Guests perceive no difference from incumbents. | 4 | 5 | **20** | CRITICAL | Add verified badge, cultural tag filters, real Arabic copy, escrow message (4.5 SP). Committee-mandated. |
| P-02 | **Payment checkout fails or is too complex.** Paymob iframe doesn't work or manual confirmation is too slow. Guests abandon at checkout. | 3 | 5 | **15** | HIGH | Manual confirmation fallback. Founder confirms within 1 hour. Test Paymob in staging before launch. |
| P-03 | **Listing form is too complex for non-technical hosts.** Hosts abandon listing creation mid-way. Supply growth stalls. | 4 | 4 | **16** | HIGH | Founder assists 60%+ of hosts with listing creation. Simplified form (no map picker, no drag-reorder). |
| P-04 | **Photo upload fails or is too slow.** S3 presigned URLs don't work from browser. CORS misconfigured. | 2 | 5 | **10** | MEDIUM | Test photo upload in staging before any other work. This is Phase 1 of Sprint 3. |
| P-05 | **Search returns empty or irrelevant results.** With 30-40 listings, most searches return < 3 results for specific dates. Guests abandon. | 4 | 3 | **12** | MEDIUM | Concentrate all listings in New Cairo. Founder personally matches guests to listings. |
| P-06 | **No reviews means no social proof.** Guests don't trust listings without reviews. Conversion is near zero for cold traffic. | 4 | 4 | **16** | HIGH | Warm-contact alpha only. Founder personally vouches for listings. Collect manual reviews at 10 bookings. |
| P-07 | **Arabic copy is machine-translated or low quality.** Guests perceive the platform as unprofessional or not truly Arabic-first. | 3 | 4 | **12** | MEDIUM | Hire a native Arabic copywriter for 2-3 days to write all guest-facing copy. Cost: ~EGP 3,000-5,000. |
| P-08 | **Cultural tags are not used by hosts.** Hosts don't tag their listings as family-only or halal-certified. Filters return empty results. | 3 | 3 | **9** | LOW | Founder sets cultural tags for all listings during onboarding. Don't rely on host self-tagging. |

---

## 3. Operational Risks

| # | Risk | Probability | Impact | Score | Severity | Mitigation |
|---|------|-------------|--------|-------|----------|------------|
| O-01 | **Founder becomes operational bottleneck.** At 30+ listings and 5+ bookings, founder cannot handle KYC, listings, payments, support, and recruitment simultaneously. | 4 | 4 | **16** | HIGH | Hire operations person by Week 2. Delegate KYC, listing review, photo uploads, support. |
| O-02 | **Operations hire is delayed or unqualified.** Hiring takes longer than expected or hire cannot learn the admin tools. | 3 | 4 | **12** | MEDIUM | Start hiring in Week 1. Create a simple operations manual. Train on Day 1. |
| O-03 | **Manual payment confirmation is too slow.** Founder doesn't check bank statement frequently enough. Guests wait hours for confirmation. | 3 | 3 | **9** | LOW | Set up Paymob dashboard alerts. Check every 2 hours during business hours. |
| O-04 | **Manual payout processing is error-prone.** Founder transfers wrong amount or to wrong account. | 2 | 4 | **8** | LOW | Double-check every transfer. Use spreadsheet to track payouts. Confirm bank details with host via WhatsApp. |
| O-05 | **Listing quality is inconsistent.** Some listings have great photos, others have poor phone photos. Marketplace looks unprofessional. | 4 | 3 | **12** | MEDIUM | Founder reviews every listing. Reject listings with < 3 photos. Offer free photography for first 20 listings. |
| O-06 | **CSV import creates bad data.** Incorrect coordinates, missing fields, wrong property types. Listings are broken. | 3 | 3 | **9** | LOW | Founder validates CSV before import. Review every imported listing before approval. |
| O-07 | **No FAQ or help content.** Hosts and guests ask repetitive questions. Founder spends hours answering the same questions. | 4 | 2 | **8** | LOW | Create Arabic FAQ page. Send welcome message with FAQ link to every new host and guest. |

---

## 4. Marketplace Risks

| # | Risk | Probability | Impact | Score | Severity | Mitigation |
|---|------|-------------|--------|-------|----------|------------|
| M-01 | **Supply falls below 30 listings by Week 4.** Host recruitment is slower than expected. Agencies don't sign. Marketplace has insufficient inventory. | 3 | 5 | **15** | HIGH | Extend alpha to 6 weeks. Founder spends 80% of time on supply. Lower MVP gate to 7 bookings. |
| M-02 | **Demand falls below 5 bookings by Week 4.** Warm contacts don't follow through. Marketplace has supply but no transactions. | 3 | 5 | **15** | HIGH | Founder personally guarantees first 5 bookings. Personally matches guests to listings. Offers 25% discount. |
| M-03 | **Liquidity is too low for conversion.** With 30 listings in one area, most date searches return < 3 available listings. Guests abandon. | 4 | 4 | **16** | HIGH | Concentrate ALL listings in New Cairo. Founder manually searches for guests and sends direct links. |
| M-04 | **Host churn after 0 bookings in first 2 weeks.** Hosts who don't receive bookings lose interest and stop responding. | 4 | 3 | **12** | MEDIUM | Founder drives first 10 bookings in first 2 weeks. Personally matches guests to hosts. Calls every host after 1 week. |
| M-05 | **Guest churn after 1 booking.** No reviews, no loyalty program, no personalized recommendations. Guests don't return. | 4 | 3 | **12** | MEDIUM | Founder calls every guest after checkout. Offers 15% discount on next booking. Activates referral program at 10 bookings. |
| M-06 | **Chicken-and-egg problem persists.** No supply → no guests. No guests → no supply. Marketplace never reaches liquidity. | 2 | 5 | **10** | MEDIUM | Founder breaks the deadlock by creating listings manually AND driving warm-contact demand simultaneously. |
| M-07 | **Competitor response.** Airbnb or Booking.com launches Arabic UX or local payment. StayOS loses differentiator. | 1 | 4 | **4** | MINIMAL | Unlikely in 6-week alpha. Long-term risk. Speed to market is the defense. |
| M-08 | **Marketplace density is geographically dispersed.** Listings spread across 4 areas instead of 1. No area reaches liquidity. | 3 | 4 | **12** | MEDIUM | Committee directive: ALL supply in New Cairo only. No spread. |

---

## 5. Founder Risks

| # | Risk | Probability | Impact | Score | Severity | Mitigation |
|---|------|-------------|--------|-------|----------|------------|
| F-01 | **Founder burnout.** 9.5-hour daily schedule, 6-7 days per week, for 6 weeks. Founder exhausts and quality drops. | 3 | 4 | **12** | MEDIUM | Hire operations person by Week 2. Take 1 day off per week. Set realistic 6-week timeline. |
| F-02 | **Founder spends too much time on operations, not enough on supply.** KYC review, listing creation, and support consume founder's day. Host recruitment doesn't happen. | 4 | 4 | **16** | HIGH | Block 2 hours every morning for host calls. Delegate operations by Week 2. Track time allocation daily. |
| F-03 | **Founder loses motivation if metrics are below target.** 30 listings and 5 bookings instead of 50 and 10. Founder feels defeated. | 2 | 3 | **6** | LOW | Set realistic targets (30-40 listings, 5-8 bookings). Celebrate small wins. Board provides support. |
| F-04 | **Founder makes poor judgment calls under pressure.** Approves bad listings, skips KYC review, processes payouts incorrectly. | 2 | 4 | **8** | LOW | Operations manual provides checklists. Board reviews weekly report. |
| F-05 | **Founder cannot hire operations person in time.** Hiring takes 2-4 weeks. No candidates available. | 3 | 3 | **9** | LOW | Start hiring in Week 1. Use personal network. Hire from university graduates. |

---

## 6. Legal Risks

| # | Risk | Probability | Impact | Score | Severity | Mitigation |
|---|------|-------------|--------|-------|----------|------------|
| L-01 | **No legal entity formed.** StayOS is operating without a registered company. Contracts, payments, and liability are personal. | 3 | 4 | **12** | MEDIUM | Form Egyptian LLC before processing any payments. Engage a lawyer. |
| L-02 | **No terms of service or privacy policy.** Platform operates without legal agreements. Guests and hosts have no legal framework. | 4 | 3 | **12** | MEDIUM | Use template ToS and privacy policy in Arabic and English. Have lawyer review. Post on website before launch. |
| L-03 | **No cancellation/refund policy published.** Guests have no stated rights. Disputes are unresolvable. | 4 | 3 | **12** | MEDIUM | Publish simple cancellation policy: full refund 48h before check-in, 50% refund within 48h, no refund after check-in. Display on booking page. |
| L-04 | **KYC data stored without compliance.** ID documents and selfies stored in S3 without data protection compliance. | 2 | 4 | **8** | LOW | S3 buckets are private. Access is logged. Delete KYC documents after verification if required by law. |
| L-05 | **Tax obligations unmet.** Commission revenue is not tax-reported. Host income is not reported. | 3 | 3 | **9** | LOW | Engage accountant. Track all commission revenue. Report and pay taxes. |
| L-06 | **No host guarantee or guest protection policy.** If a guest damages a property, there is no insurance or policy. Hosts sue StayOS. | 2 | 4 | **8** | LOW | Publish disclaimer: "StayOS is a platform, not a party to the rental agreement." Mediate disputes but don't accept liability. Long-term: create host guarantee fund. |
| L-07 | **Trademark not registered.** Someone else registers "StayOS" name. | 2 | 3 | **6** | LOW | File trademark application in Egypt. Cost: ~EGP 2,000-5,000. |

---

## 7. Trust Risks

| # | Risk | Probability | Impact | Score | Severity | Mitigation |
|---|------|-------------|--------|-------|----------|------------|
| T-01 | **Fake listing passes verification.** Founder approves a listing with stock photos or fake address. Guest arrives and property doesn't exist. | 2 | 5 | **10** | MEDIUM | Founder visits first 10 properties personally. Reverse image search on photos. Verify address on Google Maps. |
| T-02 | **Host fraud.** Host takes direct payment outside platform. StayOS loses commission. | 3 | 3 | **9** | LOW | Escrow model makes off-platform payment less attractive. Founder monitors for off-platform behavior. |
| T-03 | **Guest fraud.** Guest damages property and refuses to pay. Host loses money and churns. | 2 | 4 | **8** | LOW | Phone OTP identifies guest. Founder mediates disputes. Long-term: security deposit. |
| T-04 | **Trust signals invisible to guests.** KYC, escrow, and verification exist but are not displayed. Guests don't trust the platform. | 4 | 4 | **16** | HIGH | Add verified badge, escrow message, "StayOS-verified listing" badge (1.5 SP). Committee-mandated. |
| T-05 | **No dispute resolution process.** Guest and host disagree. No formal process. Founder mediates ad hoc. | 3 | 3 | **9** | LOW | Document dispute resolution process in operations manual. Founder mediates all disputes during alpha. |
| T-06 | **Data breach.** KYC documents or user data leaked from S3 or database. | 1 | 5 | **5** | LOW | S3 buckets are private. Database is behind VPC. Access is logged. Use strong passwords and MFA. |

---

## 8. Technology Risks

| # | Risk | Probability | Impact | Score | Severity | Mitigation |
|---|------|-------------|--------|-------|----------|------------|
| Tech-01 | **S3 presigned URLs don't work from browser.** CORS misconfigured. Photo upload fails. | 2 | 5 | **10** | MEDIUM | Test in staging first. This is Phase 1 of Sprint 3. Fix before any other work. |
| Tech-02 | **Paymob integration fails.** Iframe doesn't load. Callback doesn't work. Payment cannot be collected. | 3 | 5 | **15** | HIGH | Manual confirmation fallback. Founder checks bank statement and confirms via admin endpoint. |
| Tech-03 | **Platform goes down during alpha.** Server crash, database failure, deployment error. | 2 | 4 | **8** | LOW | Monitor daily. Engineering on-call. Simple deployment process. |
| Tech-04 | **Database migration failure.** Migration corrupts data. Listings or users lost. | 1 | 5 | **5** | LOW | Test migrations in staging. Backup database before migration. |
| Tech-05 | **SMS notifications fail.** Twilio is down or messages are not delivered in Egypt. | 2 | 3 | **6** | LOW | Twilio is reliable in Egypt. Fallback: founder sends WhatsApp messages manually. |
| Tech-06 | **Frontend build fails in production.** Next.js build error, missing environment variables, routing issue. | 2 | 4 | **8** | LOW | Test build in staging. Deploy during low-traffic hours. |
| Tech-07 | **Search performance is slow.** PostGIS queries take > 2 seconds with 40+ listings. | 1 | 2 | **2** | MINIMAL | 40 listings is trivial for PostgreSQL. Not a concern. |
| Tech-08 | **CSV import fails on large files.** Parser crashes on 50+ rows. | 2 | 2 | **4** | MINIMAL | Test with 50 rows in staging. Handle errors gracefully. |

---

## 9. Financial Risks

| # | Risk | Probability | Impact | Score | Severity | Mitigation |
|---|------|-------------|--------|-------|----------|------------|
| Fin-01 | **Runway exhausted before PMF.** $150K budget burns through before marketplace reaches 100+ bookings/month. | 2 | 5 | **10** | MEDIUM | Monthly burn capped at EGP 350,000 during alpha. No large hires. No paid ads. Track burn weekly. |
| Fin-02 | **Payment processing fees erode margin.** Paymob fees higher than expected. Take rate is insufficient. | 2 | 3 | **6** | LOW | Paymob fees are ~2.5%. At 14% take rate, margin is sufficient. Negotiate volume rates later. |
| Fin-03 | **Host payouts exceed collections.** Manual payout errors or timing mismatches create cash flow gaps. | 2 | 3 | **6** | LOW | Only process payouts after funds are collected. Use escrow model. Track in spreadsheet. |
| Fin-04 | **EGP devaluation increases costs.** Cloud costs (AWS) are in USD. EGP devaluation increases burn. | 3 | 2 | **6** | LOW | Keep 3-6 months of USD reserve. AWS costs are low at alpha scale (~EGP 5,000-8,000/month). |
| Fin-05 | **No revenue during alpha.** 10 bookings at EGP 630 revenue = EGP 6,300 total. Negligible. | 5 | 1 | **5** | LOW | Alpha is a learning phase, not a revenue phase. Confirmed in financial model. |

---

## 10. Risk Summary by Severity

### CRITICAL (Score 20-25)

| # | Risk | Score | Action Required |
|---|------|-------|-----------------|
| P-01 | No guest-visible differentiator from Airbnb | 20 | Add 4.5 SP of vision-aligned features. **Mandatory before launch.** |

### HIGH (Score 15-19)

| # | Risk | Score | Action Required |
|---|------|-------|-----------------|
| P-02 | Payment checkout fails | 15 | Manual fallback. Test Paymob in staging. |
| P-03 | Listing form too complex | 16 | Founder assists 60%+ of hosts. Simplified form. |
| P-06 | No reviews = no social proof | 16 | Warm-contact alpha only. Manual review collection. |
| O-01 | Founder becomes bottleneck | 16 | Hire operations person by Week 2. |
| M-01 | Supply falls below 30 | 15 | Extend alpha to 6 weeks. Founder focuses 80% on supply. |
| M-02 | Demand falls below 5 bookings | 15 | Founder guarantees first 5 bookings. |
| M-03 | Liquidity too low | 16 | Concentrate in New Cairo. Founder matches guests manually. |
| F-02 | Founder spends too much time on ops | 16 | Block 2 hours for host calls. Delegate by Week 2. |
| T-04 | Trust signals invisible | 16 | Add verified badge, escrow message (1.5 SP). |
| Tech-02 | Paymob integration fails | 15 | Manual confirmation fallback. |

### MEDIUM (Score 10-14)

| # | Risk | Score |
|---|------|-------|
| P-04 | Photo upload fails | 10 |
| P-05 | Search returns empty results | 12 |
| P-07 | Arabic copy is low quality | 12 |
| O-02 | Operations hire delayed | 12 |
| O-05 | Listing quality inconsistent | 12 |
| M-04 | Host churn after 0 bookings | 12 |
| M-05 | Guest churn after 1 booking | 12 |
| M-08 | Geographic dispersion | 12 |
| F-01 | Founder burnout | 12 |
| L-01 | No legal entity | 12 |
| L-02 | No ToS or privacy policy | 12 |
| L-03 | No cancellation policy | 12 |
| Fin-01 | Runway exhausted | 10 |

---

## 11. Top 5 Risks and Mandatory Mitigations

### 1. No Guest-Visible Differentiator (P-01, Score 20)

**This is the single highest risk to the project.** If StayOS launches and guests cannot perceive a difference from Airbnb, the vision is not proven. The MVP fails its purpose.

**Mandatory mitigation:** Add 4.5 SP of vision-aligned features:
- Real Arabic copy (2 SP)
- Verified Host badge (0.5 SP)
- Cultural tag filters (1 SP)
- Escrow trust message (0.5 SP)
- Cancellation policy text (0.5 SP)

### 2. Trust Signals Invisible (T-04, Score 16)

11 SP of trust infrastructure produces zero guest-visible ROI. This is a waste of engineering investment.

**Mandatory mitigation:** Add verified badge and escrow message to listing detail and booking pages (1 SP).

### 3. Founder Becomes Bottleneck (F-02, O-01, Score 16 each)

If the founder is doing KYC reviews and photo uploads instead of recruiting hosts, the marketplace stalls.

**Mandatory mitigation:** Hire 1 operations person by Week 2. Block 2 hours every morning for host calls.

### 4. Supply and Demand Both Below Target (M-01, M-02, Score 15 each)

The 50-listing, 10-booking target is optimistic. Both supply and demand are likely to fall short.

**Mandatory mitigation:** Extend alpha to 6 weeks. Lower MVP gate to 7 bookings if supply is below 40. Founder personally guarantees first 5 bookings.

### 5. Payment Checkout Fails (P-02, Tech-02, Score 15 each)

If Paymob doesn't work and manual confirmation is too slow, the transaction loop breaks.

**Mandatory mitigation:** Manual confirmation fallback with 1-hour SLA. Test Paymob in staging before launch.

---

## 12. Risks the Committee Accepts

| Risk | Why We Accept It |
|------|------------------|
| No reviews during alpha | Warm contacts don't need reviews. Founder vouches personally. |
| No map during alpha | Warm contacts can be sent direct links. Map is V1.1. |
| No host guarantee during alpha | Founder mediates disputes. Alpha is small enough for personal mediation. |
| No automated payouts during alpha | Manual bank transfers are reliable. 10 payouts is manageable. |
| No mobile app | Web is sufficient for alpha. Mobile is Phase 2. |
| No AI matching | No data. Correctly deferred. |
| Platform downtime risk | Low probability. Engineering on-call. |
| Competitor response | Unlikely in 6 weeks. Speed is the defense. |
| EGP devaluation | Low impact at alpha scale. AWS costs are minimal. |

---

## 13. Committee Verdict on Risk

The project has **1 CRITICAL risk** (no guest-visible differentiator) and **9 HIGH risks**. The critical risk is addressable with 4.5 SP of engineering effort. Three of the high risks (founder bottleneck, supply below target, demand below target) are addressable with operational changes (hire by Week 2, extend alpha to 6 weeks, founder guarantees bookings).

**The committee will not approve launch until the CRITICAL risk (P-01) is mitigated.** The 4.5 SP of vision-aligned features are mandatory, not optional.
