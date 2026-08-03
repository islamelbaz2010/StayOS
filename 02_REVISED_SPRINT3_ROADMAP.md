# 02 — REVISED SPRINT 3 ROADMAP

**Board:** Executive Project Director, Product Director, CTO, COO  
**Date:** 2026-08-03  
**Decision basis:** `01_EXECUTIVE_REVIEW.md` — OPTION C (Reduce Sprint 3 scope)  
**Supersedes:** `SPRINT3_FINAL_BACKLOG.md` priority assignments and `SPRINT3_EXECUTION_SEQUENCE.md` phase structure

---

## 1. What Changed and Why

| Change | Original | Revised | Rationale |
|--------|----------|---------|-----------|
| S3-012 (Unclaimed listing) | P0 | DEFER to P1 | Founder creates listings on behalf of hosts for 50 listings |
| S3-013 (Claim review) | P0 | DEFER to P1 | No claims needed until hosts self-register at scale |
| S3-014 (Duplicate detection) | P0 | DEFER to P1 | Not a problem until 100+ listings |
| S3-015 (Support tickets) | P0 | SIMPLIFY — WhatsApp only | Founder handles support via WhatsApp during alpha |
| S3-008 (Notifications) | P0 WhatsApp | P0 SMS only | WhatsApp API unresolved. SMS via Twilio is sufficient |
| S3-011 (CSV import) | P0 full | P0 simplified | Skip photo URL download. Ops uploads photos manually post-import |
| S3-018 (Payment checkout) | P1 | ELEVATE to P0 | Cannot complete MVP gate without payment |
| S3-003 (Listing form) | P0 full | P0 minimal | No map picker, no drag-reorder. Core fields only |

---

## 2. Revised P0 Story Inventory

### Epic 1 — Supply Enablement (P0, 22 SP)

| ID | Story | Effort | Status | Changes |
|----|-------|--------|--------|---------|
| S3-001 | Host phone OTP signup + role | 3 SP | DONE | — |
| S3-002 | Host KYC upload | 3 SP | DONE | — |
| S3-003 | Listing creation form (MINIMAL) | 3 SP | PARTIAL | Reduced from 5 SP. No map picker, no drag-reorder, no advanced amenities UI. Fields: title, description, property_type, governorate, city, district, address, lat/lng (text inputs), max_guests, bedrooms, bathrooms, base_price, min_nights, amenities (checkbox list), photos. |
| S3-004 | Listing photo upload | 5 SP | NOT IMPLEMENTED | HIGHEST PRIORITY. Build first. |
| S3-005 | Base pricing | 3 SP | DONE | — |
| S3-006 | Calendar availability | 3 SP | DONE | — |
| S3-007 | Submit for review | 2 SP | PARTIAL | Simple endpoint. No change. |
| S3-008 | SMS notifications (simplified) | 2 SP | PARTIAL | Reduced from 3 SP. SMS via Twilio only. No WhatsApp. Wire triggers for KYC and listing events. |

### Epic 2 — Admin Operations (P0, 11 SP)

| ID | Story | Effort | Status | Changes |
|----|-------|--------|--------|---------|
| S3-009 | Admin KYC review queue | 3 SP | PARTIAL | No change. Minimal: list pending, approve, reject with reason. |
| S3-010 | Listing verification queue | 3 SP | NOT IMPLEMENTED | No change. Minimal: list pending, approve, reject with reason. |
| S3-011 | CSV import (SIMPLIFIED) | 3 SP | NOT IMPLEMENTED | Reduced from 5 SP. Parse CSV, create units + listings. Skip photo URL download — ops uploads photos manually after import. Basic error reporting. |

### Epic 3 — Booking (P0, 5 SP)

| ID | Story | Effort | Status | Changes |
|----|-------|--------|--------|---------|
| S3-018 | Payment checkout | 5 SP | NOT IMPLEMENTED | ELEVATED from P1 to P0. Paymob iframe integration. Manual confirmation fallback if Paymob not ready. |

### Epic 6 — Infrastructure (P0, 6 SP)

