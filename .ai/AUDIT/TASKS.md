# Tasks — StayOS

**Version**: 2.0.0
**Last Updated**: 2026-07-13
**Maintainer**: Islam Elbaz (Founder)
**Status**: Active — Phase 0 LOCKED

## Document Purpose

This document tracks all active tasks for StayOS, organized by phase and milestone. Tasks are derived from [ROADMAP.md](ROADMAP.md) and grounded in the gate conditions established in [docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md](docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md).

**Current phase**: Phase 0 — Customer Validation (LOCKED — no gates cleared yet)

For the engineering task backlog (Phase 1 build), see [docs/02_product/ENGINEERING_BACKLOG.md](docs/02_product/ENGINEERING_BACKLOG.md).

---

## Task Organization

- **Phase**: Development phase (0, 1, 2, etc.)
- **Milestone**: Specific milestone within phase
- **Area**: Functional area (Legal, Research, Operations, Product, Growth)
- **Priority**: P0 (blocker), P1 (critical), P2 (high), P3 (medium)
- **Status**: Not Started · In Progress · Blocked · Complete
- **Gate**: Which Phase 0 gate this task unblocks

---

## Phase 0: Customer Validation Tasks

### Milestone 0.1: Legal and Structural Foundation (Week 1–4)

---

**Task ID**: T0.1-L01
**Title**: Trademark search — StayOS
**Area**: Legal
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 3 days
**Gate**: Legal foundation
**Dependencies**: None

**Description**: Commission trademark search for "StayOS" in Egypt, Saudi Arabia, and UAE. Include word mark and logo variants.

**Acceptance Criteria**:
- [ ] Egypt trademark search complete (Egyptian Trademark Office)
- [ ] Saudi Arabia trademark search complete (SAIP)
- [ ] UAE trademark search complete (MOCCAE)
- [ ] Conflicts identified and alternatives prepared if needed
- [ ] Legal opinion on registrability received

---

**Task ID**: T0.1-L02
**Title**: Retain tourism and hospitality lawyer (Egypt)
**Area**: Legal
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 1 week
**Gate**: Legal foundation
**Dependencies**: None

**Description**: Identify and retain a lawyer with expertise in Egyptian tourism authority regulations, accommodation marketplace licensing, and payment compliance. This is a blocker for all legal structure decisions.

**Acceptance Criteria**:
- [ ] At least 3 candidate firms identified with hospitality/tourism experience
- [ ] Initial consultations conducted
- [ ] Lawyer retained and engagement letter signed
- [ ] Egypt Tourism Authority licensing requirements documented

---

**Task ID**: T0.1-L03
**Title**: Legal entity structure decision
**Area**: Legal
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder + Legal Counsel
**Estimated Effort**: 2 weeks
**Gate**: Legal foundation
**Dependencies**: T0.1-L02

**Description**: Decide and initiate legal entity formation. Options: Egyptian LLC only, or Egyptian operating entity + offshore holding (Cayman/BVI or DIFC). Decision driven by investor appetite and tourism authority foreign ownership rules.

**Acceptance Criteria**:
- [ ] Legal opinion on Egyptian foreign ownership rules for accommodation marketplace received
- [ ] Entity structure decision made (documented in DECISION_LOG.md)
- [ ] Formation process initiated
- [ ] Timeline to operational entity established

---

**Task ID**: T0.1-L04
**Title**: Egypt Tourism Authority — initial meeting
**Area**: Legal / Regulatory
**Priority**: P1
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 1 week to schedule, 1 meeting
**Gate**: Regulatory path
**Dependencies**: T0.1-L02

**Description**: Schedule and attend an initial meeting with the Egypt Tourism Authority to understand licensing requirements for an accommodation marketplace. Identify the regulatory path to legal operations.

**Acceptance Criteria**:
- [ ] Meeting scheduled
- [ ] Meeting attended
- [ ] Licensing requirements documented
- [ ] Regulatory timeline established
- [ ] Follow-up actions identified

---

**Task ID**: T0.1-P01
**Title**: Payment processor meetings — Paymob and Fawry
**Area**: Operations / Payments
**Priority**: P1
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 1 week
**Gate**: Payment infrastructure
**Dependencies**: None

