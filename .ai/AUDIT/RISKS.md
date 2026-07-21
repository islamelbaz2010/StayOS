# Risks — StayOS

**Version**: 2.0.0
**Last Updated**: 2026-07-13
**Maintainer**: Islam Elbaz (Founder)
**Status**: Active

## Document Purpose

This document identifies, assesses, and provides mitigation strategies for risks associated with StayOS — the AI-powered accommodation operating system for MENA. Regular risk assessment and mitigation is critical to successfully building a trusted two-sided marketplace for hosts and guests in Egypt and the broader MENA region.

---

## Risk Management Process

### Risk Assessment Framework

Each risk is assessed on two dimensions:

- **Likelihood**: Probability of occurrence (1–5 scale)
  - 1: Very unlikely (< 10%)
  - 2: Unlikely (10–30%)
  - 3: Possible (30–50%)
  - 4: Likely (50–70%)
  - 5: Very likely (> 70%)

- **Impact**: Severity of consequences (1–5 scale)
  - 1: Negligible
  - 2: Minor
  - 3: Moderate
  - 4: Major
  - 5: Critical

**Risk Score**: Likelihood × Impact (1–25)

### Risk Categories

- **Technical Risks**: Platform, AI, and data infrastructure risks
- **Market Risks**: Supply, demand, and competitive risks
- **Business Risks**: Revenue model, funding, and partnership risks
- **Resource Risks**: Team, talent, and operational capacity risks
- **External Risks**: Regulatory, payment, and environmental risks

---

## Risk Register

### Technical Risks

#### TR-001: Marketplace Trust Infrastructure Complexity

**Risk ID**: TR-001
**Category**: Technical
**Likelihood**: 4
**Impact**: 5
**Risk Score**: 20 (Critical)
**Status**: Active

**Description**: Building a trust infrastructure for an accommodation marketplace — covering host identity verification, property verification, guest vetting, escrow payments, and dispute resolution — is highly complex. Failures in any layer erode guest and host confidence and can trigger platform collapse.

**Probability**: High — trust infrastructure requires coordination across identity, payments, operations, and AI layers
**Impact**: Critical — a single high-profile fraud or dispute incident can destroy early-stage reputation

**Mitigation Strategies**:
- Implement physical property verification before any listing goes live (video tour minimum)
- Require national ID or passport for all host and guest identity verification
- Partner with Paymob for escrow payment protection before Phase 1 launch
- Build documented dispute resolution process before first booking
- Conduct manual operations in Phase 0 to validate the full trust flow before automating

**Contingency Plans**:
- Engage third-party identity verification API if internal verification proves too slow at scale
- Establish a guest protection guarantee fund to rebuild trust after any incident
- Pause new supply onboarding if a trust incident is unresolved
- Commission independent security audit of trust infrastructure before Phase 1 launch

**Owner**: Founder / Head of Operations
**Review Date**: 2026-10-13

---

#### TR-002: AI Feature Development Risk

**Risk ID**: TR-002
**Category**: Technical
**Likelihood**: 3
**Impact**: 4
**Risk Score**: 12 (High)
**Status**: Active

**Description**: StayOS is positioned as AI-powered, but AI features require transaction data that does not yet exist. Building AI features too early (before sufficient data accumulates) wastes engineering resources and produces misleading recommendations. Building AI too late loses competitive positioning.

**Probability**: Medium — data accumulation takes time; AI feature timelines are hard to predict
**Impact**: Major — premature AI claims damage credibility; delayed AI loses competitive moat

**Mitigation Strategies**:
- Enforce AI feature gating by data volume (Phase 1: rule-based only; Phase 2: ML at 50K+ transactions; Phase 3: advanced AI at 500K+)
- Begin data collection architecture in Phase 1 MVP even before AI features are enabled
- Use rule-based pricing guidance in Phase 1 clearly labeled as market estimates, not AI
- Build AI roadmap as explicit product documentation (DEC-008)

**Contingency Plans**:
- Source third-party hospitality market data to supplement proprietary transaction data in early phases
- Partner with hospitality data providers for Egypt and GCC pricing benchmarks
- License AI recommendation models from hospitality SaaS vendors as interim solution

**Owner**: Head of Product / CTO (Phase 1)
**Review Date**: 2026-10-13

---

#### TR-003: Platform Scalability Under Booking Demand Peaks

**Risk ID**: TR-003
**Category**: Technical
**Likelihood**: 3
**Impact**: 4
**Risk Score**: 12 (High)
**Status**: Active

