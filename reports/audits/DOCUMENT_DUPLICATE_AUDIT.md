# StayOS — Document Duplicate & Inconsistency Audit

**Date:** 2025-01-20
**Scope:** All markdown strategy/operations/governance documents in repository root
**Purpose:** Identify duplicate content, redundant documents, and cross-document inconsistencies

---

## Executive Summary

The repository contains **20+ markdown documents** in the root directory covering strategy, operations, governance, and engineering readiness. These documents were produced across multiple planning phases (Sprint 0–3, executive reviews, stage gates) and exhibit **significant duplication** — at least **6 major clusters** where 3+ documents cover the same topic with overlapping content. Additionally, there are **9 notable inconsistencies** where documents contradict each other on key facts.

---

## PART I — Duplicate Content Clusters

### Cluster 1: Supply Acquisition Strategy (6 documents, massive overlap)

| Document | Scope | Unique Value |
|----------|-------|--------------|
| `SUPPLY_ACQUISITION_PLAYBOOK.md` | First 50–500 units, 7 channel types, conversions | Channel-by-channel conversion benchmarks |
| `04_SUPPLY_ACQUISITION_PLAN.md` | First 50–100 listings, funnel, 4 sources | Supply funnel with conversion rates per stage |
| `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md` | First 100 properties, supersedes `04_` | Contact scripts, objection handling, acceptance rules |
| `SUPPLY_EXECUTION_MASTER_PLAN.md` | "Constitutional" supply doc, 100-listing plan | P0 engineering tasks, import pipeline audit |
| `MARKETPLACE_SUPPLY_STRATEGY.md` | Overall supply strategy, cold start, scaling to 10K | Scaling plan, implementation checklist |
| `PROPERTY_IMPORT_AND_SEEDING_STRATEGY.md` | Seeding strategy, import channels, claim workflow | Claim-your-property workflow detail |

**Overlapping content across these 6 documents:**
- Supply-first philosophy / cold-start rationale (all 6)
- Geographic focus on Greater Cairo / New Cairo (all 6)
- Supply channels: founder network, property management agencies, CSV import (all 6)
- Onboarding workflow: contact → KYC → listing creation → verification (5 of 6)
- Supply milestones / weekly targets (5 of 6)
- Duplicate prevention rules (3 of 6)
- Risks and mitigations table (4 of 6)
- Seeding inventory / "Founder 50" concept (3 of 6)

**Recommendation:** Consolidate into a single `SUPPLY_STRATEGY.md`. `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md` already supersedes `04_SUPPLY_ACQUISITION_PLAN.md`. The remaining four add incremental detail but largely repeat each other.

---

### Cluster 2: Founder Daily Operations (5 documents, heavy overlap)

| Document | Scope | Unique Value |
|----------|-------|--------------|
| `04_FOUNDER_PLAYBOOK.md` | 6-week timeline, daily schedules, acquisition strategies | 6-week timeline with weekly targets |
| `06_FOUNDER_DAILY_OPERATIONS.md` | Daily/weekly schedule, approval workflows, templates | WhatsApp templates, approval workflows, daily log template |
| `05_CLOSED_ALPHA_PLAYBOOK.md` | Day-by-day operating model, Weeks 1–4 | Week-by-week goals, decision framework, feedback collection |
| `MARKETPLACE_ACTIVATION_BACKLOG.md` | Daily founder checklists, launch sequence | 13-step launch sequence, removed tasks list |
| `MARKETPLACE_EXECUTION_GATE.md` | Day 1–14 hour-by-hour schedules | Optimized parallel launch sequence, KPI tables |

**Overlapping content across these 5 documents:**
- Founder's daily schedule (morning health check, KYC review, outreach, guest acquisition) (all 5)
- Host outreach: call contacts, WhatsApp owners, follow up (all 5)
- Guest acquisition: contact warm network, send links, help book (all 5)
- Manual operations: create listings on behalf of hosts, process payments (4 of 5)
- Escalation flow / decision tree (3 of 5)
- Weekly reporting / metrics tracking (4 of 5)

**Recommendation:** Merge into a single `FOUNDER_OPERATIONS_MANUAL.md`. `06_FOUNDER_DAILY_OPERATIONS.md` has the most operational detail (templates, approval workflows). `MARKETPLACE_EXECUTION_GATE.md` has the most detailed day-by-day schedule.

