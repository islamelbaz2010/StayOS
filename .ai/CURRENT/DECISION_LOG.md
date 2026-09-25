# Decision Log — StayOS

**Version**: 2.0.0
**Last Updated**: 2026-07-13
**Maintainer**: Islam Elbaz (Founder)
**Status**: Active

## Document Purpose

This document records all significant strategic, product, legal, and operational decisions made during the development of StayOS — the AI-powered accommodation operating system for MENA. Each decision includes context, alternatives considered, rationale, and consequences.

**See also**: [docs/phase--1/reports/18_KEY_DECISIONS.md](docs/phase--1/reports/18_KEY_DECISIONS.md) for the full Phase -1 decision framework (15 decisions with deadlines and owners).

---

## Decision Format

```markdown
### [ID]: [Title]

**Status**: Proposed | Accepted | Rejected | Deprecated | Superseded
**Date**: YYYY-MM-DD
**Decision Maker**: Name/Role
**Urgency**: IMMEDIATE | PRE-LAUNCH | POST-PMF
**Reversibility**: HIGH | MEDIUM | LOW

#### Context
#### Decision
#### Alternatives Considered
#### Rationale
#### Consequences
#### Related Decisions
```

---

## Decision Log

### DEC-001: StayOS Is an Accommodation Marketplace, Not a Computer OS

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder
**Urgency**: IMMEDIATE
**Reversibility**: LOW

#### Context

The name "StayOS" contains "OS," which could be interpreted as a reference to a computer operating system. Early project documentation was mistakenly framed around technology-first product development rather than the accommodation marketplace it is building. This confusion needed to be formally resolved before any external stakeholder communication.

#### Decision

StayOS is an AI-powered, two-sided accommodation marketplace for the MENA region. "OS" is a business metaphor: StayOS is the operating system of accommodation — the intelligence layer, trust infrastructure, and coordination platform that makes the MENA accommodation market work. StayOS does not build computer software at the OS level. It builds a marketplace platform.

#### Alternatives Considered

- **Rename the company**: Considered renaming to remove the "OS" ambiguity. Rejected — the "OS" positioning is strategically valuable and differentiating.
- **Accept the confusion**: Rejected — confusion about what the company builds undermines investor, co-founder, and partner conversations.

#### Rationale

The accommodation marketplace metaphor for "OS" is powerful: it positions StayOS as the foundational layer of the MENA accommodation economy, not a feature layer. This is the correct level of ambition. The metaphor is worth defending.

#### Consequences

- **Positive**: All documentation, hiring, investor conversations, and product decisions are grounded in the accommodation marketplace definition.
- **Negative**: Requires explicit clarification in all early conversations ("OS means accommodation operating system, not a computer OS").
- **Neutral**: The name remains StayOS; the OS metaphor is retained.

#### Related Decisions

- DEC-002: Market entry geography
- DEC-004: Arabic-first UX

---

### DEC-002: Egypt as Proof-of-Concept Market, GCC as the Business

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder
**Urgency**: IMMEDIATE
**Reversibility**: MEDIUM

#### Context

Egypt is a viable entry market but insufficient for a venture-scale outcome. At 10% take rate and 10% market share of the Egyptian online accommodation market ($200M–$400M TAM), maximum Egypt revenue = $20M–$40M/year. This is below the threshold for a significant exit. The largest inbound travel segment to Egypt is Gulf nationals (Saudi, UAE, Qatari, Kuwaiti) who are also the highest-value customers.

#### Decision

Egypt is the proof-of-concept market. The Egypt–GCC travel corridor is the primary business. Every decision — legal structure, payment infrastructure, product language, trust standards — must support regional expansion from Day 1. Egypt is never the destination; it is the launch pad.

#### Alternatives Considered

- **Egypt-only**: Simplifies Phase 0 focus. Rejected — not a venture-scale outcome.
- **GCC-first**: Higher-value market but unknown regulatory landscape, no founder relationships, no supply network. Rejected for Phase 0.
- **Egypt + GCC simultaneously**: Resources and focus insufficient at Phase 0 and Phase 1. Rejected.

#### Rationale

The GCC-to-Egypt travel corridor is estimated at $300M–$800M in addressable accommodation spend. GCC travelers are already going to Egypt, already frustrated by English-first OTAs and payment limitations. Serving them in Egypt first gives StayOS the GCC demand relationships before launching supply in GCC countries.

#### Consequences

- **Positive**: Business model is designed for regional scale from the start; investor narrative is stronger.
- **Negative**: Increases Phase 0 complexity (must interview GCC travelers, not just Egyptian domestic travelers).
- **Neutral**: Phase 0 is still Egypt-based; GCC expansion is Phase 3.

#### Related Decisions

- DEC-003: Arabic-first UX

---

### DEC-003: Arabic-First UX, Not Arabic-Translated UX

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder
**Urgency**: PRE-LAUNCH
**Reversibility**: LOW

#### Context

Global OTAs (Booking.com, Airbnb) are English-first platforms translated into Arabic. Arabic translation is different from Arabic-native design. Translation produces awkward UX, incorrect RTL formatting, missing cultural context, and customer support that cannot actually help Arabic-speaking guests. This is a known weakness of all global competitors.

#### Decision

StayOS is built Arabic-first: RTL layout is the primary layout, Arabic is the primary language, culturally appropriate property filters (halal-certified, family-only, mixed) are built from the start, and customer support operates in Arabic as the first language, not a secondary option.

#### Alternatives Considered

- **English-first with Arabic translation**: Faster to build; appeals to expat and international traveler segment. Rejected — abandons the core differentiation and primary customer segment.
- **Bilingual equal priority**: More complex to maintain. Evaluated — may be appropriate for Phase 2 when GCC and international segments grow.

#### Rationale

The primary customer segment — Egyptian domestic travelers and GCC travelers visiting Egypt — is Arabic-speaking. No competitor has built the accommodation experience for this customer, in their language, by design. This is the moat.

#### Consequences

- **Positive**: Strong differentiation; no global OTA can easily replicate an Arabic-first design without full product rebuild.
- **Negative**: Slower development; Arabic RTL increases complexity of UI engineering.
- **Neutral**: English support added in Phase 2 when international traveler segment reaches meaningful size.

