# SPRINT 0 — ENGINEERING FOUNDATION
## Official Execution Program — Version 1.1

**Document Version:** 1.1  
**Previous Version:** 1.0 (2026-07-29)  
**Date:** 2026-07-29  
**Status:** APPROVED — READY TO EXECUTE  
**Authority:** Project Director Directive, Session 007  
**Supersedes:** SPRINT_0_ENGINEERING_FOUNDATION.md (v1.0)  
**Classification:** ENGINEERING EXECUTION — INTERNAL — OPERATIONAL HANDBOOK  

---

> **BINDING STATEMENT:** This document is the sole official execution guide for Sprint 0. It does not redesign, extend, or modify any approved architecture, UX, ADR, or product scope. Every task traces directly to STAYOS_PROJECT_READINESS_AUDIT.md (2026-07-29). No new features. No new architecture. Governance upgrade only.

---

## PART I — EXECUTIVE DASHBOARD

> Updated by TPM at 18:00 each day. This section is the single status pane for all stakeholders.

---

### 1.1 Overall Sprint Status

| Field | Value |
|-------|-------|
| **Sprint** | Sprint 0 — Engineering Foundation |
| **Status** | PRE-EXECUTION |
| **Start Date** | Day 1 (TBD on Founder authorization) |
| **Target Completion** | Day 10 (10 working days from start) |
| **Overall Progress** | 0 / 57 tasks complete (0%) |
| **Phase A Progress** | 0 / 43 tasks (0%) |
| **Phase B Progress** | 0 / 11 tasks (0%) |
| **Phase C Progress** | 0 / 3 tasks (0%) |
| **Engineering Readiness** | 55% → Target 85% post-Sprint 0 |
| **Production Readiness** | 25% → Target 40% post-Sprint 0 |
| **Risk Level** | 🔴 HIGH → Expected 🟡 MEDIUM after Day 5 |
| **Project Director Decision** | ✅ GO |

---

### 1.2 Track Progress

| Track | Owner | Phase A Tasks | Phase B Tasks | Phase C Tasks | Complete | Status |
|-------|-------|--------------|--------------|--------------|----------|--------|
| A — Governance | Founder + TPM | 5 | 3 | 3 | 0/11 | 🔴 Not Started |
| B — Backend Foundation | Backend Lead | 11 | 1 | 0 | 0/12 | 🔴 Not Started |
| C — Frontend Foundation | Web Lead | 8 | 1 | 0 | 0/9 | 🔴 Not Started |
| D — Mobile Foundation | Mobile Lead | 7 | 1 | 0 | 0/8 | 🔴 Not Started |
| E — Infrastructure | DevOps Lead | 6 | 5 | 0 | 0/11 | 🔴 Not Started |
| F — QA Foundation | QA Lead | 6 | 0 | 0 | 0/6 | 🔴 Not Started |
| **TOTAL** | | **43** | **11** | **3** | **0/57** | **🔴** |

---

### 1.3 Critical Path Status

| Node | Task | Target Day | Status | Blocker |
|------|------|-----------|--------|---------|
| CP-1 | A-04: AWS Region Decision | Day 1 AM | ⬜ Not Started | Founder availability |
| CP-2 | E-01: Fix Terraform Configuration | Day 1 PM | ⬜ Not Started | Awaits CP-1 |
| CP-3 | E-02: GitHub Secrets Configured | Day 1 PM | ⬜ Not Started | Awaits credentials |
| CP-4 | E-03: Terraform Apply (Staging Live) | Day 2–3 | ⬜ Not Started | Awaits CP-2 + CP-3 |
| CP-5 | E-04: Secrets Manager Populated | Day 3 AM | ⬜ Not Started | Awaits CP-4 |
| CP-6 | B-08: Secrets Manager Wired in Code | Day 3 AM | ⬜ Not Started | Awaits CP-5 |
| CP-7 | E-05: First Backend Deployment | Day 3 PM | ⬜ Not Started | Awaits CP-4 + CP-6 |
| CP-8 | F-05: Test Data Seeded | Day 3 PM | ⬜ Not Started | Awaits CP-7 |
| CP-9 | F-03 + F-04: E2E Smoke Tests | Day 4–5 | ⬜ Not Started | Awaits CP-8 + C-05 |
| CP-10 | EXIT-21: Smoke Suite Passes in CI | Day 7 | ⬜ Not Started | Awaits CP-9 |

---

### 1.4 Open Blockers

| # | Blocker | Owner | Since | SLA |
|---|---------|-------|-------|-----|
| BLK-01 | Founder signature on Implementation Baseline missing | Founder | Pre-Sprint | Day 1, 09:15 |
| BLK-02 | Phase 0 / Phase 1 governance conflict unresolved | Founder | Pre-Sprint | Day 1, 09:45 |
| BLK-03 | Mobile framework undecided — all 40 screens blocked | Founder + Mobile Lead | Pre-Sprint | Day 1, 11:30 |
| BLK-04 | AWS deployment region undecided — Terraform blocked | Founder + DevOps | Pre-Sprint | Day 1, 12:00 |
| BLK-05 | GitHub Secrets not configured — CI/CD cannot deploy | DevOps Lead | Pre-Sprint | Day 1, 18:00 |
| BLK-06 | No staging infrastructure exists — QA and integration blocked | DevOps Lead | Pre-Sprint | Day 3, 18:00 |

---

### 1.5 Upcoming Milestones

| Day | Milestone | Success Signal |
|-----|-----------|---------------|
| Day 1, 12:00 | All governance decisions made | DEC-011 through DEC-015 committed |
| Day 1, 18:00 | All tracks unblocked | GitHub Secrets configured, Terraform fixes committed |
| Day 3, 13:00 | Staging infrastructure live | `curl https://api.staging.stayos.com/health` returns 200 |
| Day 3, 18:00 | First backend deployment complete | ECS task running, zero restarts |
| Day 5 | Mid-Point Gate | EXIT-01 through EXIT-08 verified |
| Day 7 | E2E smoke suite green in CI | EXIT-21 verified |
| Day 10 | Sprint 0 complete | All 22 EXIT criteria verified |
| Day 10 | Sprint 1 authorized | Sprint 1 board created, Day-1 tasks assigned |

---

### 1.6 Exit Criteria Checklist

| ID | Criterion | Gate | Status |
|----|-----------|------|--------|
| EXIT-01 | `STAYOS_IMPLEMENTATION_BASELINE.md` signed | Governance | ⬜ |
| EXIT-02 | DEC-011 in `DECISION_LOG.md` | Governance | ⬜ |
| EXIT-03 | ADR-016 (mobile framework) committed | Governance | ⬜ |
| EXIT-04 | AWS region set in `variables.tf` | Governance | ⬜ |
| EXIT-05 | Staging API health check returns 200 | Infrastructure | ⬜ |
| EXIT-06 | All migrations applied on staging DB | Infrastructure | ⬜ |
| EXIT-07 | GitHub Actions CI green on `main` | CI/CD | ⬜ |
| EXIT-08 | First staging deployment via CI succeeds | CI/CD | ⬜ |
| EXIT-09 | Next.js deployed to Vercel staging URL | Frontend | ⬜ |
| EXIT-10 | `/ar/` RTL and `/en/` LTR confirmed | Frontend | ⬜ |
| EXIT-11 | Typed API client compiles clean | Frontend | ⬜ |
| EXIT-12 | OTP login → protected route → token refresh E2E pass | Frontend | ⬜ |
| EXIT-13 | Mobile scaffold on iOS Simulator + Android Emulator | Mobile | ⬜ |
| EXIT-14 | Mobile API client calls staging `/health` successfully | Mobile | ⬜ |
| EXIT-15 | Mobile auth flow reaches OTP entry screen | Mobile | ⬜ |
| EXIT-16 | `pytest tests/test_listings.py -k photo` passes | Backend | ⬜ |
| EXIT-17 | `analytics.listing_views` table exists in staging DB | Backend | ⬜ |
| EXIT-18 | Staging logs show "secrets loaded from AWS Secrets Manager" | Backend | ⬜ |
| EXIT-19 | `POST /reservations/` response includes `paymob_iframe_url` | Backend | ⬜ |
| EXIT-20 | CORS wildcard eliminated, staging origin returned | Backend | ⬜ |
| EXIT-21 | `npx playwright test --project=smoke` — 3 tests green in CI | QA | ⬜ |
| EXIT-22 | Sprint 1 board created, Day-1 tasks assigned | Delivery | ⬜ |

---

## PART II — EXECUTION PHASE DEFINITIONS

Every task in this document belongs to exactly one execution phase. Phase assignment determines whether Sprint 1 can begin before the task is complete.

---

### Phase A — Mandatory Foundation

**Definition:** These tasks MUST be in **Done** or **Verified** status before Sprint 1 begins. No exceptions. Sprint 1 start is gated behind 100% Phase A completion.

**Count:** 43 tasks  
**Timeline:** Days 1–10 (Sprint 0 scope)  
**Authorization to proceed to Sprint 1:** All 43 Phase A tasks verified + all 22 EXIT criteria met.

---

### Phase B — Foundation Enhancement

**Definition:** These tasks MAY continue in parallel with Sprint 1, Week 1. They improve the foundation but do not block Sprint 1 Day 1. Phase B tasks must be verified before Sprint 1, Week 2 begins.

**Count:** 11 tasks  
**Timeline:** Days 8–10 of Sprint 0, completing in Sprint 1 Week 1 at latest.

---

### Phase C — Pre-Beta

**Definition:** These tasks must be verified before Beta release. Long-lead-time items in this phase MUST be **initiated** in Sprint 0, even though they complete later. Initiation deadline is Day 1.

**Count:** 3 tasks  
**Timeline:** Initiated Day 1, completed Sprint 5–8 depending on external dependency.

---

### Phase D — Pre-Production

**Definition:** Required before Production launch. No Sprint 0 tasks fall into this phase. Defined here for completeness in scheduling future work (penetration test, production Terraform apply, production Secrets Manager configuration).

**Count:** 0 tasks in Sprint 0  
**Timeline:** Sprint 7–8.

---

## PART III — SPRINT 0 OBJECTIVES

**One Objective Only: Engineering Foundation Completion**

Sprint 0 is complete when every engineering track has a working foundation that Sprint 1 engineers can build features on top of, without making any architectural decisions themselves.

Sprint 0 does NOT include:
- Any guest-facing screen
- Any host-facing screen
- Any admin screen
- Any new product feature
- Any new API beyond the audit-identified gaps
- Any design iteration

Sprint 0 DOES include:
- Every governance decision that was blocked
- Every infrastructure task that had never been executed
- Every foundation layer that Sprint 1 depends on
- Every CI/CD pipe that must run before the first Sprint 1 commit

---

## PART IV — CRITICAL PATH AND DEPENDENCIES

### 4.1 Critical Path

Every node on this path is a hard dependency. A one-day slip in any node slides Sprint 0 completion by one day.

```
[Day 1 AM]  A-01 + A-02 (Governance: signature + DEC-011)
                ↓
[Day 1 AM]  A-04 (AWS Region Decision) ──────────────────────────────┐
                ↓                                                      │
[Day 1 PM]  E-01 (Fix Terraform: PostGIS, placeholders, region)       │
                ↓                                                      │
[Day 1 PM]  E-02 (GitHub Secrets) ←───────────────────────────────────┘
                ↓
[Day 2–3]   E-03 (terraform apply → Staging Provisioned)
                ↓
[Day 3 AM]  E-04 (Populate AWS Secrets Manager)
                ↓
[Day 3 AM]  B-08 (Wire Secrets Manager in Code) ←── Backend parallel track
                ↓
[Day 3 PM]  E-05 (First Backend Deployment to ECS)
                ↓
[Day 3 PM]  F-05 (Seed Test Data) + C-05 (Auth Context) ← parallel
                ↓
[Day 4–5]   F-03 + F-04 (Auth + Search Smoke Tests)
                ↓
[Day 7]     F-06 (E2E Smoke in CI post-deploy)
                ↓
[Day 10]    EXIT-21 verified → All 22 EXIT criteria met → ✅ Sprint 1 Authorized
```

---

### 4.2 Parallel Tracks (Independent of Critical Path)

These tracks run in parallel with the critical path from Day 1 and do not depend on each other.

| Track | Tasks | Earliest Start | Blocker |
|-------|-------|---------------|---------|
| Backend migrations | B-01, B-03, B-05, B-07, B-09, B-10 | Day 1 PM | None |
| Backend compliance | B-12 | Day 1 PM | None |
| Frontend config + design | C-01, C-02, C-03 | Day 1 PM | None |
| Mobile scaffold | D-01 | Day 1 PM (after A-03) | A-03 |
| Mobile nav + i18n + theme | D-02, D-03, D-04 | Day 2 AM | D-01 |
| Frontend i18n + API client | C-04, C-05, C-06, C-07 | Day 2 AM | C-01, C-03 |
| Mobile API + auth | D-05, D-06 | Day 2 PM | D-01 |
| QA infrastructure | F-01 | Day 1 PM | C-01 |