**Description**: Meet with Paymob and Fawry to understand marketplace payment capabilities, escrow support, Fawry cash-in/cash-out options, and integration requirements. Identify primary payment processing partner.

**Acceptance Criteria**:
- [ ] Paymob meeting scheduled and attended
- [ ] Fawry meeting scheduled and attended
- [ ] Marketplace escrow capability confirmed or alternatives identified
- [ ] Fawry integration requirements documented
- [ ] Primary payment partner shortlisted
- [ ] Integration timeline estimated

---

**Task ID**: T0.1-P02
**Title**: WhatsApp Business API application
**Area**: Operations / Communications
**Priority**: P1
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 1 week
**Gate**: Communication infrastructure
**Dependencies**: T0.1-L03 (business entity required)

**Description**: Apply for WhatsApp Business API access. WhatsApp is the primary communication channel for guest–host interaction, booking notifications, and customer support in Egypt. Requires a registered business entity.

**Acceptance Criteria**:
- [ ] Business Manager account configured
- [ ] WhatsApp Business API application submitted
- [ ] Approved or approval timeline established
- [ ] Test number configured (if approved)

---

**Task ID**: T0.1-R01
**Title**: Booking.com and Airbnb Egypt market research
**Area**: Research / Competitive
**Priority**: P1
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 1 week
**Gate**: Market understanding
**Dependencies**: None

**Description**: Research current Booking.com and Airbnb supply depth in Egypt. Identify coverage gaps (geographic, property type, payment method, language). Document competitive positioning opportunities.

**Acceptance Criteria**:
- [ ] Booking.com Egypt inventory analysis complete (property count, types, geography)
- [ ] Airbnb Egypt inventory analysis complete
- [ ] Coverage gaps documented
- [ ] Arabic UX quality assessment done
- [ ] Egyptian payment method availability assessed
- [ ] Filed in research/competitor/

---

### Milestone 0.2: Co-founder and Team (Week 1–6)

---

**Task ID**: T0.2-T01
**Title**: Co-founder decision
**Area**: Team
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 2–4 weeks
**Gate**: Team foundation
**Dependencies**: None

**Description**: Decide whether to pursue a co-founder and if so, identify the right profile. Panel recommendation: if founder has tech DNA, recruit a hospitality operator co-founder. If founder has hospitality DNA, recruit a tech co-founder. This is one of the lowest-reversibility decisions in the company's history.

**Acceptance Criteria**:
- [ ] Skills gap analysis self-assessment complete
- [ ] Decision on co-founder profile made (documented in DECISION_LOG.md)
- [ ] If pursuing: outreach to 5+ candidates started
- [ ] If solo: clear plan for addressing skill gaps documented

---

**Task ID**: T0.2-T02
**Title**: Hospitality industry advisor secured
**Area**: Team
**Priority**: P1
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 2–3 weeks
**Gate**: Industry credibility
**Dependencies**: T0.2-T01

**Description**: Secure at least one advisor with active Egyptian hospitality industry relationships (hotel operators, resort managers, property management companies). Egyptian property owners will not trust an unknown platform without credible industry introduction.

**Acceptance Criteria**:
- [ ] 3+ advisor candidates identified with relevant Egyptian hospitality relationships
- [ ] Conversations initiated
- [ ] At least 1 advisor committed with signed advisory agreement
- [ ] First introductions to property contacts facilitated

---

**Task ID**: T0.2-T03
**Title**: Legal/regulatory advisor secured
**Area**: Team
**Priority**: P1
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 2 weeks
**Gate**: Legal foundation
**Dependencies**: T0.1-L02

**Description**: Secure ongoing legal advisory for tourism regulations, payment processing compliance, and corporate structuring. Can be satisfied by the lawyer retained in T0.1-L02 if they have broad expertise.

**Acceptance Criteria**:
- [ ] Legal advisor with tourism + payment + corporate expertise engaged
- [ ] Retainer agreement in place
- [ ] Initial regulatory roadmap reviewed and confirmed

---

### Milestone 0.3: Customer Discovery — Travelers (Week 2–8)

---

**Task ID**: T0.3-I01
**Title**: Traveler interview script design
**Area**: Research / Customer Discovery
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 3 days
**Gate**: 50 traveler interviews
**Dependencies**: T0.1-R01