#### Related Decisions

- DEC-004: Local payment infrastructure
- DEC-001: Accommodation marketplace definition

---

### DEC-004: Local Payment Infrastructure as Core Capability, Not Integration

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder
**Urgency**: PRE-LAUNCH
**Reversibility**: LOW

#### Context

Egypt's payment landscape is fragmented: Fawry (cash and digital), Vodafone Cash, Orange Money, Meeza cards, InstaPay, bank transfer, and cash. Approximately 40% of Egyptians are unbanked or card-averse. Global OTAs require Visa/Mastercard, which excludes a large portion of the Egyptian market. This payment gap is a structural blocker to online accommodation booking in Egypt.

#### Decision

StayOS integrates all Egyptian payment rails as a core product requirement, not as optional payment methods. Every Egyptian must be able to pay. Fawry, Meeza, Vodafone Cash, InstaPay, and bank transfer are P0 requirements for Phase 1. Paymob is the primary integration partner (supports multiple rails through a single API).

#### Alternatives Considered

- **Card-only (Stripe/Paymob card)**: Fastest to integrate, covers GCC travelers. Rejected — excludes the majority of Egyptian guests.
- **Paymob only**: Covers most rails through one integration. Accepted as primary strategy.
- **Cash on arrival**: Familiar to Egyptian market but unscalable and trust-unsafe. Rejected as primary — acceptable as backup for specific property types in Phase 1.

#### Rationale

Payment exclusion is a top-3 barrier to online accommodation booking in Egypt. Solving it completely is a structural advantage that global OTAs cannot match without country-level investment they are unlikely to make for Egypt.

#### Consequences

- **Positive**: Full market access; no guest excluded by payment method.
- **Negative**: Integration complexity; compliance requirements per payment method.
- **Neutral**: Paymob handles most complexity through unified API; not building from scratch.

#### Related Decisions

- DEC-001: Accommodation marketplace definition
- DEC-005: B2B2C supply strategy

---

### DEC-005: B2B2C Supply Strategy — Hotels and Property Managers First

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder
**Urgency**: PRE-LAUNCH
**Reversibility**: MEDIUM

#### Context

Pure consumer-to-consumer marketplace supply (individual hosts listing their own apartments) is the hardest supply acquisition strategy. Individual hosts require significant education, trust-building, and operational support. Hotel chains and property managers, by contrast, have existing inventory, operational infrastructure, and clear business motivation to distribute across additional channels.

#### Decision

StayOS uses a B2B2C supply acquisition strategy: hotel chains and resort operators first (SaaS channel management + OTA distribution), then property managers (portfolio management tools), then individual hosts. Supply comes primarily from B2B relationships. B2C individual hosts are a secondary supply channel, not the primary.

#### Alternatives Considered

- **Consumer-first (individual hosts)**: Higher trust signals, authentic product. Rejected as primary — too slow for Phase 0 listing targets.
- **Hotel-only**: Sufficient supply, but misses the short-term rental segment that is the product's differentiation.
- **B2B2C (selected)**: Builds supply quickly through institutional relationships while retaining individual host onboarding for the long term.

#### Rationale

Hotel chains and resort operators can provide 50–200 listings through a single relationship. Individual hosts provide 1 listing per relationship. The Phase 1 target (500 listings) is achievable only with B2B supply.

#### Consequences

- **Positive**: Faster supply acquisition; institutional partners bring operational credibility.
- **Negative**: B2B sales cycle is longer; institutional partners may demand lower commission rates.
- **Neutral**: Individual host onboarding continues in parallel as a secondary supply channel.

#### Related Decisions

- DEC-002: Egypt as proof-of-concept market
- DEC-006: Trust-first positioning

---

### DEC-006: Trust Before Scale — No Shortcuts on Verification

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder
**Urgency**: IMMEDIATE
**Reversibility**: LOW

#### Context

The Egyptian accommodation market suffers from deep trust deficits: listings may not exist, hosts may not be who they claim, properties may not match photos, payments may not be refunded. The Phase -1 panel identified trust infrastructure as the single most important capability StayOS must build before it can acquire its first guest.

#### Decision

No listing goes live without identity verification (national ID or passport) and physical property verification (video tour minimum, on-site visit where possible). No booking completes without escrow payment protection. No launch happens without a documented dispute resolution process. Trust standards, once set, are never lowered.

#### Alternatives Considered

- **Light verification (self-reported)**: Faster to scale supply. Rejected — recreates the trust problem StayOS exists to solve.
- **Verification only at scale**: Start unverified, add verification later. Rejected — trust damage from early incidents is permanent.
- **Third-party verification service**: Explore integration with identity verification APIs. Evaluated — acceptable as supplementary tool alongside StayOS verification process.

#### Rationale

Trust is the product. Without it, StayOS is indistinguishable from OLX listings or WhatsApp groups, which Egyptian guests already do not trust. The entire business model depends on being the trusted option in a market that has no trusted option.

#### Consequences

- **Positive**: Strong brand differentiation; genuine competitive moat; lower dispute and fraud rates.
- **Negative**: Supply acquisition is slower; verification adds cost and time to host onboarding.
- **Neutral**: Verification cost modeled into host acquisition cost; acceptable at Phase 0 volumes.

#### Related Decisions

- DEC-005: B2B2C supply strategy
- DEC-001: Accommodation marketplace definition

---

### DEC-007: Manual Operations in Phase 0 — No Platform Until Validated

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder
**Urgency**: IMMEDIATE
**Reversibility**: HIGH

#### Context

The Phase -1 panel's most critical finding: "Technology does not come before customers." Building a marketplace platform before validating that guests and hosts will use it has destroyed more accommodation startups than any other single mistake. Phase 0 requires proving willingness to pay, not proving technology.

#### Decision

Phase 0 operates entirely on manual tools: WhatsApp for communication, Google Sheets for inventory and booking management, InstaPay or bank transfer for payments, and in-person or video-call for property verification. No marketplace platform is built in Phase 0. The platform build begins only after Phase 0 gates are cleared.

#### Alternatives Considered

