# MASTER EXECUTION BOARD — STAYOS SPRINT 0
## Single Operational Source of Truth

**Document:** MASTER_EXECUTION_BOARD.md  
**Authority:** SPRINT_0_ENGINEERING_FOUNDATION_v1.1.md  
**Status:** ACTIVE — EXECUTION PHASE  
**Sprint:** Sprint 0 — Engineering Foundation  
**Duration:** 10 Working Days  
**TPM:** Islam Elbaz (Founder / Project Director)  
**Last Updated:** 2026-07-29 (Day 0 — Pre-Execution)  

> This board is updated by TPM at 18:00 each day. It is the ONLY status document. All other sprint artifacts are frozen planning documents and must not be modified.

---

# SECTION 1 — EXECUTIVE DASHBOARD

---

## 1.1 Overall Progress

| Metric | Value |
|--------|-------|
| **Sprint** | Sprint 0 — Engineering Foundation |
| **Total Tasks** | 57 |
| **Phase A Tasks** | 43 |
| **Phase B Tasks** | 11 |
| **Phase C Tasks** | 3 |
| **Tasks Complete** | 0 |
| **Tasks In Progress** | 0 |
| **Tasks Blocked** | 0 |
| **Tasks Backlog** | 57 |
| **Overall Completion** | 0% |
| **Engineering Readiness** | 55% (pre-Sprint 0) |
| **Target Engineering Readiness** | 85% (post-Sprint 0) |
| **Production Readiness** | 25% (pre-Sprint 0) |
| **Target Production Readiness** | 40% (post-Sprint 0) |
| **Sprint Health** | 🔴 Pre-Execution |
| **Risk Level** | 🔴 HIGH |

---

## 1.2 Sprint Progress by Track

| Track | Owner | Total | Done | In Progress | Blocked | Backlog | % |
|-------|-------|-------|------|-------------|---------|---------|---|
| A — Governance | Founder + TPM | 11 | 0 | 0 | 0 | 11 | 0% |
| B — Backend Foundation | Backend Lead | 12 | 0 | 0 | 0 | 12 | 0% |
| C — Frontend Foundation | Web Lead | 9 | 0 | 0 | 0 | 9 | 0% |
| D — Mobile Foundation | Mobile Lead | 8 | 0 | 0 | 0 | 8 | 0% |
| E — Infrastructure | DevOps Lead | 11 | 0 | 0 | 0 | 11 | 0% |
| F — QA Foundation | QA Lead | 6 | 0 | 0 | 0 | 6 | 0% |
| **TOTAL** | | **57** | **0** | **0** | **0** | **57** | **0%** |

---

## 1.3 Sprint Progress by Phase

| Phase | Definition | Total | Done | % | Must Complete By |
|-------|-----------|-------|------|---|-----------------|
| **Phase A** | Mandatory Foundation | 43 | 0 | 0% | Day 10 (Sprint 1 gate) |
| **Phase B** | Foundation Enhancement | 11 | 0 | 0% | Sprint 1, Week 1 |
| **Phase C** | Pre-Beta (initiate now) | 3 | 0 | 0% | Sprint 5–8 (external) |
| **Phase D** | Pre-Production | 0 | — | — | Sprint 7–8 |

---

## 1.4 Critical Path Progress

| Node | ID | Task | Target | Status | Days Remaining |
|------|----|------|--------|--------|---------------|
| CP-1 | A-04 | AWS Region Decision | Day 1, 11:30 | ⬜ Backlog | 1 |
| CP-2 | E-01 | Fix Terraform | Day 1, 18:00 | ⬜ Backlog | 1 |
| CP-3 | E-02 | GitHub Secrets | Day 1, 18:00 | ⬜ Backlog | 1 |
| CP-4 | E-03 | Terraform Apply | Day 3, 12:00 | ⬜ Backlog | 3 |
| CP-5 | E-04 | Secrets Manager | Day 3, 12:00 | ⬜ Backlog | 3 |
| CP-6 | B-08 | Wire Secrets in Code | Day 3, 12:00 | ⬜ Backlog | 3 |
| CP-7 | E-05 | First Deployment | Day 3, 18:00 | ⬜ Backlog | 3 |
| CP-8 | F-05 | Test Data Seeded | Day 3, 18:00 | ⬜ Backlog | 3 |
| CP-9 | F-03+F-04 | E2E Smoke Tests | Day 5, 17:00 | ⬜ Backlog | 5 |
| CP-10 | F-06 | Smoke in CI | Day 7, 17:00 | ⬜ Backlog | 7 |
| CP-11 | EXIT-22 | Sprint 1 Authorized | Day 10, 18:00 | ⬜ Backlog | 10 |

**Critical Path Status:** ⬜ READY — Awaiting Day 1 kickoff

---

## 1.5 Open Blockers

| # | Blocker ID | Description | Owner | Day 1 SLA | Impact |
|---|-----------|-------------|-------|-----------|--------|
| 1 | BLK-01 | Implementation Baseline unsigned | Founder | 09:15 | Blocks all tracks |
| 2 | BLK-02 | Phase 0/1 governance unresolved | Founder | 09:45 | Blocks engineering mandate |
| 3 | BLK-03 | Mobile framework undecided | Founder + Mobile Lead | 11:30 | Blocks all of Track D |
| 4 | BLK-04 | AWS region undecided | Founder + DevOps Lead | 12:00 | Blocks all of Track E |
| 5 | BLK-05 | GitHub Secrets not configured | DevOps Lead | 18:00 | Blocks CI/CD |
| 6 | BLK-06 | No staging infrastructure | DevOps Lead | Day 3 | Blocks QA + integration |

---

## 1.6 Milestones

| # | Milestone | Target Day | Status | Gate Condition |
|---|-----------|-----------|--------|----------------|
| M-01 | All governance decisions committed | Day 1, 13:00 | ⬜ | DEC-011 through DEC-015 on `main` |
| M-02 | All tracks unblocked | Day 1, 18:00 | ⬜ | Terraform fixed + Secrets configured |
| M-03 | Staging infrastructure live | Day 3, 12:00 | ⬜ | `terraform output` shows all resources |
| M-04 | First backend deployment | Day 3, 18:00 | ⬜ | `/health` returns 200 |
| M-05 | Mid-point gate | Day 5, 10:00 | ⬜ | EXIT-01 through EXIT-12 verified |
| M-06 | First full CI/CD run | Day 5, 15:00 | ⬜ | `deploy-staging.yml` green |
| M-07 | E2E smoke suite green in CI | Day 7, 17:00 | ⬜ | EXIT-21 verified |
| M-08 | All Phase A tasks complete | Day 10, 12:00 | ⬜ | 43/43 Phase A Done |
| M-09 | Sprint 0 complete | Day 10, 17:00 | ⬜ | All 22 EXIT criteria Verified |
| M-10 | Sprint 1 authorized | Day 10, 18:00 | ⬜ | Sprint 1 board live |

---

## 1.7 Exit Criteria Status

| ID | Criterion | Gate | Owner | Status | Verified By |
|----|-----------|------|-------|--------|-------------|
| EXIT-01 | `STAYOS_IMPLEMENTATION_BASELINE.md` signed | Governance | Founder | ⬜ | TPM |
| EXIT-02 | DEC-011 in `DECISION_LOG.md` | Governance | Founder | ⬜ | TPM |
| EXIT-03 | ADR-016 (mobile framework) committed | Governance | Founder + ML | ⬜ | TPM |
| EXIT-04 | AWS region set in `variables.tf` | Governance | DevOps Lead | ⬜ | TPM |
| EXIT-05 | Staging API health returns 200 | Infrastructure | DevOps Lead | ⬜ | QA Lead |
| EXIT-06 | All migrations on staging DB | Infrastructure | Backend Lead | ⬜ | QA Lead |
| EXIT-07 | GitHub Actions CI green on `main` | CI/CD | DevOps Lead | ⬜ | TPM |
| EXIT-08 | First staging deployment via CI | CI/CD | DevOps Lead | ⬜ | TPM |
| EXIT-09 | Next.js on Vercel staging URL | Frontend | Web Lead | ⬜ | QA Lead |
| EXIT-10 | `/ar/` RTL + `/en/` LTR confirmed | Frontend | Web Lead | ⬜ | QA Lead |
| EXIT-11 | Typed API client compiles | Frontend | Web Lead | ⬜ | Backend Lead |
| EXIT-12 | OTP login → refresh → protected route | Frontend | Web Lead | ⬜ | QA Lead |
| EXIT-13 | Mobile scaffold on iOS + Android | Mobile | Mobile Lead | ⬜ | QA Lead |
| EXIT-14 | Mobile calls staging `/health` | Mobile | Mobile Lead | ⬜ | QA Lead |
| EXIT-15 | Mobile auth reaches OTP entry screen | Mobile | Mobile Lead | ⬜ | QA Lead |
| EXIT-16 | `pytest tests/test_listings.py -k photo` | Backend | Backend Lead | ⬜ | QA Lead |
| EXIT-17 | `analytics.listing_views` in staging DB | Backend | Backend Lead | ⬜ | QA Lead |
| EXIT-18 | Secrets loaded from AWS SM on startup | Backend | Backend Lead | ⬜ | DevOps Lead |
| EXIT-19 | `paymob_iframe_url` in POST /reservations/ | Backend | Backend Lead | ⬜ | QA Lead |
| EXIT-20 | CORS wildcard eliminated | Backend | Backend Lead | ⬜ | QA Lead |
| EXIT-21 | Playwright smoke 3/3 green in CI | QA | QA Lead | ⬜ | TPM |
| EXIT-22 | Sprint 1 board created + tasks assigned | Delivery | TPM | ⬜ | Founder |

**Exit Criteria Progress:** 0 / 22 (0%)

---

## 1.8 Project Health Summary

| Dimension | Status | Signal |
|-----------|--------|--------|
| Governance | 🔴 Blocked | 0 of 4 critical decisions made |
| Infrastructure | 🔴 Not Started | Terraform never applied |
| Backend | 🟡 Ready | Code ready; staging env needed |
| Frontend | 🔴 Not Started | 5% complete, scaffold only |
| Mobile | 🔴 Blocked | Framework decision required |
| QA | 🟡 Ready | Can write tests; staging needed for E2E |
| CI/CD | 🔴 Blocked | Secrets not configured |
| Risk Level | 🔴 HIGH | 6 open blockers all resolve Day 1 |

---

# SECTION 2 — MASTER TASK REGISTER

> All 57 Sprint 0 tasks. Every field. Updated by task owner at status change; validated by TPM at 18:00 daily.

---

## TRACK A — GOVERNANCE (11 Tasks)

---

#### A-01 — Sign STAYOS_IMPLEMENTATION_BASELINE.md

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Governance | **Category** | Governance |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Founder | **Reviewer** | TPM |
| **Duration** | 15 min | **Risk Level** | 🔴 Critical |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 09:00 | **Finish** | Day 1, 09:15 |
| **Dependencies** | None | **Parallel** | A-02 |
| **Blocking Issues** | Founder calendar availability | | |

**Deliverables:** Signed approval block appended to `STAYOS_IMPLEMENTATION_BASELINE.md`; commit on `main`

**Acceptance Criteria:** Document contains `APPROVED: [Date] — Islam Elbaz, Founder`. Commit on `main`. All engineering teams can reference it as the contractual baseline.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM confirms commit hash on `main` |

---

#### A-02 — Resolve Phase 0 / Phase 1 Governance Conflict

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Governance | **Category** | Governance |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Founder | **Reviewer** | TPM |
| **Duration** | 30 min | **Risk Level** | 🔴 Critical |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 09:15 | **Finish** | Day 1, 09:45 |
| **Dependencies** | None | **Parallel** | A-01 |
| **Blocking Issues** | Founder must make unambiguous decision | | |

**Deliverables:** DEC-011 entry in `DECISION_LOG.md` committed to `main`

**Acceptance Criteria:** DEC-011 present in `DECISION_LOG.md`. No hedging language. Explicitly states: (a) FC-01–FC-07 retroactively authorized, OR (b) new Phase designation supersedes Phase 0, OR (c) Phase 0 gates considered cleared.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM reads DEC-011 entry, confirms no ambiguity |

---

#### A-03 — Mobile Framework Decision

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Governance | **Category** | Governance |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Founder + Mobile Lead | **Reviewer** | TPM |
| **Duration** | 90 min | **Risk Level** | 🔴 Critical |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 10:00 | **Finish** | Day 1, 11:30 |
| **Dependencies** | Mobile Lead identified and present | **Parallel** | A-04 |
| **Blocking Issues** | Mobile Lead must be hired before Day 1 | | |

**Deliverables:** `docs/architecture/adr/ADR-016-mobile-framework.md` committed to `main`

**Acceptance Criteria:** ADR-016 status: Accepted. Contains chosen framework (Flutter or React Native), state management library, rationale, alternatives considered. Mobile Lead begins D-01 by Day 1, 13:00.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM confirms ADR-016 on `main` with status: Accepted |

---

#### A-04 — AWS Deployment Region Decision

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Governance | **Category** | Infrastructure |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Founder + DevOps Lead | **Reviewer** | TPM |
| **Duration** | 30 min | **Risk Level** | 🔴 Critical |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 11:30 | **Finish** | Day 1, 12:00 |
| **Dependencies** | None | **Parallel** | A-03 |
| **Blocking Issues** | Conflict: ADR-007 (me-central-1) vs Terraform backend (me-south-1) | | |

**Deliverables:** `infra/terraform/variables.tf` updated with confirmed region; ADR-007 updated if region changes

**Acceptance Criteria:** `variables.tf` `region` default set to confirmed value. Terraform state backend aligned to same region. DevOps Lead proceeds with `terraform init` by Day 1, 13:00.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | DevOps Lead confirms `terraform validate` passes |

---

#### A-05 — Decide Email Provider

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Governance | **Category** | Governance |
| **Phase** | Phase B | **Priority** | P1 |
| **Owner** | Backend Lead (proposes) | **Reviewer** | TPM |
| **Duration** | 30 min total | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 14:00 | **Finish** | Day 1, 16:00 |
| **Dependencies** | None | **Parallel** | A-07, A-08 |
| **Blocking Issues** | None — delegated, no Founder blocker | | |

**Deliverables:** DEC-012 in `DECISION_LOG.md` (AWS SES vs SendGrid)

**Acceptance Criteria:** DEC-012 committed. Backend Lead can proceed with B-06.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM reads DEC-012 |

---

#### A-06 — Decide Analytics Provider

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Governance | **Category** | Governance |
| **Phase** | Phase C | **Priority** | P1 |
| **Owner** | Founder | **Reviewer** | TPM |
| **Duration** | 30 min | **Risk Level** | 🟢 Low |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Sprint 1, Week 1 | **Finish** | Sprint 1, Week 1 |
| **Dependencies** | None | **Parallel** | — |
| **Blocking Issues** | Deferred — does not block Sprint 0 or Sprint 1 | | |

**Deliverables:** DEC-013 in `DECISION_LOG.md` (PostHog / Mixpanel / Amplitude)

**Acceptance Criteria:** DEC-013 committed before Sprint 3.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM confirms DEC-013 before Sprint 3 kickoff |

---

#### A-07 — Decide Messaging Transport

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Governance | **Category** | Governance |
| **Phase** | Phase B | **Priority** | P1 |
| **Owner** | TPM (records) | **Reviewer** | Backend Lead |
| **Duration** | 15 min | **Risk Level** | 🟢 Low |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 14:00 | **Finish** | Day 1, 15:00 |
| **Dependencies** | None — ADR-008 already decided (SSE + Redis) | **Parallel** | A-05, A-08 |
| **Blocking Issues** | None — delegated | | |

**Deliverables:** DEC-014 in `DECISION_LOG.md` (confirms SSE per ADR-008)

**Acceptance Criteria:** DEC-014 committed. Messaging architecture designed Sprint 5 without reopening the decision.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Lead confirms DEC-014 aligns with ADR-008 |

---

#### A-08 — Confirm Stripe Scope

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Governance | **Category** | Compliance |
| **Phase** | Phase B | **Priority** | P1 |
| **Owner** | Backend Lead (drafts) | **Reviewer** | TPM |
| **Duration** | 15 min | **Risk Level** | 🟢 Low |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 14:00 | **Finish** | Day 1, 15:00 |
| **Dependencies** | None | **Parallel** | A-05, A-07 |
| **Blocking Issues** | None — delegated | | |

**Deliverables:** DEC-015 in `DECISION_LOG.md` (Stripe = international cards only; Paymob = all Egyptian rails)

**Acceptance Criteria:** DEC-015 committed. Finance team Sprint 3 mandate is clear.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM confirms DEC-015 aligns with ADR-003 |

---

#### A-09 — Submit WhatsApp Business API Application

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Governance | **Category** | Governance |
| **Phase** | Phase C | **Priority** | P0 (lead time) |
| **Owner** | TPM / Operations Lead | **Reviewer** | Founder |
| **Duration** | 4 hours (active) + 4–8 weeks (external) | **Risk Level** | 🟠 High |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 13:00 | **Finish** | Day 1, 17:00 (submission) |
| **Dependencies** | Registered business entity | **Parallel** | A-10, A-11 |
| **Blocking Issues** | Business registration documents required | | |