| ID | Story | Effort | Status | Changes |
|----|-------|--------|--------|---------|
| S3-030 | unit_photos migration | 2 SP | DONE | — |
| S3-031 | Presigned S3 URLs | 1 SP | PARTIAL | Reduced from 2 SP. Listings only (KYC already works). |
| S3-032 | State machine | 2 SP | DONE | — |
| S3-033 | S3 bucket config | 1 SP | PARTIAL | Reduced from 2 SP. Verify buckets exist, configure CORS. |

---

## 3. Revised Effort Summary

| Epic | Original P0 SP | Revised P0 SP | Implemented | Remaining |
|------|----------------|---------------|-------------|-----------|
| Epic 1 (Supply) | 27 | 22 | 12 | 10 |
| Epic 2 (Admin Ops) | 27 | 11 | 0 | 11 |
| Epic 3 (Booking) | 0 | 5 | 0 | 5 |
| Epic 6 (Infra) | 8 | 6 | 4 | 2 |
| **Total** | **62** | **44** | **16** | **28** |

**Remaining engineering: ~25 SP** (after accounting for partial implementations and simplifications).

---

## 4. Revised Execution Sequence

### Phase 1 — Unblock Photos (Days 1–3)

| Step | Story | Task | Deliverable |
|------|-------|------|-------------|
| 1.1 | S3-033 | Verify S3 listings bucket exists, configure CORS | Bucket ready |
| 1.2 | S3-031 | Create presigned URL endpoint for listing photos | API endpoint |
| 1.3 | S3-004 | Create photo record endpoint (POST /listings/{id}/photos) | API endpoint |
| 1.4 | S3-004 | Create cover photo selection endpoint (PATCH) | API endpoint |
| 1.5 | S3-004 | Build photo upload component on frontend | Frontend component |

**Exit criteria:** Photo uploaded via browser → stored in S3 → record in DB → displayed on listing detail page.

### Phase 2 — Supply Pipe (Days 3–8)

| Step | Story | Task | Deliverable |
|------|-------|------|-------------|
| 2.1 | S3-003 | Build minimal listing creation form (Arabic RTL) | Frontend page |
| 2.2 | S3-003 | Build host listings list page | Frontend page |
| 2.3 | S3-007 | Add submit-for-review endpoint | API endpoint |
| 2.4 | S3-007 | Add submit button on frontend | Frontend button |
| 2.5 | S3-008 | Wire SMS triggers for KYC and listing events | Event emission |
| 2.6 | S3-008 | Create SMS templates (Arabic) | Templates |

**Exit criteria:** Host can create listing with photos, set price, submit for review, and receive SMS notification.

### Phase 3 — Admin Verification (Days 6–12, parallel with Phase 2)

| Step | Story | Task | Deliverable |
|------|-------|------|-------------|
| 3.1 | S3-009 | Build KYC queue endpoint (list pending) | API endpoint |
| 3.2 | S3-009 | Build KYC approve/reject endpoints | API endpoints |
| 3.3 | S3-009 | Build admin KYC queue page (minimal) | Frontend page |
| 3.4 | S3-010 | Build listing verification queue endpoint | API endpoint |
| 3.5 | S3-010 | Build listing approve/reject endpoints | API endpoints |
| 3.6 | S3-010 | Build admin listing verification page (minimal) | Frontend page |
| 3.7 | S3-011 | Build CSV import endpoint (simplified) | API endpoint |
| 3.8 | S3-011 | Build CSV upload page (minimal) | Frontend page |

**Exit criteria:** Founder can review KYC, approve/reject listings, and import CSV via admin pages.

### Phase 4 — Payment (Days 10–15, parallel with Phase 3)

| Step | Story | Task | Deliverable |
|------|-------|------|-------------|
| 4.1 | S3-018 | Integrate Paymob iframe payment | Payment flow |
| 4.2 | S3-018 | Build payment confirmation callback | API endpoint |
| 4.3 | S3-018 | Build manual payment confirmation fallback | Admin endpoint |
| 4.4 | S3-018 | Build checkout page on frontend | Frontend page |

**Exit criteria:** Guest can complete payment via Paymob iframe. Manual confirmation works as fallback.