- **Build MVP simultaneously**: Faster to Phase 1. Rejected — building before validating destroys capital and time.
- **Build landing page only**: Low-commitment technology to capture demand signal. Acceptable as supplementary tool during Phase 0.
- **Full manual (selected)**: Forces direct customer contact, reveals actual friction points, avoids premature optimization.

#### Rationale

10 real transactions completed manually tell you more than 1,000 users on a beta platform. Manual operations in Phase 0 reveal: the real booking friction, what hosts actually need, what guests actually ask for, and whether the trust infrastructure design works. These learnings shape the MVP scope.

#### Consequences

- **Positive**: Low cost; high learning velocity; forces founder to engage directly with every customer.
- **Negative**: Not scalable past 20–30 bookings; cannot support more than 3–5 listings manually.
- **Neutral**: Phase 0 is scoped to 10 transactions — manual operations are sufficient.

#### Related Decisions

- DEC-006: Trust-first positioning
- DEC-008: AI roadmap sequence

---

### DEC-008: AI Is a Roadmap, Not a Launch Claim

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder
**Urgency**: PRE-LAUNCH
**Reversibility**: HIGH

#### Context

StayOS is positioned as "AI-powered." The Phase -1 panel's finding: "The AI narrative is premature. There is no AI value without data. There is no data without users. There are no users without listings. There are no listings without trust." Launching with "AI-powered" positioning before having AI is dishonest and credibility-destroying.

#### Decision

AI features are built in sequence, tied to data availability:
- **Phase 0**: Zero AI. Manual operations. Data collection begins.
- **Phase 1**: Rule-based recommendations only. Basic pricing guidance from market data.
- **Phase 2**: ML-powered dynamic pricing recommendations for hosts (50K+ transaction data required).
- **Phase 3+**: Demand forecasting, personalized search, fraud detection (500K+ transaction data required).

The "AI-powered" positioning is aspirational positioning that will be earned, not a launch claim.

#### Alternatives Considered

- **Launch with AI positioning + rule-based tools labeled as "AI"**: Common industry practice. Rejected — misleading to guests, hosts, and investors who understand the difference.
- **No AI positioning at all**: Loses a genuine long-term competitive advantage. Rejected.
- **Roadmap approach (selected)**: Honest positioning that becomes more powerful as data accumulates.

#### Rationale

The accommodation intelligence capability — knowing when demand is high, which properties convert, which prices maximize revenue — is genuinely valuable. It is also genuinely unavailable until transaction data exists. Building credibility now through honesty positions StayOS for a stronger AI narrative later.

#### Consequences

- **Positive**: Credibility with sophisticated investors and partners; avoids the "AI washing" trap.
- **Negative**: Less exciting early pitch; requires patience with the AI narrative.
- **Neutral**: AI roadmap is explicitly defined; feature gating by data volume prevents premature build.

#### Related Decisions

- DEC-001: Accommodation marketplace definition
- DEC-007: Manual operations in Phase 0

---

### DEC-009: WhatsApp as Primary Communication Infrastructure

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder
**Urgency**: PRE-LAUNCH
**Reversibility**: HIGH

#### Context

Egyptian property owners and guests communicate through WhatsApp — not email, not in-app chat, not SMS. WhatsApp penetration in Egypt is near-universal. Research consistently shows that accommodation inquiries, booking negotiations, check-in instructions, and support requests in the Egyptian market happen on WhatsApp, not through OTA messaging systems.

#### Decision

WhatsApp is the primary communication channel for all guest–host interaction, booking notifications, check-in instructions, and customer support. Phase 0 manual operations run entirely through WhatsApp. Phase 1 integrates WhatsApp Business API for automated notifications and support escalation. Platform-native messaging is supplementary, not primary.

#### Alternatives Considered

- **Email-first**: Familiar for international guests. Rejected as primary — low open rates with Egyptian and GCC users for transactional messages.
- **In-app messaging only**: Best for platform experience. Rejected as primary for Phase 0 (no platform) and Phase 1 (guests prefer WhatsApp).
- **WhatsApp-first (selected)**: Meets users where they already are; reduces communication friction to zero.

#### Rationale

Fighting communication habits is expensive and unnecessary. WhatsApp is already the operating system for social and commercial communication in Egypt. Integrating with it reduces host and guest education cost to zero.

#### Consequences

- **Positive**: Instant adoption; zero communication friction; works in Phase 0 without any platform.
- **Negative**: Dependency on Meta's WhatsApp Business API; API access may take 4–8 weeks.
- **Neutral**: WhatsApp Business API applied for in Task T0.1-P02.

#### Related Decisions

- DEC-007: Manual operations in Phase 0
- DEC-003: Arabic-first UX

---

### DEC-010: Hybrid Revenue Model — Commission plus B2B SaaS

**Status**: Proposed (pending host interview validation)
**Date**: 2026-07-13
**Decision Maker**: Founder + (future) CFO
**Urgency**: PRE-LAUNCH
**Reversibility**: MEDIUM

#### Context

Two primary revenue models are available: (1) commission-only marketplace (take rate on each booking) and (2) B2B SaaS subscription (monthly fee from property managers for platform access). Each has different implications for host acquisition, pricing strategy, and investor narrative. The Phase -1 panel identified commission tolerance as an unknown that must be validated through host interviews.

#### Decision (Proposed)

Hybrid model: commission-based marketplace revenue (8–12% from host, 3–5% from guest) as primary revenue, supplemented by B2B SaaS fees ($50–$200/month per property management unit) as secondary revenue. Commission launches at 0% for first cohort of hosts (first 50 hosts receive free period), rising to 6% at Month 6 and 10% at Month 12.

**This decision is PROPOSED and requires validation from host commission tolerance interviews (T0.4-I02). It becomes ACCEPTED after interview synthesis.**

#### Alternatives Considered

- **Commission-only**: Standard marketplace model. Simpler. Accepted as the core revenue.
- **SaaS-only**: Predictable recurring revenue. Rejected as primary — reduces supply motivation to maximize bookings.
- **Hybrid (proposed)**: Combines booking-aligned commission with recurring SaaS for property managers who want advanced tools.

#### Rationale