**Deliverables:** Meta Business Manager application submitted; reference number recorded

**Acceptance Criteria:** Application submitted Day 1. Reference number in risk register. Estimated approval date noted.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM records application reference number in risk register |

---

#### A-10 — Register App Store and Play Store Accounts

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Governance | **Category** | Governance |
| **Phase** | Phase C | **Priority** | P0 (lead time) |
| **Owner** | Mobile Lead | **Reviewer** | TPM |
| **Duration** | 3 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 13:00 | **Finish** | Day 1, 16:00 |
| **Dependencies** | Founder payment authorization | **Parallel** | A-09, A-11 |
| **Blocking Issues** | Requires Founder payment method | | |

**Deliverables:** Apple Developer Account created; Google Play Console account created; Account IDs in credential store

**Acceptance Criteria:** Both accounts confirmed. Account IDs recorded.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM confirms account IDs in credential store |

---

#### A-11 — Update Stale Documents

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Governance | **Category** | Technical Debt |
| **Phase** | Phase A | **Priority** | P2 |
| **Owner** | TPM | **Reviewer** | Backend Lead |
| **Duration** | 1 hour | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 14:00 | **Finish** | Day 1, 15:00 |
| **Dependencies** | A-04 (region decision) | **Parallel** | A-09, A-10 |
| **Blocking Issues** | None | | |

**Deliverables:** Header banners added to `TECH_STACK.md` and `ARCHITECTURE.md`; `MASTER_PROJECT_MEMORY.md` `Project` field = `StayOS`; root `SPRINT_MEMORY.md` resolved

**Acceptance Criteria:** No document shows Paymob/Stripe conflict as open. `Project` = `StayOS`.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Lead spot-checks documents |

---

## TRACK B — BACKEND FOUNDATION (12 Tasks)

---

#### B-01 — Migration 011: unit_photos Table

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Backend | **Category** | Backend |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Backend Lead | **Reviewer** | Backend Engineer |
| **Duration** | 2 hours | **Risk Level** | 🟢 Low |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 13:00 | **Finish** | Day 1, 15:00 |
| **Dependencies** | None | **Parallel** | B-03, B-05, B-07, B-09, B-10 |
| **Blocking Issues** | None | | |

**Deliverables:** `alembic/versions/011_create_unit_photos.py`; `pms.unit_photos` table; `Unit.photos` relationship in `src/app/listings/models.py`

**Acceptance Criteria:** `alembic upgrade head` applies cleanly. Downgrade reverses cleanly. `Unit.photos` navigable in Python.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Engineer runs `alembic upgrade head` + `downgrade -1` locally |

---

#### B-02 — Photo Upload API

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Backend | **Category** | Backend |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Backend Lead | **Reviewer** | QA Lead |
| **Duration** | 1 day | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 2, 12:00 | **Finish** | Day 4, 18:00 |
| **Dependencies** | B-01, E-03 (S3 buckets provisioned) | **Parallel** | C-04, D-04 |
| **Blocking Issues** | S3 buckets require Terraform apply (E-03) | | |

**Deliverables:** `POST /api/v1/listings/{unit_id}/photos`; `DELETE /api/v1/listings/{unit_id}/photos/{photo_id}`; `GET /api/v1/listings/{unit_id}/photos`; tests in `tests/test_listings.py`

**Acceptance Criteria:** `pytest tests/test_listings.py -k photo` passes. MIME whitelist enforced: jpeg, png, webp. Max 10MB. Max 20 photos/listing. S3 presigned PUT URL returned.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead runs `pytest tests/test_listings.py -k photo` against staging |

---

#### B-03 — Migration 012: device_tokens Table

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Backend | **Category** | Backend |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Backend Lead | **Reviewer** | Backend Engineer |
| **Duration** | 1 hour | **Risk Level** | 🟢 Low |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 13:00 | **Finish** | Day 1, 14:00 |
| **Dependencies** | None | **Parallel** | B-01, B-05, B-07, B-09, B-10 |
| **Blocking Issues** | None | | |

**Deliverables:** `alembic/versions/012_create_device_tokens.py`; `auth.device_tokens` table

**Acceptance Criteria:** Migration applies and reverses cleanly. Unique constraint `(user_id, fcm_token)` present.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Engineer confirms migration in `alembic history` |

---

#### B-04 — Device Token Registration Endpoint

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Backend | **Category** | Backend |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Backend Lead | **Reviewer** | QA Lead |
| **Duration** | 3 hours | **Risk Level** | 🟢 Low |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 2, 09:00 | **Finish** | Day 2, 12:00 |
| **Dependencies** | B-03 | **Parallel** | B-12, C-03, D-02 |
| **Blocking Issues** | None | | |

**Deliverables:** `POST /api/v1/auth/device-token`; updated `auth/router.py`, `auth/schemas.py`, `auth/repository.py`, `auth/services.py`, `tests/test_auth.py`

**Acceptance Criteria:** Authenticated user registers token → stored. Re-registration updates record. Unauthenticated → 401. Duplicate fcm_token updates user_id.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead runs auth tests |

---

#### B-05 — Migration 015: Analytics Event Log Tables

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Backend | **Category** | Compliance |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Backend Lead | **Reviewer** | Backend Engineer |
| **Duration** | 2 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 13:00 | **Finish** | Day 1, 15:00 |
| **Dependencies** | None | **Parallel** | B-01, B-03, B-07, B-09, B-10 |
| **Blocking Issues** | ADR-015 non-negotiable — must not be deferred | | |

**Deliverables:** `alembic/versions/015_create_analytics_events.py`; `analytics` schema; tables: `analytics.listing_views`, `analytics.user_searches`, `analytics.booking_funnel_events`

**Acceptance Criteria:** Migration applies cleanly. All 3 tables in staging DB. All timestamps `TIMESTAMPTZ` with UTC default.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead confirms `\dt analytics.*` on staging DB shows 3 tables |

---

#### B-06 — Wire Email Provider (AWS SES)

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Backend | **Category** | Backend |
| **Phase** | Phase B | **Priority** | P1 |
| **Owner** | Backend Lead | **Reviewer** | QA Lead |
| **Duration** | 1 day | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 13:00 | **Finish** | Day 5, 18:00 |
| **Dependencies** | A-05 (email decision), E-07 (SES domain verified) | **Parallel** | C-06, D-06 |
| **Blocking Issues** | SES DNS propagation may take up to 72h | | |

**Deliverables:** `src/app/notifications/providers.py`; `src/app/notifications/services.py`; `send_email()` using `boto3.client('ses')`; `SES_FROM_EMAIL`, `SES_REGION` in `config.py`; `tests/test_notifications.py`

**Acceptance Criteria:** Integration test (mocked boto3) passes. Email send called with correct params. No stub references in production code. Retry up to 3 times on `ClientError`.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead runs notification tests + sends test email from staging |

---

#### B-07 — Fix Paymob Iframe URL in Reservation Response

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Backend | **Category** | Backend |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Backend Lead | **Reviewer** | QA Lead |
| **Duration** | 3 hours | **Risk Level** | 🔴 Critical |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 13:00 | **Finish** | Day 1, 16:00 |
| **Dependencies** | None | **Parallel** | B-01, B-03, B-05, B-09, B-10 |
| **Blocking Issues** | Booking flow is broken without this | | |

**Deliverables:** `ReservationCreateResponse` schema with `paymob_iframe_url: str | None` and `stripe_client_secret: str | None`; `create_reservation` populates from provider response; updated `tests/test_reservations_services.py`

**Acceptance Criteria:** `POST /api/v1/reservations/` contains `paymob_iframe_url` for Paymob payments. Existing tests updated. New test: create reservation → verify `paymob_iframe_url` is valid URL string.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead calls `POST /reservations/` on staging, asserts field present |

---

#### B-08 — Wire AWS Secrets Manager Client

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Backend | **Category** | Security |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Backend Lead | **Reviewer** | DevOps Lead |
| **Duration** | 1 day | **Risk Level** | 🔴 Critical |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 09:00 | **Finish** | Day 3, 12:00 |
| **Dependencies** | E-04 (Secrets Manager populated) | **Parallel** | B-11, C-05 |
| **Blocking Issues** | E-04 must complete first | | |

**Deliverables:** Working `src/app/security/secrets.py`; secrets fetched from `stayos/{env}/app-secrets` in `lifespan`; fail-fast in production; fallback to env vars in development/test

**Acceptance Criteria:** Staging API startup log shows "Loaded secrets from AWS Secrets Manager: stayos/staging/app-secrets". Production exits non-zero if SM unreachable. Unit test: mock boto3 → values in settings.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | DevOps Lead tails ECS logs, confirms secrets log line |

---

#### B-09 — Fix Recurring Maintenance Celery Beat Schedule

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Backend | **Category** | Backend |
| **Phase** | Phase A | **Priority** | P2 |
| **Owner** | Backend Lead | **Reviewer** | Backend Engineer |
| **Duration** | 1 hour | **Risk Level** | 🟢 Low |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 15:00 | **Finish** | Day 1, 16:00 |
| **Dependencies** | None | **Parallel** | B-01, B-03, B-05, B-07, B-10 |
| **Blocking Issues** | None | | |

**Deliverables:** `CELERY_BEAT_SCHEDULE` in `src/app/celery_app.py` updated with `app.operations.tasks.spawn_recurring_tasks` at 06:00 UTC daily

**Acceptance Criteria:** `celery_app.beat_schedule` contains the entry. `test_celery_app.py` verifies entry.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Engineer checks `beat_schedule` dict in Python REPL |

---

#### B-10 — Add PropertyReadiness Unique Constraint

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Backend | **Category** | Backend |
| **Phase** | Phase A | **Priority** | P1 |
| **Owner** | Backend Lead | **Reviewer** | Backend Engineer |
| **Duration** | 1 hour | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 16:00 | **Finish** | Day 1, 17:00 |
| **Dependencies** | None | **Parallel** | B-01, B-03, B-05, B-07, B-09 |
| **Blocking Issues** | None | | |

**Deliverables:** `alembic/versions/016_add_property_readiness_unique.py`; `UNIQUE(unit_id, reservation_id)` on `operations.property_readiness`; `UniqueConstraint` in SQLAlchemy model; `ConflictError` (409) in `operations/repository.py`

**Acceptance Criteria:** Migration applies cleanly. Duplicate insert raises 409.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Engineer attempts duplicate insert, confirms 409 |

---

#### B-11 — Lock CORS to Production Origins

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Backend | **Category** | Security |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Backend Lead | **Reviewer** | DevOps Lead |
| **Duration** | 1 hour | **Risk Level** | 🟠 High |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 09:00 | **Finish** | Day 3, 10:00 |
| **Dependencies** | E-06 (Vercel staging URL known) | **Parallel** | B-08 |
| **Blocking Issues** | Vercel staging URL must be known | | |

**Deliverables:** `CORS_ORIGINS: list[str]` in `src/app/config.py`; wildcard CORS removed from `src/app/shared/middleware.py`; staging origins: `["https://staging.stayos.com", "http://localhost:3000"]`

**Acceptance Criteria:** `curl -H "Origin: https://evil.com"` → no `Access-Control-Allow-Origin: *`. Staging origin → correct CORS headers.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | DevOps Lead runs curl test against staging |

---

#### B-12 — ADR-015 Schema Compliance Verification

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Backend | **Category** | Compliance |
| **Phase** | Phase A | **Priority** | P1 |
| **Owner** | Backend Lead | **Reviewer** | TPM |
| **Duration** | 2 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 2, 09:00 | **Finish** | Day 2, 11:00 |
| **Dependencies** | None | **Parallel** | B-04, C-03, D-02 |
| **Blocking Issues** | None | | |

**Deliverables:** Audit report (in PR description); patch migrations if any field missing; all 3 ADR-015 non-negotiables confirmed: amount columns (`INTEGER` + `currency CHAR(3)`), `locale VARCHAR(10)` on `auth.accounts`, `country CHAR(2)` + `currency CHAR(3)` on `pms.unit_listings`

**Acceptance Criteria:** All 3 ADR-015 non-negotiables present in staging DB. Any missing columns added via clean patch migration.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM reviews PR description audit table |

---

## TRACK C — FRONTEND FOUNDATION (9 Tasks)

---

#### C-01 — Project Configuration and Environment

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Frontend | **Category** | Frontend |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Web Lead | **Reviewer** | Backend Lead |
| **Duration** | 3 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 13:00 | **Finish** | Day 1, 16:00 |
| **Dependencies** | E-05 (staging URL for env vars) | **Parallel** | C-02, B-01, D-01 |
| **Blocking Issues** | None — can start with placeholder staging URL | | |

**Deliverables:** `apps/web/next.config.mjs` (images.domains, rewrites, no swcMinify); `apps/web/.env.local.example` (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_GOOGLE_MAPS_KEY, NEXT_PUBLIC_FIREBASE_CONFIG, NEXT_PUBLIC_PAYMOB_IFRAME_ID, NEXT_PUBLIC_SENTRY_DSN); `apps/web/package.json` (next-intl, @tanstack/react-query, zustand, axios, openapi-typescript, vitest, @testing-library/react, @playwright/test)

**Acceptance Criteria:** `pnpm install` completes. `pnpm build` no errors. `pnpm type-check` passes.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Lead confirms `pnpm type-check` green in CI |

---

#### C-02 — Tailwind CSS and Design Token Implementation

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Frontend | **Category** | Frontend |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Web Lead | **Reviewer** | QA Lead |
| **Duration** | 1 day | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 13:00 | **Finish** | Day 2, 12:00 |
| **Dependencies** | None | **Parallel** | C-01, C-03 |
| **Blocking Issues** | None — design system frozen in VISUAL_DESIGN_SYSTEM_P1.md | | |

**Deliverables:** `apps/web/tailwind.config.ts` (all design tokens: colors, fontFamily Cairo/Inter, spacing 4px grid, boxShadow ×5, borderRadius); `apps/web/app/globals.css` (CSS custom properties, `html[dir="rtl"]` base, Google Fonts import)

**Acceptance Criteria:** `pnpm build` passes. `className="text-primary-500 font-arabic"` renders correctly. `className="ps-4"` correct in RTL.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead visually confirms RTL and LTR on staging |

---

#### C-03 — i18n and RTL Configuration

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Frontend | **Category** | Frontend |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Web Lead | **Reviewer** | QA Lead |
| **Duration** | 1 day | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 2, 09:00 | **Finish** | Day 2, 18:00 |
| **Dependencies** | C-01 | **Parallel** | B-04, B-12, D-02, D-03 |
| **Blocking Issues** | None | | |

**Deliverables:** `apps/web/i18n.ts` (defaultLocale: ar, locales: [ar, en]); `apps/web/middleware.ts` (next-intl middleware); `apps/web/messages/ar.json` (≥20 base keys); `apps/web/messages/en.json` (≥20 base keys); `apps/web/app/[locale]/layout.tsx` (`<html lang dir>`)

**Acceptance Criteria:** `/ar/` loads with `dir="rtl"`. `/en/` loads with `dir="ltr"`. `useTranslations('common')` returns Arabic on `/ar/`. `pnpm type-check` passes.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead navigates to `/ar/` and `/en/`, inspects `html` element |

---

#### C-04 — Typed API Client

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Frontend | **Category** | Frontend |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Web Lead | **Reviewer** | Backend Lead |
| **Duration** | 1 day | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 2, 12:00 | **Finish** | Day 3, 12:00 |
| **Dependencies** | E-05 (staging API at `/openapi.json`) | **Parallel** | B-02, D-04 |
| **Blocking Issues** | Staging API must be live for `openapi-typescript` generation | | |

**Deliverables:** `apps/web/lib/api/generated.ts` (from `pnpm generate:api`); `apps/web/lib/api/client.ts` (axios, baseURL, Bearer token, 401 refresh, 422 field errors); `apps/web/lib/api/index.ts` (typed wrappers: auth, listings, reservations, finance, operations)

**Acceptance Criteria:** `pnpm generate:api` completes. `generated.ts` compiles. `api.listings.list({ locale: 'ar' })` typed, returns correct type.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Lead verifies API client types match OpenAPI spec |

---

#### C-05 — Authentication Context

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Frontend | **Category** | Frontend |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Web Lead | **Reviewer** | QA Lead |
| **Duration** | 1 day | **Risk Level** | 🟠 High |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 09:00 | **Finish** | Day 4, 12:00 |
| **Dependencies** | C-04 | **Parallel** | B-08, B-11, D-05 |
| **Blocking Issues** | None | | |

**Deliverables:** `apps/web/lib/auth/context.tsx` (AuthContext: user, isLoading, login, verifyOtp, logout, refreshToken); `apps/web/lib/auth/session.ts` (httpOnly cookie BFF via `/api/auth/set-cookie`); `useAuth()` hook; `ProtectedRoute` component

**Acceptance Criteria:** OTP login → user populated → protected page accessible. Access token expires → refresh succeeds → no logout. Refresh fails → clear session → redirect to login.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead runs F-03 (auth smoke test) |