---

### 4.3 Blocked Tasks (Cannot Start in Sprint 0)

| Work | Blocked By | Expected Sprint |
|------|-----------|----------------|
| Messaging module (design + build) | A-07 (transport decision), Sprint 5 design | Sprint 6 |
| Reviews module | Scheduled Sprint 7 | Sprint 7 |
| Admin portal screens | Foundation + design implementation | Sprint 5–6 |
| FCM push implementation (full) | D-07 SDK + Firebase project (A-10) | Sprint 4 |
| Egyptian payment methods (Fawry, Meeza, etc.) | Paymob merchant integration IDs | Sprint 5 |
| Penetration test | All features complete | Sprint 7 |
| Production Terraform apply | Production approval + security review | Sprint 7–8 |

---

### 4.4 Phase B Tasks (Parallel with Sprint 1 Week 1)

| Task ID | Name | Sprint 1 Impact if Delayed |
|---------|------|--------------------------|
| A-05 | Email Provider Decision | B-06 cannot wire SES |
| A-07 | Messaging Transport | Sprint 5–6 design blocked |
| A-08 | Stripe Scope Confirmation | Sprint 3 Finance track starts without mandate |
| B-06 | Wire Email Provider (SES) | Booking confirmations missing until done |
| C-09 | Frontend Unit Test Config | Sprint 1 web PRs lack unit test baseline |
| D-07 | Push Notification SDK | Sprint 4 mobile push blocked |
| E-07 | SES Domain Verification | DNS propagation ongoing — start Day 1 |
| E-08 | CloudFront for Listings | Photo URLs served from S3 directly until done |
| E-09 | PgBouncer | Connection pooling missing — low risk at current scale |
| E-10 | WAF on ALB | OWASP protection missing — tolerable for staging |
| E-11 | CloudWatch Alerting | Monitoring missing — tolerable for Sprint 1 |

---

### 4.5 Dependency Completion Estimates

| Phase | Tasks | Est. Days to Complete | Confidence |
|-------|-------|----------------------|------------|
| Phase A | 43 | 8–10 | High |
| Phase B | 11 | Starts Day 8, completes Sprint 1 Week 1 | Medium |
| Phase C | 3 | Initiated Day 1; completes Sprint 5–8 externally | Low (external dependency) |

---

## PART V — DAILY OPERATING RHYTHM

### 5.1 Daily Schedule (Every Working Day During Sprint 0)

| Time | Duration | Format | Purpose | Participants | Facilitator |
|------|----------|--------|---------|-------------|------------|
| 09:00 | 15 min | Standup | Progress updates, surface blockers | All 8 leads | TPM |
| 12:00 | 30 min | Blocker Review | Resolve open blockers or escalate | TPM + affected leads | TPM |
| 16:00 | 15 min | Integration Check | Verify inter-track dependencies; confirm staging health | DevOps + Backend + Web + QA | TPM |
| 18:00 | Async | Daily Report | Written sprint status posted to team channel | — | TPM |

---

### 5.2 Standup Protocol (09:00, 15 minutes maximum)

Each lead answers in 30 seconds or less:

1. What did I complete since the last standup?
2. What will I complete before the next standup?
3. What is blocking me?

**Rules:**
- Blockers go to the 12:00 session — no resolution during standup
- If a lead is absent, they post answers in writing before 09:00
- If the standup exceeds 15 minutes, TPM cuts it off and schedules sidebar

---

### 5.3 Blocker Review Protocol (12:00, 30 minutes)

1. TPM reads the blockers list (5 min)
2. One resolution attempt per blocker — affected lead proposes solution (10 min)
3. Assign escalation owner if unresolved (5 min)
4. Blockers unresolved > 4 hours escalate to Founder or Project Director (5 min)
5. Update task board before 13:00

**Escalation SLAs:**

| Blocker Type | Escalation Target | SLA |
|-------------|------------------|-----|
| Technical — engineering team can resolve | Team Lead | 4 hours |
| Technical — requires external service or credential | DevOps Lead | Same day |
| Decision required from Founder | TPM → Founder | 4 hours |
| Critical path slipping > 1 day | TPM → Project Director | Immediate |
| Phase A task cannot complete in Sprint 0 | Project Director | Immediately |

---

### 5.4 Integration Check Protocol (16:00, 15 minutes)

1. DevOps confirms staging status: up / degraded / down; CI pipeline: green / red
2. Backend confirms API compatibility changes since morning
3. Web Lead confirms frontend build status
4. QA confirms test data accessible and smoke baseline passing
5. If any dependency is broken, assign owner before 16:15

---

### 5.5 Daily Report Template (18:00, TPM posts written)

```
SPRINT 0 — DAILY REPORT
Date: [YYYY-MM-DD] | Day [N] of 10
Posted by: TPM

COMPLETED TODAY
  - [T-ID] Task name (Owner)

IN PROGRESS
  - [T-ID] Task name — [X]% complete (Owner, ETA: [time])

BLOCKED
  - [T-ID] Task name — Blocker: [description] — Owner: [name] — SLA: [time]

CRITICAL PATH
  Status: [On Track / At Risk / Behind — N days]
  Next critical node: [CP-N] due [Day X]

STAGING HEALTH
  API: [Green / Red]  CI: [Green / Red]  Coverage: [X%]

TOMORROW FOCUS
  1. [Priority task]
  2. [Priority task]
  3. [Priority task]

RISK WATCH
  [Any new or escalating risks from the risk register]

EXIT CRITERIA VERIFIED TODAY
  [EXIT-XX: criterion]
```

---

### 5.6 Weekly Cadence (Every Friday, 14:00–16:00)

| Time | Duration | Session | Purpose | Participants |
|------|----------|---------|---------|-------------|
| 14:00 | 45 min | Sprint Review | Demo deliverables; review EXIT checklist; report to Founder | All leads + Founder |
| 14:45 | 30 min | Risk Review | Update risk register; assess new risks; confirm mitigations active | All leads |
| 15:15 | 30 min | Architecture Review | Confirm no drift from ARCHITECTURE_FREEZE.md; verify ADR-015 compliance | Backend Lead + DevOps + TPM |
| 15:45 | 15 min | Week Wrap-up | Next-week priorities; team allocation adjustments | All leads |

---

## PART VI — SPRINT KPIs

### 6.1 KPI Definitions and Targets

| KPI ID | KPI Name | Definition | Target | Measurement | Cadence |
|--------|---------|-----------|--------|-------------|---------|
| KPI-01 | Phase A Completion | % of Phase A tasks in Done/Verified | 100% by Day 10 | Task board | Daily |
| KPI-02 | Phase B Completion | % of Phase B tasks in Done/Verified | ≥ 60% by Day 10 | Task board | Daily |
| KPI-03 | Critical Path Variance | Days behind critical path schedule | 0 by Day 5; ≤ 1 by Day 10 | TPM assessment | Daily |
| KPI-04 | Blocked Task Count | # tasks with Status = Blocked | 0 by Day 5 | Task board | Daily |
| KPI-05 | CI Success Rate | % GitHub Actions workflow runs passing | ≥ 90% | GitHub Actions | Daily |
| KPI-06 | Backend Coverage | % lines covered by pytest | ≥ 80.42% (maintain baseline) | pytest-cov | Per PR |
| KPI-07 | Deployment Success Rate | % staging deployments succeeding | 100% | GitHub Actions | Per deploy |
| KPI-08 | E2E Smoke Pass Rate | % Playwright smoke tests passing vs. staging | 100% by Day 7 | Playwright report | Per deploy |
| KPI-09 | Blocker SLA Compliance | % blockers resolved within their SLA | ≥ 80% | Daily report | Daily |
| KPI-10 | Bug Count | # defects found in foundation tasks | < 5 by Day 10 | Issue tracker | Weekly |
| KPI-11 | Failed Builds | # GitHub Actions workflow failures per day | < 3 / day | GitHub Actions | Daily |
| KPI-12 | Exit Criteria Progress | # EXIT-XX criteria in Verified state | 22/22 by Day 10 | EXIT checklist | Daily |
| KPI-13 | Founder Time on Day 1 | Hours Founder spent on governance tasks | < 4 hours | TPM log | Day 1 only |
| KPI-14 | Delegation Execution Rate | % delegated tasks completed by delegatee | 100% | Task board | Daily |

---

### 6.2 KPI Dashboard (Updated Daily by TPM)

| KPI | Target | Day 1 | Day 2 | Day 3 | Day 5 | Day 7 | Day 10 |
|-----|--------|-------|-------|-------|-------|-------|--------|
| KPI-01 Phase A | 100% | — | — | — | — | — | — |
| KPI-03 CP Variance | 0 days | — | — | — | — | — | — |
| KPI-04 Blockers | 0 | 6 | — | — | — | — | — |
| KPI-05 CI Rate | ≥ 90% | — | — | — | — | — | — |
| KPI-06 Coverage | ≥ 80.42% | 80.42% | — | — | — | — | — |
| KPI-07 Deploys | 100% | — | — | — | — | — | — |
| KPI-08 E2E | 100% | — | — | — | — | — | — |
| KPI-12 EXIT | 22/22 | 0/22 | — | — | — | — | — |
| KPI-13 Founder | < 4h | — | — | — | — | — | — |

---

## PART VII — TEAM ALLOCATION

| Role | Count | Phase A Responsibilities |
|------|-------|------------------------|
| **Founder** | 1 | A-01, A-02, A-03 (co-lead), A-04 (co-lead) — Day 1 AM only (< 4 hours) |
| **TPM** | 1 | A-11, sprint governance, daily report, EXIT verification, EXIT-22 |
| **Backend Lead** | 1 | B-01 through B-12 |
| **Backend Engineer** | 1 | Support B-01, B-05, B-12; write tests for B-02, B-04 |
| **Web Lead** | 1 | C-01 through C-09 |
| **Mobile Lead** | 1 | A-03 (co-lead), D-01 through D-08 |
| **DevOps Lead** | 1 | E-01 through E-11, D-08 support |
| **QA Lead** | 1 | F-01 through F-06 |

**Minimum viable team: 7 people** (Backend Lead absorbs Backend Engineer if needed, adding 2 days to backend tasks).

**Staffing Risk:** If Mobile Lead is not hired before Day 1, Track D cannot start. Mobile Lead must be identified and onboarded before Day 1 standup. If Mobile Lead starts Day 3, Track D completes by Day 12 — Sprint 1 can begin with EXIT-13/14/15 deferred to Sprint 1 Week 1.

---

## PART VIII — TRACK A: GOVERNANCE

**Track Owner:** Founder + TPM  
**Phase A Tasks:** A-01, A-02, A-03, A-04, A-11  
**Phase B Tasks:** A-05, A-07, A-08  
**Phase C Tasks:** A-06, A-09, A-10  

---

### Founder Work Classification

**Target: Founder spends < 4 hours on Day 1.**

| Classification | Tasks | Estimated Founder Time | Execution Mode |
|---------------|-------|----------------------|----------------|
| 🔴 Critical Day-1 Decision | A-01, A-02, A-03, A-04 | 2h 45m | Founder present and deciding |
| 🟡 Can Be Delegated | A-05, A-07, A-08, A-09, A-10, A-11 | 15m async approvals | Delegatee executes; Founder approves via Slack |
| 🟢 Can Be Deferred | A-06 | 30m (Sprint 1 Week 1) | Deferred entirely |

**Day 1 Founder Schedule (Total active time: 2h 45m):**

| Time | Duration | Task | Mode |
|------|----------|------|------|
| 09:00–09:15 | 15 min | A-01: Sign Implementation Baseline | Solo |
| 09:15–09:45 | 30 min | A-02: Write DEC-011 | Solo |
| 10:00–11:30 | 90 min | A-03: Mobile framework decision session | With Mobile Lead |
| 11:30–12:00 | 30 min | A-04: AWS region decision | With DevOps Lead |
| 12:00–12:15 | 15 min | Async approvals: A-05, A-07, A-08 via Slack | Async |
| **Total** | **2h 45m** | | |

Founder is free from 12:15 onward. All remaining governance tasks execute without Founder presence.

---

### A-01 — Sign STAYOS_IMPLEMENTATION_BASELINE.md

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Governance |
| **Founder Classification** | 🔴 Critical Day-1 Decision |
| **Owner** | Founder (Islam Elbaz) |
| **Priority** | P0 — BLOCKING ALL TRACKS |
| **Effort** | 15 minutes |
| **Dependencies** | None |
| **Action** | Read `STAYOS_IMPLEMENTATION_BASELINE.md` Section 17 (Production Validation & Executive Decision). Add a signed statement at the end of the document: `APPROVED: [Date] — Islam Elbaz, Founder`. Commit to `main` branch. |
| **Acceptance Criteria** | Document contains signed approval block. Commit is on `main`. Engineering teams can now reference it as the contractual baseline. |
| **Risk if Skipped** | Engineering has no mandate. Teams may implement against different priorities. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | Commit: — |
| **Verified By** | — |

---

