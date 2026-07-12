# STAYOS — 18: KEY DECISIONS
**Classification:** CONFIDENTIAL
**Date:** 2026-07-13
**Purpose:** Every strategic decision that must be made, when to make it, and how.
**Panel:** CEO, Chief Strategy Officer, Former Airbnb Director

---

## DECISION FRAMEWORK

Every decision below is categorized by:
- **Urgency:** IMMEDIATE (before any spending), PRE-LAUNCH (before product launch), POST-PMF (after proving product-market fit)
- **Reversibility:** HIGH (easy to change), MEDIUM (costly to change), LOW (very hard to change)
- **Decision owner:** Who makes this decision
- **Input required:** What evidence is needed before deciding

---

## DECISION CLUSTER 1: FOUNDATIONAL DECISIONS (IMMEDIATE)

### D01 — What Is the Founding Wedge?
**Decision:** Which specific problem, for which specific customer, in which specific geography?

**Options:**
A. GCC families visiting Egypt (North Coast/Red Sea luxury villas)
B. Corporate housing for multinationals in Cairo
C. B2B SaaS for Egyptian property managers
D. Egyptian domestic travelers (Cairo, Alexandria)

**Decision owner:** Founder (after customer interviews)
**Input required:** 50 customer interviews, 30 host interviews
**Urgency:** IMMEDIATE
**Reversibility:** MEDIUM (early pivot is possible; late pivot is costly)
**Deadline:** Day 30 of Phase -1

---

### D02 — Who Is the Co-Founder?
**Decision:** Solo founder, or co-founder? If co-founder, who?

**Options:**
A. Solo founder (high risk, all bets on one person)
B. Hospitality expert co-founder (operations DNA, Egyptian hotel relationships)
C. Tech co-founder (product and engineering depth)
D. GCC-connected co-founder (demand-side relationships)

**Decision owner:** Founder
**Input required:** Skills gap analysis, market assessment, personal strengths audit
**Urgency:** IMMEDIATE
**Reversibility:** LOW (co-founder relationships are very hard to unwind)
**Deadline:** Day 15

**Panel recommendation:** If the founder has deep Egyptian hospitality relationships and operational DNA: recruit a tech co-founder. If the founder has tech DNA: recruit a hospitality operator co-founder.

---

### D03 — What Is the Company Structure?
**Decision:** Egyptian LLC only, or Egyptian operating entity + offshore holding?

**Options:**
A. Egyptian LLC only (simpler, lower cost, limits foreign investment flexibility)
B. Cayman or BVI holding + Egyptian operating subsidiary (investor-friendly, more expensive)
C. DIFC (Dubai) holding + Egyptian subsidiary (GCC investor friendly)

**Decision owner:** CEO + legal counsel
**Input required:** Legal opinion on Egyptian tourism sector foreign ownership rules; investor appetite research
**Urgency:** IMMEDIATE
**Reversibility:** LOW (changing structure later is expensive)
**Deadline:** Day 14 (legal consultation scheduled)

---

### D04 — What Is the First Geography?
**Decision:** Which single location launches first?

**Options:**
A. Cairo (corporate housing, domestic leisure) — year-round, large market
B. North Coast (summer vacation villas for GCC) — seasonal but high-value
C. Red Sea (Sharm/Hurghada — year-round international tourism)
D. New Cairo / Maadi (expat housing) — niche but high-quality

**Decision owner:** CEO (after market research)
**Input required:** Market size research (MU-04, MU-11), host interview data
**Urgency:** IMMEDIATE
**Reversibility:** MEDIUM (can pivot geography but burns time)
**Deadline:** Day 21

**Panel preliminary view:** Red Sea (Hurghada + Sharm combined) has year-round international demand, existing tourist infrastructure, and diverse supply that North Coast lacks in winter. Strong second option.

---

### D05 — What Is the Business Model?
**Decision:** Commission marketplace, SaaS subscription, or hybrid?

**Options:**
A. Commission only: 10–15% from hosts, 0% from guests
B. Commission only: 5–8% from hosts + 3–5% from guests
C. SaaS first: monthly fee from property managers, no commission
D. Hybrid: low commission (6%) + premium SaaS features ($99/month)