Commission creates alignment: StayOS makes money when hosts make money. SaaS creates stability: predictable recurring revenue from the B2B supply-side that reduces vulnerability to booking seasonality.

#### Consequences

- **Positive**: Two revenue streams; aligned incentives with hosts; predictable baseline from SaaS.
- **Negative**: More complex product (must build SaaS features in Phase 2).
- **Neutral**: Commission structure validated by host interviews before launch commitment.

#### Related Decisions

- DEC-005: B2B2C supply strategy
- DEC-002: Egypt as proof-of-concept market

---

## Decision Statistics

| Status | Count |
|--------|-------|
| Accepted | 9 |
| Proposed (pending validation) | 1 |
| Rejected | 0 |
| Deprecated | 0 |

## Decision Categories

- **Identity / Positioning**: DEC-001
- **Market Strategy**: DEC-002, DEC-005
- **Product**: DEC-003, DEC-004, DEC-007, DEC-008, DEC-009
- **Operations**: DEC-006
- **Revenue**: DEC-010

## Pending Decisions (From Phase -1 Framework)

The following decisions from [docs/phase--1/reports/18_KEY_DECISIONS.md](docs/phase--1/reports/18_KEY_DECISIONS.md) are outstanding and will be added to this log when made:

| Decision | From 18_KEY_DECISIONS.md | Deadline | Input Required |
|----------|--------------------------|----------|---------------|
| Founding wedge | D01 | Day 30 | 50 traveler + 30 host interviews |
| Co-founder | D02 | Day 15 | Skills gap assessment |
| Legal entity structure | D03 | Day 14 | Legal opinion |
| First geography | D04 | Day 21 | Host interview data |
| Business model validation | D05 | Day 30 | Host commission tolerance interviews |
| MVP scope | D06 | After 10 manual transactions | Pilot learnings |
| Web vs. app | D07 | Day 21 | Egyptian mobile data |
| WhatsApp integration depth | D08 | Day 30 | Pilot user behavior |
| Commission launch strategy | D14 | Day 30 | Host interviews |
| GCC demand acquisition | D15 | Day 45 | GCC traveler interview data |

---

## Related Documents

- [docs/phase--1/reports/18_KEY_DECISIONS.md](docs/phase--1/reports/18_KEY_DECISIONS.md) — Full Phase -1 decision framework
- [MASTER_CONTEXT.md](MASTER_CONTEXT.md) — Project context
- [ROADMAP.md](ROADMAP.md) — Phase-by-phase execution
- [ASSUMPTIONS.md](ASSUMPTIONS.md) — Assumptions being tested
- [RISKS.md](RISKS.md) — Risk register summary

---

**This log is a living document. Every significant decision made during Phase 0 and beyond must be recorded here within 24 hours of the decision being made.**

---

## Engineering Decisions — Session 002 (2026-07-21)

### DEC-S02-001: PostgreSQL Exclusion Constraints for Calendar Concurrency

**Status**: Accepted (implementation)
**Date**: 2026-07-21
**Decision Maker**: Engineering (AI session)
**Context**: Overlapping HOLD/BOOKED calendar rules for the same unit must be prevented at the database level to avoid double-booking race conditions.
**Decision**: Add a PostgreSQL exclusion constraint on `pms.calendar_rules` and translate `IntegrityError` in `reservations/repository.py` to a `ConflictError`.
**Consequences**: Race-safe calendar locking; requires PostgreSQL 16 + btree_gist extension.

### DEC-S02-002: In-Application Notification Retry + Dead-Letter Queue

**Status**: Accepted (implementation)
**Date**: 2026-07-21
**Decision Maker**: Engineering (AI session)
**Context**: Provider failures (WhatsApp/Email/SMS) should not lose notifications.
**Decision**: The `notifications` service retries up to `MAX_RETRIES` (3) and moves failed notifications to `DEAD_LETTER` status for manual inspection.
**Consequences**: Improved reliability; requires Celery task to retry pending notifications.

### DEC-S02-003: Redis for Rate Limiting and Session Revocation

**Status**: Accepted (implementation)
**Date**: 2026-07-21
**Decision Maker**: Engineering (AI session)
**Context**: Existing Redis dependency can be reused for shared state across API workers.
**Decision**: Rate limiting and refresh-token revocation are backed by Redis.
**Consequences**: Centralized, fast state; Redis unavailability causes rate limit errors rather than allowing unlimited requests.

### DEC-S02-004: Resolve Notification Providers by Name at Dispatch Time

**Status**: Accepted (implementation)
**Date**: 2026-07-21
**Decision Maker**: Engineering (AI session)
**Context**: `_CHANNEL_DISPATCHERS` stored callable references, preventing tests from monkeypatching providers.
**Decision**: Store provider function names and use `getattr(providers, dispatcher_name)` at dispatch time.
**Consequences**: More testable code; slightly more indirection.

### DEC-S02-005: Plain `Request` Type for FastAPI Dependencies

**Status**: Accepted (implementation)
**Date**: 2026-07-21
**Decision Maker**: Engineering (AI session)
**Context**: `Request[Any]` caused `FastAPIError: Invalid args for response field` because FastAPI could not recognize the generic as a special request parameter.
**Decision**: Use `Request` (non-generic) with `# type: ignore[type-arg]` under strict mypy.
**Consequences**: Dependencies work at runtime and pass type checking.

### DEC-S02-006: Preserve Non-String Log Record Arguments During PII Masking

**Status**: Accepted (implementation)
**Date**: 2026-07-21
**Decision Maker**: Engineering (AI session)
**Context**: Masking all `LogRecord.args` by casting to `str` broke `%d` formatting.
**Decision**: Only mask string arguments; leave non-string arguments unchanged.
**Consequences**: PII masking works without breaking numeric format specifiers.

---

## Sprint 0 Governance Decisions

### DEC-011: Phase 0 Gate Cleared — Engineering Implementation Authorized

**Status**: Accepted
**Date**: 2026-07-30
**Decision Maker**: Islam Elbaz, Founder
**Urgency**: IMMEDIATE
**Reversibility**: LOW

#### Context