### A-02 — Resolve Phase 0 / Phase 1 Governance Conflict

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Governance |
| **Founder Classification** | 🔴 Critical Day-1 Decision |
| **Owner** | Founder (Islam Elbaz) |
| **Priority** | P0 — BLOCKING ALL TRACKS |
| **Effort** | 30 minutes |
| **Dependencies** | None |
| **Action** | Add new entry to `DECISION_LOG.md` as DEC-011 with fields: Decision, Context, Rationale, Status: Accepted. Must explicitly state whether: (a) Phase 1 code (FC-01–FC-07) is retroactively authorized, OR (b) a new Phase designation supersedes Phase 0, OR (c) Phase 0 gates are considered cleared. No ambiguity permitted. |
| **Acceptance Criteria** | DEC-011 in `DECISION_LOG.md`, committed to `main`. Entry contains no hedging language. It is a clear, dated founder decision. |
| **Risk if Skipped** | Engineers operate without clear authority. Future audits flag this as unresolved. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | Commit: — |
| **Verified By** | — |

---

### A-03 — Mobile Framework Decision

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Governance |
| **Founder Classification** | 🔴 Critical Day-1 Decision |
| **Owner** | Founder + Mobile Lead |
| **Priority** | P0 — BLOCKING TRACK D |
| **Effort** | 90 minutes (decision session) |
| **Dependencies** | Mobile Lead must be identified before this session |
| **Action** | Founder and Mobile Lead conduct a 90-minute decision session. Framework: Flutter vs React Native. Evaluation axes: team familiarity, hire availability in MENA, Paymob mobile SDK support, SQLite/offline support, CI tooling maturity. Decision committed as ADR in `docs/architecture/adr/ADR-016-mobile-framework.md` following existing ADR template. Simultaneously decide state management: Riverpod (Flutter) or Redux Toolkit (React Native). |
| **Acceptance Criteria** | ADR-016 committed to `main`, status: Accepted. Contains: chosen framework, state management library, rationale, alternatives considered. Mobile Lead begins scaffold Day 1 PM. |
| **Risk if Skipped** | All 40 mobile screens, mobile CI pipeline, and Push Notifications backend cannot start. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### A-04 — AWS Deployment Region Decision

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Infrastructure |
| **Founder Classification** | 🔴 Critical Day-1 Decision |
| **Owner** | Founder + DevOps Lead |
| **Priority** | P0 — BLOCKING TRACK E |
| **Effort** | 30 minutes |
| **Dependencies** | None |
| **Action** | Resolve the conflict between ADR-007 (me-central-1, UAE) and the current Terraform state backend (me-south-1, Bahrain). Considerations: service availability (PostGIS on RDS, ElastiCache, Fargate in chosen region), latency to Egyptian users, compliance, cost. Update `infra/terraform/variables.tf` with the confirmed region value. Update ADR-007 if decision changes from me-central-1. |
| **Acceptance Criteria** | `infra/terraform/variables.tf` `region` default is set to the confirmed region. If ADR-007 is unchanged (me-central-1), Terraform state backend moved from me-south-1. DevOps Lead proceeds with `terraform init` Day 1 PM. |
| **Risk if Skipped** | `terraform apply` cannot run. Infrastructure provisioning is blocked. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | Commit: — |
| **Verified By** | — |

---

### A-05 — Decide Email Provider

| Field | Detail |
|-------|--------|
| **Phase** | **Phase B — Foundation Enhancement** |
| **Category** | Governance |
| **Founder Classification** | 🟡 Can Be Delegated (Backend Lead proposes → Founder approves async) |
| **Owner** | Backend Lead (proposes) + Founder (approves) |
| **Priority** | P1 — Blocks B-06 |
| **Effort** | 30 minutes total (15 min Backend Lead prepares; 5 min Founder approves via Slack) |
| **Dependencies** | None |
| **Action** | Backend Lead documents recommendation between AWS SES and SendGrid. Default recommendation: SES (consistency with existing AWS infrastructure; SES requires domain verification 1–3 days but avoids vendor sprawl). Backend Lead posts recommendation to Slack with one-line rationale. Founder approves. Record as DEC-012 in `DECISION_LOG.md`. |
| **Acceptance Criteria** | DEC-012 committed. Backend Lead can proceed with B-06. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | Commit: — |
| **Verified By** | — |

---

### A-06 — Decide Analytics Provider

| Field | Detail |
|-------|--------|
| **Phase** | **Phase C — Pre-Beta** |
| **Category** | Governance |
| **Founder Classification** | 🟢 Can Be Deferred (Sprint 1, Week 1) |
| **Owner** | Founder |
| **Priority** | P1 — Blocks Sprint 3 analytics emission |
| **Effort** | 30 minutes |
| **Dependencies** | None |
| **Deferred Action** | Schedule for Sprint 1, Week 1 daily standup. Choose between PostHog, Mixpanel, Amplitude. Recommendation: PostHog (open-source, self-hostable, no per-event cost). Record as DEC-013 in `DECISION_LOG.md`. |
| **Acceptance Criteria** | DEC-013 committed before Sprint 3 begins. Analytics event emission can be planned. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | Commit: — |
| **Verified By** | — |

---

### A-07 — Decide Messaging Transport

| Field | Detail |
|-------|--------|
| **Phase** | **Phase B — Foundation Enhancement** |
| **Category** | Governance |
| **Founder Classification** | 🟡 Can Be Delegated (TPM records; ADR-008 already decides this) |
| **Owner** | TPM (records) + Founder (approves async) |
| **Priority** | P1 — Blocks Sprint 5 messaging architecture |
| **Effort** | 15 minutes (ADR-008 already accepted SSE + Redis pub/sub) |
| **Dependencies** | None |
| **Action** | ADR-008 already accepts SSE + Redis pub/sub for real-time. Messaging chat uses the same SSE pattern for consistency. TPM drafts DEC-014 confirming this, posts to Slack. Founder approves async. Commit DEC-014. |
| **Acceptance Criteria** | DEC-014 committed. Messaging architecture designed Sprint 5 without re-opening the decision. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | Commit: — |
| **Verified By** | — |

---

### A-08 — Confirm Stripe Scope

| Field | Detail |
|-------|--------|
| **Phase** | **Phase B — Foundation Enhancement** |
| **Category** | Compliance |
| **Founder Classification** | 🟡 Can Be Delegated (Backend Lead drafts → Founder approves async) |
| **Owner** | Backend Lead (drafts) + Founder (approves) |
| **Priority** | P1 — Clarification for Sprint 3 Finance track |
| **Effort** | 15 minutes total |
| **Dependencies** | None |
| **Action** | Backend Lead drafts DEC-015 confirming ADR-003 position: Stripe scoped to international cards only (Visa, Mastercard, Apple Pay, Google Pay). Paymob handles all Egyptian rails (Fawry, Meeza, Vodafone Cash, InstaPay, EGP cards). Founder approves via Slack. Commit DEC-015. |
| **Acceptance Criteria** | DEC-015 committed. Finance team Sprint 3 mandate is clear. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | Commit: — |
| **Verified By** | — |

---

### A-09 — Submit WhatsApp Business API Application

| Field | Detail |
|-------|--------|
| **Phase** | **Phase C — Pre-Beta** |
| **Category** | Governance |
| **Founder Classification** | 🟡 Can Be Delegated (TPM or Operations Lead submits with Founder business credentials) |
| **Owner** | TPM / Operations Lead (submits) + Founder (provides business credentials) |
| **Priority** | P0 — LONG LEAD TIME (4–8 weeks external) |
| **Effort** | 4 hours for submission; 4–8 weeks for external approval |
| **Dependencies** | Registered business entity in Egypt or UAE |
| **Initiation Deadline** | Day 1 — cannot be deferred without pushing Beta release |
| **Action** | Apply for Meta Business Manager verification and WhatsApp Business API access. Required: registered business name, address, phone number, Meta Business Manager account, Facebook Business verification. Begin Day 1. |
| **Acceptance Criteria** | Meta Business Manager application submitted Day 1. Application reference number recorded. Estimated approval date noted in risk register. |
| **Risk if Skipped** | WhatsApp (primary notification channel) unavailable at Alpha launch. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | Application reference: — |
| **Verified By** | — |

---

### A-10 — Register App Store and Play Store Accounts

| Field | Detail |
|-------|--------|
| **Phase** | **Phase C — Pre-Beta** |
| **Category** | Governance |
| **Founder Classification** | 🟡 Can Be Delegated (Mobile Lead creates accounts; Founder provides payment method async) |
| **Owner** | Mobile Lead (creates) + Founder (payment authorization) |
| **Priority** | P0 — LONG LEAD TIME (review 1–7 days) |
| **Effort** | 3 hours |
| **Dependencies** | None |
| **Initiation Deadline** | Day 1 |
| **Action** | (1) Create Apple Developer Account at developer.apple.com ($99/year). (2) Create Google Play Console account at play.google.com/console ($25 one-time). Both require a verified business entity. App Store review takes 1–3 days per submission. First submission planned for Sprint 7–8. |
| **Acceptance Criteria** | Both accounts created and confirmed. Account IDs recorded in the project credential store. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | Apple ID: — · Play Console ID: — |
| **Verified By** | — |

---

### A-11 — Update Stale Documents

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Technical Debt |
| **Founder Classification** | 🟡 Can Be Delegated (TPM executes entirely) |
| **Owner** | TPM |
| **Priority** | P2 |
| **Effort** | 1 hour |
| **Dependencies** | A-04 (region decision, to update any region references) |
| **Action** | (1) Add header banner to `TECH_STACK.md` and `ARCHITECTURE.md`: "CONFLICTS RESOLVED — See ARCHITECTURE_FREEZE.md". (2) Update `MASTER_PROJECT_MEMORY.md` `Project:` field from `UNKNOWN` to `StayOS`. (3) Remove or redirect root-level `SPRINT_MEMORY.md` to `.ai/CURRENT/SPRINT_MEMORY.md`. |
| **Acceptance Criteria** | No document shows Paymob/Stripe conflict as open. `Project` field is `StayOS`. Root `SPRINT_MEMORY.md` resolved. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | Commit: — |
| **Verified By** | — |

---

## PART IX — TRACK B: BACKEND FOUNDATION

**Track Owner:** Backend Lead  
**Phase A Tasks:** B-01, B-02, B-03, B-04, B-05, B-07, B-08, B-09, B-10, B-11, B-12 (11 tasks)  
**Phase B Tasks:** B-06 (1 task)  
**Timeline:** Days 1–4  
**Note:** No new feature modules in Sprint 0. Only audit-identified foundation gaps.

---