**Description**: Egyptian accommodation demand is highly seasonal (summer peak: July–September; Eid holidays; school holidays). Platform infrastructure must handle peak booking loads without degraded availability — downtime during peak booking periods directly destroys host revenue and guest trust.

**Probability**: Medium — seasonality is predictable; scaling requires advance planning
**Impact**: Major — peak downtime damages host trust, guest satisfaction, and booking conversion

**Mitigation Strategies**:
- Design for horizontal scalability from Phase 1 MVP architecture
- Use cloud-native infrastructure (auto-scaling) for booking engine and search
- Load test peak booking scenarios before each seasonal demand window
- Implement booking queue management to handle demand spikes gracefully

**Contingency Plans**:
- Activate read replicas and caching layers during peak demand periods
- Implement graceful degradation (read-only browsing remains available during write overload)
- Pre-scale infrastructure 2 weeks ahead of known peak periods (Eid, school holidays)

**Owner**: CTO (Phase 1)
**Review Date**: 2026-09-13

---

#### TR-004: Data Security and Guest Privacy Vulnerabilities

**Risk ID**: TR-004
**Category**: Technical
**Likelihood**: 4
**Impact**: 5
**Risk Score**: 20 (Critical)
**Status**: Active

**Description**: StayOS handles sensitive personal data: national IDs, passport scans, payment information, location data, and booking history for both guests and hosts. A data breach would destroy trust, trigger regulatory action, and potentially expose guests in a market with limited consumer protection infrastructure.

**Probability**: High — all platforms handling payment and identity data face persistent attack surface
**Impact**: Critical — a breach could end the business before it scales

**Mitigation Strategies**:
- Implement defense-in-depth security across all data stores (encryption at rest and in transit)
- Apply least-privilege access controls across all internal systems
- Conduct regular security audits before each phase launch
- Implement a responsible disclosure and bug bounty program at Phase 1 launch
- Comply with Egyptian data protection requirements and GDPR for international guests

**Contingency Plans**:
- Maintain a documented incident response and data breach notification plan
- Retain legal counsel for privacy incident response before Phase 1 launch
- Implement rapid credential rotation and session invalidation capabilities
- Pre-draft guest and host communication templates for breach notification

**Owner**: Security Lead / Legal Counsel
**Review Date**: 2026-08-13

---

### Market Risks

#### MR-001: Host Supply Acquisition Failure

**Risk ID**: MR-001
**Category**: Market
**Likelihood**: 3
**Impact**: 5
**Risk Score**: 15 (High)
**Status**: Active

**Description**: A two-sided accommodation marketplace cannot function without verified supply. Egyptian property owners may resist onboarding due to unfamiliarity with formal platforms, fear of tax visibility, unwillingness to pay commission, or distrust of a new marketplace. Supply failure at Phase 1 prevents any guest-side growth.

**Probability**: Medium — Egyptian hosts are underserved but may be resistant to formal platform requirements
**Impact**: Critical — without supply, the marketplace cannot launch; a demand-only platform has no product

**Mitigation Strategies**:
- Use B2B2C supply strategy (hotels and property managers first; faster onboarding than individual hosts)
- Leverage hospitality advisor relationships for warm introductions to first host cohort
- Offer zero-commission period for first 50 hosts (6 months free)
- Provide genuine value beyond distribution: host dashboard, pricing guidance, verified guest screening
- Make onboarding frictionless (WhatsApp-native, Arabic language, in-person support)

**Contingency Plans**:
- Pivot to hotel-only supply if individual host acquisition proves too slow at Phase 1
- Offer SaaS tools (channel manager, pricing engine) as standalone product to build host relationships before marketplace launch
- Partner with existing Egyptian property management companies to wholesale supply

**Owner**: Founder / Head of Growth
**Review Date**: 2026-09-13

---

#### MR-002: Major OTA Competitor Response

**Risk ID**: MR-002
**Category**: Market
**Likelihood**: 2
**Impact**: 4
**Risk Score**: 8 (Medium)
**Status**: Active

**Description**: Booking.com, Airbnb, or a well-funded regional competitor could respond to StayOS growth by investing in Arabic-first UX, local payment integration, or lower Egypt commission rates. This could reduce StayOS's differentiation advantage in its core market.

**Probability**: Low — global OTAs have organizational structures that make rapid localization slow; Egypt is not a priority market for Booking.com or Airbnb at this scale
**Impact**: Major — could reduce the conversion advantage of Arabic-first and local payment differentiation

