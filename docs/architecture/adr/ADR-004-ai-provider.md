# ADR-004: AI Provider Architecture

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-002 (Backend Runtime — Python for AI), ADR-005 (Database — training data), ADR-015 (Multi-region)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — "AI/ML: Phase 3+ — not Phase 0 or 1"
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §3 DEC-008, §5.2 Excluded from MVP
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §2 Service Boundaries
- [`TECH_STACK.md`](../../TECH_STACK.md) — §4 AI/ML Technology (Deferred)
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §1 Phase Gate, §11 What Does Not Exist Yet

---

## Problem

`DECISION_LOG.md` DEC-008 establishes that AI/ML features are deferred:
- Phase 0: Zero AI
- Phase 1: Rule-based pricing only (no ML)
- Phase 2: ML features at 50K+ transactions
- Phase 3+: Demand forecasting, personalization, fraud detection

However, the AI provider architecture must be decided now because:
1. The backend language choice (ADR-002: Python/FastAPI) was partially motivated by Python's AI ecosystem — that rationale must specify which ecosystem.
2. Data schema decisions in Phase 1 must collect the right training signals for Phase 3 AI features — schema design depends on knowing what AI will consume.
3. MASTER_CONTEXT.md positions StayOS as "AI-powered" — investors and partners will ask which AI stack is planned.

**This ADR decides the AI provider strategy. It does NOT authorize any AI implementation in Phase 1.**

---

## AI Feature Roadmap (from DEC-008)

| Phase | AI Feature | Data Requirement |
|-------|-----------|-----------------|
| Phase 1 | Rule-based pricing (no ML) | None |
| Phase 2 | Demand forecasting | 50K+ bookings, seasonal patterns |
| Phase 2 | Basic personalized search ranking | User behavior logs, booking history |
| Phase 3 | Dynamic pricing ML | Real-time demand signals, competitor data |
| Phase 3 | Fraud detection | Transaction patterns, KYC signals |
| Phase 3 | Natural language property descriptions | Arabic NLP model |
| Phase 4 | Full AI layer, API platform | Platform-scale data |

---

## Options Evaluated

### Option A: OpenAI API (GPT-4o / GPT-4-turbo)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Input: $5–15/1M tokens. High for large-scale Arabic text processing. |
| **Scalability** | Global. Rate limits manageable with caching. |
| **Operational Complexity** | Low. API-only, no infrastructure. |
| **Security** | Data sent to OpenAI servers. GDPR/PDPA implications for MENA user data. |
| **Performance** | Excellent for text. No native Arabic-specific fine-tuning. |
| **Future Global Expansion** | Available globally. No MENA data residency guarantee. |
| **Arabic NLP** | Good but not specialized for Arabic dialects (Egyptian, Gulf). |

**Pros**: Market-leading LLM. Mature API. Large community. Embeddings API for search.
**Cons**: No data residency in MENA. Egyptian and Gulf Arabic dialect performance is below MSA (Modern Standard Arabic). Price is high at scale. Data sent to US servers — potential regulatory concern under Egyptian data protection laws.

---

### Option B: Anthropic Claude API

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Claude Sonnet: $3/1M input tokens, $15/1M output. Competitive. |
| **Scalability** | Global API. Available in MENA via API. |
| **Operational Complexity** | Low. API-only. |
| **Security** | Enterprise API. No training on customer data by default. |
| **Performance** | Strong reasoning. Good Arabic performance. Best-in-class for structured output. |
| **Future Global Expansion** | API available globally. No MENA data residency currently. |
| **Arabic NLP** | Good Modern Standard Arabic. Improving on Egyptian and Gulf dialects. |

**Pros**: Superior structured output (pricing suggestions, fraud analysis). Strong reasoning for complex marketplace rules. No training on user data. Same AI already used in StayOS development tooling (Claude Code). Python SDK native.
**Cons**: No MENA data residency. Not specialized for Arabic dialects natively. Rate limits in high-throughput scenarios require caching strategy.

---

### Option C: Google Vertex AI (Gemini Pro)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Gemini Pro: $1.25–$5/1M tokens. Competitive. |
| **Scalability** | Google-scale infrastructure. |
| **Operational Complexity** | Higher. Requires GCP project, IAM, Vertex AI endpoints. |
| **Security** | GCP data residency options. Can configure Middle East data location. |
| **Performance** | Good. Multimodal (image + text) — useful for KYC document processing and property photo analysis. |
| **Future Global Expansion** | Google Cloud Middle East region (Saudi Arabia me-central2, UAE me-west1). Data residency possible. |
| **Arabic NLP** | Strong Arabic support. Google Translate heritage. |

