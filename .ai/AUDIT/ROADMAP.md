# Roadmap — StayOS

**Version**: 2.0.0
**Last Updated**: 2026-07-13
**Maintainer**: Islam Elbaz (Founder)
**Status**: Active

## Document Purpose

This roadmap defines the development phases for StayOS — the AI-powered accommodation marketplace for MENA. Each phase has gate conditions that must be met before the next phase begins. No phase is skipped. No technology is built before customers are understood.

## Roadmap Philosophy

1. **Customer before code** — Every phase of product development follows customer validation
2. **Manual before automated** — Operations run manually first, then automated
3. **Egypt before GCC** — Prove the model locally before regional expansion
4. **Data before AI** — AI features are unlocked only when sufficient data exists
5. **Revenue before raise** — Demonstrate unit economics before seeking Series A

## Current Status

| Phase | Status | Gate |
|-------|--------|------|
| Phase -1: Founder Discovery | ✅ Complete | Panel verdict: Conditional Go |
| Phase 0: Customer Validation | 🔴 Locked | 10 transactions + 80 interviews |
| Phase 1: MVP | ⏳ Pending | Phase 0 gates |
| Phase 2: Market Expansion | ⏳ Future | Phase 1 gates |
| Phase 3: GCC Entry | ⏳ Future | Phase 2 gates |
| Phase 4: AI Platform | ⏳ Future | Phase 3 gates |

---

## Phase -1: Founder Discovery (COMPLETE)

**Duration**: 2 weeks
**Status**: Complete — 2026-07-13

**What was done:**
- 21 documents produced by simulated executive leadership panel
- 600+ risks catalogued across 6 categories
- 100+ assumptions identified and rated
- 14 critical flaws documented
- Panel verdict: Conditional Go

**Key Outputs:**
- [Executive Summary](docs/phase--1/reports/01_EXECUTIVE_SUMMARY.md)
- [Risk Register](docs/phase--1/risks/06_RISK_REGISTER.md) (600+ risks)
- [Required Validations](docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md)
- [Execution Order](docs/phase--1/reports/19_EXECUTION_ORDER.md)
- [Next Phase Definition](docs/phase--1/reports/20_NEXT_PHASE.md)

**Verdict**: Buildable. Likely to fail in current form. Proceed to Phase 0 with eyes open.

---

## Phase 0: Customer Validation

**Duration**: 60–90 days
**Status**: 🔴 LOCKED — Gate conditions not yet met
**Budget**: $50K–$150K
**Team**: Founder + 1–2 advisors

### Objective

Validate or invalidate the core hypotheses before any technology investment. Determine the specific wedge. Demonstrate real willingness to pay from real customers.

**The single most important question to answer**: What is the one specific, painful problem for a specific person in the Egypt accommodation market that no one is solving today?

### Gate Conditions (ALL must be met to unlock Phase 1)

| Gate | Target | Kill Threshold | Status |
|------|--------|---------------|--------|
| Traveler interviews | 50 completed | < 30 | 🔴 Not started |
| Host/PM interviews | 30 completed | < 20 | 🔴 Not started |
| Manual transactions | 10 completed | < 5 | 🔴 Not started |
| Guest NPS (pilot) | ≥ 7.0/10 | < 5.0 | 🔴 Not started |
| Host NPS (pilot) | ≥ 7.0/10 | < 5.0 | 🔴 Not started |
| Wedge identified | Specific, validated | Vague or generic | 🔴 Not started |
| GCC guest % | > 20% organic | < 5% | 🔴 Not started |

### Milestone 0.1: Legal and Structural Foundation (Week 1–4)

**Deliverables:**
- [ ] Trademark search: StayOS (Egypt, KSA, UAE)
- [ ] Tourism lawyer retained
- [ ] Legal entity structure decided (Egypt LLC vs offshore holdco)
- [ ] Egypt Tourism Authority meeting scheduled
- [ ] Payment processor meetings: Paymob, Fawry
- [ ] WhatsApp Business API application submitted
- [ ] Booking.com and Airbnb Egypt market research complete

**Success Criteria:**
- Legal path to operations defined
- Payment processing partner identified
- Tourism authority relationship initiated

---

### Milestone 0.2: Co-founder and Team (Week 1–6)

**Deliverables:**
- [ ] Co-founder decision made
- [ ] Hospitality industry advisor secured
- [ ] Legal/regulatory advisor secured
- [ ] Role definition for Phase 1 team

**Success Criteria:**
- At least one team member with Egyptian hospitality industry relationships
- Legal and regulatory guidance secured

