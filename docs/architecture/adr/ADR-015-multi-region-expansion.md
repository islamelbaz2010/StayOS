# ADR-015: Multi-Region Expansion Strategy

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-007 (Deployment — primary region), ADR-005 (Database — replication), ADR-004 (AI — MENA data residency)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — §Regional Expansion table (Egypt → Saudi → UAE → Qatar → Jordan/Morocco)
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §2 Market Context, §3 DEC-002 (Egypt proof-of-concept, GCC is the business)
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §1 System Type, §7 Conflicts
- [`TECH_STACK.md`](../../TECH_STACK.md) — §1 AWS Middle East region
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §1 Phase Gate

---

## Problem

`DECISION_LOG.md` DEC-002 establishes that Egypt is the proof-of-concept market and the GCC corridor is the primary business. `MASTER_CONTEXT.md` provides a regional expansion timeline:

| Market | Priority | Timeline |
|--------|----------|----------|
| Egypt | 1 | Now (Phase 0–1) |
| Saudi Arabia | 2 | 18–36 months |
| UAE | 2 | 18–36 months |
| Qatar | 3 | 36–48 months |
| Jordan, Morocco | 4 | 48–60 months |

The Phase 1 architecture decisions (ADR-007: AWS `me-central-1` UAE) must not become blockers to this expansion. Multi-region strategy must be designed now so Phase 1 code does not embed Egypt-specific assumptions that require rewrites during GCC expansion.

This ADR does NOT authorize GCC expansion engineering — it documents the technical strategy that Phase 1 must be aware of.

---

## Multi-Region Concerns

### 1. Data Residency

| Country | Regulatory Status | Requirement |
|---------|-----------------|------------|
| Egypt | Central Bank of Egypt (CBE) data localization directives pending | Financial data must be processed within Egypt or approved MENA region |
| Saudi Arabia | NCA (National Cybersecurity Authority) data residency requirements | Data of Saudi residents must be stored in KSA |
| UAE | ADGM / DIFC data protection frameworks | Financial data residency requirements for regulated entities |
| Qatar | PDPPL (Personal Data Protection Privacy Law) | Data residency for Qatari residents |

**Phase 1 implication**: Store all user data in AWS `me-central-1` (UAE) — a neutral MENA region acceptable for Egypt operations. This region is also acceptable for UAE data. Saudi expansion will require a KSA-region deployment.

### 2. Payment Rail Expansion

| Market | Local Rails Required |
|--------|---------------------|
| Egypt | Paymob (Fawry, Meeza, Vodafone Cash, InstaPay) — ADR-003 |
| Saudi Arabia | HyperPay, STC Pay, Mada (national debit network) |
| UAE | Network International, FAB Pay, local bank transfers |
| Qatar | QNB payment gateway, Hukoomi portal integration |

**Phase 1 implication**: Payment abstraction layer (PaymentRouter in FC-03) must be designed to accept pluggable processor adapters. Adding HyperPay for Saudi Arabia must require only: (a) a new adapter, (b) a new routing rule. No changes to FC-06 Treasury Ledger schema.

### 3. Language and Locale

| Dimension | Egypt | Saudi Arabia | UAE | Qatar |
|-----------|-------|-------------|-----|-------|
| Primary Arabic | Egyptian dialect (عامية مصرية) | Gulf Arabic (عربي خليجي) | Gulf Arabic | Gulf Arabic |
| Formal Arabic | MSA (الفصحى) | MSA | MSA | MSA |
| English | Secondary | Secondary | Co-primary | Secondary |
| Currency | EGP (LE) | SAR | AED | QAR |
| Date format | dd/mm/yyyy | Hijri + Gregorian | dd/mm/yyyy | Hijri + Gregorian |
| Prayer time filters | Required | Required | Required | Required |

**Phase 1 implication**: Build locale abstraction from Sprint 1. Do not hardcode `EGP`, `ar-EG`, or Egyptian-specific content strings in business logic. Use locale configuration objects.

### 4. Currency and Pricing

Each market has a different currency. FC-06 Treasury Ledger must:
- Store amounts in minor units (piasters for EGP, halalas for SAR, fils for AED)
- Store currency code (`EGP`, `SAR`, `AED`, `QAR`) per transaction record
- Support multi-currency payout routing from day one in schema design

**Phase 1 implication**: Even though Egypt is the only market, the `amount` field in all ledger tables must include a `currency` column from Sprint 1. Retrofitting currency support onto a single-currency schema is expensive.

---

## Options Evaluated

### Option A: Egypt-only Architecture (Migrate Later)

**Approach**: Build for Egypt only. Hardcode EGP currency, Egyptian payment rails, `ar-EG` locale, `me-central-1` single region. Rewrite for GCC expansion.

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Lowest Phase 1 cost. |
| **Scalability** | Does not scale to GCC without significant rework. |
| **Operational Complexity** | Lowest Phase 1 complexity. |
| **Migration Cost** | Very high — currency schema changes, payment rail integration, locale hardcoding throughout codebase. |
| **Future Global Expansion** | Actively impedes it. Every GCC expansion requires code changes across multiple services. |

**Rejected**: DEC-002 explicitly states "every decision must support regional expansion from Day 1." Building Egypt-only violates this decision.

---

### Option B: Multi-Tenant Locale-Aware Architecture (Phase 1)

**Approach**: Build locale/currency/payment abstractions from day one. Egypt is the only active market, but the schema, configuration, and code support multi-market from the first commit.

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Moderate additional Phase 1 cost (~10–15% more development time for abstractions). |
| **Scalability** | Direct path to multi-region without architectural rework. |
| **Operational Complexity** | Slightly higher Phase 1 complexity (locale config objects, currency columns). |
| **Migration Cost** | Low. Adding a new market = new locale config + new payment adapter. No schema changes. |
| **Future Global Expansion** | Saudi Arabia, UAE can be activated by configuration, not code rewrite. |