---

### Cluster 3: Closed Alpha Definition & Week-by-Week Plan (3 documents, conflicting)

| Document | Duration | Week Structure | Unique Value |
|----------|----------|----------------|--------------|
| `05_CLOSED_ALPHA_PLAYBOOK.md` | 4 weeks | W1: First Hosts, W2: Supply Ramp, W3: First Bookings, W4: Validation | Communication models, exit criteria |
| `CLOSED_ALPHA_EXECUTION_PLAN.md` | 4 weeks | W1: Supply Lock-In, W2: Listing Publication, W3: First Bookings, W4: Learn & Refine | Team structure (12–14 people), Go/No-Go criteria |
| `04_FOUNDER_PLAYBOOK.md` | 6 weeks | Week-by-week with listing/booking targets | Escalation decision tree, weekly reporting template |

**Overlapping content:**
- Closed Alpha definition (invitation-only, real hosts, real bookings) (all 3)
- Week-by-week plan with targets (all 3)
- Founder as primary operator (all 3)
- Exit criteria / Go-No-Go (all 3)

**Key inconsistency:** Duration is 4 weeks in two documents vs 6 weeks in one. See Part II.

---

### Cluster 4: Platform Readiness Reports (4 documents, conflicting metrics)

| Document | Test Count | Blocker Count | Rating |
|----------|-----------|---------------|--------|
| `GO_LIVE_READINESS_REPORT.md` | Not specified | 5 blockers (fixed) | READY FOR CLOSED ALPHA |
| `CLOSED_ALPHA_EXECUTION_GATE.md` | 376 passed | 6 blockers (13 SP remaining) | B — Ready after remaining stories |
| `CLOSED_ALPHA_EXECUTION_VALIDATION.md` | 376 passed | 10 gaps (fixed) | READY for Closed Alpha |
| `MARKETPLACE_EXECUTION_GATE.md` | 401 passed | 5 operational blockers, 0 engineering | READY TO START ACTIVATION |

**Overlapping content:**
- Verification of all user journeys (Guest, Host, Admin) (all 4)
- List of what's done vs what's missing (all 4)
- Final readiness verdict (all 4)
- List of features explicitly deferred / not needed (3 of 4)

**These are snapshots at different points in time** but are all still present in the repo, creating confusion about the current state. `MARKETPLACE_EXECUTION_GATE.md` is the most recent and authoritative.

---

### Cluster 5: Stop-Doing / Deleted Tasks Lists (3 documents, heavy overlap)

| Document | Location | Items |
|----------|----------|-------|
| `06_STOP_DOING_LIST.md` | Entire document | DO NOT BUILD (15+ items), DO NOT DO (8 items), DO NOT MEASURE (6 items) |
| `MARKETPLACE_ACTIVATION_BACKLOG.md` | "Removed Tasks" section | Engineering + operational removed tasks |
| `MARKETPLACE_EXECUTION_GATE.md` | "Deleted Tasks" section | 20+ engineering deleted, 30+ operational deleted |

**Overlapping items (appear in 2+ documents):**
- No native mobile app
- No AI/auto pricing
- No channel manager integration
- No map-based search
- No reviews/ratings system
- No support ticket system
- No automated payouts
- No owner claim workflow
- No property quality score
- No advanced duplicate detection
- No paid ads / marketing
- No CRM system
- No analytics dashboard

**Recommendation:** `06_STOP_DOING_LIST.md` should be the single source of truth for this. The other two documents should reference it rather than re-listing items.

---

### Cluster 6: Marketplace Execution Strategy (3 documents, overlapping)

| Document | Scope | Unique Value |
|----------|-------|--------------|
| `03_MARKETPLACE_EXECUTION_PLAN.md` | Marketplace thesis, two-sided strategy, ops model | Revenue model (10% commission), simple metrics dashboard |
| `MARKETPLACE_OPERATIONS_BLUEPRINT.md` | Complete operating model, departments, KPIs | Department responsibilities, operational ownership matrix, SLAs |
| `MARKETPLACE_ACTIVATION_BACKLOG.md` | Activation tasks, launch sequence | Task-level backlog, launch sequence steps |