### B-01 — Migration 011: unit_photos Table

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Backend |
| **Owner** | Backend Lead |
| **Priority** | P0 |
| **Effort** | 2 hours |
| **Dependencies** | None |
| **Files** | `alembic/versions/011_create_unit_photos.py`, `src/app/listings/models.py` |
| **Description** | Create `pms.unit_photos` table: `id UUID PK`, `unit_id UUID FK → pms.units`, `s3_key TEXT NOT NULL`, `url TEXT NOT NULL`, `order INT NOT NULL DEFAULT 0`, `is_primary BOOL DEFAULT false`, `uploaded_by UUID FK → auth.users`, `created_at TIMESTAMPTZ`. Add `unit_photos` relationship to `Unit` SQLAlchemy model. |
| **Acceptance Criteria** | Migration applies cleanly with `alembic upgrade head`. Downgrade reverses cleanly. `Unit.photos` relationship navigable in Python. |
| **Risk** | Low — additive migration, no existing table affected |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### B-02 — Photo Upload API

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Backend |
| **Owner** | Backend Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | B-01, E-03 (S3 buckets provisioned via Terraform) |
| **Files** | `src/app/listings/services.py`, `src/app/listings/router.py`, `src/app/listings/schemas.py`, `src/app/listings/repository.py`, `tests/test_listings.py` |
| **Description** | Implement `POST /api/v1/listings/{unit_id}/photos` (host-only, KYC-verified). Flow: (1) validate file count ≤ 20 per listing, (2) generate S3 presigned PUT URL for `S3_LISTINGS_BUCKET/{unit_id}/{uuid}.{ext}`, (3) create `pms.unit_photos` record with `status=pending`, (4) return presigned URL to client for direct S3 upload. Implement `DELETE /api/v1/listings/{unit_id}/photos/{photo_id}` (host-only, owns listing). Implement `GET /api/v1/listings/{unit_id}/photos` (public). Enforce MIME whitelist: `image/jpeg`, `image/png`, `image/webp`. Max size: 10MB per file. |
| **Acceptance Criteria** | `pytest tests/test_listings.py -k photo` passes. Manual test: presigned URL returned, S3 upload succeeds, photo record created. |
| **Risk** | Medium — depends on S3 bucket being provisioned (E-03) |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### B-03 — Migration 012: device_tokens Table

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Backend |
| **Owner** | Backend Lead |
| **Priority** | P0 |
| **Effort** | 1 hour |
| **Dependencies** | None |
| **Files** | `alembic/versions/012_create_device_tokens.py`, `src/app/auth/models.py` |
| **Description** | Create `auth.device_tokens` table: `id UUID PK`, `user_id UUID FK → auth.users`, `fcm_token TEXT NOT NULL`, `platform ENUM('ios','android','web') NOT NULL`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`. Add unique constraint on `(user_id, fcm_token)`. |
| **Acceptance Criteria** | Migration applies and reverses cleanly. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### B-04 — Device Token Registration Endpoint

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Backend |
| **Owner** | Backend Lead |
| **Priority** | P0 |
| **Effort** | 3 hours |
| **Dependencies** | B-03 |
| **Files** | `src/app/auth/router.py`, `src/app/auth/schemas.py`, `src/app/auth/repository.py`, `src/app/auth/services.py`, `tests/test_auth.py` |
| **Description** | Implement `POST /api/v1/auth/device-token` (authenticated). Body: `{ "fcm_token": "string", "platform": "ios|android|web" }`. Upsert device token for the current user. On duplicate `fcm_token`, update `user_id` (token transferred to new user after re-login). |
| **Acceptance Criteria** | Authenticated user registers token → token stored. Re-registration updates record. Unauthenticated request returns 401. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### B-05 — Migration 015: Analytics Event Log Tables (ADR-015 Non-Negotiable)

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Compliance |
| **Owner** | Backend Lead |
| **Priority** | P0 — ADR-015 non-negotiable |
| **Effort** | 2 hours |
| **Dependencies** | None |
| **Files** | `alembic/versions/015_create_analytics_events.py` |
| **Description** | Create `analytics` schema. Create tables: `analytics.listing_views` (`id`, `listing_id FK`, `user_id FK nullable`, `session_id`, `locale`, `device_type`, `referrer`, `viewed_at TIMESTAMPTZ`), `analytics.user_searches` (`id`, `user_id nullable`, `query`, `geo_lat`, `geo_lng`, `date_from`, `date_to`, `guests`, `filters JSONB`, `result_count INT`, `searched_at TIMESTAMPTZ`), `analytics.booking_funnel_events` (`id`, `user_id FK nullable`, `listing_id FK`, `event_type ENUM`, `session_id`, `occurred_at TIMESTAMPTZ`). All tables use `TIMESTAMPTZ` with UTC default. |
| **Acceptance Criteria** | Migration applies cleanly. All three tables present in staging DB. ADR-015 non-negotiable met. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### B-06 — Wire Email Provider (AWS SES)

| Field | Detail |
|-------|--------|
| **Phase** | **Phase B — Foundation Enhancement** |
| **Category** | Backend |
| **Owner** | Backend Lead |
| **Priority** | P1 |
| **Effort** | 1 day |
| **Dependencies** | A-05 (email provider decision), E-07 (SES domain verified — DNS propagation) |
| **Files** | `src/app/notifications/providers.py`, `src/app/notifications/services.py`, `tests/test_notifications.py` |
| **Description** | Replace email provider stub with real AWS SES implementation using `boto3.client('ses')`. Function: `send_email(to: str, subject: str, body_html: str, body_text: str)`. Use SES `send_email` API. Add `SES_FROM_EMAIL` and `SES_REGION` to `src/app/config.py`. Handle `ClientError` with retry up to 3 times. Route to dead-letter on 4th failure. |
| **Acceptance Criteria** | Integration test (with mocked boto3): email send called with correct parameters. No stub references remain in production code paths. SES verified in staging. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### B-07 — Fix Paymob Iframe URL in Reservation Response

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Backend |
| **Owner** | Backend Lead |
| **Priority** | P0 — BOOKING FLOW IS BROKEN WITHOUT THIS |
| **Effort** | 3 hours |
| **Dependencies** | None |
| **Files** | `src/app/reservations/services.py`, `src/app/reservations/schemas.py`, `tests/test_reservations_services.py` |
| **Description** | `create_reservation` in `src/app/reservations/services.py` calls the Paymob provider to create a payment order and payment key but does not return the iframe URL to the caller. Modify `ReservationCreateResponse` schema to include `paymob_iframe_url: str | None` and `stripe_client_secret: str | None`. Populate these fields from the provider response in `create_reservation`. |
| **Acceptance Criteria** | `POST /api/v1/reservations/` response body contains `paymob_iframe_url` for Paymob payments. Existing tests updated and passing. New test: create reservation → verify `paymob_iframe_url` is a valid URL string. |
| **Risk** | Low — data is already present in the service layer, just not returned |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### B-08 — Wire AWS Secrets Manager Client

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Security |
| **Owner** | Backend Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | E-04 (Secrets Manager populated with staging values) |
| **Files** | `src/app/security/secrets.py`, `src/app/config.py`, `src/app/main.py` |
| **Description** | Replace the placeholder `SecretsManager` AWS backend with a working implementation. On startup (in `lifespan`), fetch the secret bundle from AWS Secrets Manager secret named `stayos/{environment}/app-secrets`. Parse JSON bundle and inject values into `settings` overrides. Fail fast if secrets cannot be fetched in production environment. Allow fallback to environment variables in `development` and `test` environments. |
| **Acceptance Criteria** | Staging API startup log shows "Loaded secrets from AWS Secrets Manager: stayos/staging/app-secrets". If Secrets Manager is unreachable in production, app exits with non-zero code. Unit test: mock `boto3.client` → verify values loaded into settings. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### B-09 — Fix Recurring Maintenance Celery Beat Schedule

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Backend |
| **Owner** | Backend Lead |
| **Priority** | P2 |
| **Effort** | 1 hour |
| **Dependencies** | None |
| **Files** | `src/app/celery_app.py` |
| **Description** | Add `app.operations.tasks.spawn_recurring_tasks` to `CELERY_BEAT_SCHEDULE` with a daily schedule at 06:00 UTC. |
| **Acceptance Criteria** | `celery_app.beat_schedule` contains the recurring maintenance task. CI test: `test_celery_app.py` verifies the entry. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### B-10 — Add PropertyReadiness Unique Constraint

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Backend |
| **Owner** | Backend Lead |
| **Priority** | P1 |
| **Effort** | 1 hour |
| **Dependencies** | None |
| **Files** | `alembic/versions/016_add_property_readiness_unique.py`, `src/app/operations/models.py` |
| **Description** | Create migration 016 to add `UNIQUE(unit_id, reservation_id)` constraint to `operations.property_readiness`. Add `UniqueConstraint` to the SQLAlchemy model. Handle `IntegrityError` in `operations/repository.py` as a `ConflictError`. |
| **Acceptance Criteria** | Migration applies cleanly. Attempting to insert a duplicate `(unit_id, reservation_id)` raises `ConflictError (409)`. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### B-11 — Lock CORS to Production Origins

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Security |
| **Owner** | Backend Lead |
| **Priority** | P0 |
| **Effort** | 1 hour |
| **Dependencies** | E-06 (Vercel staging URL known) |
| **Files** | `src/app/shared/middleware.py`, `src/app/config.py` |
| **Description** | Add `CORS_ORIGINS: list[str]` to settings (comma-separated in environment variables). Replace any wildcard CORS with explicit origin list. Staging: `["https://staging.stayos.com", "http://localhost:3000"]`. Production: `["https://stayos.com", "https://www.stayos.com"]`. |
| **Acceptance Criteria** | `curl -H "Origin: https://evil.com" https://api.staging.stayos.com/api/v1/listings/` — response does NOT include `Access-Control-Allow-Origin: *`. Legitimate staging origin returns correct CORS headers. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### B-12 — ADR-015 Schema Compliance Verification

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Compliance |
| **Owner** | Backend Lead |
| **Priority** | P1 |
| **Effort** | 2 hours |
| **Dependencies** | None |
| **Files** | All migration files 003–010, `src/app/*/models.py` |
| **Description** | Audit every table against ADR-015 non-negotiables: (1) All monetary `amount` columns — verify type is `INTEGER` (minor units) and a companion `currency CHAR(3)` column exists. Create patch migration if not. (2) `auth.accounts` — verify `locale VARCHAR(10)` column exists. (3) `pms.unit_listings` — verify `country CHAR(2)` and `currency CHAR(3)` columns exist. Create patch migrations for any missing columns. |
| **Acceptance Criteria** | All three ADR-015 non-negotiables verified present in staging DB. Any missing columns added via migrations that apply cleanly. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

## PART X — TRACK C: FRONTEND FOUNDATION

**Track Owner:** Web Lead  
**Phase A Tasks:** C-01, C-02, C-03, C-04, C-05, C-06, C-07, C-08 (8 tasks)  
**Phase B Tasks:** C-09 (1 task)  
**Timeline:** Days 1–5  
**Tooling (frozen):** `next-intl` (i18n), `TanStack Query` (server state), `Zustand` (client state), `Tailwind CSS` (styling), `openapi-typescript` (type generation), `Vitest` + `React Testing Library` (unit tests), `Playwright` (E2E).

---