The repository CLAUDE.md file specified that Phase 0 was "ACTIVE" and that application code in `src/` was restricted to tooling and documentation only, pending Phase 0 gate conditions (10 transactions + 80 customer interviews). The MASTER_EXECUTION_BOARD.md, SPRINT_0_ENGINEERING_FOUNDATION_v1.1.md, and STAYOS_IMPLEMENTATION_BASELINE.md had all been authored with the assumption of an engineering GO decision, creating a governance conflict: governance documents said STOP, planning documents said GO.

The Executive Stage-Gate Review Board issued decision STAGE-GATE-001 (GO WITH CONDITIONS) on 2026-07-30, authorizing implementation to begin.

#### Decision

**Phase 0 gate conditions are waived for engineering implementation.** The founder authorizes engineering teams to begin building all FC-01 through FC-07 product features as defined in the STAYOS_IMPLEMENTATION_BASELINE.md. The original Phase 0 requirement (10 transactions + 80 interviews) is reclassified as a commercial validation milestone, not a code freeze gate.

Rationale: The backend implementation is 70% complete. Stopping engineering now creates technical debt accumulation and team disengagement with no compensating risk reduction. Commercial validation proceeds in parallel with engineering — the two are not sequential.

#### Alternatives Considered

- **Enforce Phase 0 gate:** Rejected. The gate was designed to prevent premature product investment; the investment has already been made by the engineering work completed in prior sessions. Enforcing the gate retroactively prevents completion of work already in progress.
- **Partial authorization (backend only):** Rejected. The Executive Stage-Gate Board authorized all tracks except Mobile (which is blocked on framework decision). Partial authorization creates unnecessary confusion.

#### Consequences

- All engineering tracks (Backend, Frontend, Infrastructure, QA) are authorized to begin immediately.
- Mobile track remains blocked until ADR-016 (mobile framework decision) is committed — see DEC-014.
- Phase 0 commercial validation (customer interviews, transactions) continues independently.
- CLAUDE.md phase gate rules are superseded by this decision for all `src/` application code.

#### Related Decisions

- DEC-012: Email provider (AWS SES)
- DEC-013: Analytics provider (deferred to Sprint 1)
- DEC-014: Mobile framework (pending)
- DEC-015: Stripe scope

---

### DEC-012: Email Provider — AWS SES

**Status**: Accepted
**Date**: 2026-07-30
**Decision Maker**: Backend Lead (proposed) — Founder (approved)
**Urgency**: IMMEDIATE
**Reversibility**: MEDIUM

#### Decision

AWS SES is the email provider. Rationale: consistent with existing AWS infrastructure, avoids additional vendor relationships, SES SMTP/API is well-supported by boto3 which is already a dependency.

**Configuration:** `SES_FROM_EMAIL=noreply@stayos.com`, region follows confirmed AWS deployment region. Domain verification required (Task E-07, Phase B).

#### Related Decisions

DEC-011

---

### DEC-014: Messaging Transport — SSE + Redis Pub/Sub (Per ADR-008)

**Status**: Accepted
**Date**: 2026-07-30
**Decision Maker**: TPM (recorded) — confirmed per ADR-008
**Urgency**: Sprint 5 design
**Reversibility**: MEDIUM

#### Decision

Messaging (Guest↔Host real-time chat) uses SSE (Server-Sent Events) with Redis pub/sub for fan-out, consistent with ADR-008. WebSocket was evaluated and rejected in ADR-008; that decision stands. The messaging module is Sprint 6 scope. This decision closes the open messaging transport question so Sprint 5-6 design begins without reopening it.

---

### DEC-015: Stripe Scope — International Cards Only

**Status**: Accepted
**Date**: 2026-07-30
**Decision Maker**: Backend Lead (drafted) — Founder (approved per ADR-003)
**Urgency**: Sprint 3 Finance clarity
**Reversibility**: MEDIUM

#### Decision

Stripe handles: Visa, Mastercard, Apple Pay, Google Pay (international cards only).
Paymob handles: all Egyptian rails — Fawry, Meeza, Vodafone Cash, InstaPay, EGP Visa/MC.

This is a restatement of ADR-003. The Finance team begins Sprint 3 with this mandate. No Stripe for Egyptian domestic payments. No Paymob for non-EGP international cards.

---

### DEC-016: Sprint 3 Re-scoped to Supply Enablement & Closed Alpha Preparation

**Status**: Accepted
**Date**: 2026-07-30
**Decision Maker**: Executive Product & Engineering Review Board
**Urgency**: IMMEDIATE
**Reversibility**: MEDIUM

#### Context

Sprint 3 planning was split between "Booking Flow Web + Mobile, Host Listings" and "Payments + Notifications + Launch." Both versions under-weighted the marketplace's most critical precondition: verified rental inventory. The executive review identified that the backend is strong, the frontend is minimal, and the largest business risk is supply. A marketplace cannot launch, accept payments, or retain guests without dense, verified listings.

#### Decision

Sprint 3 is re-scoped to **"Supply Enablement & Closed Alpha Preparation."** The sprint will prioritize host onboarding, listing photo upload, admin listing-claim/import, KYC review UI, map-based search, and payment checkout — in that order. Public launch is deferred until a closed alpha in Cairo/Alexandria reaches 50–100 live listings and 10 manual transactions.

#### Alternatives Considered

- **Keep original Sprint 3 (Payments + Notifications + Launch)** — Rejected. Would deliver polished booking features with insufficient inventory to book.
- **Stop all engineering until Phase 0 is completed** — Rejected. The existing foundation can be hardened for supply acquisition while Phase 0 runs in parallel.
- **Build native mobile first** — Rejected. Web is sufficient and faster for the closed alpha.

#### Rationale

Two-sided marketplaces must solve supply before demand. The engineering team has built a strong foundation; the next marginal effort must create inventory. Photo upload, host onboarding, and admin seeding are hard blockers. Payment and notification polish can follow once listings exist.

#### Consequences

- **Positive**: Engineering effort aligns with marketplace cold-start reality; closed alpha becomes achievable.
- **Negative**: Some payment and notification features slip out of Sprint 3.
- **Neutral**: Mobile, AI pricing, and field operations remain deferred.

#### Related Decisions

- DEC-001: StayOS is an accommodation marketplace.
- DEC-002: Egypt as proof-of-concept market.
- DEC-015: Stripe / Paymob scope.