**Description**: Design a structured interview guide for traveler discovery. Based on hypotheses from [docs/phase--1/reports/05_MARKET_HYPOTHESES.md](docs/phase--1/reports/05_MARKET_HYPOTHESES.md). Key hypotheses to test: GCC distrust of English-first OTAs, Arabic UX as differentiator, payment method as booking blocker.

**Acceptance Criteria**:
- [ ] Interview guide drafted (30–45 minute format)
- [ ] Key hypotheses mapped to specific questions
- [ ] Guide reviewed and iterated by at least 1 external reader
- [ ] Filed at research/interviews/traveler_interview_guide.md
- [ ] Pilot interview conducted with 2 test subjects

---

**Task ID**: T0.3-I02
**Title**: Conduct 50 traveler interviews
**Area**: Research / Customer Discovery
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 4–6 weeks (parallel execution)
**Gate**: Phase 0 Gate — 50 traveler interviews ≥ 30 (kill threshold)
**Dependencies**: T0.3-I01

**Description**: Conduct and document 50 traveler interviews. Mix: 25 Egyptian domestic travelers, 15 GCC nationals traveling to Egypt, 10 international travelers to Egypt. Each interview recorded (with consent) or documented within 24 hours.

**Target mix**:
- Egyptian domestic travelers: 25
- GCC nationals (Saudi, UAE, Qatar, Kuwait) visiting Egypt: 15
- International travelers to Egypt: 10

**Acceptance Criteria**:
- [ ] 50 interviews conducted and documented
- [ ] At least 15 GCC-national interviews completed
- [ ] All notes filed in research/interviews/
- [ ] Recording/consent process followed

---

**Task ID**: T0.3-I03
**Title**: Traveler interview synthesis report
**Area**: Research / Customer Discovery
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 1 week
**Gate**: Wedge identification
**Dependencies**: T0.3-I02 (minimum 30 interviews to synthesize)

**Description**: Synthesize traveler interview findings into a structured report. Identify consistent pain points (> 60% frequency), ranked by severity and frequency. Validate or invalidate key hypotheses from [docs/phase--1/reports/05_MARKET_HYPOTHESES.md](docs/phase--1/reports/05_MARKET_HYPOTHESES.md).

**Acceptance Criteria**:
- [ ] Pain points ranked by frequency (≥ 60% threshold for validation)
- [ ] Hypotheses from 05_MARKET_HYPOTHESES.md marked: VALIDATED / INVALIDATED / INCONCLUSIVE
- [ ] At least one wedge hypothesis supported by ≥ 40% of interviews
- [ ] Report filed at research/market/traveler_synthesis.md

---

### Milestone 0.4: Customer Discovery — Hosts and Property Managers (Week 2–8)

---

**Task ID**: T0.4-I01
**Title**: Host interview script design
**Area**: Research / Customer Discovery
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 3 days
**Gate**: 30 host interviews
**Dependencies**: T0.1-R01

**Description**: Design a structured interview guide for host and property manager discovery. Focus on current booking channel mix, OTA pain points, commission tolerance, and B2B SaaS willingness to pay.

**Acceptance Criteria**:
- [ ] Host interview guide drafted
- [ ] Key hypotheses mapped to questions (commission range, WhatsApp % of bookings, OTA frustrations)
- [ ] Filed at research/interviews/host_interview_guide.md
- [ ] Pilot interview conducted with 2 property owners

---

**Task ID**: T0.4-I02
**Title**: Conduct 30 host/property manager interviews
**Area**: Research / Customer Discovery
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 3–5 weeks (parallel with T0.3-I02)
**Gate**: Phase 0 Gate — 30 host interviews ≥ 20 (kill threshold)
**Dependencies**: T0.4-I01

**Description**: Conduct and document 30 host and property manager interviews. Mix: 15 individual property owners (apartments, villas), 10 small property managers (2–20 units), 5 hotel/resort operators.

**Target mix**:
- Individual property owners (apartments, villas): 15
- Small property managers (2–20 units): 10
- Hotel or resort operators: 5

**Acceptance Criteria**:
- [ ] 30 interviews conducted and documented
- [ ] Current booking channel mix captured for each host (% WhatsApp, % OTA, % walk-in, % referral)
- [ ] Commission tolerance range identified
- [ ] B2B SaaS willingness to pay assessed
- [ ] All notes filed in research/interviews/