**Mitigation Strategies**:
- Build trust infrastructure moats (physical property verification, Arabic customer support) that take years to replicate at scale
- Move to the GCC-to-Egypt corridor before global OTAs prioritize the market
- Build host loyalty through zero-commission launch period and superior host tools
- Achieve network effects in key supply clusters (Red Sea resorts, North Coast chalets) before competitor response

**Contingency Plans**:
- Accelerate niche dominance in high-value segments (GCC families, halal-certified properties) that global OTAs structurally cannot serve
- Pursue co-marketing or channel partnerships with OTAs rather than direct competition
- Raise Series A earlier to fund growth acceleration before competitor response

**Owner**: Founder / Head of Growth
**Review Date**: 2026-12-13

---

#### MR-003: Guest Demand Acquisition Failure

**Risk ID**: MR-003
**Category**: Market
**Likelihood**: 3
**Impact**: 4
**Risk Score**: 12 (High)
**Status**: Active

**Description**: Egyptian and GCC travelers may not adopt StayOS over existing booking behavior (WhatsApp groups, OTAs, or walk-in). If guest acquisition is too slow or too expensive, the marketplace cannot reach the booking volumes needed for host retention and revenue viability.

**Probability**: Medium — behavior change requires sustained education and a superior product experience
**Impact**: Major — without guests, host supply churns and the marketplace collapses

**Mitigation Strategies**:
- Use Phase 0 manual pilot to validate organic demand before investing in paid guest acquisition
- Leverage GCC traveler community channels (travel Facebook groups, WhatsApp, Instagram) for organic growth
- Build Arabic-first trust signals (verified badges, review system, Arabic support) to convert OTA-skeptical guests
- Target high-intent demand: GCC families searching Egypt summer accommodation (peak season: July–September)

**Contingency Plans**:
- Pivot guest acquisition to institutional demand (corporate travel, group bookings) if consumer acquisition proves too expensive
- Partner with Egyptian travel agencies and GCC tour operators as demand aggregators
- Offer guest incentive program (first booking discount) if organic conversion is below target

**Owner**: Founder / Head of Growth
**Review Date**: 2026-09-13

---

### Business Risks

#### BR-001: Insufficient Funding for Marketplace Launch

**Risk ID**: BR-001
**Category**: Business
**Likelihood**: 3
**Impact**: 5
**Risk Score**: 15 (High)
**Status**: Active

**Description**: Building a trusted two-sided accommodation marketplace requires capital for legal setup, supply verification operations, payment infrastructure integration, engineering, and guest acquisition. Insufficient funding before Phase 1 launch forces premature cuts that undermine the trust infrastructure that is the product's core value.

**Probability**: Medium — pre-seed and seed funding for MENA hospitality startups is available but competitive
**Impact**: Critical — underfunded marketplace launches fail; trust infrastructure cannot be cut without destroying the product

**Mitigation Strategies**:
- Execute Phase 0 on founder capital ($50K–$150K); raise pre-seed only after Phase 0 gates cleared
- Present Phase 0 data (10 manual bookings, 80 interviews) to investors as evidence of market validation
- Pursue MENA-focused VCs (e.g., Flat6Labs, 500 Global MENA, Nuwa Capital) with hospitality sector interest
- Explore Egyptian government innovation grants for tourism tech

**Contingency Plans**:
- Reduce Phase 1 MVP scope to core booking loop only (AuthGate, search, reservation, basic payment)
- Extend Phase 0 timeline and manual operations to generate early revenue before Phase 1 build
- Pursue strategic investment from Egyptian payment processors (Paymob, Fawry) or hospitality groups

**Owner**: Founder / CFO (Phase 1)
**Review Date**: 2026-08-13

---

#### BR-002: Commission Take Rate Rejection by Hosts

**Risk ID**: BR-002
**Category**: Business
**Likelihood**: 3
**Impact**: 4
**Risk Score**: 12 (High)
**Status**: Active

**Description**: The StayOS revenue model depends on a 10–15% blended take rate (host commission + guest service fee). If Egyptian property owners and property managers are unwilling to pay this commission — either because competitors offer lower rates or because informal channels (WhatsApp, OLX) have no commission — the business model requires fundamental restructuring.

**Probability**: Medium — commission tolerance is a known unknown that Phase 0 host interviews must resolve
**Impact**: Major — take rate below 8% requires fundamental restructuring to SaaS-first or high-volume low-margin model