---

### DEC-017: Public Launch Deferred Until Closed Alpha Succeeds

**Status**: Accepted
**Date**: 2026-07-30
**Decision Maker**: Executive Product & Engineering Review Board
**Urgency**: IMMEDIATE
**Reversibility**: MEDIUM

#### Context

The product is technically a strong alpha but not ready for public launch. The frontend lacks host onboarding, payment checkout, and maps. Supply cannot be created at scale. Phase 0 customer validation has not been completed.

#### Decision

StayOS will not launch publicly in Sprint 3. It will run a **closed alpha** in one or two Egyptian cities (Cairo and/or Alexandria) with 50–100 hand-onboarded, verified listings and 10 manual transactions. Public launch is gated by alpha success metrics.

#### Alternatives Considered

- **Soft public launch with current feature set** — Rejected. Empty search and broken supply funnel would damage brand and waste marketing spend.
- **Launch only to founder network** — Partially accepted. This is the definition of the closed alpha.

#### Rationale

Launching a marketplace without supply density and validated transactions is high-risk. A closed alpha allows the team to learn, iterate, and prove the host/guest loop with a small, controlled cohort before marketing spend.

#### Consequences

- **Positive**: Lower burn, higher learning velocity, stronger launch later.
- **Negative**: Revenue and public traction delayed.
- **Neutral**: Engineering focus shifts from "launch" to "alpha readiness."

#### Related Decisions

- DEC-016: Sprint 3 re-scope.

---

### DEC-018: Mobile, AI Pricing, Field Operations, and Channel Managers Postponed

**Status**: Accepted
**Date**: 2026-07-30
**Decision Maker**: Executive Product & Engineering Review Board
**Urgency**: PRE-LAUNCH
**Reversibility**: HIGH

#### Context

The roadmap and backlog contain advanced features (native iOS/Android, AI pricing/matching, field operations/turnover tickets, channel manager sync) that are not required to launch the closed alpha.

#### Decision

The following items are formally postponed beyond Sprint 3:

- Native iOS/Android app — until after product-market fit (100+ bookings).
- AI-powered pricing and matching — until 1,000+ listings and 50K+ transactions.
- Field operations / turnover tickets — until 50+ active units.
- Channel manager sync (Airbnb/Booking.com) — remains "Never" per existing strategy.
- Real-time messaging — until Sprint 5/6, email/WhatsApp sufficient for alpha.

#### Alternatives Considered

- **Build mobile in parallel with web** — Rejected. Doubles engineering cost and slows alpha.
- **Build AI pricing now** — Rejected. No transaction data to train models.

#### Rationale

These features are scale problems, not launch problems. Resources should be concentrated on the supply bottleneck and the minimum booking loop.

#### Consequences

- **Positive**: Faster alpha, lower burn, clearer priorities.
- **Negative**: Longer path to full feature parity with global OTAs.
- **Neutral**: PWA/mobile-responsive web remains the target for the closed alpha.

#### Related Decisions

- DEC-016: Sprint 3 re-scope.
- DEC-017: Closed alpha before public launch.

---

### DEC-019: Structured Listing Discovery Attributes (Pets, Self Check-in, Accessibility, Host Languages) Added to Scope

**Status**: Accepted
**Date**: 2026-09-13
**Decision Maker**: Founder
**Urgency**: PRE-LAUNCH
**Reversibility**: MEDIUM

#### Context

Airbnb is the sole external product benchmark for StayOS. A forensic Airbnb benchmark reconciliation found four documented Airbnb discovery/filter capabilities with no StayOS representation and no prior scope entry in `docs/MVP_SLICE.md`, `docs/02_product/MVP_FREEZE.md`, `FEATURE_CATALOG.md`, or `BUSINESS_RULES.md`: pet allowance, self check-in, accessibility features, and host languages. Because they were undocumented, `AGENTS.md` §2.2 prohibited implementing them without an explicit decision.

#### Decision

All four attributes are added to scope now as structured data (not free-text amenity tags):

- **Pets** — listing-level boolean pet allowance.
- **Self check-in** — listing-level boolean.
- **Accessibility** — a deliberately small fixed vocabulary of five step/entrance/bathroom features. `ELEVATOR` is intentionally excluded because it already exists in the `amenities` vocabulary (no duplicate fields).
- **Host languages** — host-level list of ISO 639-1 codes from a fixed MENA-inbound-relevant set.

Each attribute is exposed through host listing/profile configuration, a search filter, and listing detail display.

#### Alternatives Considered

- **Defer all four (B2)** — Rejected. They are demonstrated Airbnb capabilities, so absence is a real benchmark gap, not missing nice-to-haves.
- **Pets + self check-in only** — Rejected. Partial coverage leaves an acknowledged benchmark gap.
- **Encode them in the existing free-text `amenities` array** — Rejected. `amenities` is an unvalidated string array, which cannot support reliable filtering or validation.

#### Rationale

The target is Airbnb 1:1 behavioral/product-depth equivalence. These are established Airbnb discovery filters, and the existing `UnitListing`/`User` models plus the existing array-overlap filter pattern already used for `amenities` and `cultural_tags` support them without new business rules.

#### Consequences

- **Positive**: Closes four confirmed Airbnb discovery gaps; structured data enables correct filtering and validation.
- **Negative**: Adds two Alembic migrations and widens listing/host forms; extends scope beyond the frozen MVP baseline.
- **Neutral**: No change to booking, pricing, payment, refund, or review behavior. Decision A (Request-to-Book only) and Decision C (core reviews) remain unchanged.

#### Related Decisions

- DEC-018: Postponed scale features (Instant Book remains V1.5 per `docs/MVP_SLICE.md`).

---

### DEC-020: VAT 14% Inside Platform Share + Instant Book as Default Booking Mode

**Status**: Accepted
**Date**: 2026-10-02
**Decision Maker**: Founder
**Urgency**: PRE-LAUNCH
**Reversibility**: HIGH

#### Context

The consolidated product-completion pass surfaced two product gaps that required explicit founder direction: (1) VAT was not represented anywhere in the canonical commercial engine or ledger, and (2) the default booking flow routed guests through a "request then wait for host approval" step even for available inventory.