### C-01 — Project Configuration and Environment

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Frontend |
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 3 hours |
| **Dependencies** | E-05 (staging URL known for `.env.local.example`) |
| **Deliverables** | `apps/web/next.config.mjs`, `apps/web/.env.local.example`, `apps/web/package.json` |
| **Description** | (1) Update `next.config.mjs`: add `images.domains` (S3 bucket + CloudFront domain), `async rewrites()` proxying `/api` to the backend URL in non-production, remove `swcMinify` (deprecated in Next.js 14). (2) Create `.env.local.example` with all required variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `NEXT_PUBLIC_FIREBASE_CONFIG`, `NEXT_PUBLIC_PAYMOB_IFRAME_ID`, `NEXT_PUBLIC_SENTRY_DSN`. (3) Install production dependencies: `next-intl`, `@tanstack/react-query`, `zustand`, `axios`. Install dev dependencies: `openapi-typescript`, `vitest`, `@testing-library/react`, `@playwright/test`. Update `pnpm-lock.yaml`. |
| **Acceptance Criteria** | `pnpm install` completes. `pnpm build` produces no errors. `pnpm type-check` passes. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### C-02 — Tailwind CSS and Design Token Implementation

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Frontend |
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | None — design system frozen in VISUAL_DESIGN_SYSTEM_P1.md |
| **Deliverables** | `apps/web/tailwind.config.ts`, `apps/web/app/globals.css` |
| **Description** | Install Tailwind CSS + `@tailwindcss/typography` + `tailwindcss-rtl` plugin. Configure `tailwind.config.ts` with all design tokens from VISUAL_DESIGN_SYSTEM_P1.md: (1) `colors` — all color tokens (primary, secondary, semantic, neutrals). (2) `fontFamily` — Inter (LTR), Cairo (Arabic/RTL). (3) `spacing` — 4px base grid (1 = 4px). (4) `boxShadow` — all 5 shadow tokens. (5) `borderRadius` — all radius tokens. In `globals.css`: define CSS custom properties for all tokens. Set `html[dir="rtl"]` base styles. Import Cairo and Inter fonts from Google Fonts. |
| **Acceptance Criteria** | `pnpm build` passes. A test page using `className="text-primary-500 font-arabic"` renders correctly. RTL: `className="ps-4"` (padding-start) renders correctly in RTL direction. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### C-03 — i18n and RTL Configuration

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Frontend |
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | C-01 |
| **Deliverables** | `apps/web/i18n.ts`, `apps/web/middleware.ts`, `apps/web/messages/ar.json`, `apps/web/messages/en.json`, `apps/web/app/[locale]/layout.tsx` |
| **Description** | Configure `next-intl` for Arabic (`ar`) and English (`en`). (1) Create `i18n.ts` with locale configuration, `defaultLocale: 'ar'`, `locales: ['ar', 'en']`. (2) Create `middleware.ts` using `next-intl` middleware to detect locale from URL. (3) Update `apps/web/app/[locale]/layout.tsx` to set `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>`. (4) Create initial `messages/ar.json` and `messages/en.json` with at least 20 base keys covering navigation, auth, errors, and common labels. (5) Wrap root layout with `NextIntlClientProvider`. |
| **Acceptance Criteria** | `/ar/` URL loads with `dir="rtl"` on `<html>`. `/en/` URL loads with `dir="ltr"`. `useTranslations('common')` returns Arabic string on `/ar/`. `pnpm type-check` passes. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### C-04 — Typed API Client

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Frontend |
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | E-05 (staging API running with OpenAPI at `/openapi.json`) |
| **Deliverables** | `apps/web/lib/api/generated.ts`, `apps/web/lib/api/client.ts`, `apps/web/lib/api/index.ts` |
| **Description** | (1) Run `openapi-typescript https://api.staging.stayos.com/openapi.json -o apps/web/lib/api/generated.ts`. Add as `pnpm generate:api` script. (2) Create `apps/web/lib/api/client.ts` using `axios`: configure `baseURL` from `NEXT_PUBLIC_API_URL`, attach `Authorization: Bearer {token}` header from session, handle 401 by triggering token refresh, handle 422 validation errors and surface field-level errors. (3) Export typed endpoint wrappers in `apps/web/lib/api/index.ts` — one function per API endpoint group (auth, listings, reservations, finance, operations). |
| **Acceptance Criteria** | `pnpm generate:api` completes without errors. `apps/web/lib/api/generated.ts` compiles. Calling `api.listings.list({ locale: 'ar' })` is typed and returns the correct response type. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### C-05 — Authentication Context

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Frontend |
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | C-04 |
| **Deliverables** | `apps/web/lib/auth/context.tsx`, `apps/web/lib/auth/session.ts`, `apps/web/middleware.ts` (updated) |
| **Description** | (1) Implement `AuthContext` with: `user: User | null`, `isLoading: boolean`, `login(phone: string): Promise<void>`, `verifyOtp(otp: string): Promise<void>`, `logout(): Promise<void>`, `refreshToken(): Promise<void>`. (2) Store access token in memory (React state), refresh token in `httpOnly` cookie via Next.js API route `/api/auth/set-cookie` (BFF pattern per ADR-014). (3) On app mount, call `GET /auth/me` to hydrate user. On 401, call refresh token; on refresh failure, clear session and redirect to `/[locale]/login`. (4) Create `useAuth()` hook. (5) Create `ProtectedRoute` wrapper component that redirects to login if `user === null`. |
| **Acceptance Criteria** | E2E smoke test (Playwright): OTP login → `user` is populated → access protected page → user shown. Refresh: manually expire access token → next API call triggers refresh → succeeds without logout. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### C-06 — Server State Management (TanStack Query)

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Frontend |
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 3 hours |
| **Dependencies** | C-04, C-05 |
| **Deliverables** | `apps/web/lib/query/client.ts`, `apps/web/app/providers.tsx` |
| **Description** | (1) Configure `QueryClient` with defaults: `staleTime: 5 * 60 * 1000` (5 minutes), `retry: 2`, `refetchOnWindowFocus: false`. (2) Create `apps/web/app/providers.tsx` wrapping children with `QueryClientProvider` and `NextIntlClientProvider`. (3) Create first query hook: `useListings(filters: ListingSearchFilters)` calling `api.listings.list(filters)` with TanStack Query. |
| **Acceptance Criteria** | `pnpm type-check` passes. Search results page can import and call `useListings()` without type errors. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### C-07 — Layout System and Routing

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Frontend |
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | C-02, C-03 |
| **Deliverables** | `apps/web/app/[locale]/layout.tsx`, `apps/web/components/layouts/GuestLayout.tsx`, `apps/web/components/layouts/HostLayout.tsx`, `apps/web/components/layouts/AuthLayout.tsx`, `apps/web/components/nav/Header.tsx`, `apps/web/components/nav/Footer.tsx` |
| **Description** | (1) Root locale layout: `<html lang dir>` wrapper with Google Fonts, global CSS, `Providers`. (2) `GuestLayout`: header with search bar, language toggle, login/signup CTA, footer. (3) `HostLayout`: sidebar navigation, language toggle, user avatar menu. (4) `AuthLayout`: centered card layout for login, signup, KYC screens. (5) `Header`: Arabic-first navigation — Arabic text rendered correctly in RTL, LTR toggle switches direction. (6) `Footer`: minimal, Arabic primary. |
| **Acceptance Criteria** | Navigating to `/ar/search` shows Arabic RTL header. Navigating to `/en/search` shows English LTR header. Language toggle switches locale and maintains current path. `pnpm build` passes. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### C-08 — Error Handling and Loading States

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Frontend |
| **Owner** | Web Lead |
| **Priority** | P1 |
| **Effort** | 4 hours |
| **Dependencies** | C-04, C-06 |
| **Deliverables** | `apps/web/components/ui/ErrorBoundary.tsx`, `apps/web/components/ui/Skeleton.tsx`, `apps/web/app/[locale]/error.tsx`, `apps/web/app/[locale]/not-found.tsx` |
| **Description** | (1) `ErrorBoundary` React component: catches render errors, shows Arabic-first error message with retry CTA. (2) `Skeleton` component: matches listing card, search results, and profile form shapes from VISUAL_DESIGN_SYSTEM_P3.md skeleton states. (3) Next.js `error.tsx` page: bilingual error message with back-home CTA. (4) Next.js `not-found.tsx` page: Arabic-first 404 with navigation. |
| **Acceptance Criteria** | Throwing an error inside a page renders the Arabic error boundary, not a blank screen. A route that doesn't exist renders the Arabic 404 page. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### C-09 — Frontend Unit Test Configuration

| Field | Detail |
|-------|--------|
| **Phase** | **Phase B — Foundation Enhancement** |
| **Category** | QA |
| **Owner** | Web Lead |
| **Priority** | P1 |
| **Effort** | 3 hours |
| **Dependencies** | C-01 |
| **Deliverables** | `apps/web/vitest.config.ts`, `apps/web/tests/setup.ts`, first passing unit test |
| **Description** | Configure Vitest with `@testing-library/react`, `@testing-library/user-event`, and `msw` for API mocking. Set up jsdom environment. Write first unit test: render `Header` component → assert "StayOS" text present → assert `dir="rtl"` attribute present when locale is `ar`. Add `pnpm test` and `pnpm test:coverage` scripts. |
| **Acceptance Criteria** | `pnpm test` runs and first test passes. CI frontend job updated to run `pnpm test`. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

## PART XI — TRACK D: MOBILE FOUNDATION

**Track Owner:** Mobile Lead  
**Phase A Tasks:** D-01, D-02, D-03, D-04, D-05, D-06, D-08 (7 tasks)  
**Phase B Tasks:** D-07 (1 task)  
**Timeline:** Days 1–5 (Day 1 PM after A-03 completes)  
**Note:** All tasks show Flutter and React Native equivalents. Substitute correct tooling after A-03 decision.

---

### D-01 — Framework Scaffold

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Mobile |
| **Owner** | Mobile Lead |
| **Priority** | P0 — FIRST MOBILE TASK |
| **Effort** | 4 hours |
| **Dependencies** | A-03 (framework decision) |
| **Flutter Deliverable** | `apps/mobile/` with Flutter project, `pubspec.yaml`, `lib/main.dart` |
| **React Native Deliverable** | `apps/mobile/` with RN project, `package.json`, `App.tsx` |
| **Description** | Initialize mobile project inside `apps/mobile/`. Flutter: `flutter create --org com.stayos --project-name stayos_mobile apps/mobile`. React Native: `npx react-native init StayOSMobile --template react-native-template-typescript --directory apps/mobile`. Configure `.gitignore` for mobile artifacts. Add `apps/mobile` to monorepo structure. |
| **Acceptance Criteria** | `flutter run` (or `npx react-native run-ios`) launches scaffold on simulator. Clean build with no warnings. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### D-02 — Navigation Architecture

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Mobile |
| **Owner** | Mobile Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | D-01 |
| **Flutter** | `go_router` package, `lib/router/app_router.dart` |
| **React Native** | React Navigation 6, `src/navigation/AppNavigator.tsx` |
| **Description** | Implement navigation structure matching screen hierarchy in Implementation Baseline (SCR-001 through SCR-054). Route definitions only — screens are stub placeholders. Structure: (1) Unauthenticated stack: Splash → Onboarding → Phone Entry → OTP Verify → Social Login. (2) KYC gate: KYC Start → Document Capture → Selfie → Pending. (3) Guest tab bar: Home, Search, Trips, Messages, Profile. (4) Host tab bar: Dashboard, Listings, Operations, Payouts, Profile. Deep link structure: `stayos://listing/{id}`, `stayos://reservation/{id}`. |
| **Acceptance Criteria** | Navigation between all defined routes works. Deep links open correct stub screen. No navigation crashes on back-press from any stub screen. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### D-03 — Localization (Arabic RTL First)

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Mobile |
| **Owner** | Mobile Lead |
| **Priority** | P0 |
| **Effort** | 4 hours |
| **Dependencies** | D-01 |
| **Flutter** | `flutter_localizations`, `intl` package, `lib/l10n/` ARB files |
| **React Native** | `react-native-localization` or `i18next-react-native-language-detector` |
| **Description** | Configure app for Arabic (`ar`) and English (`en`). Arabic is the default. RTL layout must be the default. All text strings extracted to localization files from Day 1 — no hardcoded strings. Set up `ar.arb` and `en.arb` (Flutter) or `ar.json` and `en.json` (RN). Initial strings: app name, navigation labels, auth screen labels, error messages. |
| **Acceptance Criteria** | App launches in Arabic RTL. Switching to English changes direction to LTR. All text in scaffold uses localization keys, not hardcoded strings. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### D-04 — Theme System

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Mobile |
| **Owner** | Mobile Lead |
| **Priority** | P0 |
| **Effort** | 4 hours |
| **Dependencies** | D-01 |
| **Flutter** | `lib/theme/app_theme.dart` with `ThemeData` |
| **React Native** | `src/theme/theme.ts` with `StyleSheet` tokens |
| **Description** | Implement mobile design tokens from MOBILE_NATIVE_DESIGN_P1.md: primary color `#2C5FFF`, font families (Cairo for Arabic, Inter for English), spacing grid (8px base), border radii, shadow styles. Configure both light and dark mode themes. Apply theme to scaffold root widget/component. |
| **Acceptance Criteria** | Scaffold screens use correct primary color and font. Dark mode toggle switches theme. No hardcoded hex colors anywhere. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### D-05 — Mobile API Client

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Mobile |
| **Owner** | Mobile Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | D-01, E-05 (staging API running) |
| **Flutter** | `dio` package, `lib/services/api_client.dart` |
| **React Native** | `axios`, `src/services/apiClient.ts` |
| **Description** | Create typed API client targeting backend URL (configurable via `--dart-define` or `.env`). Features: (1) Base URL from environment. (2) Attach `Authorization: Bearer {token}` header. (3) On 401, call refresh token endpoint; on refresh failure, emit logout event. (4) Map API error responses (`{ "error": { "code", "message", "message_ar" } }`) to typed `ApiError` class. (5) Implement methods for `auth.*`, `listings.*`, `reservations.*`, `finance.*` returning typed models. |
| **Acceptance Criteria** | Smoke test: call `GET /health` from running app on simulator → returns `{"status": "ok"}` — log visible in console. Unauthenticated call to protected endpoint receives `ApiError(code: "NOT_AUTHENTICATED")`. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### D-06 — Mobile Authentication Context

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Mobile |
| **Owner** | Mobile Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | D-05 |
| **Flutter** | `lib/providers/auth_provider.dart` (Riverpod) or `lib/bloc/auth/` (Bloc) |
| **React Native** | `src/store/authSlice.ts` (Redux Toolkit) |
| **Description** | Implement auth state: `user: User?`, `isLoading: bool`, `error: String?`. Implement actions: `sendOtp(phone)`, `verifyOtp(phone, code)`, `logout()`, `refreshToken()`. Store tokens in `FlutterSecureStorage` (Flutter) or `react-native-keychain` (RN). On app launch, read stored refresh token → call `/auth/refresh` → populate user. On 401 refresh failure, clear storage and navigate to login. |
| **Acceptance Criteria** | Navigating to a protected route while unauthenticated redirects to phone entry. After OTP verification, user state is populated and persists across app restarts. Logout clears all stored tokens. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### D-07 — Push Notification SDK Setup

| Field | Detail |
|-------|--------|
| **Phase** | **Phase B — Foundation Enhancement** |
| **Category** | Mobile |
| **Owner** | Mobile Lead |
| **Priority** | P1 |
| **Effort** | 4 hours |
| **Dependencies** | D-01, A-10 (Firebase project created) |
| **Flutter** | `firebase_core`, `firebase_messaging` packages |
| **React Native** | `@react-native-firebase/messaging` |
| **Description** | Integrate Firebase Cloud Messaging SDK. (1) Connect to the Firebase project created in A-10. (2) Request permission on app launch (iOS requires explicit permission). (3) On permission granted, call `POST /api/v1/auth/device-token` with the FCM token. (4) Handle foreground messages: display in-app notification banner. (5) Handle background/terminated: navigate to correct screen on tap using deep link. |
| **Acceptance Criteria** | Device token registered in `auth.device_tokens` table after first app launch. Test push from Firebase Console: notification appears on device. Tapping notification opens the app. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### D-08 — Mobile CI Pipeline

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | DevOps |
| **Owner** | DevOps Lead + Mobile Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | A-03 (framework decision), D-01 (scaffold exists) |
| **Deliverables** | `.github/workflows/mobile-ci.yml` |
| **Description** | Create GitHub Actions workflow for mobile CI: (1) Trigger on PR to `develop` or `main`. (2) Set up Flutter (or Node.js + Java for RN). (3) Run `flutter analyze` (or `eslint`). (4) Run `flutter test` (or `jest`). (5) Build release APK (Android): `flutter build apk --release` or equivalent. (6) Build iOS archive (macOS runner): `flutter build ipa --release` or equivalent. Do NOT upload to stores — Sprint 7 task. |
| **Acceptance Criteria** | Mobile CI workflow triggers on PR. `flutter analyze` and `flutter test` pass. Android APK builds successfully. iOS build succeeds on `macos-latest` runner. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

