# Knowledge Index — StayOS

**Last Updated**: 2026-07-27
**Total Documents**: 29 articles + 4 index files
**AI-Ready**: Yes — all documents use consistent heading structure, domain metadata, and tag taxonomy for RAG import

---

## Overview

This is the complete index of StayOS's institutional knowledge base. Every document is production-grade — no placeholders, no generic content, specific to StayOS's Egypt-first MENA marketplace.

---

## Marketplace Domain (3 articles)

| Document | Audience | Key Topics |
|----------|---------|-----------|
| `marketplace/marketplace_lifecycle.md` | Founders, Product | Five stages (Ignition→Dominance), liquidity threshold, geographic concentration, stage transition criteria |
| `marketplace/cold_start_playbook.md` | Founders, Operations | Five cold start moves, institutional supply scripts, 10 manual transactions protocol |
| `marketplace/marketplace_health_kpis.md` | Founders, Operations | North Star metric, 7 Tier-2 KPIs, warning thresholds, stage-appropriate metrics |

---

## Hospitality Domain (3 articles)

| Document | Audience | Key Topics |
|----------|---------|-----------|
| `hospitality/property_quality_standards.md` | Operations, Host Success | Three-gate inspection, tier definitions, cultural flags, photo standards |
| `hospitality/turnover_operations.md` | Operations | Turnover pipeline, 4-hour window, cleaning execution, inspection checklist, BR-OPS-01/02/03 |
| `hospitality/guest_host_expectations.md` | All Teams | What guests are guaranteed, what hosts are guaranteed, cultural differences, Egyptian/GCC context |

---

## Operations Domain (3 articles)

| Document | Audience | Key Topics |
|----------|---------|-----------|
| `operations/daily_operations_runbook.md` | Operations | Operations clock 06:00–23:59, morning review, checkout monitoring, check-in coordination |
| `operations/incident_management.md` | Operations, All | P0–P3 severity, incident types, response playbooks (lockout, turnover, platform, safety, regulatory) |
| `operations/escalation_matrix.md` | All Teams | Issue → First Responder → Escalation Level → Authority table, on-call roster, authority reference card |

---

## Customer Success Domain (3 articles)

| Document | Audience | Key Topics |
|----------|---------|-----------|
| `customer_success/host_lifecycle.md` | Host Success | Six stages (Prospect→Advocacy), 21-day intervention, pricing coaching, referral program |
| `customer_success/guest_lifecycle.md` | Guest Success | Seven stages (Discovery→Return), Egyptian/GCC differences, booking drop-off points, welfare check |
| `customer_success/retention_playbook.md` | Host Success, Guest Success | Churn signals, intervention levels, loyalty programs, win-back protocols, retention analytics |

---

## Trust & Safety Domain (3 articles)

| Document | Audience | Key Topics |
|----------|---------|-----------|
| `trust/fraud_detection.md` | Trust & Safety | Six fraud categories, detection signals, prevention, response procedures, chargeback defense |
| `trust/dispute_resolution.md` | Trust & Safety, Support | Five dispute phases, SLA table, evidence hierarchy, 15 decision scenarios, monthly review |
| `trust/identity_verification_guide.md` | Trust & Safety, Engineering | KYC flow, AWS Textract + Rekognition, thresholds, manual review, edge cases, fraud signals |

---

## Finance Domain (3 articles)

| Document | Audience | Key Topics |
|----------|---------|-----------|
| `finance/escrow_model.md` | Finance, All | Escrow lifecycle, cancellation matrix, 24-hour hold mechanics, double-entry ledger, BR-FIN-01/02/03 |
| `finance/payout_operations.md` | Finance, Support | Payout flow, BR-FIN-03 verification, methods, schedule, holds, statements, reconciliation |
| `finance/refund_and_chargeback.md` | Finance, Trust & Safety | Refund types, processing steps, chargeback reasons, evidence package, response timeline, win rates |

---

## Support Domain (3 articles)

| Document | Audience | Key Topics |
|----------|---------|-----------|
| `support/support_workflows.md` | Support | 7-step workflow, severity SLA table, communication standards, triage decision tree |
| `support/escalation_playbook.md` | Support, All | 5 escalation levels, authority per level, escalation triggers table, communication format |
| `support/communication_templates.md` | Support, All | Full bilingual templates: pre-stay, access, mid-stay, checkout, host, dispute, emergency |

---

## Product Domain (3 articles)

| Document | Audience | Key Topics |
|----------|---------|-----------|
| `product/feature_reasoning.md` | Product, Engineering | FC-01–FC-07 rationale, why specific decisions were made, what was deliberately not built |
| `product/product_decision_framework.md` | Product, Founders | Four-Gate Test, Decision Log protocol, Build vs. Buy matrix, Stage 1 prioritization |
| `product/failure_modes_guide.md` | Founders, Product | 9 specific failure modes, early warning signals, countermeasures, monitoring dashboard |

---

## Founder Domain (3 articles)

| Document | Audience | Key Topics |
|----------|---------|-----------|
| `founder/vision_and_principles.md` | Founders, Leadership | Problem worth solving, MENA vision, 6 founding principles, what StayOS is NOT |
| `founder/decision_framework.md` | Founders | Type 1 vs. Type 2 decisions, Three-Question Test, governance structure, pre-mortem technique |
| `founder/scaling_playbook.md` | Founders | Stage gate criteria, city-by-city playbook, GCC corridor entry, hiring timeline, anti-patterns |

---

## Training Domain (5 programs)

| Document | Audience | Duration |
|----------|---------|---------|
| `training/host_success_training.md` | Host Success New Hires | 5 days |
| `training/guest_success_training.md` | Guest Success New Hires | 4 days |
| `training/support_training.md` | Support New Hires | 4 days |
| `training/operations_training.md` | Operations New Hires | 5 days |
| `training/finance_training.md` | Finance New Hires | 5 days |

---

## Index Files

| File | Purpose |
|------|---------|
| `KNOWLEDGE_INDEX.md` | This file — complete document index |
| `SOURCE_MAP.md` | Maps knowledge to source code, docs, and business rules |
| `TAG_INDEX.md` | Tags index for vector search and RAG retrieval |
| `LEARNING_PATHS.md` | Role-based reading paths for onboarding |

---

## AI/RAG Import Notes

**For vector database import**:
- Each document has consistent frontmatter: Domain, Audience, Version, Tags
- Section headings are consistent: Purpose, Background, Core Concept, Detailed Explanation, Real-World Scenarios, Decision Tree, Best Practices, Common Mistakes, FAQs, Checklist, References
- Tags are normalized (lowercase, hyphenated) for consistent retrieval

**For OpenAI/Claude system prompt injection**:
- All articles are self-contained (no external knowledge required to use them)
- Decision trees and checklists are structured for procedural extraction
- Business rule references (BR-ID-01, BR-FIN-01, etc.) are consistent across all documents

**Recommended chunk size for RAG**: 500–800 tokens per heading-delimited section.
**Recommended embedding model**: text-embedding-3-small or text-embedding-ada-002 (for OpenAI), or Voyage embeddings.