#### Decision

1. **VAT**: The StayOS configured VAT rate is 14%, treated as a platform-service tax component carved out of the VAT-inclusive 12% platform share. The guest-facing all-inclusive total is unchanged; the host net is unchanged (`host_net = guest_total − platform_share`). Ledger postings split the platform share into `platform_revenue` (net) and `vat_payable` (liability) at escrow release and on retained cancellation fees. The VAT component is persisted on the payment row (`payments.vat_egp`) and visible to admin/staff only. No legal/tax claims are made in product copy — the guest disclosure is simply "Includes all fees and VAT".
2. **Instant Book default**: New listings default to `instant_book = true` — available inventory goes straight from quote to checkout/payment with no host-approval wait. The host toggle remains so a listing can still opt into request-to-book. Existing listings keep their explicit flag (no data rewrite).

#### Rationale

- VAT inside the platform share is the only placement consistent with FD-19 (fixed all-inclusive guest total, `host_net = total − share`). Adding VAT on top would change the guest price; taking it from the host would change host economics.
- Instant-book-as-default matches the founder's stated booking direction and Airbnb's own new-listing default while preserving the documented host opt-out (benchmark rows BK-02/HOST-08).

#### Consequences

- **Positive**: VAT is a first-class, ledger-consistent financial component; the normal booking path is Search → Listing → dates → quote → checkout → pay → confirmed.
- **Negative**: None for guests/hosts. Admin earnings now exposes a VAT card and drill-down; historical ledger entries remain as recorded (not rewritten).
- **Neutral**: Request-to-book continues to exist for listings where the host opts out.

---

### DEC-021: VAT 14% Is a Separate Tax on the Taxable Booking Amount — Supersedes DEC-020 §1

**Status**: Superseded by DEC-023 (taxable base redefined to include both 6% allocations; the VAT-as-separate-liability principle is retained)
**Date**: 2026-10-24
**Decision Maker**: Founder
**Urgency**: PRE-LAUNCH
**Reversibility**: HIGH

#### Context

DEC-020 §1 modeled VAT as a component carved out of the VAT-inclusive 12% platform share: guest total and host net were unchanged, and `platform_share = platform_revenue + vat`. The Founder has corrected this: VAT is a **separate tax** added to the taxable booking amount, not a slice of StayOS economics.

#### Decision

1. **Taxable base**: `taxable_booking_amount = accommodation + cleaning` after applicable booking/listing discounts. No other tax base is introduced.
2. **VAT**: `vat_egp = taxable_booking_amount × 14%`. VAT is added to the guest payable total: `guest_total = taxable + vat`.
3. **Independence**: The StayOS 12% commercial/service share is computed on its existing canonical base and is **not** reduced by, inclusive of, or otherwise conflated with VAT. VAT is not StayOS revenue and not host earnings.
4. **Ledger**: `VAT_PAYABLE` receives the full VAT amount at escrow release / retained-fee recognition. `PLATFORM_REVENUE` contains only the StayOS commercial share. `HOST_PAYABLE` contains host economics only. `guest_total = host_payable + vat_payable + platform_revenue`.
5. **Refunds**: VAT follows the underlying taxable amount through the existing provider-authoritative refund lifecycle — proportional on partial refunds, fully reversed on full refunds, liability-held until provider confirmation.
6. **Alpha waiver**: The alpha free-bookings waiver removes only the StayOS commercial share. VAT still applies to the taxable booking amount on waived bookings.
7. **Custom offers**: A custom offer total is a VAT-inclusive final guest price; the taxable amount and VAT are back-derived at the configured rate.
8. **History**: Historical payment rows and ledger postings are not rewritten; `payments.vat_egp` stays NULL on pre-VAT rows.
9. DEC-020 §2 (Instant Book default) is unchanged.

#### Rationale

- VAT is a tax liability owed to the tax authority, not a revenue component; conflating it with the platform share misstates both revenue and liability.
- The guest price must show the tax transparently (subtotal + VAT + total); host economics must never be inflated by tax collected on the booking.

#### Consequences

- **Positive**: VAT, platform revenue, host earnings, escrow, and refunds are five cleanly separated concepts; reconciliation `guest_total = host + VAT + share` holds exactly.
- **Negative**: Guest payable totals rise by 14% over the taxable amount versus the prior carve-out display (which left totals unchanged). This is the intended correction.
- **Neutral**: Paymob amounts change only by the now-included VAT; payout/escrow timing, cancellation rules, discount rules, and the 12% rate are unchanged.

#### Related Decisions

- DEC-020: superseded in §1 (VAT placement); §2 (Instant Book default) remains in force.
- FD-19 / DEC-018-era commercial model: the 12% share, internal 6%+6% allocation, and discount rules are unchanged.

---

### DEC-022: Destination Search Resolution, Instant Book Backfill, and Guest Checkout Breakdown

**Status**: Accepted
**Date**: 2026-10-03
**Decision Maker**: Founder (product-completion batch)
**Urgency**: PRE-LAUNCH
**Reversibility**: HIGH

#### Context

Live verification found that free-text destination search ("Alexandria", "اسكندرية", "Alex") returned zero results: `location_aliases` only seeded neighbourhood-level entries (Cairo areas in 022, Alexandria/Red Sea/Sinai areas in 039) with no city-level rows, and the `q` parameter only ran full-text search on `search_vector` (titles/descriptions) — never the unit's structured `city`/`governorate`.

#### Decision

