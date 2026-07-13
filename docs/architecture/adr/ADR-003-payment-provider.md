# ADR-003: Payment Provider Architecture

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-005 (Database — escrow ledger), ADR-012 (Queue — payout batch)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — "Payments: Paymob (Egypt payment aggregator), Stripe (cards), Fawry"
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §10 Known Conflicts CONFLICT-001, §3 DEC-004
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §7 Known Conflicts CONFLICT-001
- [`TECH_STACK.md`](../../TECH_STACK.md) — §3 Conflicted — Payment Processor
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §8 Security Rules

---

## Problem

This is the most critical unresolved conflict in the repository. Four documents contradict each other:

| Document | Processor |
|----------|-----------|
| `DECISION_LOG.md` DEC-004 | **Paymob** — accepted decision, Egypt primary |
| `MASTER_CONTEXT.md` §Technology | **Paymob** + **Stripe** (cards) + **Fawry** |
| `FLOWS.md` Flow 1 | **Stripe** Gateway Protocol |
| `ENGINEERING_BACKLOG.md` FC-03 Task 2 | **Stripe** Merchant Platform Payment Intents |
| `MVP_FREEZE.md` §2 | **Stripe** (third-party payment gateway) |

**Impact of no decision**: FC-03 Reservation Engine cannot be implemented. FC-06 Treasury Ledger cannot be designed. This single conflict blocks the critical path of the entire MVP.

**The structural question**: The conflict exists because Paymob and Stripe serve different functions:
- **Paymob**: Egyptian payment aggregator — Fawry, Meeza, Vodafone Cash, InstaPay, Egyptian debit cards
- **Stripe**: International credit/debit cards — Visa, Mastercard for GCC travelers and international tourists

These are NOT competing solutions. They serve different payment method categories. MASTER_CONTEXT.md already implies the correct answer by listing "Paymob + Stripe + Fawry" together.

---

## Options Evaluated

### Option A: Paymob Only

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Low. Single integration. Paymob transaction fees ~2.5–3.5% for local methods. |
| **Scalability** | Sufficient for Egypt. Paymob supports high transaction volume. |
| **Operational Complexity** | Low. Single payment SDK. |
| **Security** | PCI DSS compliant. CBE-licensed payment processor. |
| **Performance** | Egyptian network-optimized. Fawry/Meeza API latency acceptable for Egypt. |
| **Future Global Expansion** | CRITICAL LIMITATION: Paymob does not operate in Saudi Arabia or UAE as of 2026. GCC expansion (Phase 3) would require adding Stripe or a regional processor anyway. |

**Pros**: Covers Egyptian payment rails (Fawry, Meeza, Vodafone Cash, InstaPay). CBE-licensed — regulatory compliance for Egypt. Arabic-language payment UI.
**Cons**: GCC travelers (Saudi, UAE, Qatari guests — the highest-value segment per MASTER_CONTEXT.md) primarily use international Visa/Mastercard. Paymob card acceptance rates for international cards are lower than Stripe. No Paymob presence in GCC for Phase 3 expansion.

---

### Option B: Stripe Only

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Low-moderate. Stripe transaction fees ~2.9% + $0.30. |
| **Scalability** | Global scale. Stripe handles massive transaction volumes. |
| **Operational Complexity** | Low. Mature SDK. Excellent developer experience. |
| **Security** | PCI DSS Level 1. Best-in-class fraud detection (Stripe Radar). |
| **Performance** | Global CDN. API responses fast. |
| **Future Global Expansion** | Excellent. Stripe operates in 46+ countries including Saudi Arabia and UAE. |

**Pros**: Excellent developer experience. Mature webhooks. Stripe Payment Intents API handles async payment confirmation well. Strong fraud detection. ENGINEERING_BACKLOG.md and FLOWS.md already spec'd against Stripe API.
**Cons**: DOES NOT support Fawry, Meeza, Vodafone Cash, or InstaPay — the methods used by ~40% of Egyptian guests (per MASTER_CONTEXT.md: "~40% of Egyptians are unbanked or card-averse"). Choosing Stripe-only means excluding the majority of the Egyptian domestic guest market. This directly contradicts DEC-004 and DEC-003 (Arabic-first, local market).

---