**Decision owner:** CEO + CFO (after host interviews)
**Input required:** Host commission tolerance survey, unit economics modeling
**Urgency:** PRE-LAUNCH
**Reversibility:** HIGH in early stages, MEDIUM after launch
**Deadline:** Day 30

---

## DECISION CLUSTER 2: PRODUCT DECISIONS (PRE-LAUNCH)

### D06 — What Is the MVP Scope?
**Decision:** What is the absolute minimum product needed to process one real transaction?

**Minimum viable feature set:**
- Host listing creation (photos, description, price, availability)
- Guest search + filter + view listing
- Booking request + host confirmation
- Payment processing (EGP)
- Basic messaging between host and guest
- Review collection (post-checkout)

**Exclude from MVP (Phase 2+):**
- AI pricing
- Map search
- Activities bundling
- Corporate billing
- Multi-currency

**Decision owner:** CPO
**Input required:** 10 manual transactions (what did users actually need?)
**Urgency:** PRE-LAUNCH
**Reversibility:** HIGH
**Deadline:** After 10 manual transactions

---

### D07 — Web-First or App-First?
**Decision:** Build a web application (works on all devices, no app store) or native iOS+Android apps?

**Options:**
A. Progressive Web App (PWA) first — faster to build, no app store dependency
B. Native iOS + Android — better user experience, required by some users
C. Mobile web + Android only (iOS delayed) — pragmatic compromise

**Decision owner:** CTO + CPO
**Input required:** Egyptian mobile device distribution data; test with pilot users
**Urgency:** PRE-LAUNCH
**Reversibility:** MEDIUM (rebuilding is expensive)
**Deadline:** Day 21

**Panel preliminary view:** PWA or mobile web first. Native apps are a Year 2 investment. Egypt's market does not require native apps to achieve first $1M GMV.

---

### D08 — WhatsApp Integration Strategy
**Decision:** How deeply should WhatsApp be integrated into the platform?

**Options:**
A. WhatsApp as support channel only (reactive)
B. WhatsApp for host notifications + support
C. WhatsApp as primary booking channel (WhatsApp-native booking flow)
D. Full WhatsApp integration: discovery, booking, support, payments

**Decision owner:** CPO + CTO
**Input required:** WhatsApp usage data from pilot transactions; Egyptian user behavior research
**Urgency:** PRE-LAUNCH
**Reversibility:** HIGH
**Deadline:** Day 30

---

### D09 — AI Feature Roadmap
**Decision:** When do AI features get built, and which ones?

**Priority framework:**
- Phase 1 (0–50K transactions): NO AI features. Build manual tools. Collect data.
- Phase 2 (50K–500K transactions): AI pricing recommendations for hosts
- Phase 3 (500K+ transactions): Personalized search, demand forecasting, smart matching

**Decision owner:** CTO + CPO
**Input required:** Transaction data volume; data infrastructure readiness
**Urgency:** POST-PMF
**Reversibility:** HIGH (AI is additive, not foundational)
**Deadline:** Review at Month 12

---

### D10 — Trust Infrastructure Minimum Standard
**Decision:** What is the minimum trust standard before the first public booking?

**Non-negotiable minimum:**
- Host: national ID verified, video tour of property completed
- Property: photos verified against video tour
- Guest: national ID or passport verified
- Payment: held in escrow until 24h after check-in
- Support: Arabic WhatsApp available 7 days/week, 9am–midnight
- Dispute: documented resolution process with 48h response commitment

**Decision owner:** COO
**Input required:** Legal requirements (tourism authority, consumer protection)
**Urgency:** IMMEDIATE
**Reversibility:** LOW (trust standards, once set, must not be lowered)
**Deadline:** Day 14

---

## DECISION CLUSTER 3: MARKET & GROWTH DECISIONS (POST-PMF)

### D11 — When to Launch Second Geography?
**Decision:** After launching first geography, when does second geography begin?