1. **Location-aware free-text search**: When `q` is present, search matches listings whose `search_vector` matches OR whose unit `city`/`governorate` equals the query OR which resolve through `pms.location_aliases`. City/governorate-level aliases (canonical name equals the city or governorate) match by location equality; neighbourhood-level aliases match by a 5 km coordinate radius so a district query does not widen to the whole city. Arabic normalization (alef/ya/ta-marbuta unification) applies on lookup, matching the autocomplete semantics.
2. **Alias data**: City- and governorate-level canonical aliases are seeded for the Egyptian destinations already represented in the taxonomy (Alexandria, Cairo, Giza, Hurghada, Sharm El Sheikh, North Coast, Luxor, Aswan, Port Said, Suez, Marsa Alam, Fayoum, Nuweiba, Taba, Ras Sedr, Damietta, El Alamein, Red Sea, South Sinai, Matrouh) plus missing Alexandria areas (Agami, Sidi Bishr, Borg El Arab) and Ain Sokhna — migration `047`.
3. **Instant Book for live inventory**: Every unit with status `LISTED` is backfilled to `instant_book = true` (migration `047`). DEC-020 §2 made Instant Book the default for new listings only; this extends it to all live inventory. Non-live units keep their flag. The host toggle continues to exist for non-live states; request-to-book is removed for live listings.
4. **Guest payment breakdown**: The guest-facing payment/checkout view exposes the guest's own booking components — accommodation, cleaning, VAT, total — while `guest_service_fee_egp` and other internal economics stay staff-gated (`include_breakdown`). This formalizes the FD-19 summary lines on the checkout page.
5. **Header**: The global header collapses to a compact marketplace header (logo, Search, Support, language, account menu). All role-scoped destinations (trips, favorites, payments, host dashboard, listings, earnings, admin) live in the account menu with unread/pending badges aggregated onto the avatar.
6. **Host surfaces**: Payout preference editing (FD-26 collection fields) is exposed on host profile via `PATCH /auth/me/account`; listing/weekly/monthly discount percentages (FD-08/FD-20) are editable in the listing form pricing section.

#### Rationale

- Destination names are the primary way guests search; structured location fields must back the free-text query — title text is not a location index.
- Instant Book for all live listings removes the request-and-wait step from the only bookable inventory (FD booking direction, DEC-020 §2).
- The guest must see what they pay for (accommodation, cleaning, VAT) without seeing StayOS economics.

#### Consequences

- **Positive**: "Alexandria"/"اسكندرية" and transliterations resolve to real inventory; checkout matches the quote breakdown; header is role-clean.
- **Negative**: Legacy payment rows created before the amount-split columns existed show no accommodation/cleaning lines (fields are NULL and hidden rather than back-computed).
- **Neutral**: `guest_service_fee_egp` remains an internal field; no pricing formulas changed.

#### Related Decisions

- DEC-020 §2 / DEC-021: Instant Book default extended to live rows; VAT visibility unchanged.
- FD-19: guest pricing summary components.
- FD-26: host payout preference collection.
- DEC-023: supersedes §4 guest checkout breakdown — the guest view is now a single all-inclusive Accommodation = Total line; cleaning/VAT stay internal.

---

### DEC-023: Additive 12% Commercial Model — All-Inclusive Guest Price Is the Only Price the Guest Sees

**Status**: Accepted
**Date**: 2026-09-25
**Decision Maker**: Founder
**Urgency**: PRE-LAUNCH
**Reversibility**: HIGH

#### Context

DEC-021 placed VAT on `accommodation + cleaning` while the 12% StayOS economics were carved out of the same taxable amount. The Founder has issued a final commercial model that changes both the placement of the platform economics and the VAT taxable base, and hardens the guest-facing "the price you see is the price you pay" rule.

#### Decision

1. **Additive economics**: StayOS economics total 12% of the accommodation amount, allocated 6% host-side + 6% guest-side. The allocations are added ON TOP of the host's price — the host is payable the full `accommodation + cleaning` they listed; the 12% is never deducted from the host payable and never deducted twice.
2. **Taxable base** (supersedes DEC-021 §1): `taxable = accommodation + cleaning + host_side_6% + guest_side_6%` — after applicable booking/listing discounts. Both allocations are inside the VAT base.
3. **VAT**: `vat = taxable × 14%`, added on top: `guest_total = taxable + vat`. VAT remains a separate tax liability — it is not host revenue, not StayOS revenue, and is never waived by the alpha waiver.
4. **Ledger**: three separate economic destinations — `HOST_PAYABLE = accommodation + cleaning`, `PLATFORM_REVENUE = host_6% + guest_6%`, `VAT_PAYABLE = vat`. Invariant: `guest_total = host_payable + stayos_revenue + vat_payable`.
5. **Canonical example**: accommodation 3,000 + cleaning 200 + 180 + 180 = taxable 3,560; VAT 498.40; guest total 4,058.40 = host 3,200 + StayOS 360 + VAT 498.40.
6. **Guest surfaces**: exactly one Accommodation figure equal to the final all-inclusive total plus "Prices include all fees" — identical from search through Paymob. No cleaning, VAT, service-fee, 6% or 12% line items are shown to guests (supersedes DEC-022 §4).
7. **Money representation**: all commercial amounts are `Numeric(12,2)` Decimal at 2dp (migration `049`); Paymob converts the exact final amount to minor units (4,058.40 → 405,840) with no integer truncation.
8. **Alpha waiver**: the guest charge is unchanged; StayOS revenue becomes zero and the collected 12% allocation accrues to the host (host payable = full taxable amount). VAT is never waived.
9. **History**: rows priced under the containment model are not rewritten; the ledger resolver detects them by the missing additive gap and reconciles them under the economics actually charged.

#### Rationale

- The host must keep their full listed price; the platform economics are a markup the guest pays, not a carve-out of host earnings.
- VAT applies to the full taxable amount including the commercial allocations, matching the final approved tax treatment.
- A single all-inclusive price across discovery → checkout → payment eliminates checkout price surprises entirely.

#### Consequences

- **Positive**: host economics are transparent (payable = accom + cleaning); VAT, revenue, and host payable are three cleanly separated ledger destinations; the guest price is constant across every surface.
- **Negative**: guest totals rise versus the containment model (the 12% is added on top rather than absorbed). This is the intended correction.
- **Neutral**: Paymob amounts change by the now-included additive share; payout/escrow timing, cancellation rules, discount rules, and the 12%/6%+6% rates are unchanged.

#### Related Decisions

- DEC-021: superseded (taxable base and economics placement); its principle that VAT is a separate liability on a defined base is retained.
- DEC-022 §4: superseded — guest breakdown is now Accommodation = Total only.
- DEC-020 §2: Instant Book default remains in force.
- FD-19: guest pricing summary — now a single all-inclusive line.