**Accepted**. This is what DEC-002 requires.

---

## Decision

**Locale-aware, multi-currency, pluggable payment architecture from Phase 1 Sprint 1.**

---

## Phase 1 Required Abstractions

These abstractions must be built in Phase 1 — they are not optional GCC features:

### 1. Locale Configuration Object

```python
class Locale:
    code: str          # "ar-EG", "ar-SA", "ar-AE"
    currency: str      # "EGP", "SAR", "AED"
    currency_minor: int  # 100 (piasters), 100 (halalas), 100 (fils)
    date_format: str   # "Gregorian", "Hijri+Gregorian"
    prayer_filters: bool  # True for all MENA markets
    rtl: bool          # True for all MENA markets
```

### 2. Multi-Currency Ledger Schema

All monetary fields in PostgreSQL:
```sql
amount_minor    INTEGER NOT NULL,   -- in smallest currency unit
currency        CHAR(3) NOT NULL,   -- ISO 4217: EGP, SAR, AED, QAR
```

No `DECIMAL` fields storing amounts without currency context.

### 3. Pluggable Payment Adapter Interface

```python
class PaymentAdapter(ABC):
    @abstractmethod
    async def create_payment_intent(self, amount: int, currency: str, ...) -> PaymentIntent: ...
    
    @abstractmethod
    async def confirm_payment(self, payment_id: str) -> PaymentConfirmation: ...
    
    @abstractmethod
    async def process_refund(self, payment_id: str, amount: int) -> Refund: ...

class PaymobAdapter(PaymentAdapter): ...    # Egypt primary
class StripeAdapter(PaymentAdapter): ...    # International cards
class HyperPayAdapter(PaymentAdapter): ... # Saudi Arabia (Phase 3)
```

### 4. Region-Aware Deployment Config

AWS infrastructure uses separate VPCs and resource sets per region:
```
stayos-production-me-central-1/   ← UAE (Phase 1)
stayos-production-me-central-2/   ← Saudi Arabia (Phase 3 — structure ready, not deployed)
```

Terraform (or CDK) module per region. Egypt operations run on `me-central-1` until Egypt-specific region is required by CBE.

---

## GCC Expansion Timeline (Technical Triggers)

| Trigger | Action |
|---------|--------|
| Phase 2 gate cleared (PMF signals) | Begin Saudi Arabia technical readiness assessment |
| Saudi Arabia licensing obtained | Deploy `me-central-2` region; activate `HyperPayAdapter`; add `ar-SA` locale config |
| UAE licensing obtained | UAE traffic routed to existing `me-central-1` (same region); add `ar-AE` locale; activate `StripeAdapter` (already active for international cards) |
| Qatar | Assess QNB integration; add `ar-QA` locale |

**No GCC expansion engineering in Phase 1.** This ADR documents the Phase 1 requirements (abstractions) that enable GCC expansion without rewrites.

---

## Decision Rationale

1. **DEC-002 is explicit**: "Every decision — legal structure, payment infrastructure, product language, trust standards — must support regional expansion from Day 1." This ADR translates that strategy into concrete Phase 1 technical requirements.

2. **Currency schema is the most expensive retrofit**: Changing a single-currency schema to multi-currency after launch requires a production migration on financial records — the highest-risk migration possible. Build it multi-currency from Sprint 1.

3. **Payment adapter interface costs ≈ 2 sprint days**: Defining the PaymentAdapter abstract class and implementing Paymob + Stripe adapters adds ~2 days to Phase 1. Adding HyperPay for Saudi Arabia later will cost ~1 day. The alternative (hardcoded Paymob calls) would require refactoring all of FC-03 and FC-06.

4. **Locale config is near-zero cost**: A configuration object per market adds negligible development time. Removing hardcoded `ar-EG` assumptions from Phase 1 costs hours, not days.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| Egypt-only hardcoded architecture | Violates DEC-002; creates expensive GCC expansion rewrites; would require 2–4 months of refactoring at Phase 3 |
| Full multi-region deployment in Phase 1 | Out of scope; Phase 0 not cleared; $150K budget constraint; only the abstractions are built, not the regions |

---

## Migration Cost

**Egypt → Saudi Arabia (Phase 3)**:
- Deploy `me-central-2` Terraform module (structure pre-defined in Phase 1)
- Implement HyperPayAdapter (interface pre-defined in Phase 1)
- Add `ar-SA` locale configuration (config object pre-defined in Phase 1)
- No schema changes (currency column present from Phase 1)
- Estimated effort: 2–4 sprint weeks

---

## Dependencies

- ADR-007 (Deployment) — AWS `me-central-1` as Phase 1 region; Terraform module structure for multi-region
- ADR-003 (Payment) — PaymentAdapter interface enables Paymob + Stripe + future HyperPay
- ADR-005 (Database) — multi-currency schema from Sprint 1
- ADR-004 (AI) — MENA data residency affects Phase 3 AI provider choice

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| FC-03 Reservation | PaymentAdapter interface; currency in all payment records |
| FC-06 Treasury | `amount_minor` + `currency` columns in all ledger tables |
| FC-04 PMS | Locale-aware pricing display (EGP vs SAR vs AED) |
| Phase 1 development time | +10–15% for abstraction work |
| GCC expansion (Phase 3) | No architecture rewrites — configuration + new adapters only |
| Investor narrative | "Regional from day one" — substantiated by this ADR |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
