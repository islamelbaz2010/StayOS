<!-- tokens: 3983 / budget 5000 -->

# Decisions

## Current Entries

### StayOS Is an Accommodation Marketplace, Not a Computer OS

**Decision:** StayOS is an AI-powered, two-sided accommodation marketplace for the MENA region. "OS" is a business metaphor: StayOS is the operating system of accommodation — the intelligence layer, trust infrastructure, and coordination platform that makes the MENA accommodation market work. StayOS does not build computer software at the OS level. It builds a marketplace platform.

**Context:**
The name "StayOS" contains "OS," which could be interpreted as a reference to a computer operating system. Early project documentation was mistakenly framed around technology-first product development rather than the accommodation marketplace it is building. This confusion needed to be formally resolved before any external stakeholder communication.

**Alternatives considered:**
- **Rename the company**: Considered renaming to remove the "OS" ambiguity. Rejected — the "OS" positioning is strategically valuable and differentiating. - **Accept the confusion**: Rejected — confusion about what the company builds undermines investor, co-founder, and partner conversations.

**Consequence:**
- **Positive**: All documentation, hiring, investor conversations, and product decisions are grounded in the accommodation marketplace definition. - **Negative**: Requires explicit clarification in all early conversations ("OS means accommodation operating system, not a computer OS"). - **Neutral**: The name remains StayOS; the OS metaphor is retained.

**Status:** `accepted`
**Date:** 2026-07-13
**Confidence:** 🟢 High
**Source:** `DECISION_LOG.md`

---

### Egypt as Proof-of-Concept Market, GCC as the Business

**Decision:** Egypt is the proof-of-concept market. The Egypt–GCC travel corridor is the primary business. Every decision — legal structure, payment infrastructure, product language, trust standards — must support regional expansion from Day 1. Egypt is never the destination; it is the launch pad.

**Context:**
Egypt is a viable entry market but insufficient for a venture-scale outcome. At 10% take rate and 10% market share of the Egyptian online accommodation market ($200M–$400M TAM), maximum Egypt revenue = $20M–$40M/year. This is below the threshold for a significant exit. The largest inbound travel segment to Egypt is Gulf nationals (Saudi, UAE, Qatari, Kuwaiti) who are also the highest-value customers.

**Alternatives considered:**
- **Egypt-only**: Simplifies Phase 0 focus. Rejected — not a venture-scale outcome. - **GCC-first**: Higher-value market but unknown regulatory landscape, no founder relationships, no supply network. Rejected for Phase 0. - **Egypt + GCC simultaneously**: Resources and focus insufficient at Phase 0 and Phase 1. Rejected.

**Consequence:**
- **Positive**: Business model is designed for regional scale from the start; investor narrative is stronger. - **Negative**: Increases Phase 0 complexity (must interview GCC travelers, not just Egyptian domestic travelers). - **Neutral**: Phase 0 is still Egypt-based; GCC expansion is Phase 3.

**Status:** `accepted`
**Date:** 2026-07-13
**Confidence:** 🟢 High
**Source:** `DECISION_LOG.md`

---

### Arabic-First UX, Not Arabic-Translated UX

**Decision:** StayOS is built Arabic-first: RTL layout is the primary layout, Arabic is the primary language, culturally appropriate property filters (halal-certified, family-only, mixed) are built from the start, and customer support operates in Arabic as the first language, not a secondary option.

**Context:**
Global OTAs (Booking.com, Airbnb) are English-first platforms translated into Arabic. Arabic translation is different from Arabic-native design. Translation produces awkward UX, incorrect RTL formatting, missing cultural context, and customer support that cannot actually help Arabic-speaking guests. This is a known weakness of all global competitors.

**Alternatives considered:**
- **English-first with Arabic translation**: Faster to build; appeals to expat and international traveler segment. Rejected — abandons the core differentiation and primary customer segment. - **Bilingual equal priority**: More complex to maintain. Evaluated — may be appropriate for Phase 2 when GCC and international segments grow.

**Consequence:**
- **Positive**: Strong differentiation; no global OTA can easily replicate an Arabic-first design without full product rebuild. - **Negative**: Slower development; Arabic RTL increases complexity of UI engineering. - **Neutral**: English support added in Phase 2 when international traveler segment reaches meaningful size.

**Status:** `accepted`
**Date:** 2026-07-13
**Confidence:** 🟢 High
**Source:** `DECISION_LOG.md`

---

### Local Payment Infrastructure as Core Capability, Not Integration

**Decision:** StayOS integrates all Egyptian payment rails as a core product requirement, not as optional payment methods. Every Egyptian must be able to pay. Fawry, Meeza, Vodafone Cash, InstaPay, and bank transfer are P0 requirements for Phase 1. Paymob is the primary integration partner (supports multiple rails through a single API).