**Mitigation Strategies**:
- Validate commission tolerance directly in Phase 0 host interviews (Task T0.4-I02) before committing to take rate
- Launch at 0% commission for first 50 hosts; raise to 6% at Month 6 and 10% at Month 12
- Justify commission through superior value: guaranteed payments, guest quality, verified bookings, Arabic support
- Design hybrid model (commission + B2B SaaS) to reduce commission dependence for property managers

**Contingency Plans**:
- If commission tolerance < 8%: shift to SaaS-primary model ($50–$200/month per property management unit)
- Reduce host commission to 5–6% and increase guest service fee to maintain blended take rate
- Pursue volume-first strategy (lower commission, high booking volume) with institutional property managers

**Owner**: Founder / CFO (Phase 1)
**Review Date**: 2026-10-13

---

#### BR-003: Payment Infrastructure Partnership Risk

**Risk ID**: BR-003
**Category**: Business
**Likelihood**: 4
**Impact**: 3
**Risk Score**: 12 (High)
**Status**: Active

**Description**: StayOS's entire payment infrastructure depends on Paymob for marketplace escrow, multi-party payment splits, and access to Egyptian payment rails (Fawry, Vodafone Cash, InstaPay, Meeza). If Paymob cannot support accommodation marketplace escrow requirements, or withdraws from the partnership, the payments layer must be rebuilt.

**Probability**: High — Paymob's marketplace escrow API capabilities are unvalidated; escrow is a complex product requirement
**Impact**: Moderate — alternative payment infrastructure partners exist but require 2–3 months to integrate

**Mitigation Strategies**:
- Validate Paymob's marketplace escrow capabilities in Task T0.1-P01 before Phase 1 build begins
- Evaluate Fawry and Stripe (for international guests) as complementary or backup processors
- Design payment abstraction layer in Phase 1 architecture to allow processor substitution without full rebuild

**Contingency Plans**:
- If Paymob cannot support escrow: build manual escrow process (founder-held Google Sheets + bank transfer) as Phase 1 interim
- Evaluate PayTabs, HyperPay, or Checkout.com as Paymob alternatives
- Engage Fawry directly for direct payment rail integration bypassing marketplace escrow requirement

**Owner**: Founder / CTO (Phase 1)
**Review Date**: 2026-12-13

---

### Resource Risks

#### RR-001: Hospitality and Marketplace Tech Talent Acquisition

**Risk ID**: RR-001
**Category**: Resource
**Likelihood**: 4
**Impact**: 4
**Risk Score**: 16 (High)
**Status**: Active

**Description**: Building an AI-powered accommodation marketplace requires rare talent combinations: engineers with marketplace and payments experience, product managers with hospitality domain knowledge, and operations staff who can execute property verification at scale in Egypt. This talent is scarce in Cairo's current tech market.

**Probability**: High — marketplace engineering and hospitality domain expertise rarely co-exist; competition from global remote opportunities
**Impact**: Major — key talent gaps directly delay MVP build and operations launch

**Mitigation Strategies**:
- Recruit co-founder with complementary skill set (hospitality operator if founder is technical; technical co-founder if founder is hospitality-native)
- Engage Egyptian engineering community through university partnerships (AUC, GUC, Cairo University)
- Use remote-first hiring for engineering roles to access global Egyptian diaspora talent
- Offer competitive equity packages to early team members as compensation for lower cash salaries

**Contingency Plans**:
- Contract specialist agencies for property verification operations if internal ops team is unavailable
- Use no-code/low-code tools to extend Phase 0 manual operations without full engineering team
- Prioritize hospitality advisor network as bridge team until full-time hires are made

**Owner**: Founder / HR Lead (Phase 1)
**Review Date**: 2026-08-13

---

#### RR-002: Team Retention

**Risk ID**: RR-002
**Category**: Resource
**Likelihood**: 3
**Impact**: 4
**Risk Score**: 12 (High)
**Status**: Active

**Description**: Early-stage marketplace startups have high team turnover risk. Loss of a key team member — co-founder, CTO, or head of operations — causes knowledge loss, delayed milestones, and host/guest relationship disruption at a stage where institutional knowledge is thin.

**Probability**: Medium — hospitality tech is competitive; remote opportunities offer alternative compensation
**Impact**: Major — early-stage team loss disproportionately impacts a lean organization