## PART XII — TRACK E: INFRASTRUCTURE

**Track Owner:** DevOps Lead  
**Phase A Tasks:** E-01, E-02, E-03, E-04, E-05, E-06 (6 tasks)  
**Phase B Tasks:** E-07, E-08, E-09, E-10, E-11 (5 tasks)  
**Timeline:** Days 1–3 (critical path — everything depends on staging being live)

---

### E-01 — Resolve Terraform Configuration

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Infrastructure |
| **Owner** | DevOps Lead |
| **Priority** | P0 — FIRST INFRA TASK |
| **Effort** | 4 hours |
| **Dependencies** | A-04 (region decision) |
| **Files** | `infra/terraform/rds.tf`, `infra/terraform/ecs.tf`, `infra/terraform/variables.tf`, `infra/terraform/main.tf` |
| **Description** | (1) Update `infra/terraform/variables.tf`: set confirmed `region` default. (2) Fix `infra/terraform/rds.tf`: add custom parameter group `aws_db_parameter_group` with `family = "postgres16"`, parameter `rds.force_ssl = 1`, and `shared_preload_libraries = pg_stat_statements,pg_stat_bgwriter`. Set `parameter_group_name` on `aws_db_instance`. (3) Fix `infra/terraform/ecs.tf`: replace all `subnet-xxx` and `sg-xxx` placeholder values with Terraform data sources or variables. Reference `aws_vpc.main.id`, `aws_subnet.private[*].id`, `aws_security_group.ecs_tasks.id`. (4) Move Terraform state backend to confirmed region if different from current `me-south-1`. (5) Create `infra/terraform/staging.tfvars` with all variable values for staging. |
| **Acceptance Criteria** | `terraform validate` passes. `terraform plan -var-file=staging.tfvars` produces no errors. No placeholder values remain. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### E-02 — Configure GitHub Secrets

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | DevOps |
| **Owner** | DevOps Lead + Founder |
| **Priority** | P0 |
| **Effort** | 4 hours |
| **Dependencies** | None — runs in parallel with E-01 |
| **Description** | Populate all required GitHub Actions secrets in repository Settings → Secrets and Variables → Actions: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `PAYMOB_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SENTRY_DSN`, `JWT_PRIVATE_KEY` (staging RSA key), `JWT_PUBLIC_KEY`. |
| **Acceptance Criteria** | All secrets listed above present in GitHub Actions secret store. Running `deploy-staging.yml` manually does not fail with "secret not found" errors. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | GitHub Actions Secrets UI screenshot |
| **Verified By** | — |

---

### E-03 — Provision Staging Infrastructure

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Infrastructure |
| **Owner** | DevOps Lead |
| **Priority** | P0 — CRITICAL PATH |
| **Effort** | 1 day |
| **Dependencies** | E-01, E-02 |
| **Description** | Execute `terraform init` then `terraform apply -var-file=staging.tfvars -auto-approve`. Resources to confirm created: VPC + subnets + NAT Gateway, RDS PostgreSQL 16 (PostGIS parameter group applied), ElastiCache Redis 7, ECS cluster, ECR repositories (api, celery-worker, celery-beat), ALB with HTTPS listener + ACM certificate, S3 buckets (`stayos-listings-staging`, `stayos-kyc-staging`, `stayos-ops-staging`), IAM roles (ECS task execution role, Celery task role). Note all `terraform output` values: RDS endpoint, Redis endpoint, ALB DNS, S3 bucket names. |
| **Acceptance Criteria** | `terraform output` shows all resources. RDS reachable from private subnet. ALB returns 503 (no backend yet — expected). S3 buckets exist with correct policies. Redis endpoint pings. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | `terraform output` log attached |
| **Verified By** | — |

---

### E-04 — AWS Secrets Manager Population

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | Security |
| **Owner** | DevOps Lead |
| **Priority** | P0 |
| **Effort** | 2 hours |
| **Dependencies** | E-03 |
| **Description** | Create AWS Secrets Manager secret `stayos/staging/app-secrets` as a JSON blob: `DATABASE_URL`, `REDIS_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`, `FIREBASE_CREDENTIALS_JSON`, `PAYMOB_API_KEY`, `PAYMOB_IFRAME_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `AWS_S3_LISTINGS_BUCKET`, `AWS_S3_KYC_BUCKET`, `AWS_S3_OPS_BUCKET`, `SENTRY_DSN`. |
| **Acceptance Criteria** | Secret exists in AWS Secrets Manager. `aws secretsmanager get-secret-value --secret-id stayos/staging/app-secrets` returns the full JSON. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | AWS console screenshot |
| **Verified By** | — |

---

### E-05 — First Backend Deployment to Staging

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | DevOps |
| **Owner** | DevOps Lead |
| **Priority** | P0 — CRITICAL PATH |
| **Effort** | 4 hours |
| **Dependencies** | E-03, E-04, B-08 (Secrets Manager wired in code) |
| **Description** | (1) Build Docker image: `docker build -f infra/docker/api/Dockerfile -t stayos-api:staging .`. (2) Push to ECR: `aws ecr get-login-password | docker login ... && docker push ...`. (3) Run `alembic upgrade head` against staging RDS from a one-off ECS task (or locally with staging DATABASE_URL). (4) Register new ECS task definition pointing to pushed image. (5) Update ECS service to use new task definition. (6) Verify ALB health check passes. |
| **Acceptance Criteria** | `curl https://api.staging.stayos.com/health` returns `{"status": "ok", "database": "ok", "redis": "ok"}`. API logs show "Loaded secrets from AWS Secrets Manager". ECS task running with 0 restart errors. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | `curl` output log |
| **Verified By** | — |

---

### E-06 — Link Vercel Project and Deploy Frontend

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | DevOps |
| **Owner** | DevOps Lead + Web Lead |
| **Priority** | P0 |
| **Effort** | 2 hours |
| **Dependencies** | E-02, C-01 |
| **Description** | (1) Create Vercel project linked to repository `apps/web` directory. (2) Configure Vercel environment variables for staging: `NEXT_PUBLIC_API_URL=https://api.staging.stayos.com`. (3) Run first Vercel deployment via `vercel --prod --token $VERCEL_TOKEN`. (4) Record `VERCEL_PROJECT_ID` and add to GitHub Secrets. (5) Verify CI frontend job in `ci.yml` triggers Vercel preview deployments on PR. |
| **Acceptance Criteria** | Vercel dashboard shows staging deployment URL. Staging URL loads the Next.js scaffold. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | Vercel deployment URL: — |
| **Verified By** | — |

---

### E-07 — Configure SES Domain Verification

| Field | Detail |
|-------|--------|
| **Phase** | **Phase B — Foundation Enhancement** |
| **Category** | Infrastructure |
| **Owner** | DevOps Lead + Founder |
| **Priority** | P1 |
| **Effort** | 2 hours active + up to 72 hours DNS propagation |
| **Dependencies** | E-03 (SES enabled in chosen region) |
| **Description** | (1) In AWS SES console, add `stayos.com` as a verified domain. (2) Add SES DKIM and SPF DNS records to domain registrar. (3) Request production sending limit increase in AWS SES (default sandbox limits 200 emails/day). |
| **Acceptance Criteria** | SES console shows domain as "Verified". A test email from `noreply@stayos.com` is received in inbox (not spam). |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | SES console screenshot |
| **Verified By** | — |

---

### E-08 — Configure CloudFront for S3 Listings Bucket

| Field | Detail |
|-------|--------|
| **Phase** | **Phase B — Foundation Enhancement** |
| **Category** | Infrastructure |
| **Owner** | DevOps Lead |
| **Priority** | P1 |
| **Effort** | 3 hours |
| **Dependencies** | E-03 |
| **Description** | Create CloudFront distribution with S3 `stayos-listings-staging` as origin. Configure: (1) Origin Access Control (OAC) — S3 not publicly accessible directly. (2) HTTPS only. (3) Compress assets (gzip + brotli). (4) Cache policy: `CachingOptimized` for images (TTL 86400s). (5) WAF association (after E-10). (6) Record CloudFront domain and add to `next.config.mjs` `images.domains`. |
| **Acceptance Criteria** | `curl https://{cloudfront-domain}/{test-key}` returns a test image with `Cache-Control: max-age=86400`. Photo URL in `pms.unit_photos.url` uses CloudFront domain, not S3 domain. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | CloudFront domain: — |
| **Verified By** | — |

---

### E-09 — Configure PgBouncer

| Field | Detail |
|-------|--------|
| **Phase** | **Phase B — Foundation Enhancement** |
| **Category** | Infrastructure |
| **Owner** | DevOps Lead |
| **Priority** | P1 |
| **Effort** | 4 hours |
| **Dependencies** | E-03 |
| **Description** | Add PgBouncer as an ECS sidecar or dedicated ECS service in Terraform. Configure: (1) `pool_mode = transaction` (compatible with SQLAlchemy async). (2) `max_client_conn = 1000`. (3) `default_pool_size = 25` per database. (4) Update `DATABASE_URL` in Secrets Manager to point to PgBouncer endpoint, not RDS directly. (5) Verify SQLAlchemy `POOL_PRE_PING = True` is set. |
| **Acceptance Criteria** | `psql -h pgbouncer-endpoint -U stayos -c "SELECT 1"` succeeds. Backend connects via PgBouncer. RDS `pg_stat_activity` shows connections originating from PgBouncer. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | `pg_stat_activity` screenshot |
| **Verified By** | — |

---

### E-10 — Configure WAF on ALB

| Field | Detail |
|-------|--------|
| **Phase** | **Phase B — Foundation Enhancement** |
| **Category** | Security |
| **Owner** | DevOps Lead |
| **Priority** | P1 |
| **Effort** | 3 hours |
| **Dependencies** | E-03 |
| **Description** | Create `aws_wafv2_web_acl` Terraform resource in deployed region. Associate with the ALB. Enable managed rule groups: (1) `AWSManagedRulesCommonRuleSet` (OWASP Top 10). (2) `AWSManagedRulesSQLiRuleSet` (SQL injection). (3) `AWSManagedRulesKnownBadInputsRuleSet`. Set WAF to `BLOCK` mode. Add rate limit rule: max 100 requests per IP per 5 minutes. |
| **Acceptance Criteria** | `aws wafv2 get-web-acl --name stayos-staging --scope REGIONAL` returns the ACL. Sending a SQLi payload to `GET /api/v1/listings?query=1' OR '1'='1` returns HTTP 403. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | WAF console screenshot · 403 response log |
| **Verified By** | — |

---

### E-11 — Configure CloudWatch Alerting

| Field | Detail |
|-------|--------|
| **Phase** | **Phase B — Foundation Enhancement** |
| **Category** | DevOps |
| **Owner** | DevOps Lead |
| **Priority** | P2 |
| **Effort** | 2 hours |
| **Dependencies** | E-03 |
| **Description** | Create CloudWatch alarms for staging: (1) ECS task CPU > 80% for 5 minutes → SNS alert. (2) 5XX error rate on ALB > 1% for 3 minutes → SNS alert. (3) RDS CPU > 80% → SNS alert. (4) Redis memory > 75% → SNS alert. Create SNS topic → email subscription to DevOps Lead. |
| **Acceptance Criteria** | CloudWatch console shows 4 alarms in OK state. Test: trigger a 500 error manually → alarm transitions to ALARM → email received. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | CloudWatch console screenshot |
| **Verified By** | — |

---

## PART XIII — TRACK F: QA FOUNDATION

**Track Owner:** QA Lead  
**Phase A Tasks:** F-01, F-02, F-03, F-04, F-05, F-06 (6 tasks)  
**Timeline:** Days 1–5 (F-01 starts Day 1; F-02–F-05 start Day 3 after E-05)

---

### F-01 — Playwright E2E Test Infrastructure

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | QA |
| **Owner** | QA Lead |
| **Priority** | P0 |
| **Effort** | 4 hours |
| **Dependencies** | C-01 (pnpm installed) |
| **Deliverables** | `apps/web/playwright.config.ts`, `apps/web/tests/e2e/` directory |
| **Description** | Install Playwright: `pnpm add -D @playwright/test`. Install browsers: `npx playwright install --with-deps chromium`. Configure `playwright.config.ts`: base URL from environment, 3 parallel workers, screenshots on failure, video on first retry, HTML report. Create 3 projects: `smoke` (Chromium only, 1 worker), `web` (Chromium + Firefox), `mobile` (Mobile Chrome + Mobile Safari). |
| **Acceptance Criteria** | `npx playwright test --project=smoke` runs (0 test files — should output "no tests found"). Configuration file has no TypeScript errors. `pnpm test:e2e` script added to `package.json`. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### F-02 — Smoke Test: Health Check

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | QA |
| **Owner** | QA Lead |
| **Priority** | P0 |
| **Effort** | 1 hour |
| **Dependencies** | F-01, E-05 (staging live) |
| **Deliverables** | `apps/web/tests/e2e/smoke/health.spec.ts` |
| **Description** | Test 1: `GET https://api.staging.stayos.com/health` → `status === "ok"`. Test 2: `GET https://api.staging.stayos.com/health/ready` → `database === "ok" && redis === "ok"`. Test 3: Load `https://stayos.vercel.app/ar/` → page title contains "StayOS" → `html` element has `dir="rtl"`. |
| **Acceptance Criteria** | All 3 tests pass in CI against staging. Test runtime < 10 seconds. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Playwright report: — |
| **Verified By** | — |

