# GEMINI.md — Instructions for Gemini

**Read [`CONTEXT.md`](CONTEXT.md) and [`AGENTS.md`](AGENTS.md) first.**

---

## Project Summary

StayOS is a two-sided accommodation marketplace for Egypt and the GCC — not a computer OS. Phase 0 (customer validation) is active. Phase 1 (MVP build) is gated.

Canonical definition: [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md)

---

## Grounding Instructions

All responses must be grounded in repository documents. This project has rich context across 85 documents. Do not hallucinate product requirements, technology choices, or business decisions.

**Before answering any product, architecture, or engineering question:**

1. Check [`docs/SINGLE_SOURCE_OF_TRUTH.md`](docs/SINGLE_SOURCE_OF_TRUTH.md) to find the canonical document for the topic.
2. Read that document.
3. Base your answer on what it says, not on general accommodation marketplace patterns.

---

## Document Navigation

| Topic | Canonical Document |
|-------|--------------------|
| What StayOS is | [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md) |
| All decisions | [`DECISION_LOG.md`](DECISION_LOG.md) |
| MVP scope | [`docs/02_product/MVP_FREEZE.md`](docs/02_product/MVP_FREEZE.md) |
| Features | [`docs/02_product/FEATURE_CATALOG.md`](docs/02_product/FEATURE_CATALOG.md) |
| Build order | [`docs/02_product/FEATURE_DEPENDENCY_MAP.md`](docs/02_product/FEATURE_DEPENDENCY_MAP.md) |
| Business rules | [`docs/02_product/BUSINESS_RULES.md`](docs/02_product/BUSINESS_RULES.md) |
| Tech stack | [`TECH_STACK.md`](TECH_STACK.md) |
| Architecture | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Trust system | [`docs/03_customer_experience/TRUST_FRAMEWORK.md`](docs/03_customer_experience/TRUST_FRAMEWORK.md) |
| All 85 docs | [`docs/MANIFEST.md`](docs/MANIFEST.md) |

---

## Phase Gate Awareness

Phase 0 is active. No product code is written until Phase 0 gates clear:

- 50 traveler interviews ✗
- 30 host interviews ✗
- 10 manual transactions ✗
- Guest NPS ≥ 7.0 ✗
- Host NPS ≥ 7.0 ✗

Gate conditions: [`docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md`](docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md)

---

## Known Conflicts to Surface, Not Resolve

**Payment processor conflict** (most critical):
- `DECISION_LOG.md` DEC-004: **Paymob** is the primary payment processor for Egypt.
- `FLOWS.md`: References "**Stripe** Gateway Protocol" as the payment flow.
- `ENGINEERING_BACKLOG.md` (FC-03 Task 2): References "**Stripe** Merchant Platform Payment Intents."
- `MVP_FREEZE.md`, `LEAN_PRODUCT.md`: Also reference Stripe.

These documents contradict DEC-004. Do not resolve. Surface this conflict whenever payment topics arise.

**Framework / language conflicts**:
- Frontend: "React or Next.js" — not yet decided (no ADR exists).
- Backend: "Node.js or Python" — not yet decided (no ADR exists).

---

## Gemini-Specific Notes

- This repository has no Gemini-specific API integrations currently. Gemini's role is analysis, document generation, and code assistance.
- If asked to perform retrieval-augmented generation over this repository, use [`docs/MANIFEST.md`](docs/MANIFEST.md) as the document index.
- Context length: Load Phase -1 documents only when specifically needed — they are research history, not active specifications.
- The active specifications are in `docs/02_product/` and `docs/03_customer_experience/`.

---

## Universal Agent Rules

All rules in [`AGENTS.md`](AGENTS.md) apply fully to Gemini. Key points:

- No invented requirements
- Report conflicts; do not resolve them
- Archive content is not authoritative
- Phase gate enforcement is mandatory