**Pros**: Potential MENA data residency (critical for regulatory compliance). Good Arabic. Multimodal for KYC and property image analysis. Aligns with GCP deployment if ADR-007 selects GCP.
**Cons**: Higher operational complexity. Requires GCP commitment. Vendor lock-in deeper than API-only options.

---

### Option D: Self-hosted Open Source (Llama, Mistral-Arabic)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | High upfront GPU infrastructure. Low per-token at scale. |
| **Scalability** | Requires GPU cluster management. |
| **Operational Complexity** | Very high. Model serving, fine-tuning, deployment infrastructure. |
| **Security** | Data never leaves own infrastructure — maximum security. |
| **Performance** | Arabic-specific models (Jais, AceGPT) are available but less capable than frontier models. |
| **Future Global Expansion** | Full control. No third-party dependency. |
| **Arabic NLP** | Jais (Arabic LLM from G42/MBZUAI) has strong MSA and Gulf Arabic. |

**Pros**: Full data sovereignty. No per-token cost at scale. Fine-tuning possible for Egyptian Arabic.
**Cons**: Phase 3 is 36-48 months away and requires 50K+ transactions first. Building GPU infrastructure now is premature and wastes Phase 1 budget. Team does not have ML infrastructure expertise at Phase 1.

---

## Decision

**Phase 1–2: Anthropic Claude API (claude-sonnet-4-6 or latest Sonnet model)**
**Phase 3+: Evaluate Vertex AI (for MENA data residency) or self-hosted Arabic LLM (Jais) for at-scale Arabic NLP**

**Phase 1 Implementation**: Zero AI. Rule-based pricing only. No Claude API calls in production Phase 1 code.

**Phase 2 First Use**: Claude API for:
- Arabic property description generation (host onboarding)
- Structured pricing recommendations (rule-based → ML-assisted transition)
- Support ticket triage classification

**Phase 3 Evaluation**: If MENA data residency becomes a legal requirement, Vertex AI (with GCP Middle East data residency) or self-hosted Jais model. This evaluation happens at Phase 3 gate, not now.

---

## Decision Rationale

1. **DEC-008 is immutable**: No AI in Phase 1. This ADR decides the provider strategy only — it authorizes zero Phase 1 implementation.

2. **Claude API aligns with existing tooling**: StayOS development already uses Claude Code (Anthropic). The Python SDK is already familiar. Same vendor relationship simplifies procurement for Phase 2.

3. **Data schema must prepare for AI now**: Even though AI is deferred, Phase 1 must log: search queries, click patterns, booking conversion rates, seasonal demand signals, pricing history. This data becomes Phase 2/3 training input. The backend schema (ADR-005) must include these event log tables from Sprint 1.

4. **Arabic NLP is the key Phase 3 risk**: Egyptian Arabic dialect performance is the primary AI risk. Phase 1–2 testing with Claude API validates Arabic capability before committing to a model provider at scale.

5. **Self-hosted is premature**: $150K Phase 1 budget cannot absorb GPU infrastructure. The team does not have ML infra expertise at this stage.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| OpenAI API (primary) | Regulatory risk for MENA user data; less structured output for pricing rules; no advantage over Claude for this use case |
| Vertex AI (primary from Phase 2) | Higher operational complexity; GCP commitment before ADR-007 decides cloud provider; evaluate at Phase 3 gate |
| Self-hosted open source | Premature; $150K budget constraint; no ML infrastructure expertise in Phase 1 team |

---

## Migration Cost

**Phase 1 → Phase 2**: Add Claude API dependency to requirements.txt. Write first AI-powered endpoint. No migration — additive change.

**Phase 2 → Phase 3 (if switching provider)**: Claude API calls are encapsulated in an `AIService` abstraction layer. Swapping the provider requires changing the implementation, not the interface. Migration cost: low if abstraction is maintained from Phase 2.

---

## Dependencies

- ADR-002 (Backend Runtime) — Python SDK for Claude API is native to FastAPI backend
- ADR-005 (Database) — Event log tables for training data must be in Phase 1 schema
- ADR-015 (Multi-region) — MENA data residency requirements affect Phase 3 provider choice

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| Phase 1 MVP | Zero impact. No AI in Phase 1 production code. |
| Phase 1 Schema | Event log tables for search, booking, pricing must be included |
| Phase 2 Host Onboarding | Claude generates Arabic property descriptions |
| Phase 3 Pricing | ML-assisted demand forecasting |
| Phase 3 Fraud | Pattern detection on transaction data |
| Investor Narrative | "AI-powered" is substantiated by this roadmap |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