**Mitigation Strategies**:
- Use vesting schedules (4-year vest, 1-year cliff) for all co-founders and early team
- Build comprehensive documentation of host relationships, booking processes, and supplier agreements
- Maintain direct founder relationships with all key host and guest accounts in Phase 0 and Phase 1
- Create compelling mission and equity narrative for team retention at below-market cash salaries

**Contingency Plans**:
- Maintain contact with hospitality and marketplace talent pipeline for rapid replacement
- Cross-train team members on critical functions (no single point of failure in operations)
- Establish knowledge transfer protocol for all departing team members

**Owner**: Founder / HR Lead
**Review Date**: 2026-09-13

---

#### RR-003: Timeline Slippage in MVP Build

**Risk ID**: RR-003
**Category**: Resource
**Likelihood**: 4
**Impact**: 4
**Risk Score**: 16 (High)
**Status**: Active

**Description**: The Phase 1 MVP build — booking engine, host dashboard, guest search, Paymob integration, and OpsManager — is estimated at 6 months on $150K. Marketplace platforms are notoriously complex to build correctly. Timeline slippage delays host onboarding, guest acquisition, and first revenue, increasing capital burn before any bookings are processed.

**Probability**: High — marketplace MVP complexity is consistently underestimated; payment and trust infrastructure add disproportionate scope
**Impact**: Major — each month of delay consumes ~$25K in engineering costs and delays host retention

**Mitigation Strategies**:
- Scope MVP to minimum bookable product: search → property page → booking → payment → confirmation
- Use agile sprints with bi-weekly demos to catch scope creep early
- Validate MVP scope with Phase 0 learnings before build begins (DEC-007)
- Use proven hosting and payment infrastructure (no custom payment processing from scratch)

**Contingency Plans**:
- Reduce MVP scope to core booking loop (AuthGate + search + reservation + Paymob) if budget tightens
- Extend Phase 0 manual operations to generate early revenue while MVP build completes
- Raise bridge funding if MVP build overruns by more than 30%

**Owner**: Founder / CTO (Phase 1)
**Review Date**: 2026-08-13

---

### External Risks

#### ER-001: Egypt Tourism Authority Regulatory Barriers

**Risk ID**: ER-001
**Category**: External
**Likelihood**: 3
**Impact**: 5
**Risk Score**: 15 (High)
**Status**: Active

**Description**: StayOS requires Egypt Tourism Authority (ETA) approval to legally operate as an accommodation marketplace. ETA licensing requirements for online accommodation platforms are unclear and may involve long processing timelines, foreign ownership restrictions, or conditions that affect the business model.

**Probability**: Possible — regulatory path for online accommodation marketplaces is unmapped; ETA approval timelines are unpredictable
**Impact**: Critical — without ETA approval, StayOS cannot legally operate; a 12+ month regulatory delay is an existential risk

**Mitigation Strategies**:
- Retain tourism and hospitality lawyer with existing ETA relationships (Task T0.1-L02)
- Schedule initial ETA meeting as early as Week 2 of Phase 0 (Task T0.1-L04)
- Structure entity to comply with Egyptian foreign ownership rules from the start
- Map full regulatory requirements before Phase 1 build begins

**Contingency Plans**:
- If ETA approval timeline > 12 months: operate Phase 1 under a tourism agency partner's license as interim solution
- Engage industry association (Egyptian Hotel Association) for regulatory advocacy
- Consult DIFC or UAE ADGM structure if Egyptian regulatory path proves unworkable for the target investor base

**Owner**: Founder / Legal Counsel
**Review Date**: 2026-08-13

---

#### ER-002: Egyptian Payment Rail Availability Risk

**Risk ID**: ER-002
**Category**: External
**Likelihood**: 3
**Impact**: 3
**Risk Score**: 9 (Medium)
**Status**: Active

**Description**: StayOS's guest payment strategy depends on availability of Egyptian payment rails: Fawry, Vodafone Cash, InstaPay, and Meeza cards. Regulatory changes, partner API changes, or technical instability in any of these rails could disrupt guest payment and host payouts.

**Probability**: Possible — Egyptian fintech regulatory environment is evolving; CBE regulations on payment aggregators can change
**Impact**: Moderate — disruption to one payment rail reduces market access but alternative rails remain available

**Mitigation Strategies**:
- Integrate multiple payment rails through Paymob's unified API to avoid single-rail dependency
- Monitor CBE regulatory announcements on payment processing requirements
- Maintain direct relationship with Fawry and Vodafone Cash for early warning on API changes
- Design payment layer for rail substitution without guest-facing disruption