### Option C: Paymob (Primary) + Stripe (International Cards) — Hybrid

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Moderate. Two integrations. Two sets of transaction fees. Routing logic required. |
| **Scalability** | Excellent. Each processor handles its optimal payment methods at scale. |
| **Operational Complexity** | Higher. Payment routing logic: detect payment method type → route to correct processor. Two webhook handlers. Two reconciliation flows in the ledger. |
| **Security** | Both PCI DSS compliant. Each processor's data stays in its system. Tokenization per processor. |
| **Performance** | Each processor optimized for its methods. No degradation vs single-processor. |
| **Future Global Expansion** | Stripe covers GCC expansion. Paymob can be swapped for regional processors in Saudi/UAE (HyperPay, MyFatoorah). |

**Pros**: Resolves the conflict — both DEC-004 and the engineering documents are honored. Covers 100% of the target guest market (Egyptian local methods + international cards). MASTER_CONTEXT.md already states "Paymob + Stripe + Fawry" as separate items, confirming this intent.
**Cons**: Two integrations to build and maintain. Payment routing logic adds complexity. Two reconciliation flows. Higher operational overhead.

---

## Decision

**Paymob (primary) + Stripe (international cards only) — Hybrid Architecture**

| Use Case | Processor |
|---------|-----------|
| Fawry (cash/kiosk) | Paymob |
| Meeza (Egyptian debit) | Paymob |
| Vodafone Cash (mobile wallet) | Paymob |
| InstaPay (Egyptian bank transfer) | Paymob |
| Egyptian Visa/Mastercard (local banks) | Paymob |
| International Visa/Mastercard (GCC, tourist) | Stripe |
| Apple Pay / Google Pay (international) | Stripe |

**Fawry is routed through Paymob's Fawry integration** — not a third direct integration.

---

## Decision Rationale

1. **MASTER_CONTEXT.md is authoritative**: The document explicitly lists "Paymob (Egypt payment aggregator), Stripe (cards), Fawry" as three separate entries in the technology stack. This was written by the Founder as the canonical context document. The engineering documents (FLOWS.md, ENGINEERING_BACKLOG.md) were written against Stripe in isolation — they captured the card payment flow but missed the local payment rail requirement.

2. **40% of Egyptian users are card-averse**: Per MASTER_CONTEXT.md, approximately 40% of Egyptians are unbanked or card-averse. Stripe-only would exclude this segment entirely, contradicting the Arabic-first, local-market differentiation strategy (DEC-003).

3. **GCC travelers use international cards**: The highest-value guest segment (GCC nationals visiting Egypt, per MASTER_CONTEXT.md) uses international Visa/Mastercard. Paymob-only would create friction for this segment. Stripe provides the best international card experience.

4. **DECISION_LOG.md DEC-004 is correct**: Paymob is the primary processor for Egypt. The engineering documents that reference Stripe were written to spec the card payment path — they are not wrong, but incomplete. Both are needed.

5. **Regulatory**: Paymob is CBE-licensed. This is required for Egyptian payment processing under Central Bank of Egypt regulations.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| Paymob only | Excludes ~60%+ of GCC traveler card payments; limits international adoption; GCC expansion would require adding Stripe anyway |
| Stripe only | Excludes Fawry, Meeza, Vodafone Cash, InstaPay — the payment rails for ~40% of Egyptian domestic guests; contradicts DEC-004; undermines local differentiation |

---

## Migration Cost

**From decision to implementation**: No existing payment code to migrate. Fresh implementation.

**Routing logic**: A `PaymentRouter` service in FC-03 detects payment method type from the checkout request and routes to the appropriate processor. This is ~200 lines of business logic — manageable.

**Future migration**: If Paymob is later replaced by HyperPay or MyFatoorah for GCC expansion, only the Paymob integration changes. The Stripe integration and routing logic are unaffected.

---

## Dependencies

- ADR-005 (Database) — FC-06 Treasury Ledger must record processor source per transaction for reconciliation
- ADR-012 (Queue) — Payout batch jobs run on Celery; must handle both Paymob and Stripe webhook events
- ADR-013 (Event Architecture) — Payment confirmation events trigger escrow and ledger entries

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| FC-03 Reservation Engine | PaymentRouter determines Paymob vs Stripe path at checkout |
| FC-06 Treasury Ledger | Two webhook handlers; ledger records `processor_source` per entry |
| BR-FIN-01 (Escrow) | Escrow timer starts regardless of processor; same business rule applies |
| BR-FIN-03 (Payout halt) | Applies to both Paymob and Stripe payout queues |
| CBE Compliance | Paymob CBE license covers local processing; Stripe handles international |
| GCC Expansion | Stripe already operable in Saudi Arabia and UAE; no new card integration needed |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft — resolves CONFLICT-001 | Accepted |