**Gate criteria (all must be met):**
- First geography: 200+ active listings
- First geography: Average trust score 4.5+/5
- First geography: 2+ bookings/listing/month
- First geography: Host NPS > 40
- First geography: 3 consecutive months of 20%+ MoM GMV growth

**Decision owner:** CEO
**Input required:** All 5 metrics above for 3 consecutive months
**Urgency:** POST-PMF
**Reversibility:** MEDIUM

---

### D12 — When to Launch GCC Operations?
**Decision:** When does StayOS formally launch in a GCC country (not just serving GCC tourists in Egypt)?

**Gate criteria:**
- Egypt operations generating $500K+ monthly GMV
- Egypt unit economics: LTV/CAC > 3:1
- GCC legal entity registered
- GCC payment processing live
- GCC supply acquisition team hired
- GCC-specific product requirements defined and built

**Decision owner:** CEO + Board
**Input required:** All criteria above
**Urgency:** POST-PMF
**Reversibility:** LOW (GCC entity has ongoing legal and financial obligations)
**Deadline:** Review at Month 24

---

### D13 — When to Raise Series A?
**Decision:** What must be true before initiating Series A fundraise?

**Gate criteria:**
- $500K–$1M monthly GMV
- 3 consecutive months of 15%+ MoM growth
- Host NPS > 50, Guest NPS > 40
- LTV/CAC > 3:1
- 12+ months of runway remaining
- Identified Series A lead investor with strong MENA thesis

**Decision owner:** CEO + CFO
**Input required:** Financial metrics for 3 consecutive months
**Urgency:** POST-PMF
**Reversibility:** HIGH (can delay or accelerate)
**Deadline:** Review monthly from Month 15

---

### D14 — What Is the Pricing and Commission Strategy?
**Decision:** What commission structure launches on Day 1?

**Options:**
A. Free for 12 months, then 10%
B. 5% from Day 1
C. 10% from Day 1 with "early adopter" 6% for first 50 hosts
D. 0% launch, 5% at Month 6, 10% at Month 12

**Decision owner:** CEO + CFO
**Input required:** Host commission tolerance interviews, unit economics model
**Urgency:** PRE-LAUNCH
**Reversibility:** MEDIUM (changing commission triggers host dissatisfaction if increased)
**Deadline:** Day 30

**Panel preliminary recommendation:** Option D. Zero commission while building trust and volume. Graduated introduction signals business sustainability without shocking hosts.

---

### D15 — What Is the Acquisition Strategy for GCC Demand?
**Decision:** How does StayOS reach GCC tourists who want to book Egypt accommodation?

**Options:**
A. GCC social media marketing (Snapchat, Twitter, TikTok) — paid
B. GCC travel agency partnerships — B2B
C. GCC-based StayOS team — field sales
D. GCC influencer program — earned media
E. GCC corporate travel management companies — enterprise sales

**Decision owner:** CMO + CEO
**Input required:** GCC tourist interview data; channel cost research
**Urgency:** PRE-LAUNCH
**Reversibility:** HIGH
**Deadline:** Day 45

**Panel preliminary recommendation:** Option B + D in parallel. Travel agencies provide volume; influencers provide trust. Both are required before paid media.

---

## DECISION TIMELINE

| # | Decision | Deadline | Owner |
|---|----------|----------|-------|
| D02 | Co-founder? | Day 15 | Founder |
| D10 | Trust standards | Day 14 | COO |
| D03 | Company structure | Day 14 | CEO + Legal |
| D04 | First geography | Day 21 | CEO |
| D01 | Founding wedge | Day 30 | Founder |
| D05 | Business model | Day 30 | CEO |
| D08 | WhatsApp strategy | Day 30 | CPO |
| D15 | GCC demand acquisition | Day 45 | CMO |
| D07 | Web vs. app | Day 21 | CTO |
| D14 | Commission strategy | Day 30 | CEO |
| D06 | MVP scope | After 10 transactions | CPO |
| D11 | 2nd geography gate | Month 12+ | CEO |
| D09 | AI roadmap | Month 12 | CTO |
| D13 | Series A timing | Month 15+ | CEO |
| D12 | GCC launch | Month 24+ | CEO |

---

**END OF KEY DECISIONS**