---

#### C-06 — Server State Management (TanStack Query)

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Frontend | **Category** | Frontend |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Web Lead | **Reviewer** | TPM |
| **Duration** | 3 hours | **Risk Level** | 🟢 Low |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 13:00 | **Finish** | Day 3, 16:00 |
| **Dependencies** | C-04, C-05 | **Parallel** | B-06, D-06 |
| **Blocking Issues** | None | | |

**Deliverables:** `apps/web/lib/query/client.ts` (QueryClient: staleTime 5min, retry 2, no refetchOnWindowFocus); `apps/web/app/providers.tsx` (QueryClientProvider + NextIntlClientProvider); `useListings(filters)` hook

**Acceptance Criteria:** `pnpm type-check` passes. `useListings()` importable without type errors.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM confirms `pnpm type-check` passes in CI |

---

#### C-07 — Layout System and Routing

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Frontend | **Category** | Frontend |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Web Lead | **Reviewer** | QA Lead |
| **Duration** | 1 day | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 4, 09:00 | **Finish** | Day 5, 12:00 |
| **Dependencies** | C-02, C-03 | **Parallel** | E-07, E-08, D-07 |
| **Blocking Issues** | None | | |

**Deliverables:** `apps/web/app/[locale]/layout.tsx`; `GuestLayout.tsx`; `HostLayout.tsx`; `AuthLayout.tsx`; `components/nav/Header.tsx`; `components/nav/Footer.tsx`

**Acceptance Criteria:** `/ar/search` shows Arabic RTL header. `/en/search` shows English LTR header. Language toggle switches locale and maintains path. `pnpm build` passes.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead visually confirms both locales on staging |

---

#### C-08 — Error Handling and Loading States

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Frontend | **Category** | Frontend |
| **Phase** | Phase A | **Priority** | P1 |
| **Owner** | Web Lead | **Reviewer** | QA Lead |
| **Duration** | 4 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 4, 09:00 | **Finish** | Day 4, 13:00 |
| **Dependencies** | C-04, C-06 | **Parallel** | C-07, D-08 |
| **Blocking Issues** | None | | |

**Deliverables:** `apps/web/components/ui/ErrorBoundary.tsx` (Arabic-first error message + retry CTA); `apps/web/components/ui/Skeleton.tsx` (listing card, search results, profile form); `apps/web/app/[locale]/error.tsx`; `apps/web/app/[locale]/not-found.tsx`

**Acceptance Criteria:** Error in page → Arabic error boundary renders, not blank screen. Unknown route → Arabic 404 page.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead manually triggers an error; navigates to unknown route |

---

#### C-09 — Frontend Unit Test Configuration

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Frontend | **Category** | QA |
| **Phase** | Phase B | **Priority** | P1 |
| **Owner** | Web Lead | **Reviewer** | QA Lead |
| **Duration** | 3 hours | **Risk Level** | 🟢 Low |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 4, 12:00 | **Finish** | Day 4, 15:00 |
| **Dependencies** | C-01 | **Parallel** | B-02 (finalize), F-06 |
| **Blocking Issues** | None | | |

**Deliverables:** `apps/web/vitest.config.ts`; `apps/web/tests/setup.ts`; first passing unit test (Header: "StayOS" text + `dir="rtl"` when locale=ar); `pnpm test` and `pnpm test:coverage` scripts

**Acceptance Criteria:** `pnpm test` runs and first test passes. CI frontend job runs `pnpm test`.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead confirms `pnpm test` green in CI |

---

## TRACK D — MOBILE FOUNDATION (8 Tasks)

---

#### D-01 — Framework Scaffold

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Mobile | **Category** | Mobile |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Mobile Lead | **Reviewer** | DevOps Lead |
| **Duration** | 4 hours | **Risk Level** | 🔴 Critical |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 13:00 | **Finish** | Day 1, 17:00 |
| **Dependencies** | A-03 (framework decision) | **Parallel** | C-01, B-01 |
| **Blocking Issues** | A-03 must complete by Day 1, 11:30 | | |

**Deliverables (Flutter):** `apps/mobile/` with Flutter project; `pubspec.yaml`; `lib/main.dart`  
**Deliverables (RN):** `apps/mobile/` with RN project; `package.json`; `App.tsx`; `.gitignore` for mobile artifacts

**Acceptance Criteria:** `flutter run` (or `npx react-native run-ios`) launches scaffold on simulator. Clean build with no warnings.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | DevOps Lead confirms scaffold builds in CI |

---

#### D-02 — Navigation Architecture

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Mobile | **Category** | Mobile |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Mobile Lead | **Reviewer** | QA Lead |
| **Duration** | 1 day | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 2, 09:00 | **Finish** | Day 2, 18:00 |
| **Dependencies** | D-01 | **Parallel** | B-04, B-12, C-03, D-03 |
| **Blocking Issues** | None | | |

**Deliverables (Flutter):** `go_router` package; `lib/router/app_router.dart`  
**Deliverables (RN):** React Navigation 6; `src/navigation/AppNavigator.tsx`  
**Routes:** Unauthenticated stack (Splash→Onboarding→Phone→OTP→Social); KYC gate; Guest tabs (Home, Search, Trips, Messages, Profile); Host tabs (Dashboard, Listings, Operations, Payouts, Profile); deep links `stayos://listing/{id}`, `stayos://reservation/{id}`

**Acceptance Criteria:** All routes navigate without crash. Deep links open correct stub. Back-press on any stub does not crash.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead navigates all routes on simulator |

---

#### D-03 — Localization (Arabic RTL First)

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Mobile | **Category** | Mobile |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Mobile Lead | **Reviewer** | QA Lead |
| **Duration** | 4 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 2, 09:00 | **Finish** | Day 2, 13:00 |
| **Dependencies** | D-01 | **Parallel** | D-02, B-04, C-03 |
| **Blocking Issues** | None | | |

**Deliverables (Flutter):** `flutter_localizations`; `intl` package; `lib/l10n/ar.arb` and `en.arb`  
**Deliverables (RN):** i18n library; `ar.json` and `en.json`; initial strings: app name, navigation labels, auth labels, error messages

**Acceptance Criteria:** App launches in Arabic RTL. Switch to English → LTR. All scaffold text uses localization keys, zero hardcoded strings.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead inspects source for hardcoded strings |

---

#### D-04 — Theme System

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Mobile | **Category** | Mobile |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Mobile Lead | **Reviewer** | QA Lead |
| **Duration** | 4 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 2, 13:00 | **Finish** | Day 2, 17:00 |
| **Dependencies** | D-01 | **Parallel** | B-02, C-04 |
| **Blocking Issues** | None | | |

**Deliverables (Flutter):** `lib/theme/app_theme.dart` with `ThemeData`  
**Deliverables (RN):** `src/theme/theme.ts` with `StyleSheet` tokens  
**Tokens:** primary `#2C5FFF`; Cairo (Arabic) / Inter (English); 8px spacing grid; border radii; shadow styles; light + dark mode

**Acceptance Criteria:** Scaffold uses correct primary color and fonts. Dark mode toggle works. Zero hardcoded hex colors in source.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead searches source for hardcoded `#` values |

---

#### D-05 — Mobile API Client

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Mobile | **Category** | Mobile |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Mobile Lead | **Reviewer** | Backend Lead |
| **Duration** | 1 day | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 09:00 | **Finish** | Day 3, 18:00 |
| **Dependencies** | D-01, E-05 (staging API running) | **Parallel** | B-08, B-11, C-05 |
| **Blocking Issues** | Staging API must be live | | |

**Deliverables (Flutter):** `dio` package; `lib/services/api_client.dart`  
**Deliverables (RN):** `axios`; `src/services/apiClient.ts`  
**Features:** Base URL from env; Bearer token header; 401 → refresh → logout on fail; `ApiError` typed from `{"error":{"code","message","message_ar"}}`; methods: auth.*, listings.*, reservations.*, finance.*

**Acceptance Criteria:** `GET /health` from simulator → `{"status":"ok"}` logged. Unauthenticated → `ApiError(code: "NOT_AUTHENTICATED")`.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Lead confirms API client error types match backend schema |

---

#### D-06 — Mobile Authentication Context

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Mobile | **Category** | Mobile |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | Mobile Lead | **Reviewer** | QA Lead |
| **Duration** | 1 day | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 13:00 | **Finish** | Day 4, 12:00 |
| **Dependencies** | D-05 | **Parallel** | B-06, C-06 |
| **Blocking Issues** | None | | |

**Deliverables (Flutter):** `lib/providers/auth_provider.dart` (Riverpod) or `lib/bloc/auth/` (Bloc)  
**Deliverables (RN):** `src/store/authSlice.ts` (Redux Toolkit)  
**State:** user, isLoading, error. **Actions:** sendOtp, verifyOtp, logout, refreshToken. **Token storage:** FlutterSecureStorage (Flutter) or react-native-keychain (RN)

**Acceptance Criteria:** Unauthenticated → redirects to phone entry. After OTP → user persists across restarts. Logout → tokens cleared.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead kills and relaunches app, confirms session persists |

---

#### D-07 — Push Notification SDK Setup

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Mobile | **Category** | Mobile |
| **Phase** | Phase B | **Priority** | P1 |
| **Owner** | Mobile Lead | **Reviewer** | DevOps Lead |
| **Duration** | 4 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 4, 09:00 | **Finish** | Day 4, 13:00 |
| **Dependencies** | D-01, A-10 (Firebase project created) | **Parallel** | C-07, E-07, E-08 |
| **Blocking Issues** | Firebase project requires A-10 (App Store + Play Store) | | |

**Deliverables (Flutter):** `firebase_core`, `firebase_messaging`  
**Deliverables (RN):** `@react-native-firebase/messaging`  
**Behavior:** Permission request on launch (iOS explicit). Token → `POST /api/v1/auth/device-token`. Foreground → in-app banner. Background/terminated → navigate via deep link.

**Acceptance Criteria:** Token in `auth.device_tokens` after first launch. Firebase test push → appears on device. Tap → app opens.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | DevOps Lead sends test push from Firebase Console |

---

#### D-08 — Mobile CI Pipeline

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Mobile | **Category** | DevOps |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | DevOps Lead + Mobile Lead | **Reviewer** | TPM |
| **Duration** | 1 day | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 4, 09:00 | **Finish** | Day 5, 12:00 |
| **Dependencies** | A-03 (framework), D-01 (scaffold) | **Parallel** | C-07, C-08, E-09, E-10 |
| **Blocking Issues** | None | | |

**Deliverables:** `.github/workflows/mobile-ci.yml`  
**Steps:** Trigger on PR to develop/main; set up Flutter or Node.js+Java; `flutter analyze` or ESLint; `flutter test` or Jest; build APK (`flutter build apk --release`); build IPA (`flutter build ipa --release` on macos-latest)

**Acceptance Criteria:** Mobile CI triggers on PR. Analyze + test pass. APK builds. iOS build succeeds on macos-latest.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM confirms mobile-ci.yml green in GitHub Actions |

---

## TRACK E — INFRASTRUCTURE (11 Tasks)

---

#### E-01 — Resolve Terraform Configuration

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Infrastructure | **Category** | Infrastructure |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | DevOps Lead | **Reviewer** | Backend Lead |
| **Duration** | 4 hours | **Risk Level** | 🔴 Critical |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 13:00 | **Finish** | Day 1, 17:00 |
| **Dependencies** | A-04 (region decision) | **Parallel** | E-02 |
| **Blocking Issues** | A-04 must complete by Day 1, 12:00 | | |

**Deliverables:** `infra/terraform/variables.tf` (confirmed region); `infra/terraform/rds.tf` (aws_db_parameter_group with postgres16, force_ssl, pg_stat_statements); `infra/terraform/ecs.tf` (no placeholder subnet-xxx/sg-xxx, all Terraform data sources); `infra/terraform/staging.tfvars`; state backend in confirmed region

**Acceptance Criteria:** `terraform validate` passes. `terraform plan -var-file=staging.tfvars` produces no errors. Zero placeholder strings remain.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Lead reviews rds.tf PostGIS parameter group |

---

#### E-02 — Configure GitHub Secrets

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Infrastructure | **Category** | DevOps |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | DevOps Lead | **Reviewer** | TPM |
| **Duration** | 4 hours | **Risk Level** | 🔴 Critical |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 13:00 | **Finish** | Day 1, 17:00 |
| **Dependencies** | None | **Parallel** | E-01 |
| **Blocking Issues** | All external credentials must be procured | | |

**Deliverables:** GitHub Actions Secrets populated: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `PAYMOB_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SENTRY_DSN`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`

**Acceptance Criteria:** All 15 secrets present. `deploy-staging.yml` manual run does not fail with "secret not found".

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM confirms secrets count in GitHub settings |

---

#### E-03 — Provision Staging Infrastructure

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Infrastructure | **Category** | Infrastructure |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | DevOps Lead | **Reviewer** | TPM |
| **Duration** | 1 day | **Risk Level** | 🔴 Critical |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 2, 09:00 | **Finish** | Day 3, 12:00 |
| **Dependencies** | E-01, E-02 | **Parallel** | B-04, B-12, C-03 |
| **Blocking Issues** | E-01 and E-02 must complete Day 1 | | |

**Deliverables:** Via `terraform apply -var-file=staging.tfvars`: VPC + subnets + NAT Gateway; RDS PostgreSQL 16 (PostGIS parameter group); ElastiCache Redis 7; ECS cluster; ECR repos (api, celery-worker, celery-beat); ALB + HTTPS + ACM; S3 buckets (stayos-listings-staging, stayos-kyc-staging, stayos-ops-staging); IAM roles

**Acceptance Criteria:** `terraform output` shows all resources. RDS reachable from private subnet. ALB returns 503 (no backend yet). S3 buckets exist. Redis pings.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM reviews `terraform output` log |

---

#### E-04 — AWS Secrets Manager Population

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Infrastructure | **Category** | Security |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | DevOps Lead | **Reviewer** | Backend Lead |
| **Duration** | 2 hours | **Risk Level** | 🟠 High |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 09:00 | **Finish** | Day 3, 11:00 |
| **Dependencies** | E-03 | **Parallel** | B-08, B-11, C-05 |
| **Blocking Issues** | None | | |

**Deliverables:** AWS Secrets Manager secret `stayos/staging/app-secrets` (JSON): DATABASE_URL, REDIS_URL, JWT_PRIVATE_KEY, JWT_PUBLIC_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID, FIREBASE_CREDENTIALS_JSON, PAYMOB_API_KEY, PAYMOB_IFRAME_ID, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, AWS_S3_LISTINGS_BUCKET, AWS_S3_KYC_BUCKET, AWS_S3_OPS_BUCKET, SENTRY_DSN

**Acceptance Criteria:** `aws secretsmanager get-secret-value --secret-id stayos/staging/app-secrets` returns full JSON.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Lead runs `get-secret-value` command, confirms all keys present |

---

#### E-05 — First Backend Deployment to Staging

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Infrastructure | **Category** | DevOps |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | DevOps Lead | **Reviewer** | QA Lead |
| **Duration** | 4 hours | **Risk Level** | 🔴 Critical |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 13:00 | **Finish** | Day 3, 17:00 |
| **Dependencies** | E-03, E-04, B-08 | **Parallel** | E-06, C-06, D-06 |
| **Blocking Issues** | B-08 must complete before deploy | | |

**Deliverables:** Docker image built and pushed to ECR; `alembic upgrade head` applied on staging RDS; ECS task definition registered; ECS service updated; ALB health check passing

**Acceptance Criteria:** `curl https://api.staging.stayos.com/health` returns `{"status":"ok","database":"ok","redis":"ok"}`. API logs show "Loaded secrets from AWS Secrets Manager". ECS task 0 restart errors.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | QA Lead runs `curl` health check and captures output |

---

#### E-06 — Link Vercel Project and Deploy Frontend

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Infrastructure | **Category** | DevOps |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | DevOps Lead + Web Lead | **Reviewer** | TPM |
| **Duration** | 2 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 13:00 | **Finish** | Day 3, 15:00 |
| **Dependencies** | E-02, C-01 | **Parallel** | E-05 |
| **Blocking Issues** | None | | |

**Deliverables:** Vercel project linked to `apps/web`; staging env var `NEXT_PUBLIC_API_URL=https://api.staging.stayos.com`; first deployment; `VERCEL_PROJECT_ID` added to GitHub Secrets; CI frontend job triggers Vercel preview on PR

**Acceptance Criteria:** Vercel dashboard shows staging URL. Staging URL loads Next.js scaffold.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM navigates to Vercel staging URL |

---

#### E-07 — Configure SES Domain Verification

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Infrastructure | **Category** | Infrastructure |
| **Phase** | Phase B | **Priority** | P1 |
| **Owner** | DevOps Lead | **Reviewer** | Backend Lead |
| **Duration** | 2h active + up to 72h DNS | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 15:00 | **Finish** | Day 6 (DNS-dependent) |
| **Dependencies** | E-03 (SES enabled in region) | **Parallel** | E-08, E-09, E-10 |
| **Blocking Issues** | DNS propagation is external/uncontrollable | | |