---

### F-03 — Smoke Test: Authentication Flow

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | QA |
| **Owner** | QA Lead |
| **Priority** | P0 |
| **Effort** | 4 hours |
| **Dependencies** | F-01, E-05, C-05 (auth context), F-05 (test data seeded) |
| **Deliverables** | `apps/web/tests/e2e/smoke/auth.spec.ts` |
| **Description** | Test: (1) Navigate to `/ar/login`. (2) Enter test phone number (pre-registered in staging). (3) Assert OTP request sent (mock OTP in staging using `settings.MOCK_OTP=true` and fixed OTP `123456`). (4) Enter OTP `123456`. (5) Assert redirect to `/ar/search`. (6) Assert user avatar visible in header. (7) Assert `GET /auth/me` returns user object. Test cleanup: logout. |
| **Acceptance Criteria** | Auth smoke test passes in CI. Add `MOCK_OTP=true` to staging Secrets Manager. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Playwright report: — |
| **Verified By** | — |

---

### F-04 — Smoke Test: Listing Search

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | QA |
| **Owner** | QA Lead |
| **Priority** | P0 |
| **Effort** | 2 hours |
| **Dependencies** | F-01, E-05, F-05 (test listing seeded) |
| **Deliverables** | `apps/web/tests/e2e/smoke/search.spec.ts` |
| **Description** | Test: (1) Navigate to `/ar/search?q=Cairo` (unauthenticated). (2) Assert at least one listing card visible. (3) Assert listing card contains Arabic title text. (4) Assert listing card contains price in EGP format. |
| **Acceptance Criteria** | Search smoke test passes. At least one seed listing returned. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Playwright report: — |
| **Verified By** | — |

---

### F-05 — Test Data Seeder

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | QA |
| **Owner** | QA Lead + Backend Lead |
| **Priority** | P0 |
| **Effort** | 4 hours |
| **Dependencies** | E-05 (staging DB live) |
| **Deliverables** | `scripts/seed_staging.py` |
| **Description** | Extend existing `scripts/staging_seed.sh` with a Python seeder `scripts/seed_staging.py`. Creates: (1) Admin user (`admin@stayos.com`, verified, `role=admin`). (2) Host user (`host@stayos.com`, KYC verified). (3) Guest user with test phone number (`+201000000001`, KYC verified). (4) 3 test listings in Cairo (one published, one draft, one unlisted) with seeded latitude/longitude for PostGIS. (5) One completed reservation (for E2E test of finance and operations flows). Run as part of staging startup script. |
| **Acceptance Criteria** | `python scripts/seed_staging.py` populates all five data entities. Idempotent: running twice does not create duplicates. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | PR: — · Commit: — |
| **Verified By** | — |

---

### F-06 — CI Integration: E2E Smoke on Deploy

| Field | Detail |
|-------|--------|
| **Phase** | **Phase A — Mandatory Foundation** |
| **Category** | DevOps |
| **Owner** | QA Lead + DevOps Lead |
| **Priority** | P1 |
| **Effort** | 2 hours |
| **Dependencies** | F-02, F-03, F-04, E-05, E-08 (first CI deploy working) |
| **Deliverables** | Updated `.github/workflows/deploy-staging.yml` |
| **Description** | Add a post-deploy step to `deploy-staging.yml` that runs `npx playwright test --project=smoke` against the freshly deployed staging URL. If smoke tests fail, mark the deployment as failed. Store Playwright HTML report as a GitHub Actions artifact. |
| **Acceptance Criteria** | After a successful staging deploy, Playwright smoke tests run automatically. A smoke test failure causes the deploy workflow to fail. |

**Execution Tracking**

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Started Date** | — |
| **Finished Date** | — |
| **Evidence** | GitHub Actions workflow run URL: — |
| **Verified By** | — |

---

## PART XIV — SPRINT TIMELINE

### Day 1 — Governance Decisions + Foundation Setup

**Founder Schedule (Target: ≤ 2h 45m active time)**

| Time | Owner | Task ID | Action |
|------|-------|---------|--------|
| 09:00 | All | — | Day 1 kickoff standup (15 min) |
| 09:00–09:15 | Founder | A-01 | Sign STAYOS_IMPLEMENTATION_BASELINE.md |
| 09:15–09:45 | Founder | A-02 | Write DEC-011 (Phase 0/1 resolution) |
| 10:00–11:30 | Founder + Mobile Lead | A-03 | Mobile framework decision → ADR-016 |
| 11:30–12:00 | Founder + DevOps Lead | A-04 | AWS region decision → update variables.tf |
| 12:00–12:15 | Founder (async) | A-05, A-07, A-08 | Approve via Slack: email provider, messaging transport, Stripe scope |
| 12:00 | — | — | **Founder free from 12:15 onward** |
| 13:00–18:00 | DevOps Lead | E-01 | Fix Terraform (rds.tf PostGIS, ecs.tf placeholders, region) |
| 13:00–18:00 | DevOps Lead | E-02 | Configure GitHub Secrets (parallel) |
| 13:00–18:00 | Backend Lead | B-01, B-03, B-05 | Migrations 011, 012, 015 |
| 13:00–18:00 | Backend Lead | B-07 | Fix Paymob iframe URL |
| 13:00–18:00 | Backend Lead | B-09, B-10 | Celery Beat fix + PropertyReadiness constraint |
| 13:00–18:00 | Web Lead | C-01, C-02 | Next.js config + Tailwind CSS |
| 13:00–18:00 | Mobile Lead | D-01 | Framework scaffold |
| 13:00–18:00 | QA Lead | F-01 | Playwright infrastructure |
| 13:00–18:00 | TPM | A-11 | Update stale documents |
| 14:00 | TPM (async) | A-05, A-07, A-08 | Backend Lead and TPM draft DEC-012, 014, 015 |
| 14:00 | TPM | A-09, A-10 | Delegate: submit WhatsApp app; create App Store + Play Store accounts |
| 18:00 | TPM | — | Day 1 Daily Report |

---

### Day 2 — Infrastructure Provisioning + Foundation Build

| Time | Owner | Task ID | Action |
|------|-------|---------|--------|
| 09:00 | All | — | Day 2 standup |
| 09:00–18:00 | DevOps Lead | E-03 | `terraform apply` staging — all day |
| 09:00–12:00 | Backend Lead | B-04, B-12 | Device token endpoint + ADR-015 audit |
| 09:00–12:00 | Web Lead | C-03 | i18n + RTL configuration |
| 09:00–12:00 | Mobile Lead | D-02, D-03 | Navigation architecture + localization |
| 12:00–18:00 | Backend Lead | B-02 | Photo upload API (start, depends on S3) |
| 12:00–18:00 | Web Lead | C-04 | Typed API client (mock OpenAPI spec) |
| 12:00–18:00 | Mobile Lead | D-04 | Theme system |
| 12:00–18:00 | QA Lead | F-02 | Health check smoke test (write before staging live) |
| 18:00 | TPM | — | Day 2 Daily Report |

---

### Day 3 — First Backend Deployment + Auth Foundation

| Time | Owner | Task ID | Action |
|------|-------|---------|--------|
| 09:00 | All | — | Day 3 standup |
| 09:00–12:00 | DevOps Lead | E-03 complete | Verify terraform output, test RDS connectivity |
| 09:00–12:00 | DevOps Lead | E-04 | Populate AWS Secrets Manager |
| 09:00–12:00 | Backend Lead | B-08 | Wire Secrets Manager client in code |
| 09:00–12:00 | Backend Lead | B-11 | Lock CORS origins |
| 09:00–12:00 | Web Lead | C-05 | Authentication context |
| 09:00–12:00 | Mobile Lead | D-05 | Mobile API client |
| 09:00–12:00 | QA Lead | F-05 | Test data seeder |
| 13:00–18:00 | DevOps Lead | E-05 | First backend deployment to ECS |
| 13:00–18:00 | DevOps Lead | E-06 | Link Vercel + frontend deployment |
| 13:00–18:00 | Backend Lead | B-06 | Wire email provider (SES) [Phase B — start] |
| 13:00–18:00 | Web Lead | C-06 | TanStack Query configuration |
| 13:00–18:00 | Mobile Lead | D-06 | Mobile authentication context |
| 13:00–18:00 | QA Lead | F-03 | Auth smoke test (against staging) |
| 18:00 | TPM | — | Day 3 Daily Report |

---

### Day 4 — Integration + Hardening

| Time | Owner | Task ID | Action |
|------|-------|---------|--------|
| 09:00 | All | — | Day 4 standup |
| 09:00–18:00 | DevOps Lead | E-07, E-08 | SES domain verification + CloudFront |
| 09:00–18:00 | DevOps Lead | E-09, E-10 | PgBouncer + WAF |
| 09:00–12:00 | Web Lead | C-07, C-08 | Layout system + error handling |
| 09:00–12:00 | Mobile Lead | D-07 | FCM SDK [Phase B — start] |
| 09:00–12:00 | Mobile Lead | D-08 | Mobile CI pipeline |
| 09:00–12:00 | QA Lead | F-04 | Search smoke test |
| 12:00–18:00 | Web Lead | C-09 | Frontend unit test config [Phase B] |
| 12:00–18:00 | Backend Lead | B-02 complete | Photo upload API + tests |
| 12:00–18:00 | QA Lead | F-06 | CI post-deploy smoke hook |
| 18:00 | TPM | — | Day 4 Daily Report |

---

### Day 5 — Mid-Point Gate

| Time | Owner | Action |
|------|-------|--------|
| 09:00 | All | Day 5 standup |
| 09:00–10:00 | TPM | **MID-POINT GATE**: Verify EXIT-01 through EXIT-12 |
| 10:00–13:00 | All | Address any blockers found in mid-point review |
| 13:00–15:00 | DevOps Lead | Trigger `deploy-staging.yml` via GitHub Actions — first full CI/CD run |
| 15:00–17:00 | QA Lead | Run E2E smoke suite against staging via CI |
| 17:00–18:00 | TPM | Update sprint board; document blockers for Week 2 |
| 18:00 | TPM | Day 5 Daily Report |
| **Friday 14:00** | All | **Week 1 Sprint Review + Risk Review + Architecture Review** |

**Mid-Point Gate Decision:** If EXIT-05 (staging live) is not met by end of Day 5, escalate to Founder immediately. Infrastructure provisioning is the critical path.

---

### Days 6–10 — Completion, Integration, Sprint 1 Planning

| Day | Focus | Owner |
|-----|-------|-------|
| Day 6 | Complete any incomplete Phase A tasks. Begin integration testing. | All leads |
| Day 7 | Mobile: complete D-02 through D-06 if delayed. Web: complete C-05 through C-09. | Mobile Lead + Web Lead |
| Day 8 | Full end-to-end smoke test: frontend → API → database → external services. Phase B tasks in parallel. | DevOps + QA |
| Day 9 | Fix all failures found in Day 8. Verify all Phase A EXIT criteria. | All leads |
| Day 10 | **FINAL EXIT CRITERIA CHECK.** Sprint 1 planning session. Sprint 0 retrospective. | All + Founder |

---

## PART XV — RISK REGISTER

> Updated every Friday during Risk Review. All risks monitored by TPM. Probability and Impact rated at initial assessment.

**Probability Scale:** Very High (>80%) · High (60–80%) · Medium (30–60%) · Low (<30%)  
**Impact Scale:** Critical (Sprint 0 fails) · High (Sprint 0 delayed > 2 days) · Medium (Sprint 1 gap) · Low (advisory)

---

### Critical Risks

| ID | Risk | Probability | Impact | Owner | Sprint 0 Mitigation | Contingency | Escalation Trigger |
|----|------|------------|--------|-------|--------------------|-----------|--------------------|
| R-C01 | Infrastructure never provisioned — Terraform never applied | Very High (pre-mitigation) | Critical | DevOps Lead | E-01 + E-02 + E-03: fix Terraform, apply Day 2–3 | Manual AWS resource creation via console as fallback if Terraform fails twice | Terraform apply fails twice on Day 3 → escalate to Founder immediately |
| R-C02 | PostGIS not in RDS parameter group — migrations fail on first production apply | Very High (pre-mitigation) | Critical | DevOps Lead | E-01: add PostGIS parameter group to rds.tf before `terraform apply` | Use Amazon RDS for PostgreSQL with manual PostGIS extension install if parameter group fails | `alembic upgrade head` fails with "extension postgis does not exist" |
| R-C03 | GitHub Secrets not configured — CI/CD pipeline cannot deploy | Very High (pre-mitigation) | Critical | DevOps Lead | E-02: configure all secrets Day 1 PM | Inject secrets manually into ECS task definition as temporary measure | `deploy-staging.yml` fails with "secret not found" on Day 2 |
| R-C04 | Governance conflict unresolved — Phase 0 vs Phase 1 authority unclear | High (pre-mitigation) | Critical | Founder | A-01 + A-02: sign baseline and write DEC-011 Day 1 by 09:45 | TPM documents engineering team proceeds under "authority pending" for 24h only | DEC-011 not committed by Day 1, 12:00 |
| R-C05 | Mobile framework not decided — all 40 screens and mobile CI blocked | High (pre-mitigation) | Critical | Founder + Mobile Lead | A-03: 90-minute decision session Day 1, 10:00–11:30 | Mobile Lead makes unilateral recommendation; Founder ratifies async within 2h | ADR-016 not committed by Day 1, 13:00 |
| R-C06 | Mobile Lead not hired before Day 1 — Track D cannot start | Medium | Critical | Founder | Identify and onboard Mobile Lead before Sprint 0 kickoff | Backend Lead or senior contractor fills Mobile Lead role for Days 1–3 scaffold only | Mobile Lead confirmed absent at Day 1 standup |