**Overlapping content:**
- Marketplace operations model during Closed Alpha (all 3)
- Founder-centric operations (all 3)
- Trust & safety model (manual verification) (2 of 3)
- Revenue model / payment flow (2 of 3)
- Success metrics / KPIs (all 3)
- Geographic focus (all 3)

---

### Cluster 7: Host Onboarding Process (3 documents, overlapping)

| Document | Scope | Unique Value |
|----------|-------|--------------|
| `HOST_ONBOARDING_OPERATIONS.md` | End-to-end onboarding, funnel stages, SLAs | Detailed stage checklists, photography standards, SLA table |
| `MARKETPLACE_SUPPLY_STRATEGY.md` | Host acquisition channels, onboarding funnel | Channel-level acquisition strategy, partnership types |
| `04_SUPPLY_ACQUISITION_PLAN.md` | Onboarding workflows for owners and agencies | Step-by-step onboarding workflows per source type |

**Overlapping content:**
- Onboarding funnel stages: lead → qualification → KYC → verification → publishing (all 3)
- Required documents for KYC (2 of 3)
- Property verification checklist (2 of 3)
- Onboarding SLAs / timelines (2 of 3)

---

### Cluster 8: Trust & Safety / Verification (3 documents, overlapping)

| Document | Scope | Unique Value |
|----------|-------|--------------|
| `TRUST_AND_SAFETY_OPERATIONS.md` | Comprehensive T&S operations | Fraud detection, suspensions, appeals, incident handling |
| `MARKETPLACE_SUPPLY_STRATEGY.md` | Verification process section | Host verification + listing verification summary |
| `HOST_ONBOARDING_OPERATIONS.md` | KYC and property verification sections | KYC flow detail, property verification checklist |

**Overlapping content:**
- Host KYC verification process (all 3)
- Listing verification / three-gate quality system (all 3)
- Photo review standards (2 of 3)
- Required documents for verification (all 3)

---

### Cluster 9: Executive Governance Decisions (2 documents, similar structure)

| Document | Decision |
|----------|----------|
| `07_FINAL_EXECUTIVE_DECISION.md` | Sprint 3 GO with mandatory adjustments |
| `FINAL_EXECUTIVE_STAGE_GATE_DECISION.md` | Sprint 0 GO WITH CONDITIONS |

**Overlapping content:**
- Executive board review structure
- GO/NO-GO decision framework
- Risk register format
- Conditions of approval
- Sign-off table

These cover different sprints but use nearly identical governance document templates.

---

### Cluster 10: Launch Sequence / Go-to-Market (4 documents, overlapping)

| Document | Location | Unique Value |
|----------|----------|--------------|
| `MARKETPLACE_ACTIVATION_BACKLOG.md` | "Launch Sequence" section | 13-step sequential sequence |
| `MARKETPLACE_EXECUTION_GATE.md` | "Launch Sequence" section | Optimized parallel sequence (Track A + Track B) |
| `03_MARKETPLACE_EXECUTION_PLAN.md` | "Go-to-Market Sequence" section | High-level GTM with exit criteria |
| `CLOSED_ALPHA_EXECUTION_PLAN.md` | Week-by-week plan | Week 1–4 activity tables |

**Overlapping content:**
- Deploy → Import → Approve → Owner Outreach → Guest Acquisition → Booking → Payment → Payout (all 4)
- Day 1 launch activities (all 4)
- Success criteria after launch (all 4)

---

## PART II — Cross-Document Inconsistencies

### Inconsistency 1: Closed Alpha Duration
- **4 weeks:** `05_CLOSED_ALPHA_PLAYBOOK.md`, `CLOSED_ALPHA_EXECUTION_PLAN.md`
- **6 weeks:** `04_FOUNDER_PLAYBOOK.md`, `07_FINAL_EXECUTIVE_DECISION.md`
- **Resolution needed:** `07_FINAL_EXECUTIVE_DECISION.md` mandates 6 weeks and is the most recent executive decision.

### Inconsistency 2: Test Count
- **376 tests:** `CLOSED_ALPHA_EXECUTION_GATE.md`, `CLOSED_ALPHA_EXECUTION_VALIDATION.md`
- **401 tests:** `MARKETPLACE_EXECUTION_GATE.md`
- **Explanation:** Tests were added between reports. `MARKETPLACE_EXECUTION_GATE.md` is the most recent.