**Deliverables:** `stayos.com` verified in AWS SES; DKIM + SPF DNS records added to registrar; production sending limit increase requested

**Acceptance Criteria:** SES console shows "Verified". Test email from `noreply@stayos.com` lands in inbox (not spam).

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Lead receives test email in inbox |

---

#### E-08 — Configure CloudFront for S3 Listings Bucket

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Infrastructure | **Category** | Infrastructure |
| **Phase** | Phase B | **Priority** | P1 |
| **Owner** | DevOps Lead | **Reviewer** | Web Lead |
| **Duration** | 3 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 4, 09:00 | **Finish** | Day 4, 12:00 |
| **Dependencies** | E-03 | **Parallel** | E-07, E-09, E-10 |
| **Blocking Issues** | None | | |

**Deliverables:** CloudFront distribution for `stayos-listings-staging`; OAC (no public S3 access); HTTPS only; gzip + brotli; TTL 86400s; CloudFront domain in `next.config.mjs` images.domains

**Acceptance Criteria:** Test image via CloudFront URL returns `Cache-Control: max-age=86400`. `pms.unit_photos.url` uses CloudFront domain.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Web Lead confirms image URL domain in DB |

---

#### E-09 — Configure PgBouncer

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Infrastructure | **Category** | Infrastructure |
| **Phase** | Phase B | **Priority** | P1 |
| **Owner** | DevOps Lead | **Reviewer** | Backend Lead |
| **Duration** | 4 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 4, 09:00 | **Finish** | Day 4, 13:00 |
| **Dependencies** | E-03 | **Parallel** | E-07, E-08, E-10 |
| **Blocking Issues** | None | | |

**Deliverables:** PgBouncer as ECS sidecar or service; `pool_mode=transaction`; `max_client_conn=1000`; `default_pool_size=25`; DATABASE_URL in Secrets Manager points to PgBouncer; `POOL_PRE_PING=True` in SQLAlchemy

**Acceptance Criteria:** `psql -h pgbouncer-endpoint` succeeds. `pg_stat_activity` shows PgBouncer as connection source.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Backend Lead queries `pg_stat_activity`, confirms PgBouncer |

---

#### E-10 — Configure WAF on ALB

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Infrastructure | **Category** | Security |
| **Phase** | Phase B | **Priority** | P1 |
| **Owner** | DevOps Lead | **Reviewer** | TPM |
| **Duration** | 3 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 4, 13:00 | **Finish** | Day 4, 16:00 |
| **Dependencies** | E-03 | **Parallel** | E-07, E-08, E-09 |
| **Blocking Issues** | None | | |

**Deliverables:** `aws_wafv2_web_acl` in Terraform; associated with ALB; rule groups: AWSManagedRulesCommonRuleSet, AWSManagedRulesSQLiRuleSet, AWSManagedRulesKnownBadInputsRuleSet; BLOCK mode; rate limit 100 req/IP/5min

**Acceptance Criteria:** `aws wafv2 get-web-acl` returns ACL. SQLi payload to `/api/v1/listings?query=1' OR '1'='1` returns 403.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM confirms 403 on SQLi test |

---

#### E-11 — Configure CloudWatch Alerting

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | Infrastructure | **Category** | DevOps |
| **Phase** | Phase B | **Priority** | P2 |
| **Owner** | DevOps Lead | **Reviewer** | TPM |
| **Duration** | 2 hours | **Risk Level** | 🟢 Low |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 5, 09:00 | **Finish** | Day 5, 11:00 |
| **Dependencies** | E-03 | **Parallel** | E-07, E-08, E-09, E-10 |
| **Blocking Issues** | None | | |

**Deliverables:** CloudWatch alarms: ECS CPU >80% (5min→SNS), ALB 5XX >1% (3min→SNS), RDS CPU >80% (→SNS), Redis memory >75% (→SNS); SNS topic → email to DevOps Lead

**Acceptance Criteria:** 4 alarms in OK state. Trigger 500 manually → ALARM state → email received.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | DevOps Lead triggers test 500, confirms email in inbox |

---

## TRACK F — QA FOUNDATION (6 Tasks)

---

#### F-01 — Playwright E2E Test Infrastructure

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | QA | **Category** | QA |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | QA Lead | **Reviewer** | Web Lead |
| **Duration** | 4 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 1, 13:00 | **Finish** | Day 1, 17:00 |
| **Dependencies** | C-01 (pnpm installed) | **Parallel** | A-11, D-01, B-01 |
| **Blocking Issues** | None | | |

**Deliverables:** `apps/web/playwright.config.ts` (base URL from env, 3 workers, screenshots on fail, video on retry, HTML report); `apps/web/tests/e2e/` directory; 3 projects: smoke (Chromium, 1 worker), web (Chromium+Firefox), mobile (Mobile Chrome+Mobile Safari); `pnpm test:e2e` script

**Acceptance Criteria:** `npx playwright test --project=smoke` runs with "no tests found". Config has no TypeScript errors. `pnpm test:e2e` script in `package.json`.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Web Lead runs `npx playwright test --project=smoke` locally |

---

#### F-02 — Smoke Test: Health Check

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | QA | **Category** | QA |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | QA Lead | **Reviewer** | DevOps Lead |
| **Duration** | 1 hour | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 2, 12:00 | **Finish** | Day 2, 13:00 |
| **Dependencies** | F-01, E-05 (staging live) | **Parallel** | B-02, C-04 |
| **Blocking Issues** | Can be written before staging is live; runs after E-05 | | |

**Deliverables:** `apps/web/tests/e2e/smoke/health.spec.ts`  
**Tests:** `GET /health` → `status === "ok"`; `GET /health/ready` → `database === "ok" && redis === "ok"`; load `/ar/` → title contains "StayOS" + `dir="rtl"`

**Acceptance Criteria:** All 3 tests pass in CI. Runtime < 10 seconds.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | DevOps Lead confirms tests pass in CI run |

---

#### F-03 — Smoke Test: Authentication Flow

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | QA | **Category** | QA |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | QA Lead | **Reviewer** | Web Lead |
| **Duration** | 4 hours | **Risk Level** | 🟠 High |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 13:00 | **Finish** | Day 4, 12:00 |
| **Dependencies** | F-01, E-05, C-05, F-05 | **Parallel** | B-06, E-06 |
| **Blocking Issues** | Staging must be live + auth context must work + test data must be seeded | | |

**Deliverables:** `apps/web/tests/e2e/smoke/auth.spec.ts`; `MOCK_OTP=true` in staging Secrets Manager  
**Test flow:** `/ar/login` → phone `+201000000001` → OTP `123456` → assert redirect → assert user avatar → assert `GET /auth/me` → logout

**Acceptance Criteria:** Auth smoke test passes in CI.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Web Lead reviews test script; CI run shows pass |

---

#### F-04 — Smoke Test: Listing Search

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | QA | **Category** | QA |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | QA Lead | **Reviewer** | Web Lead |
| **Duration** | 2 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 4, 09:00 | **Finish** | Day 4, 11:00 |
| **Dependencies** | F-01, E-05, F-05 | **Parallel** | C-07, C-08, D-07 |
| **Blocking Issues** | Test listing must be seeded (F-05) | | |

**Deliverables:** `apps/web/tests/e2e/smoke/search.spec.ts`  
**Test flow:** unauthenticated `/ar/search?q=Cairo` → assert ≥1 listing card → Arabic title → EGP price format

**Acceptance Criteria:** Search smoke test passes. At least one seed listing returned.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | Web Lead reviews test; CI run shows pass |

---

#### F-05 — Test Data Seeder

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | QA | **Category** | QA |
| **Phase** | Phase A | **Priority** | P0 |
| **Owner** | QA Lead + Backend Lead | **Reviewer** | TPM |
| **Duration** | 4 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 3, 09:00 | **Finish** | Day 3, 13:00 |
| **Dependencies** | E-05 (staging DB live) | **Parallel** | B-08, B-11, C-05 |
| **Blocking Issues** | Staging DB must be live | | |

**Deliverables:** `scripts/seed_staging.py`: admin@stayos.com (role=admin, verified); host@stayos.com (KYC verified); +201000000001 guest (KYC verified); 3 Cairo listings (published/draft/unlisted) with PostGIS coords; 1 completed reservation

**Acceptance Criteria:** `python scripts/seed_staging.py` populates all 5 entities. Idempotent: second run creates no duplicates.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM runs seeder twice, confirms idempotency |

---

#### F-06 — CI Integration: E2E Smoke on Deploy

| Field | Value | Field | Value |
|-------|-------|-------|-------|
| **Track** | QA | **Category** | DevOps |
| **Phase** | Phase A | **Priority** | P1 |
| **Owner** | QA Lead + DevOps Lead | **Reviewer** | TPM |
| **Duration** | 2 hours | **Risk Level** | 🟡 Medium |
| **Status** | Backlog | **% Complete** | 0% |
| **Start** | Day 4, 12:00 | **Finish** | Day 4, 14:00 |
| **Dependencies** | F-02, F-03, F-04, E-05, E-08 | **Parallel** | C-09 |
| **Blocking Issues** | All 3 smoke tests must pass first | | |

**Deliverables:** Updated `.github/workflows/deploy-staging.yml` — post-deploy step runs `npx playwright test --project=smoke`; failure marks deploy failed; HTML report as GitHub Actions artifact

**Acceptance Criteria:** Post-deploy smoke auto-triggers. Smoke failure → deploy workflow fails.

| Commit | PR | Verification |
|--------|----|-------------|
| — | — | TPM merges test commit, confirms workflow runs and smoke passes |

---

---

# SECTION 3 — KANBAN BOARD

> Columns advance left to right. TPM moves tasks between columns daily at 18:00.

---

## Column Definitions

| Column | Meaning | Entry Condition | Exit Condition |
|--------|---------|-----------------|----------------|
| **Backlog** | Not started, dependencies unmet or capacity not available | Default | Dependencies met + owner available |
| **Ready** | Dependencies met, owner available, can start immediately | All deps Done | Owner begins work |
| **In Progress** | Owner actively working | Owner started | Deliverables complete |
| **Blocked** | Cannot proceed — external dependency or missing resource | Blocker identified | Blocker resolved |
| **In Review** | PR open, awaiting peer review | PR opened | Reviewer approves |
| **Testing** | QA / staging verification in progress | Deployed to staging | Acceptance criteria verified |
| **Done** | Accepted, evidence recorded, commit ref captured | Acceptance criteria verified | — |

---

## 3.1 Backlog (all 57 tasks — Day 0 pre-execution)

| Phase | ID | Task | Owner | Priority | Depends On |
|-------|----|------|-------|----------|-----------|
| A | A-01 | Sign STAYOS_IMPLEMENTATION_BASELINE.md | Founder | P0 | None |
| A | A-02 | Resolve Phase 0/1 Governance Conflict | Founder | P0 | None |
| A | A-03 | Mobile Framework Decision | Founder + ML | P0 | Mobile Lead available |
| A | A-04 | AWS Deployment Region Decision | Founder + DevOps | P0 | None |
| A | A-11 | Update Stale Documents | TPM | P2 | A-04 |
| B | A-05 | Decide Email Provider | Backend Lead | P1 | None |
| B | A-07 | Decide Messaging Transport | TPM | P1 | None |
| B | A-08 | Confirm Stripe Scope | Backend Lead | P1 | None |
| C | A-06 | Decide Analytics Provider | Founder | P1 | None (deferred) |
| C | A-09 | Submit WhatsApp Business API Application | TPM / Ops | P0 | Business registration |
| C | A-10 | Register App Store + Play Store | Mobile Lead | P0 | Founder payment |
| A | B-01 | Migration 011: unit_photos | Backend Lead | P0 | None |
| A | B-03 | Migration 012: device_tokens | Backend Lead | P0 | None |
| A | B-05 | Migration 015: analytics events | Backend Lead | P0 | None |
| A | B-07 | Fix Paymob iframe_url in response | Backend Lead | P0 | None |
| A | B-09 | Fix Celery Beat Schedule | Backend Lead | P2 | None |
| A | B-10 | PropertyReadiness Unique Constraint | Backend Lead | P1 | None |
| A | B-04 | Device Token Endpoint | Backend Lead | P0 | B-03 |
| A | B-12 | ADR-015 Compliance Verification | Backend Lead | P1 | None |
| A | B-08 | Wire AWS Secrets Manager | Backend Lead | P0 | E-04 |
| A | B-11 | Lock CORS Origins | Backend Lead | P0 | E-06 |
| A | B-02 | Photo Upload API | Backend Lead | P0 | B-01, E-03 |
| B | B-06 | Wire Email Provider (SES) | Backend Lead | P1 | A-05, E-07 |
| A | C-01 | Project Config and Environment | Web Lead | P0 | None |
| A | C-02 | Tailwind + Design Tokens | Web Lead | P0 | None |
| A | C-03 | i18n and RTL | Web Lead | P0 | C-01 |
| A | C-04 | Typed API Client | Web Lead | P0 | E-05 |
| A | C-05 | Authentication Context | Web Lead | P0 | C-04 |
| A | C-06 | Server State (TanStack Query) | Web Lead | P0 | C-04, C-05 |
| A | C-07 | Layout System | Web Lead | P0 | C-02, C-03 |
| A | C-08 | Error Handling + Loading States | Web Lead | P1 | C-04, C-06 |
| B | C-09 | Frontend Unit Test Config | Web Lead | P1 | C-01 |
| A | D-01 | Framework Scaffold | Mobile Lead | P0 | A-03 |
| A | D-02 | Navigation Architecture | Mobile Lead | P0 | D-01 |
| A | D-03 | Localization RTL | Mobile Lead | P0 | D-01 |
| A | D-04 | Theme System | Mobile Lead | P0 | D-01 |
| A | D-05 | Mobile API Client | Mobile Lead | P0 | D-01, E-05 |
| A | D-06 | Mobile Auth Context | Mobile Lead | P0 | D-05 |
| B | D-07 | Push Notification SDK | Mobile Lead | P1 | D-01, A-10 |
| A | D-08 | Mobile CI Pipeline | DevOps + ML | P0 | A-03, D-01 |
| A | E-01 | Resolve Terraform Config | DevOps Lead | P0 | A-04 |
| A | E-02 | Configure GitHub Secrets | DevOps Lead | P0 | None |
| A | E-03 | Provision Staging Infrastructure | DevOps Lead | P0 | E-01, E-02 |
| A | E-04 | Secrets Manager Population | DevOps Lead | P0 | E-03 |
| A | E-05 | First Backend Deployment | DevOps Lead | P0 | E-03, E-04, B-08 |
| A | E-06 | Vercel Project + Deploy | DevOps + Web | P0 | E-02, C-01 |
| B | E-07 | SES Domain Verification | DevOps Lead | P1 | E-03 |
| B | E-08 | CloudFront for S3 | DevOps Lead | P1 | E-03 |
| B | E-09 | PgBouncer | DevOps Lead | P1 | E-03 |
| B | E-10 | WAF on ALB | DevOps Lead | P1 | E-03 |
| B | E-11 | CloudWatch Alerting | DevOps Lead | P2 | E-03 |
| A | F-01 | Playwright E2E Infrastructure | QA Lead | P0 | C-01 |
| A | F-02 | Smoke: Health Check | QA Lead | P0 | F-01, E-05 |
| A | F-03 | Smoke: Authentication Flow | QA Lead | P0 | F-01, E-05, C-05, F-05 |
| A | F-04 | Smoke: Listing Search | QA Lead | P0 | F-01, E-05, F-05 |
| A | F-05 | Test Data Seeder | QA + Backend | P0 | E-05 |
| A | F-06 | CI Smoke on Deploy | QA + DevOps | P1 | F-02, F-03, F-04, E-05 |

---

## 3.2 Ready Day 1 (tasks with no blocking dependencies)

| ID | Task | Owner | Duration |
|----|------|-------|----------|
| A-01 | Sign Baseline | Founder | 15 min |
| A-02 | Governance Conflict | Founder | 30 min |
| A-03 | Mobile Framework | Founder + ML | 90 min |
| A-04 | AWS Region | Founder + DevOps | 30 min |
| B-01 | Migration 011 | Backend Lead | 2h |
| B-03 | Migration 012 | Backend Lead | 1h |
| B-05 | Migration 015 | Backend Lead | 2h |
| B-07 | Paymob Fix | Backend Lead | 3h |
| B-09 | Celery Beat | Backend Lead | 1h |
| C-01 | Project Config | Web Lead | 3h |
| C-02 | Tailwind | Web Lead | 1 day |
| E-02 | GitHub Secrets | DevOps Lead | 4h |
| F-01 | Playwright | QA Lead | 4h |

---

## 3.3 In Progress

*Empty — pre-execution. Move tasks here as work begins.*

---

## 3.4 Blocked (pre-execution blockers)

