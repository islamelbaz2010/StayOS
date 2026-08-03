# SPRINT 3 P0 EXECUTION PLAN — StayOS

**Prepared by:** Lead Software Architect, Engineering Execution Lead  
**Date:** 2026-08-04  
**Source documents:** `MVP_SCOPE_FREEZE.md`, `SPRINT3_FINAL_BACKLOG.md`  
**Purpose:** Extract all P0 stories, map dependencies, define execution order, and estimate effort for Sprint 3.

---

## 1. P0 Story Inventory

19 P0 stories are extracted from `SPRINT3_FINAL_BACKLOG.md` across three epics.

### Epic 1 — Supply Enablement (P0, 27 SP)

| ID | Story | Effort | Dependencies | Status |
|----|-------|--------|--------------|--------|
| S3-001 | Host phone OTP signup + role selection | 3 SP | Twilio Verify, user model | Implemented |
| S3-002 | Host KYC upload (ID + selfie) | 3 SP | S3-001, S3 KYC bucket, presigned S3 | Implemented |
| S3-003 | Listing creation form (location, title, description, amenities, max guests) | 5 SP | Unit model, PostGIS, listing form | Partial — backend only |
| S3-004 | Listing photo upload | 5 SP | S3 listings bucket, photo endpoint, `pms.unit_photos` migration | Not implemented |
| S3-005 | Base pricing, weekend multiplier, minimum stay | 3 SP | Pricing endpoint, calendar model | Implemented |
| S3-006 | Calendar availability and date blocking | 3 SP | Calendar model, availability endpoint | Implemented |
| S3-007 | Listing submit for review | 2 SP | Listing state machine | Partial — no submit endpoint |
| S3-008 | Host WhatsApp notifications (KYC + listing status) | 3 SP | WhatsApp Business API, notification service | Partial — infra exists, triggers missing |

### Epic 2 — Admin Operations Dashboard (P0, 27 SP)

| ID | Story | Effort | Dependencies | Status |
|----|-------|--------|--------------|--------|
| S3-009 | Admin KYC review queue (view pending, approve/reject with reason) | 3 SP | S3-002, admin auth | Partial — process endpoint exists, no queue/reason |
| S3-010 | Admin listing verification queue (view pending, approve/reject) | 3 SP | S3-007, listing state machine | Not implemented |
| S3-011 | Bulk CSV import of properties | 5 SP | CSV parser, unit/photo creation | Not implemented |
| S3-012 | Admin unclaimed listing creation + invite owner to claim | 5 SP | Admin unit creation, claim workflow | Not implemented |
| S3-013 | Claim review and ownership transfer | 5 SP | S3-012, KYC, ownership docs | Not implemented |
| S3-014 | Duplicate listing detection and merge/reject | 3 SP | Duplicate detection service | Not implemented |
| S3-015 | Support ticket queue (triage, assign, escalate, close) | 3 SP | Support ticket model | Not implemented |

### Epic 6 — Infrastructure and Platform (P0, 8 SP)

| ID | Story | Effort | Dependencies | Status |
|----|-------|--------|--------------|--------|
| S3-030 | `pms.unit_photos` migration and S3 integration | 2 SP | S3 listings bucket, Alembic | Implemented (migration + model) |
| S3-031 | Pre-signed S3 upload URLs for KYC and listing photos | 2 SP | S3, IAM roles | Partial — KYC only |
| S3-032 | Listing state machine (DRAFT → PENDING_VERIFICATION → LISTED → SUSPENDED → ARCHIVED) | 2 SP | Unit listing model | Implemented |
| S3-033 | S3 bucket config for listings + KYC with IAM and CORS | 2 SP | AWS account | Partial — config exists, buckets/CORS not verified |

---

## 2. Dependency Graph

```
S3-033 (S3 bucket config)
  └─→ S3-030 (unit_photos migration)  [DONE]
        └─→ S3-031 (presigned S3 URLs)
              ├─→ S3-004 (listing photo upload)  [BLOCKED]
              └─→ S3-002 (KYC upload)  [DONE — KYC presigned only]

S3-001 (host OTP signup)  [DONE]
  ├─→ S3-002 (KYC upload)  [DONE]
  │     └─→ S3-009 (admin KYC review queue)  [PARTIAL]
  └─→ S3-003 (listing creation)  [PARTIAL — backend only]
        ├─→ S3-004 (photo upload)  [BLOCKED]
        ├─→ S3-005 (base pricing)  [DONE]
        ├─→ S3-006 (calendar availability)  [DONE]
        └─→ S3-007 (submit for review)  [PARTIAL]
              └─→ S3-010 (admin listing verification)  [BLOCKED]

S3-032 (state machine)  [DONE]
  └─→ S3-007 (submit for review)  [PARTIAL]
        └─→ S3-010 (listing verification)  [BLOCKED]

S3-008 (WhatsApp notifications)  [PARTIAL — triggers missing]
  Depends on: notification service (exists), WhatsApp Business API (external)

S3-011 (CSV import)  [NOT IMPLEMENTED]
  Depends on: S3-003 (listing creation), S3-004 (photo upload)

S3-012 (unclaimed listing)  [NOT IMPLEMENTED]
  Depends on: S3-003 (listing creation), admin auth
  └─→ S3-013 (claim review/transfer)  [NOT IMPLEMENTED]

S3-014 (duplicate detection)  [NOT IMPLEMENTED]
  Depends on: S3-003 (listing creation), S3-011 (CSV import)

S3-015 (support ticket queue)  [NOT IMPLEMENTED]
  Depends on: admin auth, support ticket model (new)
```