### Inconsistency 3: Listing Targets for Closed Alpha
- **50 listings:** `05_CLOSED_ALPHA_PLAYBOOK.md`, `CLOSED_ALPHA_EXECUTION_PLAN.md`, `MARKETPLACE_ACTIVATION_BACKLOG.md`
- **100 listings:** `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md`, `SUPPLY_EXECUTION_MASTER_PLAN.md`
- **Resolution needed:** The 50-listing target is for the Closed Alpha itself. The 100-listing target is the supply acquisition goal within 4 weeks. These may not be contradictory but are easily confused since both are called "targets."

### Inconsistency 4: Team Size for Closed Alpha
- **12–14 people:** `CLOSED_ALPHA_EXECUTION_PLAN.md` (Supply Director, 2 Supply Managers, 2 Onboarding Specialists, 2 Field Staff, KYC Reviewer, Listing Verifier, etc.)
- **Founder alone (solo):** `04_FOUNDER_PLAYBOOK.md`, `06_FOUNDER_DAILY_OPERATIONS.md`, `MARKETPLACE_EXECUTION_GATE.md`
- **Hire 1 ops person by Week 2:** `07_FINAL_EXECUTIVE_DECISION.md`
- **Resolution needed:** `CLOSED_ALPHA_EXECUTION_PLAN.md` describes an ideal team structure that was never authorized. The actual plan is founder-led with 1 ops hire.

### Inconsistency 5: Blocker Count for Go-Live
- **5 blockers (fixed):** `GO_LIVE_READINESS_REPORT.md`
- **6 blockers (13 SP remaining):** `CLOSED_ALPHA_EXECUTION_GATE.md`
- **10 gaps (fixed):** `CLOSED_ALPHA_EXECUTION_VALIDATION.md`
- **5 operational blockers, 0 engineering:** `MARKETPLACE_EXECUTION_GATE.md`
- **Explanation:** These are snapshots at different times. The earliest (`CLOSED_ALPHA_EXECUTION_GATE.md`) identified 6 engineering blockers. Subsequent reports show them being fixed. The latest (`MARKETPLACE_EXECUTION_GATE.md`) confirms all engineering is done and only operational blockers remain.

### Inconsistency 6: Geographic Focus
- **Greater Cairo (general):** Most documents
- **New Cairo + Rehab (or Maadi + Degla as fallback):** `CLOSED_ALPHA_EXECUTION_PLAN.md`
- **New Cairo only (concentrated):** `07_FINAL_EXECUTIVE_DECISION.md`
- **Resolution needed:** `07_FINAL_EXECUTIVE_DECISION.md` mandates concentrating all supply in New Cairo. Earlier documents allowed broader Greater Cairo.

### Inconsistency 7: Commission Rate
- **10% commission:** `03_MARKETPLACE_EXECUTION_PLAN.md`
- **0% host commission for first 3 bookings:** `07_FINAL_EXECUTIVE_DECISION.md`
- **Resolution needed:** `07_FINAL_EXECUTIVE_DECISION.md` overrides. The 10% applies after the first 3 bookings per host.

### Inconsistency 8: Owner Claim Workflow
- **Described in detail as a key feature:** `MARKETPLACE_SUPPLY_STRATEGY.md` (full claim listing workflow section), `PROPERTY_IMPORT_AND_SEEDING_STRATEGY.md` (claim-your-property workflow)
- **Explicitly NOT BUILDING (deferred to V1.1):** `SUPPLY_EXECUTION_MASTER_PLAN.md`, `MARKETPLACE_EXECUTION_GATE.md`, `06_STOP_DOING_LIST.md`
- **Resolution needed:** The strategy documents describe the ideal future state. The execution documents correctly defer it. This is confusing because strategy docs present it as a Closed Alpha feature without clearly marking it as deferred.

### Inconsistency 9: Property Quality Score
- **Described as a feature:** `HOST_ONBOARDING_OPERATIONS.md` (listing quality scores section), `MARKETPLACE_SUPPLY_STRATEGY.md` (quality scoring)
- **Explicitly NOT BUILDING:** `SUPPLY_EXECUTION_MASTER_PLAN.md`, `MARKETPLACE_EXECUTION_GATE.md`
- **Resolution needed:** Same as #8 — strategy documents describe future state without clear deferral marking.

---

## PART III — Documents That Should Be Marked as Superseded