| ID | Task | Blocked On | Blocker SLA |
|----|------|-----------|-------------|
| D-01 | Scaffold | A-03 (Mobile Lead + Framework) | Day 1, 11:30 |
| E-01 | Terraform Fix | A-04 (Region Decision) | Day 1, 12:00 |
| D-02–D-08 | Track D (all) | D-01 | Day 1, 17:00 |
| E-03 | Provision Infra | E-01 + E-02 | Day 1, 18:00 |
| E-04 | Secrets Manager | E-03 | Day 3, 09:00 |
| B-08 | Wire Secrets | E-04 | Day 3, 12:00 |
| E-05 | First Deploy | E-03, E-04, B-08 | Day 3, 18:00 |
| C-04 | Typed API Client | E-05 | Day 3, 18:00 |
| F-05 | Test Seeder | E-05 | Day 3, 18:00 |
| B-02 | Photo Upload API | B-01, E-03 | Day 3 |
| B-11 | CORS Fix | E-06 | Day 3 |
| F-03 | Auth E2E | C-05, F-05 | Day 4 |

---

## 3.5 In Review / Testing / Done

*Empty — pre-execution*

---

# SECTION 4 — CRITICAL PATH VIEW

---

## 4.1 Primary Critical Path (must not slip)

```
DAY 1 ─────────────────────────────────────────────────────────────────────
 09:00  A-01 (15m) → SIGNED BASELINE
 09:15  A-02 (30m) → DEC-011 committed
 10:00  A-03 (90m) → ADR-016 committed → D-01 unblocked
 11:30  A-04 (30m) → Region decided → E-01 unblocked
 13:00  E-01 (4h)  → Terraform fixed
         E-02 (4h)  → GitHub Secrets configured  [parallel]
 18:00  GATE: All governance decisions committed. All tracks unblocked.

DAY 2 ─────────────────────────────────────────────────────────────────────
 09:00  E-03 begins → terraform apply (1 day duration)
        Backend Lead: B-04, B-10, B-12
        Web Lead: C-03, C-04 (waiting)
        Mobile Lead: D-02, D-03, D-04

DAY 3 ─────────────────────────────────────────────────────────────────────
 12:00  E-03 → STAGING PROVISIONED
 12:00  E-04 (2h) → Secrets Manager populated
         B-08 (parallel, after E-04) → Secrets wired in code
         F-05 (parallel) → Test data seeded
 18:00  E-05 → FIRST DEPLOYMENT LIVE (/health 200)
         E-06 → Vercel staging deployed  [parallel]
 18:00  GATE: Staging live. QA and integration unblocked.

DAY 4 ─────────────────────────────────────────────────────────────────────
 09:00  C-04, C-05, C-06 (Web Lead)
        D-05, D-06 (Mobile Lead, after E-05)
        F-03, F-04 begin (QA Lead, after F-05)

DAY 5 ─────────────────────────────────────────────────────────────────────
 10:00  MID-POINT GATE: EXIT-01 through EXIT-12 verified
 17:00  F-03, F-04 → E2E smoke tests passing

DAY 7 ─────────────────────────────────────────────────────────────────────
 17:00  F-06 → Smoke runs in CI post-deploy
         EXIT-21 VERIFIED → Sprint 0 smoke gate cleared

DAY 10 ────────────────────────────────────────────────────────────────────
 12:00  All Phase A tasks Done
 17:00  EXIT-01 through EXIT-22 all Verified
 18:00  EXIT-22: Sprint 1 board live → SPRINT 0 CLOSED
```

---

## 4.2 Gating Tasks (zero float — slip = sprint slips)

| # | Gate | ID | Task | Target | Float |
|---|------|----|------|--------|-------|
| G-01 | Mandate | A-01+A-02 | Sign + Resolve governance | Day 1, 09:45 | 0 |
| G-02 | Region | A-04 | AWS region decided | Day 1, 12:00 | 0 |
| G-03 | Terraform | E-01 | Terraform config clean | Day 1, 18:00 | 0 |
| G-04 | Secrets | E-02 | GitHub Secrets configured | Day 1, 18:00 | 0 |
| G-05 | Infra | E-03 | Staging provisioned | Day 3, 12:00 | 0 |
| G-06 | SM | E-04 | Secrets Manager populated | Day 3, 12:00 | 0 |
| G-07 | Code | B-08 | Secrets wired | Day 3, 13:00 | 0 |
| G-08 | Deploy | E-05 | First deployment live | Day 3, 18:00 | 0 |
| G-09 | Data | F-05 | Test data seeded | Day 3, 18:00 | 0 |
| G-10 | E2E | F-03+F-04 | Smoke tests passing | Day 5, 17:00 | 0 |
| G-11 | CI | F-06 | Smoke runs in CI | Day 7, 17:00 | 0 |
| G-12 | EXIT | EXIT-21 | Playwright smoke 3/3 green | Day 7 | 0 |
| G-13 | Close | EXIT-22 | Sprint 1 board created | Day 10, 18:00 | 0 |

---

## 4.3 Parallel Tracks by Day

| Day | Track A | Track B | Track C | Track D | Track E | Track F |
|-----|---------|---------|---------|---------|---------|---------|
| 1 | A-01, A-02, A-03, A-04 | B-01, B-03, B-05, B-07, B-09 | C-01, C-02 | D-01 | E-01, E-02 | F-01 |
| 2 | A-05,A-07,A-08,A-09,A-10 | B-04,B-10,B-12 | C-03 | D-02,D-03,D-04 | E-03 (apply) | F-02 (write) |
| 3 | A-11 | B-08, B-11 | C-04 (after E-05) | — | E-04,E-05,E-06 | F-05 |
| 4 | — | B-02,B-06 | C-05,C-06,C-07,C-08 | D-05,D-06,D-07,D-08 | E-07,E-08,E-09,E-10 | F-03,F-04,F-06 |
| 5 | — | B-12 finalize | C-09 | D-08 complete | E-11 | — |
| 6–7 | — | — | C-07 complete | — | E-07 (DNS) | — |
| 8–10 | — | — | — | — | — | EXIT verify |

---

# SECTION 5 — TEAM VIEW

---

## 5.1 Founder (≤ 2h 45m Day 1; async only thereafter)

| Time | Task | Duration |
|------|------|----------|
| Day 1, 09:00 | A-01: Sign Baseline | 15 min |
| Day 1, 09:15 | A-02: Resolve governance conflict | 30 min |
| Day 1, 10:00 | A-03: Mobile framework decision | 90 min |
| Day 1, 11:30 | A-04: AWS region decision | 30 min |
| Day 1, 13:00 | A-09: Authorize WhatsApp app submission | 30 min |
| Day 1, 13:00 | A-10: Authorize store account payment | 30 min |
| Sprint 1 W1 | A-06: Analytics provider | 30 min |
| **Day 1 Total** | | **2h 45m** |

**Delegated (async approval, no calendar block required):** A-05, A-07, A-08

---

## 5.2 TPM

| Days | Tasks | Daily Duty |
|------|-------|------------|
| Day 1 | A-07, A-08 (record), A-09 (submit), A-11 | Board update 18:00 |
| Day 2 | — | Stand-up, blocker tracking |
| Day 3 | — | Verify E-05 (first deploy) |
| Day 5 | Mid-point gate (EXIT-01–12) | Milestone report |
| Day 7 | EXIT-21 verification | CI smoke confirm |
| Day 10 | EXIT-22 (Sprint 1 board) | Sprint 0 close |
| All days | Stand-up 09:00, end-of-day report 18:00 | Cadence |

---

## 5.3 Backend Lead (12 tasks — heaviest track)

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | B-01, B-03, B-05, B-07, B-09 | ~8h |
| 2 | B-04, B-10, B-12 | ~4h |
| 3 | B-08 (CP), B-11 | ~5h |
| 4–5 | B-02 (1 day), B-06 (start) | ~8h |
| 6–7 | B-06 (complete) | ~4h |

---

## 5.4 Web Lead (9 tasks)

| Day | Tasks | Hours |
|-----|-------|-------|
| 1–2 | C-01, C-02 | ~9h |
| 2–3 | C-03 | ~8h |
| 3 | C-04 (after E-05) | ~8h |
| 4 | C-05, C-06, C-08 | ~10h |
| 4–5 | C-07 | ~8h |
| 4 | C-09 | ~3h |

---

## 5.5 Mobile Lead (8 tasks + joint A-03, A-10)

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 AM | A-03 joint | 90 min |
| 1 PM | D-01, A-10 joint | ~5h |
| 2 | D-02, D-03, D-04 | ~9h |
| 3 | D-05 (after E-05) | ~8h |
| 4 | D-06, D-07 | ~9h |
| 4–5 | D-08 (joint DevOps) | ~8h |

---

## 5.6 DevOps Lead (11 infra tasks + D-08 joint)

| Day | Tasks | Hours | Priority |
|-----|-------|-------|----------|
| 1 | E-01 (CP), E-02 (CP) | ~8h | P0 |
| 2–3 | E-03 (terraform apply) | ~8h | P0 CP |
| 3 | E-04 (CP), E-05 (CP), E-06 | ~8h | P0 |
| 4 | E-07, E-08, E-09, E-10, D-08 | ~10h | P1 |
| 5 | E-11 | ~2h | P2 |

---

## 5.7 QA Lead (6 tasks + EXIT verification Days 5–10)

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | F-01 | 4h |
| 2 | F-02 (write) | 1h |
| 3 | F-05 (joint Backend) | 4h |
| 3–4 | F-03, F-04 | 6h |
| 4–5 | F-06 (joint DevOps) | 2h |
| 5–10 | EXIT verification | ongoing |

---

# SECTION 6 — DAILY OPERATIONS

---

## 6.1 Daily Stand-up Protocol (09:00 — 15 minutes max)

```
Each team member answers three questions:
  1. What tasks did I complete since yesterday? (ID + commit ref)
  2. What am I working on today? (ID + expected finish time)
  3. Do I have any blockers? (description + who can unblock me)

TPM actions:
  - Record any new blockers in Section 1.5 immediately
  - Assign owner + SLA to every open blocker before stand-up ends
  - Flag any critical path task that did not complete on schedule
```

---

## 6.2 Blocker Resolution Protocol

| Severity | Definition | SLA | Escalation |
|----------|-----------|-----|------------|
| **Critical** | Blocks a critical path task (G-01 through G-13) | 4 hours | TPM → Founder, direct call |
| **High** | Blocks a P0 non-CP task | 8 hours | TPM notification |
| **Medium** | Blocks a P1 task | 24 hours | Stand-up flag |
| **Low** | Blocks a P2 task | 48 hours | Async message |

**Lifecycle:** Identified → Assigned → Resolving → Resolved → Removed from Section 1.5

---

## 6.3 Post-Deployment Integration Checklist (Day 3 onward)

Run after every staging deployment:

```
[ ] curl https://api.staging.stayos.com/health
    Expected: {"status":"ok","database":"ok","redis":"ok"}
[ ] alembic current → latest revision hash
[ ] ECS task restart count = 0 in past 15 minutes
[ ] CloudWatch: no ERROR burst in past 5 minutes
[ ] Vercel staging URL loads (if frontend deployed)
[ ] pnpm type-check passes (if frontend code changed)
[ ] pytest --co → no collection errors
```

---

## 6.4 End-of-Day Report (18:00 — TPM posts to team channel)

```
=== SPRINT 0 | DAY [N] | [DATE] ===

COMPLETED TODAY:
  - [Task ID] [Task Name] — [commit ref or evidence]

IN PROGRESS:
  - [Task ID] [Task Name] — [% complete, expected finish]

NEWLY BLOCKED:
  - [BLK-XX] [description] — Owner: [name] SLA: [day/time]

BLOCKERS RESOLVED:
  - [BLK-XX] [resolution summary]

CRITICAL PATH: [On Track / At Risk: N days slip / Slipped: moved to Day X]

TOMORROW'S TOP 3:
  1. [Task ID] — [why it's the priority]
  2. [Task ID] — [why]
  3. [Task ID] — [why]
```

---

## 6.5 Mid-Point Gate Checklist (Day 5, 10:00)

| # | Check | Pass Condition | Status |
|---|-------|---------------|--------|
| 1 | EXIT-01 | Baseline signed + commit on main | — |
| 2 | EXIT-02 | DEC-011 in DECISION_LOG.md | — |
| 3 | EXIT-03 | ADR-016 merged, status: Accepted | — |
| 4 | EXIT-04 | Region in variables.tf | — |
| 5 | EXIT-05 | `/health` returns 200 | — |
| 6 | EXIT-06 | All migrations applied on staging | — |
| 7 | EXIT-07 | CI green on main | — |
| 8 | EXIT-08 | First staging deploy via CI | — |
| 9 | EXIT-09 | Vercel staging URL accessible | — |
| 10 | EXIT-10 | `/ar/` RTL + `/en/` LTR confirmed | — |
| 11 | EXIT-11 | Typed API client compiles | — |
| 12 | EXIT-12 | OTP login → refresh → protected route | — |
| 13 | All 6 blockers | BLK-01 through BLK-06 resolved | — |

**Decision rule:** <10/13 passed → TPM raises escalation to Founder same day.

---

## 6.6 Sprint Close Checklist (Day 10, 17:00)

| # | EXIT | Verified By | Evidence Required |
|---|------|-------------|-------------------|
| 1 | EXIT-01 | TPM | Commit hash on main |
| 2 | EXIT-02 | TPM | DEC-011 entry |
| 3 | EXIT-03 | TPM | ADR-016 file |
| 4 | EXIT-04 | DevOps Lead | variables.tf diff |
| 5 | EXIT-05 | QA Lead | curl output |
| 6 | EXIT-06 | QA Lead | `alembic current` output |
| 7 | EXIT-07 | TPM | CI run URL |
| 8 | EXIT-08 | TPM | Deploy run URL |
| 9 | EXIT-09 | QA Lead | Vercel URL screenshot |
| 10 | EXIT-10 | QA Lead | `/ar/` + `/en/` screenshot |
| 11 | EXIT-11 | Backend Lead | `pnpm type-check` log |
| 12 | EXIT-12 | QA Lead | Playwright report |
| 13 | EXIT-13 | QA Lead | Simulator screenshot |
| 14 | EXIT-14 | QA Lead | Network log showing `/health` |
| 15 | EXIT-15 | QA Lead | Simulator screenshot OTP screen |
| 16 | EXIT-16 | QA Lead | pytest output |
| 17 | EXIT-17 | QA Lead | `\dt analytics.*` output |
| 18 | EXIT-18 | DevOps Lead | ECS startup log |
| 19 | EXIT-19 | QA Lead | API response JSON |
| 20 | EXIT-20 | DevOps Lead | curl origin test output |
| 21 | EXIT-21 | TPM | Playwright CI run URL |
| 22 | EXIT-22 | Founder | Sprint 1 board URL |

---

# SECTION 7 — DELIVERABLES REGISTER

---

## 7.1 Governance Deliverables

| ID | Deliverable | File / Location | Owner | Due Day | Evidence |
|----|-------------|----------------|-------|---------|---------|
| DEL-A01 | Signed STAYOS_IMPLEMENTATION_BASELINE.md | `STAYOS_IMPLEMENTATION_BASELINE.md` | Founder | 1 | Commit on main |
| DEL-A02 | DEC-011 | `.ai/CURRENT/DECISION_LOG.md` | Founder | 1 | Entry present |
| DEL-A03 | ADR-016 (mobile framework) | `docs/architecture/adr/ADR-016-*.md` | Founder + ML | 1 | Status: Accepted |
| DEL-A04 | Region in variables.tf | `infra/terraform/variables.tf` | DevOps | 1 | terraform validate |
| DEL-A05 | DEC-012 (email) | `.ai/CURRENT/DECISION_LOG.md` | Backend Lead | 1 | Entry present |
| DEL-A06 | DEC-013 (analytics) | `.ai/CURRENT/DECISION_LOG.md` | Founder | Sprint 1 | Entry present |
| DEL-A07 | DEC-014 (messaging) | `.ai/CURRENT/DECISION_LOG.md` | TPM | 1 | Entry present |
| DEL-A08 | DEC-015 (Stripe scope) | `.ai/CURRENT/DECISION_LOG.md` | Backend Lead | 1 | Entry present |
| DEL-A09 | WhatsApp Business API application | External (Meta) | TPM | 1 | Reference number |
| DEL-A10 | App Store + Play Store accounts | External | ML + Founder | 1 | Account IDs recorded |
| DEL-A11 | Stale document banners | `TECH_STACK.md`, `ARCHITECTURE.md` | TPM | 1 | Visual confirm |

---

## 7.2 Backend Deliverables