---

### High Risks

| ID | Risk | Probability | Impact | Owner | Sprint 0 Mitigation | Contingency | Escalation Trigger |
|----|------|------------|--------|-------|--------------------|-----------|--------------------|
| R-H01 | WhatsApp Business API approval takes 4–8 weeks — notification channel unavailable at Alpha | Very High (external) | High | TPM (initiates) | A-09: submit application Day 1 to start the clock | Use Twilio SMS exclusively for notifications at Alpha; WhatsApp added at Beta | Application not submitted by Day 1, 18:00 |
| R-H02 | AWS Secrets Manager is a placeholder stub — API fails to start | High (pre-mitigation) | High | Backend Lead | B-08: wire real client before E-05 deployment | Inject secrets via ECS environment variables as temporary fallback (remove before production) | Staging API fails to start on Day 3 |
| R-H03 | Frontend at 5% — Sprint 1 engineers have no working scaffold to build in | Very High (pre-mitigation) | High | Web Lead | Track C: C-01 through C-09 completing Days 1–5 | Web Lead works overtime Days 3–5; defer C-09 (unit tests) to Phase B | `pnpm build` not passing by Day 4 |
| R-H04 | No E2E tests exist — deployment quality cannot be verified | Very High (pre-mitigation) | High | QA Lead | Track F: F-01 through F-06 completing Days 1–5 | Manual smoke test checklist as temporary fallback if Playwright infrastructure fails | F-01 not complete by Day 2 |
| R-H05 | No PgBouncer — connection exhaustion under concurrent load | Low (staging traffic) | Medium | DevOps Lead | E-09: configure PgBouncer in Phase B | Reduce ECS task count to 1 to limit concurrent connections at staging | RDS max_connections exceeded during E2E tests |
| R-H06 | Paymob iframe URL not returned — booking flow is broken | Very High (pre-mitigation) | High | Backend Lead | B-07: 3-hour fix Day 1 PM | Return iframe URL from payment provider response (data already exists in service layer) | EXIT-19 fails |
| R-H07 | Egyptian payment methods (Fawry, Meeza, Vodafone Cash) not configured | High | Medium | Backend Lead | Out of scope for Sprint 0. Scheduled Sprint 5. | Paymob EGP card payments still functional for Alpha | Sprint 3 finance review reveals gap |
| R-H08 | AWS deployment region conflict (me-central-1 vs me-south-1) | High (pre-mitigation) | High | Founder + DevOps | A-04 + E-01: resolve Day 1 AM, fix Terraform before apply | DevOps Lead defaults to me-central-1 (ADR-007) if Founder unreachable by 12:30 | Terraform plan targets wrong region |
| R-H09 | Stale documents mislead Sprint 1 engineers — old conflicts cause confusion | High (pre-mitigation) | Medium | TPM | A-11: update stale docs Day 1 PM | Add deprecation notice as commit message if not updated by Day 1 | Engineer references TECH_STACK.md Paymob/Stripe conflict as open |

---

### Medium Risks

| ID | Risk | Probability | Impact | Owner | Sprint 0 Mitigation | Contingency | Escalation Trigger |
|----|------|------------|--------|-------|--------------------|-----------|--------------------|
| R-M01 | Migrations 013–014 (messaging, reviews tables) missing | Low | Medium | Backend Lead | Out of scope for Sprint 0. Designed Sprint 5–6. | — | Sprint 5 messaging sprint reveals schema gap |
| R-M02 | Email provider is a stub — booking confirmations silently fail | High (pre-mitigation) | Medium | Backend Lead | B-06: wire SES in Phase B, complete by Sprint 1 Week 1 | Log email send attempts; display booking confirmation in UI as interim | QA finds email never delivered in Sprint 1 Week 2 |
| R-M03 | SES domain verification takes up to 72h — email delayed beyond Sprint 0 | Medium | Medium | DevOps Lead | E-07: initiate Day 3, DNS records added immediately | Use SES sandbox mode (verified email addresses only) for Sprint 1 internal testing | SES still shows "Pending" on Day 7 |
| R-M04 | No CDN for photo uploads — listing images load slowly from S3 directly | Medium | Medium | DevOps Lead | E-08: configure CloudFront in Phase B, Days 4–5 | Photos served from S3 public URLs temporarily for staging | Photo load time > 3s in Lighthouse audit |
| R-M05 | ADR-015 analytics event log tables missing | High (pre-mitigation) | Medium | Backend Lead | B-05: migration 015 on Day 1 PM | — | EXIT-17 fails |
| R-M06 | PropertyReadiness table has no unique constraint — duplicate operations records possible | High (pre-mitigation) | Medium | Backend Lead | B-10: migration 016 on Day 1 PM | — | IntegrityError in operations tests |
| R-M07 | CI coverage gate drops below 80.42% after new migrations/code | Low | Medium | Backend Lead | All new code in Sprint 0 has tests. Coverage gate ≥ 80.42% enforced in CI. | Add targeted tests for uncovered lines before merge | `--cov-fail-under=80` fails in CI |
| R-M08 | App Store + Play Store accounts not created — Beta submission blocked | High (pre-mitigation) | Medium | Mobile Lead | A-10: create accounts Day 1 | Expedited individual developer account as fallback ($0, faster approval) | Mobile Lead confirms accounts not created by Day 3 |

---

## PART XVI — DEFINITION OF DONE

Sprint 0 is officially complete when **all** of the following are true simultaneously. Partial completion is not completion.

### Governance DoD
- [ ] `STAYOS_IMPLEMENTATION_BASELINE.md` contains signed founder approval block
- [ ] `DECISION_LOG.md` contains DEC-011 through DEC-015 — all committed to `main`
- [ ] ADR-016 (mobile framework) committed to `docs/architecture/adr/`
- [ ] No document in the repository shows a resolved conflict as open
- [ ] `MASTER_PROJECT_MEMORY.md` `Project:` field is `StayOS`

### Infrastructure DoD
- [ ] `terraform output` shows all staging resources present and healthy
- [ ] `curl https://api.staging.stayos.com/health` returns `{"status":"ok","database":"ok","redis":"ok"}`
- [ ] `alembic current` on staging shows migration `016` (latest) applied
- [ ] CloudFront distribution serving listing images (or S3 direct as Phase B interim)
- [ ] CloudWatch alarms in OK state (Phase B — before Sprint 1 Week 2)

### CI/CD DoD
- [ ] `deploy-staging.yml` has run successfully at least once via GitHub Actions
- [ ] All existing CI jobs green on latest `main` commit
- [ ] Mobile CI job green (even with no feature code)
- [ ] Playwright smoke suite passes in CI post-deploy

### Backend DoD
- [ ] Photo upload API implemented — `pytest tests/test_listings.py -k photo` passes
- [ ] Device token endpoint implemented — tests passing
- [ ] Paymob iframe URL present in `POST /reservations/` response
- [ ] AWS Secrets Manager client fetching secrets at staging startup
- [ ] CORS locked to staging origin — no wildcard
- [ ] ADR-015 compliance: analytics tables, currency/locale/country fields verified

### Frontend DoD
- [ ] Next.js staging deployment live at Vercel URL
- [ ] Arabic RTL renders at `/ar/` path — visually confirmed
- [ ] English LTR renders at `/en/` path — visually confirmed
- [ ] Design tokens (colors, fonts, spacing) applied in Tailwind config
- [ ] Typed API client compiles and type-checks
- [ ] OTP login → session → protected route — works end-to-end

### Mobile DoD
- [ ] Mobile scaffold runs on iOS Simulator and Android Emulator — screenshot or screen recording in evidence
- [ ] Navigation structure defined for all 40 screens as stub placeholders
- [ ] Localization: Arabic default, English toggle — working
- [ ] API client calls staging backend `/health` successfully
- [ ] Auth flow reaches OTP entry screen and processes login

### QA DoD
- [ ] 3 Playwright smoke tests passing in CI against staging
- [ ] Test data seeder runs idempotently against staging
- [ ] Backend coverage gate ≥ 80.42% maintained
- [ ] KPI-08 (E2E Smoke Pass Rate) at 100%

### Delivery DoD
- [ ] Sprint 1 board created with all Day-1 Sprint 1 tasks assigned and estimated
- [ ] Sprint 1 planning session completed with all track leads present
- [ ] Sprint 0 retrospective conducted and notes committed to `epos/SESSION_RECORD.md`
- [ ] All 22 EXIT criteria in `Verified` state
- [ ] Executive Dashboard updated to reflect Sprint 0 Complete

---

## PART XVII — EXECUTIVE AUTHORIZATION

### Pre-Execution Readiness Assessment

| Dimension | Assessment | Status |
|-----------|-----------|--------|
| Task definition | 57 tasks defined, owners assigned, acceptance criteria measurable | ✅ Ready |
| Dependency mapping | Critical path identified, parallel tracks mapped, blocked work documented | ✅ Ready |
| Governance | 6 Day-1 decisions mapped; Founder time optimized to ≤ 2h 45m | ✅ Ready |
| Exit criteria | 22 EXIT criteria, each with observable, binary pass/fail signal | ✅ Ready |
| Risk register | 19 risks documented with probability, impact, mitigation, contingency, escalation trigger | ✅ Ready |
| Team allocation | 8 roles assigned; minimum viable team: 7 | ✅ Ready |
| Timeline | 10-day timeline with Day-by-day schedule and mid-point gate | ✅ Ready |
| Operating rhythm | Daily standup, blocker review, integration check, daily report, weekly reviews | ✅ Ready |
| KPIs | 14 KPIs with targets and measurement method | ✅ Ready |
| Phase classification | All 57 tasks assigned to Phase A/B/C/D | ✅ Ready |

---

### Pre-Conditions for Execution Start

The following must be true on Day 1 before the 09:00 standup:

| # | Pre-Condition | Verification |
|---|---------------|-------------|
| 1 | Founder is available from 09:00 to 12:15 on Day 1 | Founder confirms calendar availability |
| 2 | Mobile Lead is identified and present at Day 1 standup | Mobile Lead name confirmed by Founder |
| 3 | AWS account with admin permissions is available to DevOps Lead | DevOps Lead confirms `aws sts get-caller-identity` succeeds |
| 4 | All external credentials procured: Twilio SID, Firebase project, Paymob API key, Stripe secret key | DevOps Lead confirms credentials list complete |
| 5 | Repository `tooling/repository-intelligence` branch is current with `main` | TPM confirms with `git status` |
| 6 | All 8 team leads briefed on this document and have read their track | TPM confirms via team sign-off |

---

### PROJECT STATUS

**READY**

All 57 tasks are defined, executable, and assigned. All 22 exit criteria are measurable. The critical path is known. Governance is streamlined to ≤ 2h 45m of Founder time on Day 1. All 6 pre-execution blockers have mitigations. No architectural questions remain open. No product scope is uncertain.

---

### PROJECT DIRECTOR DECISION

**✅ GO**

**Justification:**

Sprint 0 is authorized to begin immediately upon Founder completing the four Critical Day-1 Decisions (A-01, A-02, A-03, A-04). Every known blocker has a mitigation and a contingency. The critical path is achievable in 10 working days with a team of 7–8 leads. Phase A completion delivers a fully operational staging environment, a working frontend foundation, a running mobile scaffold, and a CI/CD pipeline that deploys on every merge — the complete prerequisite set for Sprint 1.

**Sprint 1 is authorized upon:** Verification of all 22 EXIT criteria and sign-off by TPM and Project Director.

**This document supersedes** `SPRINT_0_ENGINEERING_FOUNDATION.md` (v1.0) effective immediately upon Project Director signature.

---

**Signed:** _____________________________ Date: _______________  
**Project Director (Islam Elbaz, Founder)**

**Countersigned (TPM):** _____________________________ Date: _______________

---

*Document: SPRINT_0_ENGINEERING_FOUNDATION_v1.1.md*  
*Version: 1.1 | Authority: Session 007 Executive Directive | Classification: Engineering Execution — Internal*