The following documents are earlier versions that have been explicitly superseded or made obsolete by later documents:

| Obsolete Document | Superseded By | Reason |
|-------------------|---------------|--------|
| `04_SUPPLY_ACQUISITION_PLAN.md` | `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md` | Explicitly superseded by name |
| `CLOSED_ALPHA_EXECUTION_GATE.md` | `MARKETPLACE_EXECUTION_GATE.md` | Later readiness report with higher test count and fewer blockers |
| `CLOSED_ALPHA_EXECUTION_VALIDATION.md` | `MARKETPLACE_EXECUTION_GATE.md` | Later readiness report |
| `GO_LIVE_READINESS_REPORT.md` | `MARKETPLACE_EXECUTION_GATE.md` | Later readiness report |
| `03_MARKETPLACE_EXECUTION_PLAN.md` | `MARKETPLACE_OPERATIONS_BLUEPRINT.md` + `MARKETPLACE_ACTIVATION_BACKLOG.md` | Split into more detailed documents |
| `04_FOUNDER_PLAYBOOK.md` | `06_FOUNDER_DAILY_OPERATIONS.md` + `MARKETPLACE_EXECUTION_GATE.md` | More detailed operational documents |
| `05_CLOSED_ALPHA_PLAYBOOK.md` | `MARKETPLACE_ACTIVATION_BACKLOG.md` + `MARKETPLACE_EXECUTION_GATE.md` | More detailed activation documents |
| `FINAL_EXECUTIVE_STAGE_GATE_DECISION.md` | `07_FINAL_EXECUTIVE_DECISION.md` | Later executive decision for later sprint |
| `CLOSED_ALPHA_EXECUTION_PLAN.md` | `MARKETPLACE_ACTIVATION_BACKLOG.md` + `MARKETPLACE_EXECUTION_GATE.md` | More recent and more detailed |
| `SUPPLY_ACQUISITION_PLAYBOOK.md` | `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md` + `SUPPLY_EXECUTION_MASTER_PLAN.md` | More recent and more actionable |

---

## PART IV — Summary Statistics

| Metric | Count |
|--------|-------|
| Total documents reviewed | 20 |
| Duplicate content clusters | 10 |
| Documents in supply acquisition cluster | 6 |
| Documents in founder operations cluster | 5 |
| Documents in readiness reports cluster | 4 |
| Cross-document inconsistencies | 9 |
| Documents that should be marked superseded | 10 |
| Features described in strategy docs but explicitly NOT building | 2 (owner claim, quality score) |

---

## PART V — Recommendations

1. **Consolidate supply documents:** Merge the 6 supply documents into 2: a `SUPPLY_STRATEGY.md` (vision, channels, scaling) and `SUPPLY_EXECUTION_PLAN.md` (actionable 100-listing plan with scripts and KPIs).

2. **Consolidate founder operations:** Merge the 5 founder operations documents into 1: `FOUNDER_OPERATIONS_MANUAL.md` with daily schedules, templates, approval workflows, and escalation flows.

3. **Mark superseded documents:** Add a `> **STATUS: SUPERSEDED** — This document is retained for historical reference only. See [newer document] for current guidance.` header to all 10 obsolete documents.

4. **Resolve the Closed Alpha duration inconsistency:** Update all documents to reflect the 6-week duration mandated by `07_FINAL_EXECUTIVE_DECISION.md`.

5. **Resolve the team size inconsistency:** Update `CLOSED_ALPHA_EXECUTION_PLAN.md` to reflect the founder-led model with 1 ops hire, not the 12–14 person team.

6. **Clearly mark deferred features in strategy documents:** Where `MARKETPLACE_SUPPLY_STRATEGY.md` and `PROPERTY_IMPORT_AND_SEEDING_STRATEGY.md` describe owner claim workflow and property quality score, add notes that these are V1.1+ features, not Closed Alpha scope.

7. **Single source of truth for readiness:** Keep only `MARKETPLACE_EXECUTION_GATE.md` as the current readiness document. Archive the other 3 readiness reports.

8. **Single source of truth for stop-doing list:** Keep only `06_STOP_DOING_LIST.md`. Remove the duplicated lists from `MARKETPLACE_ACTIVATION_BACKLOG.md` and `MARKETPLACE_EXECUTION_GATE.md`, replacing with a reference.

---

*End of audit.*