| ID | Deliverable | File | Owner | Due Day | Test |
|----|-------------|------|-------|---------|------|
| DEL-B01 | Migration 011 (unit_photos) | `alembic/versions/011_*.py` | BL | 1 | upgrade + downgrade |
| DEL-B02 | Migration 012 (device_tokens) | `alembic/versions/012_*.py` | BL | 1 | upgrade + downgrade |
| DEL-B03 | Migration 015 (analytics) | `alembic/versions/015_*.py` | BL | 1 | 3 tables in staging |
| DEL-B04 | Photo upload API (3 endpoints) | `src/app/listings/` | BL | 4 | pytest -k photo |
| DEL-B05 | Device token endpoint | `src/app/auth/router.py` | BL | 2 | Auth tests |
| DEL-B06 | Fixed ReservationCreateResponse | `src/app/reservations/schemas.py` | BL | 1 | Field in response |
| DEL-B07 | AWS Secrets Manager client | `src/app/security/secrets.py` | BL | 3 | ECS startup log |
| DEL-B08 | SES email provider | `src/app/notifications/` | BL | 7 | Send test email |
| DEL-B09 | Celery Beat schedule fix | `src/app/celery_app.py` | BL | 1 | Beat schedule dict |
| DEL-B10 | Migration 016 (unique constraint) | `alembic/versions/016_*.py` | BL | 1 | 409 on duplicate |
| DEL-B11 | CORS locked | `src/app/shared/middleware.py` | BL | 3 | curl origin test |
| DEL-B12 | ADR-015 audit report | PR description | BL | 2 | TPM reads report |

---

## 7.3 Frontend Deliverables

| ID | Deliverable | File | Owner | Due Day | Verification |
|----|-------------|------|-------|---------|-------------|
| DEL-C01 | next.config.mjs | `apps/web/next.config.mjs` | WL | 1 | pnpm build |
| DEL-C02 | .env.local.example | `apps/web/.env.local.example` | WL | 1 | Matches staging |
| DEL-C03 | tailwind.config.ts + globals.css | `apps/web/tailwind.config.ts` | WL | 2 | Visual on staging |
| DEL-C04 | i18n.ts + ar.json + en.json | `apps/web/i18n.ts` + messages/ | WL | 2 | RTL on /ar/ |
| DEL-C05 | generated.ts (typed API client) | `apps/web/lib/api/generated.ts` | WL | 3 | pnpm type-check |
| DEL-C06 | AuthContext + useAuth() | `apps/web/lib/auth/context.tsx` | WL | 4 | F-03 E2E |
| DEL-C07 | QueryClient + useListings() | `apps/web/lib/query/client.ts` | WL | 4 | type-check |
| DEL-C08 | Layouts + Header + Footer | `apps/web/app/[locale]/layout.tsx` | WL | 5 | Visual staging |
| DEL-C09 | ErrorBoundary + Skeleton | `apps/web/components/ui/` | WL | 4 | Error trigger |
| DEL-C10 | vitest.config.ts + first test | `apps/web/vitest.config.ts` | WL | 4 | pnpm test green |

---

## 7.4 Mobile Deliverables

| ID | Deliverable | Location | Owner | Due Day | Verification |
|----|-------------|---------|-------|---------|-------------|
| DEL-D01 | Mobile scaffold | `apps/mobile/` | ML | 1 | Runs on simulator |
| DEL-D02 | 40 stub navigation screens | `apps/mobile/` | ML | 2 | No crash on tap |
| DEL-D03 | Localization files (ar + en) | `apps/mobile/lib/l10n/` | ML | 2 | Zero hardcoded strings |
| DEL-D04 | Theme file | `apps/mobile/lib/theme/` | ML | 2 | Colors + fonts correct |
| DEL-D05 | Mobile API client | `apps/mobile/lib/services/` | ML | 3 | /health call success |
| DEL-D06 | Auth provider / store | `apps/mobile/lib/providers/` | ML | 4 | Session persists |
| DEL-D07 | FCM SDK integration | `apps/mobile/` | ML | 4 | Test push received |
| DEL-D08 | mobile-ci.yml | `.github/workflows/mobile-ci.yml` | DL+ML | 5 | CI green |

---

## 7.5 Infrastructure Deliverables

| ID | Deliverable | Location | Owner | Due Day | Verification |
|----|-------------|---------|-------|---------|-------------|
| DEL-E01 | Fixed Terraform (rds + ecs + staging.tfvars) | `infra/terraform/` | DL | 1 | terraform validate |
| DEL-E02 | 15 GitHub Actions Secrets | GitHub Settings | DL | 1 | Secrets count |
| DEL-E03 | Staging infrastructure (VPC, RDS, Redis, ECS, S3, ALB) | AWS | DL | 3 | terraform output |
| DEL-E04 | stayos/staging/app-secrets (16 values) | AWS Secrets Manager | DL | 3 | get-secret-value |
| DEL-E05 | Docker image + ECS task live | ECR + ECS | DL | 3 | /health 200 |
| DEL-E06 | Vercel project + first deploy | Vercel | DL+WL | 3 | Staging URL loads |
| DEL-E07 | SES stayos.com verified + DKIM/SPF | AWS SES + DNS | DL | 6 | Test email inbox |
| DEL-E08 | CloudFront on S3 listings bucket | AWS CloudFront | DL | 4 | Image via CDN |
| DEL-E09 | PgBouncer (transaction mode) | ECS / EC2 | DL | 4 | pg_stat_activity |
| DEL-E10 | WAF ACL on ALB (3 rule groups) | AWS WAF | DL | 4 | SQLi test → 403 |
| DEL-E11 | 4 CloudWatch alarms + SNS email | AWS CloudWatch | DL | 5 | Test alarm email |

---

## 7.6 QA Deliverables

| ID | Deliverable | File | Owner | Due Day | Verification |
|----|-------------|------|-------|---------|-------------|
| DEL-F01 | playwright.config.ts (3 projects) | `apps/web/playwright.config.ts` | QL | 1 | No TS errors |
| DEL-F02 | health.spec.ts (3 tests) | `apps/web/tests/e2e/smoke/` | QL | 2 | Pass in CI |
| DEL-F03 | auth.spec.ts (OTP flow) | `apps/web/tests/e2e/smoke/` | QL | 4 | Pass in CI |
| DEL-F04 | search.spec.ts (Cairo search) | `apps/web/tests/e2e/smoke/` | QL | 4 | Pass in CI |
| DEL-F05 | seed_staging.py (5 entities, idempotent) | `scripts/seed_staging.py` | QL+BL | 3 | Second run = no dup |
| DEL-F06 | deploy-staging.yml (smoke on deploy) | `.github/workflows/` | QL+DL | 5 | Auto-triggers |

---

# SECTION 8 — RISK DASHBOARD

---

## 8.1 Risk Status Summary

| Level | Count | Status |
|-------|-------|--------|
| 🔴 Critical | 6 | All Open |
| 🟠 High | 9 | All Open |
| 🟡 Medium | 4 | All Open |
| **Total** | **19** | **19 Open** |

---

## 8.2 Critical Risk Register

| ID | Risk | Prob | Impact | Owner | Mitigation Task | Contingency | Escalation Trigger |
|----|------|------|--------|-------|----------------|-------------|-------------------|
| R-C01 | AWS region conflict causes Terraform failure | High | High | DevOps Lead | A-04 + E-01 Day 1 | Manual region patch before terraform apply | A-04 not done by Day 1, 13:00 |
| R-C02 | Unsigned baseline — no engineering mandate | High | High | Founder | A-01 Day 1, 09:00 | Record verbal authorization; countersign within 24h | A-01 not done by Day 1, 10:00 |
| R-C03 | Phase 0 gate challenge halts all engineering | Medium | Critical | Founder | A-02 Day 1 — DEC-011 unambiguous | Sprint 0 proceeds on infra-only scope | A-02 produces hedged decision |
| R-C04 | No Mobile Lead hired — Track D fully blocked | Medium | High | Founder | Founder identifies ML before Day 1 | Web Lead scaffolds minimal RN project | Mobile Lead not identified Day 1, 09:00 |
| R-C05 | PostGIS missing from RDS parameter group | High | High | DevOps Lead | E-01 adds parameter group | Destroy + recreate RDS (2–4h delay) | E-01 PR missing parameter group |
| R-C06 | Secrets Manager stub causes startup failure | High | High | Backend Lead | B-08 replaces stub | Emergency env var fallback for 1 deploy | E-05 fails with SM connection error |

---

## 8.3 High Risk Register

| ID | Risk | Prob | Impact | Owner | Mitigation | Contingency | Escalation Trigger |
|----|------|------|--------|-------|-----------|-------------|-------------------|
| R-H01 | CORS wildcard in production | High | High | Backend Lead | B-11 Day 3 | Hotfix: force CORS_ORIGINS env var override | Staging returns `*` after E-05 |
| R-H02 | Twilio OTP down — registration blocked | Medium | High | Backend Lead | MOCK_OTP=true in staging | Add SMS provider failover in Sprint 1 | F-03 fails with Twilio 503 |
| R-H03 | Paymob sandbox unreliable | Medium | High | Backend Lead | Seed existing reservation; mock in tests | Defer payment E2E to Sprint 3 | F-03 fails on payment step |
| R-H04 | Mobile CI builds >30 min | Medium | Medium | DevOps Lead | D-08 uses caching + parallel jobs | Split iOS/Android into separate workflows | D-08 CI run >30 min |
| R-H05 | RDS provisioning fails on first apply | Medium | High | DevOps Lead | terraform validate + plan before apply | Rollback plan; destroy partial resources | terraform apply exits non-zero |
| R-H06 | WhatsApp approval >8 weeks | High | Medium | TPM | A-09 Day 1; SMS fallback for Beta | SMS-only Beta release | Not received 6 weeks before Beta |
| R-H07 | ADR-015 columns missing from existing schema | Medium | High | Backend Lead | B-12 audits Day 2 | Add patch migration immediately | B-12 finds missing column |
| R-H08 | SES DNS propagation >72h | High | Medium | DevOps Lead | E-07 initiated Day 3 | Use SMTP fallback for first Beta emails | SES unverified by Day 6 |
| R-H09 | Next.js Vercel deploy fails on first push | Low | High | Web Lead | E-06 links project before first PR | Deploy from CLI manually | Vercel build fails on first push |

---

## 8.4 Medium Risk Register

| ID | Risk | Prob | Impact | Owner | Mitigation | Contingency | Escalation Trigger |
|----|------|------|--------|-------|-----------|-------------|-------------------|
| R-M01 | Test coverage drops below 80.42% | Medium | Medium | QA Lead | C-09 + B-02 tests add coverage | Temporary waiver; coverage target Sprint 1 | pytest --cov <80.42% |
| R-M02 | 10MB photo limit too restrictive | Low | Medium | Backend Lead | B-02 enforces per ADR spec; validate Sprint 1 | Raise to 20MB via config flag Sprint 1 | User research shows friction |
| R-M03 | Arabic strings incomplete | Medium | Medium | ML + WL | D-03 + C-03 deliver ≥20 keys each | Fallback to English for missing keys with TODO label | QA finds untranslated element |
| R-M04 | Sprint 0 scope creep | Low | Medium | TPM | Change Control Section 9 gates all requests | Reject request; log for Sprint 1 backlog | Any team member adds a task outside these 57 |

---

## 8.5 Risk Actions This Week

| Priority | Action | Owner | By When |
|----------|--------|-------|---------|
| 1 | Confirm Mobile Lead hired before Day 1 | Founder | Before Day 1 |
| 2 | Run `terraform validate` before Day 1 end | DevOps Lead | Day 1, 17:00 |
| 3 | Confirm PostGIS param group in E-01 PR | Backend Lead | Day 1 review |
| 4 | Confirm MOCK_OTP available in Twilio Verify | Backend Lead | Day 1 |
| 5 | Initiate A-09 WhatsApp submission | TPM | Day 1, 13:00 |

---

# SECTION 9 — CHANGE CONTROL

---

## 9.1 Policy

| Rule | Detail |
|------|--------|
| Architecture Freeze | ADR-001 through ADR-015 cannot be modified. Any reopening requires Founder + TPM written decision. |
| Scope Freeze | These 57 tasks are final. New task requires: (a) Founder approval, (b) a corresponding task removed or deferred. |
| Priority Changes | P1↔P2: TPM authority. P0 changes: Founder approval required within 4h. |
| No Verbal Changes | All changes must be logged here before implementation begins. |
| Emergency Exception | Critical blocker hotfix may proceed; CR entry required within 4 hours of action. |

---

## 9.2 Change Request Template

```
CR-ID:          CR-XXX
Date:           YYYY-MM-DD
Day:            Day N
Requested By:   [Name — Role]
Type:           Scope Addition | Priority Change | Dependency Change | Emergency Fix | Other
Description:    [One paragraph: what is changing and what the change does]
Justification:  [Why this change is necessary now, not after Sprint 0]
Impact on CP:   [None | Delays Gate G-XX by N hours/days]
EXIT Impact:    [None | Modifies EXIT-XX | Adds new criterion]
Tasks Affected: [List of task IDs]
Tasks Removed:  [List of task IDs removed to make room, if scope addition]
Approved By:    [Founder | TPM]
Approval Date:  —
Status:         Pending | Approved | Rejected
Implementation Note: [If approved, any instruction for implementer]
```

---

## 9.3 Change Log

| CR-ID | Date | Type | Summary | Requested By | Status | Approved By |
|-------|------|------|---------|-------------|--------|-------------|
| — | — | — | No changes yet | — | — | — |

---

## 9.4 What Does NOT Require Change Control

- Updating Status, %, Evidence, Commit, PR in any task row
- Recording resolved blockers
- Moving tasks between Kanban columns
- Daily end-of-day board updates
- Marking EXIT criteria as Verified

---

---

# SECTION 10 — EXECUTION HISTORY

> Immutable chronological log. No entry is ever deleted. Append only.  
> Updated by task owner at every status change; TPM validates at 18:00.

---

## 10.1 Log Format Reference

| Field | Description |
|-------|-------------|
| **EVT-ID** | Sequential event number (EVT-001, EVT-002…) |
| **Date** | YYYY-MM-DD |
| **Time** | HH:MM local |
| **Task ID** | A-01 through F-06 (or BOARD / SPRINT) |
| **Action** | Started · Blocked · Resumed · Sent to Review · Returned · Tested · Completed · Reopened · Cancelled |
| **Prev Status** | Column before this event |
| **New Status** | Column after this event |
| **Owner** | Person who performed the action |
| **Notes** | Context, what happened, why |
| **Evidence** | URL, file path, log excerpt, screenshot path |
| **PR** | GitHub PR number (if applicable) |
| **Commit** | Git commit SHA (if applicable) |

---

## 10.2 Execution Log

| EVT-ID | Date | Time | Task ID | Action | Prev Status | New Status | Owner | Notes | Evidence | PR | Commit |
|--------|------|------|---------|--------|-------------|------------|-------|-------|----------|----|--------|
| EVT-001 | 2026-07-29 | 00:00 | BOARD | Created | — | Active | TPM | MASTER_EXECUTION_BOARD_v2.0.md created. All 57 tasks loaded. 22 EXIT criteria set. 19 risks open. 6 pre-execution blockers. | `MASTER_EXECUTION_BOARD_v2.0.md` | — | — |
| EVT-002 | — | — | — | — | — | — | — | *(next event)* | — | — | — |

> **Instruction for daily use:** Add one row per status change. Never overwrite existing rows. Increment EVT-ID sequentially.

---

## 10.3 Significant Events Log (non-task events)

| EVT-ID | Date | Time | Category | Event | Owner | Notes |
|--------|------|------|----------|-------|-------|-------|
| SIG-001 | 2026-07-29 | 00:00 | Governance | Sprint 0 board activated — Day 0 pre-execution | TPM | MASTER_EXECUTION_BOARD_v2.0.md becomes official operational system |
| SIG-002 | — | — | — | *(next significant event)* | — | — |

---

# SECTION 11 — EXECUTIVE DECISION LOG

> All execution-phase decisions tracked here. Decisions made in planning phase (DEC-001 through DEC-010) are recorded in `.ai/CURRENT/DECISION_LOG.md`. Sprint 0 operational decisions begin at DEC-011.

---

## 11.1 Decision Format Reference

| Field | Description |
|-------|-------------|
| **Decision ID** | DEC-011 onward (sequential) |
| **Date** | YYYY-MM-DD |
| **Decision** | What was decided |
| **Requested By** | Who raised the need for this decision |
| **Approved By** | Who has authority to approve |
| **Impact** | What changes as a result |
| **Affected Tasks** | Task IDs unblocked or modified |
| **Reason** | Why this decision was necessary |
| **Status** | Pending · Approved · Rejected · Superseded |

---

## 11.2 Sprint 0 Decision Register

---

#### DEC-011 — Resolve Phase 0 / Phase 1 Governance Conflict

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-011 |
| **Date** | — (Day 1) |
| **Decision** | — (pending Founder) |
| **Requested By** | TPM |
| **Approved By** | Founder |
| **Impact** | Resolves BLK-02; unblocks engineering mandate for FC-01–FC-07 |
| **Affected Tasks** | A-02, all 57 tasks (mandate) |
| **Reason** | FC-01–FC-07 implemented while Phase 0 gates officially uncleared |
| **Status** | 🔴 Pending — Required Day 1, 09:45 |

---

#### DEC-012 — Email Provider Selection

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-012 |
| **Date** | — (Day 1) |
| **Decision** | — (AWS SES or SendGrid) |
| **Requested By** | Backend Lead |
| **Approved By** | Founder (async) |
| **Impact** | Unblocks B-06 (email integration) |
| **Affected Tasks** | A-05, B-06 |
| **Reason** | Email provider required before SES domain verification (E-07) can begin |
| **Status** | 🔴 Pending — Required Day 1, 16:00 |