---

## 3. Execution Priority

### Tier 1 — Unblock Supply Pipe (Week 1–2)

| Priority | Story | Why First |
|----------|-------|-----------|
| 1 | S3-033 | S3 buckets must exist before any photo upload |
| 2 | S3-031 | Presigned URLs needed for both KYC and listing photos |
| 3 | S3-004 | Photo upload is a hard launch blocker |
| 4 | S3-003 | Listing creation frontend form (backend exists) |
| 5 | S3-007 | Submit-for-review endpoint (state machine exists, endpoint missing) |
| 6 | S3-008 | Wire notification triggers to KYC and listing state changes |

### Tier 2 — Admin Operations (Week 3–4)

| Priority | Story | Why Next |
|----------|-------|-----------|
| 7 | S3-009 | KYC review queue — needed to verify hosts |
| 8 | S3-010 | Listing verification queue — needed to approve listings |
| 9 | S3-011 | CSV bulk import — needed to seed 50+ listings |
| 10 | S3-012 | Unclaimed listing creation — seed before host self-service |
| 11 | S3-013 | Claim review and transfer — complete the claim workflow |
| 12 | S3-014 | Duplicate detection — catalog integrity after import |
| 13 | S3-015 | Support ticket queue — daily operations |

### Tier 3 — Commercial Readiness (Week 5)

| Priority | Activity | Why |
|----------|----------|-----|
| 14 | Seed 50 listings via CSV import | Validate supply pipe end-to-end |
| 15 | Verify search returns results | Validate discovery |
| 16 | Test booking flow end-to-end | Validate transaction loop |
| 17 | Admin dashboard smoke test | Validate operations workflow |

---

## 4. Effort Summary

| Category | Total SP | Implemented SP | Remaining SP |
|----------|----------|----------------|--------------|
| Epic 1 (Supply Enablement) | 27 | 12 | 15 |
| Epic 2 (Admin Operations) | 27 | 0 | 27 |
| Epic 6 (Infrastructure) | 8 | 4 | 4 |
| **Total** | **62** | **16** | **46** |

**Implementation readiness: ~26% of P0 SP complete.**

---

## 5. Critical Path

The critical path to Closed Alpha is:

```
S3-033 → S3-031 → S3-004 → S3-003 (frontend) → S3-007 → S3-010 → S3-011 → Seed 50 listings
```

Any delay in this path delays the Closed Alpha launch.

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| S3 bucket/CORS misconfigured | Medium | High — blocks all photo upload | Verify bucket policy and CORS before Week 2 |
| WhatsApp Business API not approved | High | Medium — fallback to SMS | Use SMS notifications as fallback |
| CSV import format mismatch | Medium | Medium — delays seeding | Define CSV schema early, test with 5 rows |
| Duplicate detection false positives | Medium | Low — manual override | Start with simple geo+title matching |
| Frontend listing form complexity | Medium | High — blocks host self-service | Build minimal form first, iterate |
| Admin queue endpoints not designed | High | High — blocks operations | Design API contract in Week 1 |

---

## 7. Acceptance Criteria per P0 Story

| ID | Acceptance Criteria |
|----|---------------------|
| S3-001 | Phone OTP works; role stored as GUEST/HOST; Arabic RTL supported. |
| S3-002 | Upload succeeds; images stored in S3 KYC bucket; metadata saved in `auth.kyc_documents`. |
| S3-003 | Form creates `pms.units` and `pms.unit_listings` rows; data validated; Arabic RTL. |
| S3-004 | 5+ photos uploaded via presigned S3 URL; stored in `pms.unit_photos`; displayed on listing detail; primary photo set. |
| S3-005 | Price saved in `unit_listings.base_price_egp`; calendar rules respect `min_nights`. |
| S3-006 | Dates blocked/unblocked via `pms.calendar_rules`; availability filter works in search. |
| S3-007 | Listing moves to `PENDING_VERIFICATION` status; host notified. |
| S3-008 | WhatsApp/SMS messages sent on KYC status change and listing status change. |
| S3-009 | Admin can list pending KYC; approve sets `kyc_status=verified`; reject with reason sets `kyc_status=rejected`. |
| S3-010 | Admin can list pending listings; approve sets `status=LISTED`; reject with reason sets `status=UNLISTED`. |
| S3-011 | 20+ listings created from CSV; errors reported per row; photos imported from URLs. |
| S3-012 | Admin creates unclaimed listing (no host_id); claim link generated; listing in `PENDING_VERIFICATION`. |
| S3-013 | Claim approved → `host_id` transferred; rejected → reason logged; KYC required before transfer. |
| S3-014 | Duplicates flagged by geo proximity + title similarity; merge/reject action works. |
| S3-015 | Tickets created, prioritized, assigned, escalated, closed; SLA tracked. |
| S3-030 | Migration runs; `pms.unit_photos` table and S3 path work. |
| S3-031 | Presigned PUT URLs generated for KYC and listing photos; uploads succeed; URLs expire. |
| S3-032 | State transitions enforced: DRAFT → PENDING_VERIFICATION → LISTED → SUSPENDED → ARCHIVED. |
| S3-033 | S3 buckets accessible from web; CORS configured; IAM roles correct. |