**Context:**
Egypt's payment landscape is fragmented: Fawry (cash and digital), Vodafone Cash, Orange Money, Meeza cards, InstaPay, bank transfer, and cash. Approximately 40% of Egyptians are unbanked or card-averse. Global OTAs require Visa/Mastercard, which excludes a large portion of the Egyptian market. This payment gap is a structural blocker to online accommodation booking in Egypt.

**Alternatives considered:**
- **Card-only (Stripe/Paymob card)**: Fastest to integrate, covers GCC travelers. Rejected — excludes the majority of Egyptian guests. - **Paymob only**: Covers most rails through one integration. Accepted as primary strategy. - **Cash on arrival**: Familiar to Egyptian market but unscalable and trust-unsafe. Rejected as primary — acceptable as backup for specific property types in Phase 1.

**Consequence:**
- **Positive**: Full market access; no guest excluded by payment method. - **Negative**: Integration complexity; compliance requirements per payment method. - **Neutral**: Paymob handles most complexity through unified API; not building from scratch.

**Status:** `accepted`
**Date:** 2026-07-13
**Confidence:** 🟢 High
**Source:** `DECISION_LOG.md`

---

### B2B2C Supply Strategy — Hotels and Property Managers First

**Decision:** StayOS uses a B2B2C supply acquisition strategy: hotel chains and resort operators first (SaaS channel management + OTA distribution), then property managers (portfolio management tools), then individual hosts. Supply comes primarily from B2B relationships. B2C individual hosts are a secondary supply channel, not the primary.

**Context:**
Pure consumer-to-consumer marketplace supply (individual hosts listing their own apartments) is the hardest supply acquisition strategy. Individual hosts require significant education, trust-building, and operational support. Hotel chains and property managers, by contrast, have existing inventory, operational infrastructure, and clear business motivation to distribute across additional channels.

**Alternatives considered:**
- **Consumer-first (individual hosts)**: Higher trust signals, authentic product. Rejected as primary — too slow for Phase 0 listing targets. - **Hotel-only**: Sufficient supply, but misses the short-term rental segment that is the product's differentiation. - **B2B2C (selected)**: Builds supply quickly through institutional relationships while retaining individual host onboarding for the long term.

**Consequence:**
- **Positive**: Faster supply acquisition; institutional partners bring operational credibility. - **Negative**: B2B sales cycle is longer; institutional partners may demand lower commission rates. - **Neutral**: Individual host onboarding continues in parallel as a secondary supply channel.

**Status:** `accepted`
**Date:** 2026-07-13
**Confidence:** 🟢 High
**Source:** `DECISION_LOG.md`

---

### Trust Before Scale — No Shortcuts on Verification

**Decision:** No listing goes live without identity verification (national ID or passport) and physical property verification (video tour minimum, on-site visit where possible). No booking completes without escrow payment protection. No launch happens without a documented dispute resolution process. Trust standards, once set, are never lowered.

**Context:**
The Egyptian accommodation market suffers from deep trust deficits: listings may not exist, hosts may not be who they claim, properties may not match photos, payments may not be refunded. The Phase -1 panel identified trust infrastructure as the single most important capability StayOS must build before it can acquire its first guest.

**Alternatives considered:**
- **Light verification (self-reported)**: Faster to scale supply. Rejected — recreates the trust problem StayOS exists to solve. - **Verification only at scale**: Start unverified, add verification later. Rejected — trust damage from early incidents is permanent. - **Third-party verification service**: Explore integration with identity verification APIs. Evaluated — acceptable as supplementary tool alongside StayOS verification process.

**Consequence:**
- **Positive**: Strong brand differentiation; genuine competitive moat; lower dispute and fraud rates. - **Negative**: Supply acquisition is slower; verification adds cost and time to host onboarding. - **Neutral**: Verification cost modeled into host acquisition cost; acceptable at Phase 0 volumes.

**Status:** `accepted`
**Date:** 2026-07-13
**Confidence:** 🟢 High
**Source:** `DECISION_LOG.md`

---

### Manual Operations in Phase 0 — No Platform Until Validated

**Decision:** Phase 0 operates entirely on manual tools: WhatsApp for communication, Google Sheets for inventory and booking management, InstaPay or bank transfer for payments, and in-person or video-call for property verification. No marketplace platform is built in Phase 0. The platform build begins only after Phase 0 gates are cleared.

**Context:**
The Phase -1 panel's most critical finding: "Technology does not come before customers." Building a marketplace platform before validating that guests and hosts will use it has destroyed more accommodation startups than any other single mistake. Phase 0 requires proving willingness to pay, not proving technology.

**Alternatives considered:**
- **Build MVP simultaneously**: Faster to Phase 1. Rejected — building before validating destroys capital and time. - **Build landing page only**: Low-commitment technology to capture demand signal. Acceptable as supplementary tool during Phase 0. - **Full manual (selected)**: Forces direct customer contact, reveals actual friction points, avoids premature optimization.