---

### Milestone 0.3: Customer Discovery — Travelers (Week 2–8)

**Deliverables:**
- [ ] Interview script designed
- [ ] 50 traveler interviews conducted and recorded
- [ ] Synthesis report produced
- [ ] Key pain points ranked and validated

**Interview Target Mix:**
- Egyptian domestic travelers: 25
- GCC nationals traveling to Egypt: 15
- International travelers to Egypt: 10

**Key Hypotheses to Test:**
- Do GCC travelers distrust Booking.com/Airbnb for Egypt bookings?
- Is Arabic-first UX a real differentiator or a nice-to-have?
- Is payment method a blocker to online booking?
- What is the CAC for digital acquisition vs. WhatsApp/referral?

**Success Criteria:**
- > 60% of traveler interviews identify consistent, specific pain with current accommodation search/booking
- At least one wedge hypothesis supported by > 40% of interviews

---

### Milestone 0.4: Customer Discovery — Hosts and Property Managers (Week 2–8)

**Deliverables:**
- [ ] Host interview script designed
- [ ] 30 host/property manager interviews conducted and recorded
- [ ] Synthesis report produced
- [ ] Supply onboarding friction identified

**Interview Target Mix:**
- Individual property owners (apartments, villas): 15
- Small property managers (2–20 units): 10
- Hotel/resort operators: 5

**Key Hypotheses to Test:**
- What is the current booking channel mix (WhatsApp %, OTA %, walk-in %)?
- What is the primary pain with Booking.com/Airbnb?
- What commission rate is acceptable?
- Is a B2B SaaS tool valuable enough to pay for independently?

**Success Criteria:**
- > 60% of hosts identify specific frustration with current distribution
- Commission tolerance identified (acceptable range, not assumed)

---

### Milestone 0.5: Manual Pilot — 10 Real Transactions (Week 4–10)

**Deliverables:**
- [ ] 3–5 verified property listings sourced manually
- [ ] 10 bookings completed (offline, WhatsApp, or basic landing page)
- [ ] Guest and host NPS collected for each booking
- [ ] Unit economics recorded for each transaction (CAC, booking value, host payout)

**No platform required.** This can run on WhatsApp + Google Sheets + manual payment transfer.

**Success Criteria:**
- 10 completed transactions
- Guest NPS ≥ 7.0
- Host NPS ≥ 7.0
- CAC < $50 per guest (first transaction)
- No serious trust or safety incident

---

### Phase 0 Exit Report

At completion, a Phase 0 Exit Report must be produced covering:
- Interview findings and validated pain points
- Wedge definition (specific, testable, defensible)
- Unit economics from manual pilot
- Legal entity status
- Team structure and gaps
- Phase 1 recommendation: GO / NO GO / PIVOT

---

## Phase 1: MVP Launch

**Duration**: 4–6 months
**Status**: ⏳ Pending Phase 0 completion
**Prerequisite**: All Phase 0 gates cleared + Phase 0 Exit Report: GO

### Objective

Build and launch a minimum viable marketplace with 500+ listings, 200+ monthly bookings, and demonstrated product-market fit signal.

### Milestone 1.1: Product Foundation (Month 1–2)

**Deliverables:**
- [ ] Web platform: Search, property pages, booking flow
- [ ] Arabic and English language support
- [ ] Paymob and card payment integration
- [ ] Host onboarding flow
- [ ] Basic listing creation and management
- [ ] Booking management dashboard (host)
- [ ] Guest booking management

**Success Criteria:**
- Full booking flow working end-to-end
- Payment processing live
- Arabic UI production-ready

---

### Milestone 1.2: Supply Acquisition (Month 2–4)

**Deliverables:**
- [ ] 500 verified listings live
- [ ] Host concierge onboarding for first 100 hosts
- [ ] Property verification process defined and executed
- [ ] Host protection framework v1 published

**Supply Mix Target:**
- Apartments (Cairo, Alexandria): 200
- Beach/resort properties (Hurghada, Sharm, North Coast): 200
- Villas and chalets: 100

**Success Criteria:**
- 500 live, verified listings
- < 5% listing fraud rate
- Host onboarding NPS ≥ 7.0

---

### Milestone 1.3: Demand Acquisition (Month 3–5)

**Deliverables:**
- [ ] WhatsApp marketing channels active
- [ ] Egyptian travel influencer partnerships
- [ ] Arabic SEO content strategy live
- [ ] GCC-targeted social campaign (Arabic)
- [ ] First 200 monthly bookings