---

#### DEC-013 — Analytics Provider Selection

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-013 |
| **Date** | — (Sprint 1, Week 1) |
| **Decision** | — (PostHog / Mixpanel / Amplitude) |
| **Requested By** | TPM |
| **Approved By** | Founder |
| **Impact** | Analytics integration unblocked for Sprint 3 |
| **Affected Tasks** | A-06 |
| **Reason** | Analytics event tables (B-05) built in Sprint 0; provider feeds them in Sprint 3 |
| **Status** | 🟡 Deferred — Required before Sprint 3 |

---

#### DEC-014 — Messaging Transport Confirmation

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-014 |
| **Date** | — (Day 1) |
| **Decision** | Confirm SSE + Redis pub/sub per ADR-008 |
| **Requested By** | TPM |
| **Approved By** | Founder (async) |
| **Impact** | Messaging architecture confirmed for Sprint 5 design |
| **Affected Tasks** | A-07 |
| **Reason** | ADR-008 decides this; DEC-014 is the execution-phase confirmation record |
| **Status** | 🔴 Pending — Required Day 1, 15:00 |

---

#### DEC-015 — Stripe Scope Confirmation

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-015 |
| **Date** | — (Day 1) |
| **Decision** | Stripe = international cards only; Paymob = all Egyptian rails |
| **Requested By** | Backend Lead |
| **Approved By** | Founder (async) |
| **Impact** | Finance team Sprint 3 mandate is unambiguous |
| **Affected Tasks** | A-08 |
| **Reason** | Clarifies ADR-003 scope for Finance implementation |
| **Status** | 🔴 Pending — Required Day 1, 15:00 |

---

#### DEC-016 — Mobile Framework Selection

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-016 |
| **Date** | — (Day 1) |
| **Decision** | — (Flutter or React Native — chosen by Founder + Mobile Lead) |
| **Requested By** | Mobile Lead |
| **Approved By** | Founder |
| **Impact** | ADR-016 committed; Track D fully unblocked; BLK-03 resolved |
| **Affected Tasks** | A-03, D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08 |
| **Reason** | Mobile framework was never formally decided; Track D cannot start without it |
| **Status** | 🔴 Pending — Required Day 1, 11:30 |

---

#### DEC-017 — AWS Region Confirmation

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-017 |
| **Date** | — (Day 1) |
| **Decision** | — (me-central-1 per ADR-007, or new choice if overriding) |
| **Requested By** | DevOps Lead |
| **Approved By** | Founder |
| **Impact** | `variables.tf` updated; ADR-007 updated if region changes; BLK-04 resolved; E-01 unblocked |
| **Affected Tasks** | A-04, E-01, E-02, E-03, E-04, E-05, E-06, E-07, E-08, E-09, E-10, E-11 |
| **Reason** | ADR-007 says me-central-1 (UAE); Terraform state backend is me-south-1 (Bahrain) — conflict must be resolved before any infrastructure work |
| **Status** | 🔴 Pending — Required Day 1, 12:00 |

---

#### Future Decisions Template

```
#### DEC-XXX — [Decision Title]

| Field | Value |
|-------|-------|
| Decision ID | DEC-XXX |
| Date | YYYY-MM-DD |
| Decision | [What was decided] |
| Requested By | [Name — Role] |
| Approved By | [Name — Role] |
| Impact | [What changes] |
| Affected Tasks | [Task IDs] |
| Reason | [Why needed] |
| Status | Pending / Approved / Rejected |
```

---

## 11.3 Decision Summary Table

| ID | Decision | Owner | Status | Day |
|----|----------|-------|--------|-----|
| DEC-011 | Phase 0/1 governance resolution | Founder | 🔴 Pending | Day 1 |
| DEC-012 | Email provider | Backend Lead → Founder | 🔴 Pending | Day 1 |
| DEC-013 | Analytics provider | Founder | 🟡 Deferred | Sprint 1 W1 |
| DEC-014 | Messaging transport (SSE confirmation) | TPM → Founder | 🔴 Pending | Day 1 |
| DEC-015 | Stripe scope | Backend Lead → Founder | 🔴 Pending | Day 1 |
| DEC-016 | Mobile framework | Founder + Mobile Lead | 🔴 Pending | Day 1 |
| DEC-017 | AWS region | Founder + DevOps Lead | 🔴 Pending | Day 1 |

---

# SECTION 12 — EXECUTIVE KPI DASHBOARD

> All KPIs shown at Day 0 baseline. Updated by TPM at end of each sprint day.  
> Trend: ↑ improving · ↓ declining · → stable · ⬜ no data yet

---

## 12.1 Project KPIs

| KPI | Current | Target | Trend | Last Updated |
|-----|---------|--------|-------|--------------|
| Overall Progress | 0% | 100% by Sprint 8 | ⬜ | 2026-07-29 |
| Tasks Complete | 0 / 57 | 57 / 57 (Sprint 0) | ⬜ | 2026-07-29 |
| Phase A Complete | 0 / 43 | 43 / 43 by Day 10 | ⬜ | 2026-07-29 |
| Blocked Tasks | 6 | 0 by Day 5 | ⬜ | 2026-07-29 |
| Open Decisions | 7 | 0 by Day 1 PM | ⬜ | 2026-07-29 |
| EXIT Criteria Verified | 0 / 22 | 22 / 22 by Day 10 | ⬜ | 2026-07-29 |
| Engineering Readiness | 55% | 85% post-Sprint 0 | ⬜ | 2026-07-29 |
| Production Readiness | 25% | 40% post-Sprint 0 | ⬜ | 2026-07-29 |

---

## 12.2 Engineering KPIs

| KPI | Current | Target | Trend | Last Updated |
|-----|---------|--------|-------|--------------|
| Backend Test Coverage | 80.42% | ≥ 80.42% (maintain) | → | 2026-07-29 |
| Total Tests (Backend) | 283 | ≥ 283 + new tests | → | 2026-07-29 |
| Frontend Tests | 0 | ≥ 1 (C-09) | ⬜ | 2026-07-29 |
| CI Success Rate | — | ≥ 90% | ⬜ | 2026-07-29 |
| Build Success Rate | — | 100% | ⬜ | 2026-07-29 |
| Average PR Review Time | — | ≤ 4 hours | ⬜ | 2026-07-29 |
| Deployment Frequency | 0 | Daily (Day 3+) | ⬜ | 2026-07-29 |
| Mean Time to Deploy | — | ≤ 15 minutes | ⬜ | 2026-07-29 |
| Open PRs | 0 | ≤ 3 at any time | → | 2026-07-29 |
| Stale PRs (>48h) | 0 | 0 | → | 2026-07-29 |

---

## 12.3 Quality KPIs

| KPI | Current | Target | Trend | Last Updated |
|-----|---------|--------|-------|--------------|
| Backend Coverage | 80.42% | ≥ 80.42% | → | 2026-07-29 |
| E2E Smoke Tests Passing | 0 / 3 | 3 / 3 by Day 7 | ⬜ | 2026-07-29 |
| Playwright Test Projects | 0 / 3 | 3 / 3 by Day 1 | ⬜ | 2026-07-29 |
| Critical Bugs Open | 0 | 0 at all times | → | 2026-07-29 |
| High Bugs Open | 0 | 0 at sprint close | → | 2026-07-29 |
| Failed Deployments | 0 | 0 | → | 2026-07-29 |
| Rollbacks | 0 | 0 | → | 2026-07-29 |
| API Error Rate (5XX) | — | < 1% | ⬜ | 2026-07-29 |
| RTL Defects Found | 0 | 0 at release | → | 2026-07-29 |

---

## 12.4 Delivery KPIs

| KPI | Current | Target | Trend | Last Updated |
|-----|---------|--------|-------|--------------|
| Sprint 0 Velocity | 0 SP | 57 tasks / 10 days | ⬜ | 2026-07-29 |
| Tasks/Day (actual) | 0 | ~6 tasks/day | ⬜ | 2026-07-29 |
| Schedule Variance | 0 days | 0 days | ⬜ | 2026-07-29 |
| Critical Path Variance | 0 days | 0 days | → | 2026-07-29 |
| Milestone Hit Rate | — | 100% | ⬜ | 2026-07-29 |
| Blocker Clearance (SLA) | — | ≥ 80% within SLA | ⬜ | 2026-07-29 |
| Founder Time Day 1 | — | ≤ 2h 45m | ⬜ | 2026-07-29 |
| Phase A Burn Rate | 0 / 43 | 43 by Day 10 | ⬜ | 2026-07-29 |

---

## 12.5 Risk KPIs

| KPI | Current | Target | Trend | Last Updated |
|-----|---------|--------|-------|--------------|
| Critical Risks Open | 6 | 0 by Day 10 | ⬜ | 2026-07-29 |
| High Risks Open | 9 | ≤ 3 by Day 10 | ⬜ | 2026-07-29 |
| Medium Risks Open | 4 | ≤ 4 | ⬜ | 2026-07-29 |
| Risks Mitigated | 0 / 19 | 19 / 19 by Sprint 2 | ⬜ | 2026-07-29 |
| Escalations This Week | 0 | 0 | → | 2026-07-29 |
| Blocker SLA Breaches | 0 | 0 | → | 2026-07-29 |
| Change Requests Open | 0 | 0 | → | 2026-07-29 |

---

## 12.6 Infrastructure KPIs

| KPI | Current | Target | Trend | Last Updated |
|-----|---------|--------|-------|--------------|
| Staging Uptime | — | ≥ 99% (Day 3+) | ⬜ | 2026-07-29 |
| API Response P99 | — | < 500ms | ⬜ | 2026-07-29 |
| ECS Task Restarts/Day | — | 0 | ⬜ | 2026-07-29 |
| RDS CPU (avg) | — | < 40% | ⬜ | 2026-07-29 |
| Redis Memory Used | — | < 60% | ⬜ | 2026-07-29 |
| Secrets Manager Errors | — | 0 | ⬜ | 2026-07-29 |
| CloudFront Cache Hit Rate | — | > 80% | ⬜ | 2026-07-29 |

---

# SECTION 13 — TODAY COMMAND CENTER

> Updated each morning by TPM before 09:00. Designed for 30-second executive review.

---

## TODAY — DAY 0 (Pre-Execution) · 2026-07-29

---

### Objective

Activate the operational command center. Prepare all materials for Day 1 kickoff. Confirm all team members and credentials are ready.

---

### Critical Tasks Today

| # | ID | Task | Owner | Done By |
|---|----|------|-------|---------|
| 1 | — | Confirm Mobile Lead identity before Day 1 | Founder | Today |
| 2 | — | Procure all 15 GitHub Secrets credentials | DevOps Lead | Today |
| 3 | — | Distribute MASTER_EXECUTION_BOARD_v2.0.md to all leads | TPM | Today |
| 4 | — | Confirm business registration docs for WhatsApp application | Founder | Today |
| 5 | — | Review Day 1 schedule with Founder (2h 45m block) | TPM | Today |

---

### Critical Path Today

```
None — Day 0 is preparation only.
Day 1 critical path begins: A-01 at 09:00.
```

---

### Risks Active Today

| Risk | Status | Action |
|------|--------|--------|
| R-C04 — Mobile Lead not hired | 🔴 Active | Founder confirms hire before Day 1 |
| R-C02 — Baseline unsigned | 🔴 Active | A-01 resolves Day 1, 09:00 |
| R-C01 — AWS region conflict | 🔴 Active | A-04 + E-01 resolve Day 1 |

---

### Decisions Required Today

| ID | Decision | Owner | SLA |
|----|----------|-------|-----|
| — | Confirm Mobile Lead identity | Founder | Before Day 1 |
| — | Confirm Apple Developer + Play Console payment | Founder | Before Day 1 |

---

### Today's Deliverables

- [ ] Team briefed on MASTER_EXECUTION_BOARD_v2.0.md
- [ ] DevOps Lead has all credential information to populate GitHub Secrets
- [ ] Founder has 2h 45m Day 1 calendar block confirmed

---

### Today's Success Definition

> All team members know their Day 1 tasks. Founder has confirmed the Day 1 calendar block. All 15 GitHub Secrets credentials are procured and ready to enter.

---

### Expected Milestone

None today — Day 0 is preparation. First milestone is M-01: governance decisions committed (Day 1, 13:00).

---

### End-of-Day Verification

```
[ ] Team notified of Day 1 start time (09:00)
[ ] Founder 2h 45m block confirmed
[ ] Mobile Lead identity confirmed
[ ] GitHub Secrets credentials gathered
[ ] MASTER_EXECUTION_BOARD_v2.0.md distributed to all leads
```

---

## TODAY Template (copy and fill each morning)

```markdown
## TODAY — DAY [N] · [DATE]

### Objective
[One sentence: what must be true by 18:00 today]

### Critical Tasks Today
| # | ID | Task | Owner | Done By |
|---|----|------|-------|---------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### Critical Path Today
[Which CP gate is targeted today? Describe in one line.]

### Risks Active Today
| Risk | Status | Action |
|------|--------|--------|
| | | |

### Decisions Required Today
| ID | Decision | Owner | SLA |
|----|----------|-------|-----|
| | | | |

### Today's Deliverables
- [ ] 
- [ ] 

### Today's Success Definition
[One sentence: what "done" looks like by 18:00]

### Expected Milestone
[Which milestone, if any, should be reached today?]

### End-of-Day Verification
[ ] Stand-up held at 09:00
[ ] Blockers logged in Section 1.5
[ ] Board updated by 18:00
[ ] End-of-day report sent to team
```

---

# SECTION 14 — EXECUTIVE WEEKLY REVIEW

> Produced by TPM every Friday at 17:00. Covers the preceding 5 days.

---

## Week 0 Review — Pre-Execution (2026-07-29)

### Completed This Week

*No tasks completed — Sprint 0 has not started. Board activated. Operational system prepared.*

---

### In Progress

*No tasks in progress — Day 0 pre-execution.*

---

### Blocked

| Blocker | Owner | Days Open | Status |
|---------|-------|-----------|--------|
| BLK-01 Baseline unsigned | Founder | 0 | Resolves Day 1 |
| BLK-02 Phase governance | Founder | 0 | Resolves Day 1 |
| BLK-03 Mobile framework | Founder + ML | 0 | Resolves Day 1 |
| BLK-04 AWS region | Founder + DevOps | 0 | Resolves Day 1 |
| BLK-05 GitHub Secrets | DevOps Lead | 0 | Resolves Day 1 |
| BLK-06 No staging | DevOps Lead | 0 | Resolves Day 3 |

---

### Risk Status

| Level | This Week | Last Week | Change |
|-------|-----------|-----------|--------|
| Critical | 6 | — | Baseline |
| High | 9 | — | Baseline |
| Medium | 4 | — | Baseline |

---

### Schedule Status

| Milestone | Target | Forecast | Variance |
|-----------|--------|----------|---------|
| M-01: Governance closed | Day 1, 13:00 | Day 1, 13:00 | 0 |
| M-03: Staging live | Day 3 | Day 3 | 0 |
| M-05: Mid-point gate | Day 5 | Day 5 | 0 |
| M-09: Sprint 0 complete | Day 10 | Day 10 | 0 |

---

### Engineering Health

| Area | Status | Notes |
|------|--------|-------|
| Backend | 🟡 Ready | 78% complete, 283 tests, waiting for staging |
| Frontend | 🔴 Not Started | Scaffold only |
| Mobile | 🔴 Blocked | Framework undecided |
| Infrastructure | 🔴 Not Started | Terraform not applied |

---

### Quality Health

| Metric | Value | Status |
|--------|-------|--------|
| Backend coverage | 80.42% | ✅ |
| Frontend coverage | 0% | 🔴 |
| E2E tests | 0 / 3 | 🔴 |
| Critical bugs | 0 | ✅ |

---

### Budget Status

*Budget tracking not activated — update when cost data available.*

| Resource | Budgeted | Consumed | Remaining |
|----------|----------|----------|-----------|
| AWS Staging Infra | — | $0 | — |
| Apple Developer | $99/yr | $0 | $99 |
| Google Play | $25 | $0 | $25 |
| Total | — | $0 | — |

---

### Next Week Priorities (Week 1 — Sprint 0 Days 1–5)

| # | Priority | Owner | Target |
|---|----------|-------|--------|
| 1 | A-01: Sign baseline + resolve governance | Founder | Day 1, 10:00 |
| 2 | A-04: AWS region decision | Founder + DevOps | Day 1, 12:00 |
| 3 | E-01 + E-02: Terraform + Secrets | DevOps Lead | Day 1, 18:00 |
| 4 | E-03: Provision staging | DevOps Lead | Day 3, 12:00 |
| 5 | E-05: First deployment | DevOps Lead | Day 3, 18:00 |

---

### Executive Decisions Needed Next Week