### Phase 5 — Integration and Launch (Days 13–15)

| Step | Task | Deliverable |
|------|------|-------------|
| 5.1 | End-to-end test: host signup → KYC → listing → photos → submit → approve → search → book → pay | Test report |
| 5.2 | Deploy to production | Production deployment |
| 5.3 | Founder creates first 5 listings | 5 live listings |
| 5.4 | Founder tests full booking flow | Test booking completed |

**Exit criteria:** Platform live. 5 listings visible. One test booking completed end-to-end. Closed Alpha begins.

---

## 5. Revised Timeline

| Phase | Duration | Days | Parallel? |
|-------|----------|------|-----------|
| 1 — Unblock Photos | 3 days | 1–3 | No |
| 2 — Supply Pipe | 5 days | 3–8 | Partial (overlaps Phase 1) |
| 3 — Admin Verification | 6 days | 6–12 | Yes (parallel with Phase 2) |
| 4 — Payment | 5 days | 10–15 | Yes (parallel with Phase 3) |
| 5 — Integration and Launch | 2 days | 13–15 | After Phases 2–4 |

**Total engineering timeline: 15 working days (3 weeks).**

Down from 25 working days (5 weeks). 2 weeks saved.

---

## 6. What Happens During the 2 Weeks Saved

The 2 weeks saved are NOT engineering time. They are reinvested in marketplace execution:

| Week | Activity | Owner |
|------|----------|-------|
| Week 3 (while engineering builds) | Founder begins host recruitment. Contacts 20 potential hosts. | Founder |
| Week 3 | Founder prepares supply data for CSV import (collects via WhatsApp). | Founder |
| Week 3 | Founder prepares demand list (10 warm contacts who will book). | Founder |
| Week 4 (while engineering finishes) | Founder onboards first 5 hosts. Tests the platform with them. | Founder |
| Week 4 | Founder creates 5 listings via CSV import. Uploads photos. | Founder |
| Week 4 | Founder drives first test bookings from warm contacts. | Founder |

This parallel execution is the difference between launching a platform with 0 listings and launching with 10.

---

## 7. Deferred Stories — P1 Backlog

These stories are deferred from P0 to P1. They will be built after the MVP v1 Gate (10 bookings) is achieved, as part of V1.1.

| ID | Story | Original Priority | New Priority | When |
|----|-------|-------------------|-------------|------|
| S3-012 | Unclaimed listing creation | P0 | P1 | V1.1 |
| S3-013 | Claim review and ownership transfer | P0 | P1 | V1.1 |
| S3-014 | Duplicate listing detection | P0 | P1 | V1.1 |
| S3-015 | Support ticket queue (full system) | P0 | P1 | V1.1 |
| S3-016 | Map-based search | P1 | P1 | V1.1 |
| S3-017 | Availability on search cards | P1 | P1 | V1.1 |
| S3-019 | Host dashboard | P1 | P1 | V1.1 |
| S3-020 | Host pricing/calendar from dashboard | P1 | P1 | V1.1 |
| S3-021 | Verified badges on listing detail | P1 | P1 | V1.1 |

---

## 8. Revised Definition of Done

A Sprint 3 P0 story is done when:

1. Code is written and deployed to staging.
2. Acceptance criteria are met.
3. Founder has tested the feature manually.
4. No critical bugs open.
5. Feature is on the production deployment path.

Manual QA by Product/Operations is replaced by **founder testing** during alpha. Formal QA processes are introduced in V1.1.

---

## 9. Revised Post-Sprint 3 Criteria

Sprint 3 is successful when:

1. A host can sign up, complete KYC, create a listing with photos, set pricing, and submit for review.
2. The founder can review KYC, approve listings, and import CSV via admin pages.
3. A guest can search, find a listing, book, and pay (Paymob or manual confirmation).
4. The founder can confirm payment and trigger a manual payout.
5. Platform is deployed and accessible.
6. **5 listings are live on Day 1 of Closed Alpha.**

The original criterion of "50 listings on staging" is moved to the Closed Alpha execution plan (Week 4 target), not the Sprint 3 completion criteria.