---

**Task ID**: T0.4-I03
**Title**: Host interview synthesis report
**Area**: Research / Customer Discovery
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 1 week
**Gate**: Supply strategy decision
**Dependencies**: T0.4-I02 (minimum 20 interviews to synthesize)

**Description**: Synthesize host interview findings. Identify consistent frustrations with current distribution channels (> 60% frequency), validated commission tolerance range, and supply acquisition strategy implications.

**Acceptance Criteria**:
- [ ] Host frustration points ranked by frequency
- [ ] Commission tolerance range documented (acceptable range, not assumed)
- [ ] B2B SaaS opportunity assessment
- [ ] Supply acquisition friction identified
- [ ] Report filed at research/market/host_synthesis.md

---

### Milestone 0.5: Manual Pilot — 10 Real Transactions (Week 4–10)

---

**Task ID**: T0.5-P01
**Title**: Source 3–5 verified property listings (manual)
**Area**: Operations / Supply
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 2–3 weeks
**Gate**: Manual pilot launch
**Dependencies**: T0.2-T02 (hospitality advisor for introductions), T0.1-L03 (some legal structure needed)

**Description**: Manually onboard 3–5 verified property listings using a non-platform process (WhatsApp, Google Sheets, personal network). Each property must be physically verified (visit or video tour). These listings will be used for the 10 manual transactions.

**Acceptance Criteria**:
- [ ] 3–5 properties identified through personal or advisor network
- [ ] Each property physically verified (visit or recorded video tour)
- [ ] Basic listing information documented (photos, price, availability, house rules)
- [ ] Host identity verified (national ID)
- [ ] Host agreement to participate in manual pilot signed

---

**Task ID**: T0.5-P02
**Title**: Execute 10 manual bookings
**Area**: Operations
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 4–6 weeks
**Gate**: Phase 0 Gate — 10 transactions ≥ 5 (kill threshold)
**Dependencies**: T0.5-P01

**Description**: Execute 10 complete bookings manually — guest discovery, booking confirmation, payment collection, check-in, stay, check-out, and review collection. Platform is NOT required. WhatsApp + Google Sheets + manual payment (Instapay, bank transfer, or Fawry) is acceptable.

**Acceptance Criteria**:
- [ ] 10 bookings confirmed and completed
- [ ] Payment collected and disbursed for each booking (escrow tracked in Google Sheets)
- [ ] Guest NPS collected post-stay for each booking
- [ ] Host NPS collected post-stay for each booking
- [ ] Unit economics recorded for each transaction (booking value, channel, CAC proxy)
- [ ] No unresolved safety or trust incident

---

**Task ID**: T0.5-M01
**Title**: Track and report pilot metrics
**Area**: Operations / Analytics
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: Ongoing during pilot
**Gate**: All Phase 0 gate metrics
**Dependencies**: T0.5-P02

**Description**: Maintain a running metrics log for all pilot transactions. Track against Phase 0 gate conditions on a weekly basis.

**Metrics to track**:

| Metric | Target | Kill Threshold | Current |
|--------|--------|----------------|---------|
| Guest NPS (0–10) | ≥ 7.0 | < 5.0 | — |
| Host NPS (0–10) | ≥ 7.0 | < 5.0 | — |
| CAC per guest (first transaction) | < $50 | > $100 | — |
| Booking dispute rate | < 10% | > 30% | — |
| GCC guest % (organic) | > 20% | < 5% | — |

**Acceptance Criteria**:
- [ ] Weekly metrics update maintained throughout pilot
- [ ] Guest NPS ≥ 7.0 across all completed bookings
- [ ] Host NPS ≥ 7.0 across all completed bookings
- [ ] No unresolved dispute outstanding

---

**Task ID**: T0.5-E01
**Title**: Phase 0 Exit Report
**Area**: Strategy / Documentation
**Priority**: P0
**Status**: Not Started
**Assignee**: Founder
**Estimated Effort**: 1 week (after all gates met)
**Gate**: Phase 0 exit — unlocks Phase 1
**Dependencies**: All T0.x tasks