**Consequence:**
- **Positive**: Low cost; high learning velocity; forces founder to engage directly with every customer. - **Negative**: Not scalable past 20–30 bookings; cannot support more than 3–5 listings manually. - **Neutral**: Phase 0 is scoped to 10 transactions — manual operations are sufficient.

**Status:** `accepted`
**Date:** 2026-07-13
**Confidence:** 🟢 High
**Source:** `DECISION_LOG.md`

---

### AI Is a Roadmap, Not a Launch Claim

**Decision:** AI features are built in sequence, tied to data availability: - **Phase 0**: Zero AI. Manual operations. Data collection begins. - **Phase 1**: Rule-based recommendations only. Basic pricing guidance from market data. - **Phase 2**: ML-powered dynamic pricing recommendations for hosts (50K+ transaction data required). - **Phase 3+**: Demand forecasting, personalized search, fraud detection (500K+ transaction data required). The "AI-powered" positioning is aspirational positioning that will be …

**Context:**
StayOS is positioned as "AI-powered." The Phase -1 panel's finding: "The AI narrative is premature. There is no AI value without data. There is no data without users. There are no users without listings. There are no listings without trust." Launching with "AI-powered" positioning before having AI is dishonest and credibility-destroying.

**Alternatives considered:**
- **Launch with AI positioning + rule-based tools labeled as "AI"**: Common industry practice. Rejected — misleading to guests, hosts, and investors who understand the difference. - **No AI positioning at all**: Loses a genuine long-term competitive advantage. Rejected. - **Roadmap approach (selected)**: Honest positioning that becomes more powerful as data accumulates.

**Consequence:**
- **Positive**: Credibility with sophisticated investors and partners; avoids the "AI washing" trap. - **Negative**: Less exciting early pitch; requires patience with the AI narrative. - **Neutral**: AI roadmap is explicitly defined; feature gating by data volume prevents premature build.

**Status:** `accepted`
**Date:** 2026-07-13
**Confidence:** 🟢 High
**Source:** `DECISION_LOG.md`

---

### WhatsApp as Primary Communication Infrastructure

**Decision:** WhatsApp is the primary communication channel for all guest–host interaction, booking notifications, check-in instructions, and customer support. Phase 0 manual operations run entirely through WhatsApp. Phase 1 integrates WhatsApp Business API for automated notifications and support escalation. Platform-native messaging is supplementary, not primary.

**Context:**
Egyptian property owners and guests communicate through WhatsApp — not email, not in-app chat, not SMS. WhatsApp penetration in Egypt is near-universal. Research consistently shows that accommodation inquiries, booking negotiations, check-in instructions, and support requests in the Egyptian market happen on WhatsApp, not through OTA messaging systems.

**Alternatives considered:**
- **Email-first**: Familiar for international guests. Rejected as primary — low open rates with Egyptian and GCC users for transactional messages. - **In-app messaging only**: Best for platform experience. Rejected as primary for Phase 0 (no platform) and Phase 1 (guests prefer WhatsApp). - **WhatsApp-first (selected)**: Meets users where they already are; reduces communication friction to zero.

**Consequence:**
- **Positive**: Instant adoption; zero communication friction; works in Phase 0 without any platform. - **Negative**: Dependency on Meta's WhatsApp Business API; API access may take 4–8 weeks. - **Neutral**: WhatsApp Business API applied for in Task T0.1-P02.

**Status:** `accepted`
**Date:** 2026-07-13
**Confidence:** 🟢 High
**Source:** `DECISION_LOG.md`

---

### Database Strategy

**Decision:** PostgreSQL 16+ on AWS RDS Multi-AZ.

**Context:**
`ENGINEERING_RULES.md` §7: "Do not introduce a second relational database without an ADR." PostgreSQL with read replicas is sufficient for Phase 1–2 scale. Analytics/reporting: Export to CSV for Phase 1; consider ClickHouse or BigQuery at Phase 3 when booking volume requires real-time analytics dashboards.

**Alternatives considered:**
_Not stated in source._

**Consequence:**
_Not stated in source._

**Status:** `accepted`
**Date:** 2026-07-13
**Confidence:** 🟡 Medium
**Source:** `docs/architecture/adr/ADR-005-database-strategy.md`

---

### Notification Architecture

**Decision:** **WhatsApp Business API (primary) + AWS SES email (secondary) + Twilio (OTP only) + Firebase Cloud Messaging (in-app push)** All notification dispatch is **asynchronous** — dispatched via Celery tasks (ADR-012), never blocking the primary request path. ---

**Context:**
WhatsApp replaces SMS for transactional notifications. Using SMS for notifications alongside WhatsApp creates duplicate channels and cost. OTP via SMS is required for phone number verification regardless of WhatsApp availability.

**Alternatives considered:**
_Not stated in source._

**Consequence:**
_Not stated in source._

**Status:** `accepted`
**Date:** 2026-07-13
**Confidence:** 🟡 Medium
**Source:** `docs/architecture/adr/ADR-011-notification-architecture.md`

---