| Decision | Owner | Required By |
|----------|-------|------------|
| DEC-011: Phase governance | Founder | Day 1, 09:45 |
| DEC-016: Mobile framework | Founder | Day 1, 11:30 |
| DEC-017: AWS region | Founder | Day 1, 12:00 |
| DEC-012: Email provider | Backend Lead → Founder | Day 1 |
| DEC-015: Stripe scope | Backend Lead → Founder | Day 1 |

---

## Weekly Review Template (copy for each Friday)

```markdown
## Week [N] Review — [Date range]

### Completed This Week
| ID | Task | Day Completed | Owner | Evidence |
|----|------|--------------|-------|---------|
| | | | | |

### In Progress
| ID | Task | % | Owner | ETA |
|----|------|---|-------|-----|
| | | | | |

### Blocked
| Blocker | Owner | Days Open | Action |
|---------|-------|-----------|--------|
| | | | |

### Risk Status
| Level | This Week | Last Week | Change |
|-------|-----------|-----------|--------|
| Critical | | | |
| High | | | |
| Medium | | | |

### Schedule Status
| Milestone | Target | Forecast | Variance |
|-----------|--------|----------|---------|
| | | | |

### Engineering Health
| Area | Status | Notes |
|------|--------|-------|
| | | |

### Quality Health
| Metric | Value | Status |
|--------|-------|--------|
| | | |

### Budget Status
| Resource | Budgeted | Consumed | Remaining |
|----------|----------|----------|-----------|
| | | | |

### Next Week Priorities
| # | Priority | Owner | Target |
|---|----------|-------|--------|
| | | | |

### Executive Decisions Needed Next Week
| Decision | Owner | Required By |
|----------|-------|------------|
| | | |
```

---

# SECTION 15 — LESSONS LEARNED

> Entries are never deleted. Each lesson is permanent institutional knowledge.  
> Sources: post-mortems, retrospectives, blocker resolutions, team feedback.

---

## 15.1 Log Format

| Field | Description |
|-------|-------------|
| **LL-ID** | Sequential ID (LL-001, LL-002…) |
| **Date** | YYYY-MM-DD |
| **Sprint** | Sprint 0, Sprint 1, etc. |
| **Category** | Governance · Engineering · Infrastructure · QA · Delivery · Communication |
| **Issue** | What went wrong or what was unexpectedly difficult |
| **Root Cause** | Why did this happen |
| **Resolution** | How was it resolved |
| **Preventive Action** | What will prevent recurrence |
| **Owner** | Who is responsible for the preventive action |
| **Status** | Open · Applied · Verified |

---

## 15.2 Lessons Learned Register

| LL-ID | Date | Sprint | Category | Issue | Root Cause | Resolution | Preventive Action | Owner | Status |
|-------|------|--------|----------|-------|-----------|------------|------------------|-------|--------|
| LL-001 | 2026-07-29 | Pre-Sprint 0 | Governance | ADR conflicts found in TECH_STACK.md and ARCHITECTURE.md showing open decisions already resolved in ARCHITECTURE_FREEZE.md | Older docs not updated after ARCHITECTURE_FREEZE.md was written | A-11 adds deprecation banners to stale documents | New ADRs must trigger an update pass on TECH_STACK.md and ARCHITECTURE.md before merging | TPM | Open |
| LL-002 | 2026-07-29 | Pre-Sprint 0 | Infrastructure | ADR-007 (me-central-1) conflicts with Terraform state backend (me-south-1) — discovered in audit, not at apply time | Region decision was not propagated to Terraform after ADR-007 was written | A-04 forces decision; E-01 fixes Terraform | ADR changes affecting infrastructure must include a paired Terraform review as part of the ADR approval checklist | DevOps Lead | Open |
| LL-003 | 2026-07-29 | Pre-Sprint 0 | Engineering | PostGIS parameter group missing from rds.tf — would have caused production migration failure | Terraform template was created before PostGIS spatial requirement was finalized | E-01 adds correct parameter group | Terraform plan must be validated against all database extension requirements before any ADR involving DB is approved | DevOps Lead | Open |
| LL-004 | 2026-07-29 | Pre-Sprint 0 | Engineering | AWS Secrets Manager wired as stub — production startup would fail if deployed as-is | SM integration was scaffolded but not implemented during FC feature development | B-08 replaces stub with real implementation | All stubs must be marked `TODO(P0-SM-WIRE)` and tracked in the engineering backlog before feature is marked done | Backend Lead | Open |
| LL-005 | — | — | — | *(next lesson)* | — | — | — | — | — |

---

# SECTION 16 — PROJECT TIMELINE

> References existing roadmap only. No new planning. Dates are estimates; confirmed at each sprint kickoff.

---

## 16.1 Sprint Timeline Overview

```
SPRINT 0 — ENGINEERING FOUNDATION
Day  1  ████████ Governance + Day-1 setup
Day  2  ████████ Backend migrations + Mobile scaffold
Day  3  ████████ Staging provisioned + First deployment ◄ GATE
Day  4  ████████ Frontend + Mobile core integration
Day  5  ████████ Mid-point gate EXIT-01–12 ◄ GATE
Day  6  ████░░░░ Phase B infrastructure
Day  7  ████████ E2E smoke in CI ◄ GATE (EXIT-21)
Day  8  ████░░░░ Phase B completion
Day  9  ████░░░░ Exit criterion verification
Day 10  ████████ Sprint 0 CLOSE + Sprint 1 AUTHORIZE ◄ GATE

SPRINT 1 — CORE USER FLOWS (estimated ~2 weeks post-Sprint 0)
Week 1  Guest search + listing detail
Week 2  Host dashboard + listing creation
GATE: Guest can search and view listing; Host can publish listing

SPRINT 2 — RESERVATION ENGINE (estimated ~2 weeks)
Week 1  Reservation request flow
Week 2  Calendar management + availability
GATE: Guest can submit reservation; Host can approve/reject

SPRINT 3 — PAYMENT & FINANCE (estimated ~2 weeks)
Week 1  Paymob integration (Fawry, Meeza, Vodafone Cash, InstaPay)
Week 2  Stripe international cards + escrow hold/release
GATE: End-to-end payment completes; escrow holds and releases correctly

SPRINT 4 — TRUST & MESSAGING (estimated ~2 weeks)
Week 1  KYC verification flows
Week 2  SSE messaging (ADR-008) + notification centre
GATE: KYC gate functional; host-guest messaging live

SPRINT 5 — MOBILE FEATURE PARITY (estimated ~3 weeks)
Parallel mobile development: all core flows on iOS + Android
GATE: Mobile parity with web for search + reservation + payment

SPRINT 6 — OPERATIONS & ANALYTICS (estimated ~2 weeks)
OpsManager dashboard + property readiness
Analytics event stream live (ADR-015)
GATE: Host can manage operations; analytics pipeline active

SPRINT 7 — BETA PREPARATION (estimated ~2 weeks)
Performance hardening
Security audit
Load testing
GATE: 100 concurrent users, p99 < 500ms, zero critical security findings

RELEASE CANDIDATE 1 (RC1) — After Sprint 7 gate
Internal team + selected hosts
Bug-fix sprint

BETA LAUNCH — After RC1 sign-off
Limited geography: Cairo + Dubai
Target: 10 transactions + 80 user interviews (Phase 0 validation gates)

PRODUCTION LAUNCH — After Beta validation
Full MENA geography
All payment rails active
```

---

## 16.2 Milestone Timeline

| Milestone | Sprint | Day/Week | Status | Condition |
|-----------|--------|----------|--------|-----------|
| Sprint 0 Day-1 gates | S0 | Day 1 | ⬜ | All governance decisions committed |
| Staging live | S0 | Day 3 | ⬜ | `/health` returns 200 |
| Sprint 0 mid-point | S0 | Day 5 | ⬜ | EXIT-01–12 verified |
| Sprint 0 complete | S0 | Day 10 | ⬜ | All 22 EXIT verified |
| Sprint 1 kickoff | S1 | Day 11 | ⬜ | EXIT-22 done |
| Guest search live | S1 | S1 W1 | ⬜ | Search returns results |
| Host dashboard live | S1 | S1 W2 | ⬜ | Host can publish listing |
| Reservation flow | S2 | S2 W2 | ⬜ | End-to-end reservation |
| Payment live | S3 | S3 W2 | ⬜ | Paymob + Stripe |
| KYC live | S4 | S4 W1 | ⬜ | KYC gate functional |
| Mobile parity | S5 | S5 W3 | ⬜ | iOS + Android feature parity |
| Analytics pipeline | S6 | S6 W2 | ⬜ | Events flowing |
| RC1 | S7+ | Post S7 | ⬜ | Performance + security gates |
| Beta launch | Beta | Post RC1 | ⬜ | Cairo + Dubai limited |
| Production launch | Prod | Post Beta | ⬜ | Phase 0 gates cleared |

---

## 16.3 Critical Dates

| Date | Event | Owner |
|------|-------|-------|
| Day 1 of Sprint 0 | Founder signs baseline + all governance decisions | Founder |
| Day 3 of Sprint 0 | Staging infrastructure live | DevOps Lead |
| Day 10 of Sprint 0 | Sprint 0 complete + Sprint 1 authorized | TPM + Founder |
| Sprint 3 start | DEC-013 (analytics provider) must be committed | Founder |
| Before Beta | WhatsApp Business API approved (submitted Day 1, ~8 week lead) | TPM |
| Beta | 10 real transactions + 80 customer interviews target | Founder |

---

# SECTION 17 — EXECUTIVE HEALTH SCORE

> Scored at each sprint close. Updated by TPM. Each dimension 0–100.  
> Current score: **Day 0 Baseline (Pre-Execution)**

---

## 17.1 Scoring Methodology

| Score Range | Status | Meaning |
|------------|--------|---------|
| 80–100 | 🟢 GREEN | On track, no significant concerns |
| 60–79 | 🟡 YELLOW | Attention needed, some risks |
| 40–59 | 🟠 AMBER | Action required, multiple issues |
| 0–39 | 🔴 RED | Critical attention, escalation needed |

---

## 17.2 Dimension Scores — Day 0 Baseline

---

#### Execution — 0 / 100 🔴

| Factor | Score | Notes |
|--------|-------|-------|
| Tasks completed | 0/30 | 0 of 57 tasks started |
| Milestones hit | 0/20 | 0 of 10 milestones reached |
| On-schedule tasks | 0/20 | Pre-execution |
| Blocker clearance | 0/15 | 6 pre-execution blockers open |
| Daily cadence | 0/15 | No stand-ups held yet |
| **Dimension Total** | **0** | Pre-execution |

---

#### Quality — 62 / 100 🟡

| Factor | Score | Notes |
|--------|-------|-------|
| Backend test coverage | 25/25 | 80.42% — meets target |
| Test count | 20/20 | 283 tests passing |
| Frontend tests | 0/15 | No frontend tests yet |
| E2E tests | 0/20 | Playwright not configured |
| Critical bugs | 20/20 | 0 critical bugs open |
| **Dimension Total** | **65** | Backend solid; frontend/E2E missing |

---

#### Engineering — 55 / 100 🟠

| Factor | Score | Notes |
|--------|-------|-------|
| Backend completeness | 25/35 | 78% done (FC-01–FC-07 core) |
| Frontend completeness | 2/20 | 5% (scaffold only) |
| Mobile completeness | 0/20 | 0% (framework undecided) |
| Code quality (ruff/mypy) | 10/10 | Clean — ruff + mypy pass |
| Architecture decisions | 15/15 | 15 ADRs accepted and frozen |
| **Dimension Total** | **52** | Backend strong; frontend/mobile zero |

---

#### Risk — 28 / 100 🔴

| Factor | Score | Notes |
|--------|-------|-------|
| Critical risks mitigated | 0/30 | 6 critical open |
| High risks mitigated | 0/25 | 9 high open |
| Blockers resolved | 0/25 | 6 blockers open |
| Change control active | 10/10 | Section 9 in place |
| Escalation path defined | 10/10 | SLAs documented |
| **Dimension Total** | **20** | High risk pre-execution — expected |

---

#### Delivery — 5 / 100 🔴

| Factor | Score | Notes |
|--------|-------|-------|
| Deliverables shipped | 0/40 | 0 of 48 deliverables |
| Milestones met | 0/30 | 0 of 10 |
| Velocity established | 0/20 | No velocity data yet |
| Sprint plan complete | 10/10 | All 57 tasks defined with owners |
| **Dimension Total** | **10** | Pre-execution — baseline only |

---

#### Governance — 42 / 100 🟠

| Factor | Score | Notes |
|--------|-------|-------|
| Baseline signed | 0/25 | BLK-01 — unsigned |
| Decisions recorded | 0/20 | DEC-011–017 all pending |
| ADRs frozen | 20/20 | 15 ADRs accepted |
| Decision log exists | 10/10 | Section 11 active |
| Change control | 10/10 | Section 9 active |
| Team authorities clear | 5/15 | Mobile Lead identity unconfirmed |
| **Dimension Total** | **45** | ADR freeze strong; execution decisions pending |

---

#### Infrastructure — 22 / 100 🔴

| Factor | Score | Notes |
|--------|-------|-------|
| Staging provisioned | 0/30 | Terraform not applied |
| CI/CD configured | 0/25 | GitHub Secrets not set |
| Secrets management | 0/20 | SM stub — not wired |
| Terraform code quality | 15/15 | Defined but broken (PostGIS + region) |
| Security baseline | 5/10 | CORS wildcard risk; WAF not deployed |
| **Dimension Total** | **20** | Infra blocked pending Day 1 decisions |

---

## 17.3 Overall Health Score

| Dimension | Weight | Score | Weighted |
|-----------|--------|-------|---------|
| Execution | 25% | 0 | 0.0 |
| Quality | 15% | 62 | 9.3 |
| Engineering | 20% | 55 | 11.0 |
| Risk | 15% | 28 | 4.2 |
| Delivery | 10% | 10 | 1.0 |
| Governance | 10% | 45 | 4.5 |
| Infrastructure | 5% | 22 | 1.1 |
| **TOTAL** | **100%** | | **31.1** |

---

## 17.4 Overall Health

```
OVERALL HEALTH SCORE: 31 / 100

STATUS: 🔴 RED

Interpretation: Expected pre-execution baseline. All scores reflect
Day 0 state before any execution has occurred. The primary drivers
of the LOW score are:
  - 0% execution (no tasks started)
  - 6 open pre-execution blockers
  - 19 open risks (6 Critical)
  - Staging not provisioned
  - Baseline unsigned

This score is not a failure signal. It is the pre-execution baseline.
The target after Sprint 0 is ≥ 70 (YELLOW→GREEN transition).
```

---

## 17.5 Health Score History

| Date | Execution | Quality | Engineering | Risk | Delivery | Governance | Infrastructure | **Overall** | Status |
|------|-----------|---------|-------------|------|----------|------------|---------------|------------|--------|
| 2026-07-29 (Day 0) | 0 | 62 | 55 | 28 | 10 | 45 | 22 | **31** | 🔴 RED |
| Day 5 (mid-point) | — | — | — | — | — | — | — | — | TBD |
| Day 10 (Sprint 0 close) | — | — | — | — | — | — | — | — | TBD |
| Sprint 1 close | — | — | — | — | — | — | — | — | TBD |
| Sprint 2 close | — | — | — | — | — | — | — | — | TBD |
| Beta launch | — | — | — | — | — | — | — | — | TBD |

---

# DOCUMENT CONTROL

| Field | Value |
|-------|-------|
| **Document** | MASTER_EXECUTION_BOARD_v2.0.md |
| **Version** | 2.0 |
| **Previous Version** | MASTER_EXECUTION_BOARD.md v1.0 |
| **Status** | OFFICIAL PROJECT OPERATING SYSTEM — Single Operational Source of Truth |
| **Created** | 2026-07-29 (Day 0 Pre-Execution) |
| **Authority** | SPRINT_0_ENGINEERING_FOUNDATION_v1.1.md · STAYOS_IMPLEMENTATION_BASELINE.md |
| **Owner** | TPM (Islam Elbaz) |
| **Update Cadence** | Daily at 18:00 · Weekly review every Friday 17:00 · Sprint close after each sprint |
| **Sections** | 17 operational sections |
| **Tasks** | 57 Sprint 0 tasks |
| **EXIT Criteria** | 22 |
| **Tracked Decisions** | DEC-011 through DEC-017 (Sprint 0 phase) |
| **Tracked Risks** | 19 (6 Critical · 9 High · 4 Medium) |
| **KPIs Tracked** | 45 metrics across 6 dimensions |
| **Frozen Documents** | SPRINT_0_ENGINEERING_FOUNDATION_v1.1.md · All 15 ADRs · STAYOS_IMPLEMENTATION_BASELINE.md |
| **Supersedes** | MASTER_EXECUTION_BOARD.md (v1.0) |
| **Next Board Update** | Day 1, 18:00 — first stand-up results + governance decisions |

---

**Audience:** Founder · TPM · Engineering Leads · QA Lead · DevOps Lead · Investors · Steering Committee

> This document replaces all previous execution tracking artifacts.  
> No new planning documents are to be created.  
> All execution activity is logged here.  
> All decisions are recorded here.  
> All risk changes are recorded here.  
> This is the single operational truth for StayOS.