**Success Criteria:**
- 200 bookings/month by end of Phase 1
- GCC guests ≥ 25% of bookings
- Guest NPS ≥ 7.0
- Booking dispute rate < 3%

---

### Milestone 1.4: Trust Infrastructure v1 (Month 3–6)

**Deliverables:**
- [ ] Identity verification (host and guest)
- [ ] Review and rating system live
- [ ] Dispute resolution process defined and staffed
- [ ] WhatsApp customer support operational
- [ ] Cancellation and refund policy published

**Success Criteria:**
- < 2% dispute rate
- Dispute resolution SLA met in > 90% of cases
- No unresolved trust incidents after 30 days

---

### Phase 1 Gates (to unlock Phase 2)

| Gate | Target |
|------|--------|
| Active listings | 500+ |
| Monthly bookings | 200+ |
| Monthly GTV | $50K+ |
| Guest NPS | ≥ 7.0 |
| Host retention (3-month) | > 65% |
| Dispute rate | < 3% |
| Seed funding | Raised or revenue-funded |

---

## Phase 2: Market Expansion — Egypt at Scale

**Duration**: 6–12 months
**Status**: ⏳ Future

### Objective

Scale to 5,000+ listings, 2,000+ monthly bookings, and dominant position in 2–3 Egyptian segments. Launch mobile app. Add B2B SaaS for property managers.

### Key Milestones

- 5,000 active listings (all Egyptian regions)
- Mobile app launch (iOS and Android, Arabic-first)
- B2B SaaS: Property Manager dashboard with channel management
- AI pricing recommendations v1 (rule-based)
- Paymob + Fawry + Meeza + Vodafone Cash fully integrated
- Corporate housing vertical launched
- Egypt Tourism Authority partnership formalized
- Series A preparation

---

## Phase 3: GCC Entry

**Duration**: 12–18 months
**Status**: ⏳ Future

### Objective

Establish direct market presence in Saudi Arabia and UAE. Own the Egypt-GCC travel corridor. Localize for GCC supply-side (Saudi and Emirati property owners).

### Key Milestones

- Legal entities in KSA and UAE
- KSA and UAE listings live (5,000+)
- GCC-to-Egypt corridor bookings: 10,000+/month
- SADAD, Apple Pay, and mada payment integration (KSA)
- UAE payment rails (local cards, digital wallets)
- Series A raised ($5M–$15M target)
- Regional brand recognition

---

## Phase 4: AI Platform at Scale

**Duration**: Ongoing post Phase 3
**Status**: ⏳ Future

### Objective

Activate the full AI intelligence layer. Become the data-driven pricing and distribution OS for MENA accommodation.

### Key Milestones

- Dynamic pricing ML model (20%+ vacancy reduction demonstrated)
- Demand forecasting (80%+ accuracy)
- AI-powered personalized discovery
- Fraud detection ML model (< 0.1% dispute rate)
- Third-party API platform (third-party OTA and channel integrations)
- Series B preparation

---

## Timeline Summary

```
2026 Q3: Phase 0 — Customer Validation (60–90 days)
2026 Q4 / 2027 Q1: Phase 1 — MVP Launch (4–6 months)
2027 Q2–Q4: Phase 2 — Egypt Scale
2028 Q1–Q3: Phase 3 — GCC Entry
2028 Q4+: Phase 4 — AI Platform
```

Timelines are conditional on Phase gate clearance. A failure to clear gates delays the timeline — not the gate conditions.

## Risk Dependencies

- Phase 0 → Phase 1: Blocked if validation fails or wedge is not found
- Phase 1 → Phase 2: Blocked if unit economics are not healthy
- Phase 2 → Phase 3: Blocked if Series A is not raised
- Phase 3 → Phase 4: Blocked if GCC market data is insufficient for AI models

See [RISKS.md](RISKS.md) and [Phase -1 Risk Register](docs/phase--1/risks/06_RISK_REGISTER.md).

## Related Documents

- [MASTER_CONTEXT.md](MASTER_CONTEXT.md) — Full project context
- [PROJECT_VISION.md](PROJECT_VISION.md) — Strategic vision
- [TASKS.md](TASKS.md) — Current action items (Phase 0)
- [Phase -1 Execution Order](docs/phase--1/reports/19_EXECUTION_ORDER.md)
- [Phase -1 Required Validations](docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md)
- [Phase -1 Next Phase](docs/phase--1/reports/20_NEXT_PHASE.md)

---

**This roadmap is a living document. It is updated at the completion of each phase, when gate conditions change, and when strategic pivots occur. The field, not the plan, determines the timeline.**