**Contingency Plans**:
- Activate backup payment rails within 48 hours of any primary rail failure
- Offer bank transfer as universal fallback for all booking payments
- Communicate transparently with affected hosts and guests if payment disruption occurs

**Owner**: Founder / CTO (Phase 1)
**Review Date**: 2026-10-13

---

#### ER-003: Intellectual Property and Trademark Risk

**Risk ID**: ER-003
**Category**: External
**Likelihood**: 2
**Impact**: 5
**Risk Score**: 10 (High)
**Status**: Active

**Description**: The StayOS brand name contains "OS," which may overlap with existing trademarks in the accommodation, technology, or operating system categories in Egypt, Saudi Arabia, and UAE. An IP dispute could force rebranding at a stage when brand equity is being built.

**Probability**: Low — trademark search has not yet been completed; risk decreases after search and registration
**Impact**: Critical — forced rebranding after Phase 1 launch destroys brand investment and customer recognition

**Mitigation Strategies**:
- Commission trademark search for "StayOS" in Egypt, Saudi Arabia, and UAE before any public launch (Task T0.1-L01)
- Register trademark in all three jurisdictions as early as legally possible
- Use original branding and visual identity to minimize copyright risk
- Engage IP lawyer to review all branding assets before public launch

**Contingency Plans**:
- Prepare 2–3 alternative brand names in case trademark conflicts are identified
- If conflict is identified post-launch, pursue co-existence agreement before rebranding
- Budget $5K–$15K for trademark registration across three jurisdictions

**Owner**: Founder / Legal Counsel
**Review Date**: 2026-12-13

---

## Risk Summary

### Risk Score Distribution

- **Critical (16–25)**: 4 risks
- **High (10–15)**: 8 risks
- **Medium (5–9)**: 3 risks
- **Low (1–4)**: 0 risks

### By Category

- **Technical**: 4 risks (2 Critical, 2 High)
- **Market**: 3 risks (1 High, 2 Medium/High)
- **Business**: 3 risks (3 High)
- **Resource**: 3 risks (2 High, 1 High)
- **External**: 3 risks (1 High, 1 Medium, 1 High)

### Top 5 Risks by Score

1. **TR-001**: Marketplace Trust Infrastructure Complexity (20)
2. **TR-004**: Data Security and Guest Privacy Vulnerabilities (20)
3. **RR-001**: Hospitality and Marketplace Tech Talent Acquisition (16)
4. **RR-003**: Timeline Slippage in MVP Build (16)
5. **BR-001**: Insufficient Funding for Marketplace Launch (15)

---

## Risk Management Process

### Review Schedule

- **Weekly**: Review Phase 0 operational risks (TR-001, BR-003, ER-001, ER-002)
- **Monthly**: Review top 5 risks and any risks in active mitigation
- **At Phase Gate**: Full risk register review before advancing from Phase 0 to Phase 1
- **Quarterly**: Full risk register review in Phase 1 and beyond

### Risk Monitoring

- Track risk likelihood and impact changes as Phase 0 interviews and pilot progress
- Validate or invalidate each risk assumption against actual data (cross-reference ASSUMPTIONS.md)
- Identify new risks as regulatory, market, and competitive conditions change
- Document risk status changes in DECISION_LOG.md when they trigger strategic decisions

### Risk Communication

- Weekly risk status summary in founder working notes
- Risk review in Phase 0 advisor check-ins
- Escalation to investor and board when any risk reaches Critical (score 20+) without an active mitigation plan

### Immediate Action Triggers

- Any risk score increases to 20+ (Critical) without an active mitigation in place
- Any mitigation strategy fails or is blocked
- A new risk is identified with score 15+ (e.g., new regulatory announcement, competitor action)
- External event materially changes the risk profile (e.g., CBE payment regulation change, ETA licensing rule change)

---

## Related Documents

- [ASSUMPTIONS.md](ASSUMPTIONS.md) — Assumptions being tested in Phase 0
- [MASTER_CONTEXT.md](MASTER_CONTEXT.md) — Full project context
- [DECISION_LOG.md](DECISION_LOG.md) — Strategic decisions made in response to risks
- [ROADMAP.md](ROADMAP.md) — Phase gate conditions and timeline
- [TASKS.md](TASKS.md) — Phase 0 tasks that directly mitigate these risks

---

**Risk assessment is a continuous activity, not a one-time document. Every Phase 0 interview, pilot transaction, and regulatory meeting generates new information that must be reflected here within 48 hours of the triggering event.**