**Description**: Produce the Phase 0 Exit Report. This document is the gate between Phase 0 and Phase 1. It must cover all gate conditions, the validated wedge, unit economics from the pilot, legal entity status, team structure, and a GO / NO GO / PIVOT recommendation.

**Structure**:
- Interview findings and validated pain points
- Wedge definition (specific, testable, defensible)
- Unit economics from the 10-transaction pilot
- Legal entity status and regulatory path
- Team structure and identified gaps
- Phase 1 recommendation: GO / NO GO / PIVOT

**Acceptance Criteria**:
- [ ] All 7 Phase 0 gate conditions met and documented
- [ ] Wedge identified (specific customer, specific problem, specific geography)
- [ ] Unit economics real (from actual pilot transactions, not projections)
- [ ] Phase 1 recommendation with rationale
- [ ] Document approved by at least 1 external advisor

---

## Phase 1: MVP Build Preview (Pending Phase 0)

The following tasks are defined for planning purposes only. **They may not begin until Phase 0 gates are cleared.**

For the detailed engineering backlog, see [docs/02_product/ENGINEERING_BACKLOG.md](docs/02_product/ENGINEERING_BACKLOG.md).

| Area | Task | Gate Condition |
|------|------|---------------|
| Product | MVP scope finalization based on pilot learnings | Phase 0 Exit Report: GO |
| Engineering | AuthGate and identity verification build | Phase 0 complete |
| Engineering | Spatial search and property discovery | Phase 0 complete |
| Engineering | Reservation lifecycle and booking engine | Phase 0 complete |
| Engineering | Payment integration (Paymob, Fawry) | Phase 0 complete + payment partner confirmed |
| Engineering | Host dashboard and property management | Phase 0 complete |
| Operations | Field operations mobile app (OpsManager) | Phase 0 complete |
| Finance | Treasury ledger and escrow system | Phase 0 complete |
| Growth | Arabic SEO content strategy | Phase 0 complete |
| Growth | WhatsApp marketing channel launch | Phase 0 complete |

---

## Task Statistics (Phase 0)

### By Status

| Status | Count |
|--------|-------|
| Not Started | 19 |
| In Progress | 0 |
| Blocked | 0 |
| Complete | 0 |

### By Priority

| Priority | Count |
|----------|-------|
| P0 (Blocker) | 13 |
| P1 (Critical) | 6 |
| P2 (High) | 0 |

### By Area

| Area | Count |
|------|-------|
| Legal | 4 |
| Research / Customer Discovery | 6 |
| Team | 3 |
| Operations | 4 |
| Strategy | 1 |
| Payments | 1 |

### Estimated Total Effort

- **Phase 0 Total**: 8–10 weeks (most tasks run in parallel)
- **Critical path**: T0.1-L02 → T0.2-T02 → T0.5-P01 → T0.5-P02 → T0.5-E01

---

## Task Management Process

### Task Creation

New tasks are added when:
1. A gap is identified in Phase 0 coverage
2. A host or traveler interview surfaces an unanticipated requirement
3. A legal or regulatory requirement creates new work
4. A Phase 0 gate condition needs additional sub-tasks

### Task Updates

Tasks are updated:
- After each interview session (progress on T0.3-I02, T0.4-I02)
- After each milestone meeting (weekly)
- When status changes (Not Started → In Progress → Complete)
- When a blocker is identified

### Task Completion

A task is complete when:
- All acceptance criteria are met
- Outputs are documented and filed in the correct directory
- Progress is reflected in the relevant Phase 0 gate counter

---

## Related Documents

- [ROADMAP.md](ROADMAP.md) — Phase-by-phase plan with gate conditions
- [MASTER_CONTEXT.md](MASTER_CONTEXT.md) — Full project context
- [DECISION_LOG.md](DECISION_LOG.md) — Strategic decisions as they are made
- [docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md](docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md) — Phase 0 gate conditions
- [docs/phase--1/reports/19_EXECUTION_ORDER.md](docs/phase--1/reports/19_EXECUTION_ORDER.md) — Week-by-week action plan
- [docs/02_product/ENGINEERING_BACKLOG.md](docs/02_product/ENGINEERING_BACKLOG.md) — Phase 1 engineering tasks

---

**Phase 0 is not a development phase. It is a validation phase. No technology is built until these tasks are complete and gates are cleared.**
