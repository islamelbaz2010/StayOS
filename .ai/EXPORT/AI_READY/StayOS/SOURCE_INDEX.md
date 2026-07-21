<!-- tokens: 2475 / budget 2500 -->

# Source Index — StayOS

## Annotated Tree

`StayOS/` — project root
  └── `ai_agents/` — project directory
  └── `AI_READY/` — project directory
      └── `AI_READY/StayOS/` — project directory
  └── `alembic/` — project directory
      └── `alembic/versions/` — project directory
  └── `apps/` — application / UI layer
      └── `apps/web/` — project directory
          └── `apps/web/app/` — application / UI layer
          └── `apps/web/lib/` — shared library / core utilities
          └── `apps/web/messages/` — project directory
  └── `business/` — project directory
      └── `business/financial/` — project directory
      └── `business/product/` — project directory
      └── `business/roadmap/` — project directory
      └── `business/sprint/` — project directory
  └── `docs/` — documentation and guides
      └── `docs/02_product/` — project directory
      └── `docs/03_customer_experience/` — project directory
      └── `docs/architecture/` — project directory
          └── `docs/architecture/adr/` — project directory
      └── `docs/phase--1/` — project directory
          └── `docs/phase--1/reports/` — project directory
          └── `docs/phase--1/risks/` — project directory
      └── `docs/standards/` — project directory
      └── `docs/system-design/` — project directory
      └── `docs/templates/` — project directory
  └── `infra/` — infrastructure / deployment
      └── `infra/docker/` — infrastructure / deployment
          └── `infra/docker/api/` — API / route handlers
      └── `infra/terraform/` — infrastructure / deployment
  └── `research/` — project directory
      └── `research/competitor/` — project directory
      └── `research/feature_evaluation/` — project directory
      └── `research/interviews/` — project directory
      └── `research/market/` — project directory
      └── `research/risk/` — project directory
  └── `scripts/` — scripts and executables
  └── `src/` — main source code
      └── `src/app/` — application / UI layer
          └── `src/app/shared/` — shared library / core utilities
  └── `tests/` — test suite
  └── `tools/` — project directory
      └── `tools/repository_intelligence/` — project directory

## Document Index

| Path | Category | Date | Summary | Authority |
| --- | --- | --- | --- | --- |
| `ARCHITECTURE.md` | architecture | — | ARCHITECTURE.md — System Architecture | canonical (by recency; no declared status) |
| `ARCHITECTURE_FREEZE.md` | architecture | 2026-07-13 | **Status**: FROZEN **Date**: 2026-07-13 **Authority**: Islam Elbaz (Founder) **P | canonical (by recency; no declared status) |
| `DECISION_LOG.md` | decision | 2026-07-13 | **Version**: 2.0.0 **Last Updated**: 2026-07-13 **Maintainer**: Islam Elbaz (Fou | superseded |
| `PROJECT_VISION.md` | vision | 2026-07-13 | **Version**: 2.0.0 **Last Updated**: 2026-07-13 **Maintainer**: Islam Elbaz (Fou | canonical (by recency; no declared status) |
| `README.md` | readme | — | **The AI-Powered Accommodation Operating System for MENA** | canonical (by recency; no declared status) |
| `ROADMAP.md` | roadmap | 2026-07-13 | **Version**: 2.0.0 **Last Updated**: 2026-07-13 **Maintainer**: Islam Elbaz (Fou | canonical (by recency; no declared status) |
| `docs/system-design/11_DEPLOYMENT_ARCHITECTURE.md` | architecture | — | **Cross-references**: [01_SYSTEM_OVERVIEW.md](01_SYSTEM_OVERVIEW.md) · [ADR-007] | canonical (by recency; no declared status) |
| `business/roadmap/roadmap_template.md` | roadmap | 2026-07-12 | **Version**: 1.0.0   **Last Updated**: 2026-07-12   **Maintainer**: Product Team | historical |
| `docs/architecture/adr/ADR-001-frontend-framework.md` | decision | 2026-07-13 | **Status**: Accepted **Date**: 2026-07-13 **Decision Maker**: Founder (Islam Elb | historical |
| `docs/architecture/adr/ADR-002-backend-runtime.md` | decision | 2026-07-13 | **Status**: Accepted **Date**: 2026-07-13 **Decision Maker**: Founder (Islam Elb | historical |
| `docs/architecture/adr/ADR-003-payment-provider.md` | decision | 2026-07-13 | ADR-003: Payment Provider Architecture | historical |
| `docs/architecture/adr/ADR-004-ai-provider.md` | decision | 2026-07-13 | ADR-004: AI Provider Architecture | historical |
| `docs/architecture/adr/ADR-005-database-strategy.md` | decision | 2026-07-13 | **Status**: Accepted **Date**: 2026-07-13 **Decision Maker**: Founder (Islam Elb | historical |
| `docs/architecture/adr/ADR-006-authentication-strategy.md` | decision | 2026-07-13 | ADR-006: Authentication Strategy | historical |
| `docs/architecture/adr/ADR-007-deployment-strategy.md` | decision | 2026-07-13 | **Status**: Accepted **Date**: 2026-07-13 **Decision Maker**: Founder (Islam Elb | historical |
| `docs/architecture/adr/ADR-008-realtime-architecture.md` | decision | 2026-07-13 | **Status**: Accepted **Date**: 2026-07-13 **Decision Maker**: Founder (Islam Elb | historical |
| `docs/architecture/adr/ADR-009-storage-strategy.md` | decision | 2026-07-13 | **Status**: Accepted **Date**: 2026-07-13 **Decision Maker**: Founder (Islam Elb | historical |
| `docs/architecture/adr/ADR-010-search-architecture.md` | decision | 2026-07-13 | **Status**: Accepted **Date**: 2026-07-13 **Decision Maker**: Founder (Islam Elb | historical |
| `docs/architecture/adr/ADR-011-notification-architecture.md` | decision | 2026-07-13 | ADR-011: Notification Architecture | historical |
| `docs/architecture/adr/ADR-012-queue-background-jobs.md` | decision | 2026-07-13 | ADR-012: Queue and Background Jobs | historical |
| `docs/architecture/adr/ADR-013-event-driven-architecture.md` | decision | 2026-07-13 | ADR-013: Event-Driven Architecture | historical |
| `docs/architecture/adr/ADR-014-api-style.md` | decision | 2026-07-13 | **Status**: Accepted **Date**: 2026-07-13 **Decision Maker**: Founder (Islam Elb | historical |
| `docs/architecture/adr/ADR-015-multi-region-expansion.md` | decision | 2026-07-13 | ADR-015: Multi-Region Expansion Strategy | historical |
| `docs/architecture/adr/ADR-template.md` | decision | — | **Status**: [Proposed \| Accepted \| Rejected \| Deprecated \| Superseded]   **D | superseded |
| `docs/phase--1/reports/18_KEY_DECISIONS.md` | decision | 2026-07-13 | STAYOS — 18: KEY DECISIONS **Classification:** CONFIDENTIAL **Date:** 2026-07-13 | canonical (by recency; no declared status) |
| `docs/system-design/04_API_SPECIFICATION.md` | specification | — | **Cross-references**: [03_MICROSERVICES.md](03_MICROSERVICES.md) · [08_RBAC.md]( | superseded |
| `RISKS.md` | risk | 2026-07-13 | **Version**: 2.0.0 **Last Updated**: 2026-07-13 **Maintainer**: Islam Elbaz (Fou | historical |
| `docs/phase--1/reports/13_FOUNDER_MISTAKES.md` | interview | 2026-07-13 | STAYOS — 13: FOUNDER MISTAKES **Classification:** CONFIDENTIAL **Date:** 2026-07 | canonical (by recency; no declared status) |
| `research/interviews/interview_template.md` | interview | 2026-07-12 | **Version**: 1.0.0   **Last Updated**: 2026-07-12   **Maintainer**: Research Tea | canonical (by recency; no declared status) |
| `docs/standards/commit_conventions.md` | standards | 2026-07-12 | **Version**: 1.0.0   **Last Updated**: 2026-07-12   **Maintainer**: Technical Le | canonical (by recency; no declared status) |
| `docs/standards/documentation_guide.md` | standards | 2026-07-12 | **Version**: 1.0.0   **Last Updated**: 2026-07-12   **Maintainer**: Documentatio | historical |
| `docs/standards/folder_conventions.md` | standards | 2026-07-12 | **Version**: 1.0.0   **Last Updated**: 2026-07-12   **Maintainer**: Technical Le | canonical (by recency; no declared status) |
| `docs/standards/markdown_standards.md` | standards | 2026-07-12 | **Version**: 1.0.0   **Last Updated**: 2026-07-12   **Maintainer**: Documentatio | superseded |
| `docs/standards/naming_conventions.md` | standards | 2026-07-12 | **Version**: 1.0.0   **Last Updated**: 2026-07-12   **Maintainer**: Technical Le | canonical (by recency; no declared status) |
| `docs/standards/repository_standards.md` | standards | 2026-07-12 | **Version**: 1.0.0   **Last Updated**: 2026-07-12   **Maintainer**: Technical Le | canonical (by recency; no declared status) |
| `docs/phase--1/risks/06_RISK_REGISTER.md` | risk | 2026-07-13 | STAYOS — 06: MASTER RISK REGISTER **Classification:** CONFIDENTIAL **Date:** 202 | canonical (by recency; no declared status) |
| `docs/phase--1/risks/07_BUSINESS_RISKS.md` | risk | 2026-07-13 | STAYOS — 07: BUSINESS RISKS (100) **Classification:** CONFIDENTIAL **Date:** 202 | historical |
| `docs/phase--1/risks/08_TECHNICAL_RISKS.md` | risk | 2026-07-13 | STAYOS — 08: TECHNICAL RISKS (100) **Classification:** CONFIDENTIAL **Date:** 20 | historical |
| `docs/phase--1/risks/09_LEGAL_RISKS.md` | risk | 2026-07-13 | STAYOS — 09: LEGAL RISKS (100) **Classification:** CONFIDENTIAL **Date:** 2026-0 | historical |
| `docs/phase--1/risks/10_MARKETPLACE_RISKS.md` | risk | 2026-07-13 | STAYOS — 10: MARKETPLACE RISKS (100) **Classification:** CONFIDENTIAL **Date:**  | canonical (by recency; no declared status) |
| `docs/phase--1/risks/11_FINANCIAL_RISKS.md` | risk | 2026-07-13 | STAYOS — 11: FINANCIAL RISKS (100) **Classification:** CONFIDENTIAL **Date:** 20 | canonical (by recency; no declared status) |
| `docs/phase--1/risks/12_COMPETITIVE_RISKS.md` | risk | 2026-07-13 | STAYOS — 12: COMPETITIVE RISKS (100) **Classification:** CONFIDENTIAL **Date:**  | canonical (by recency; no declared status) |
| `research/risk/risk_template.md` | risk | 2026-07-12 | **Version**: 1.0.0   **Last Updated**: 2026-07-12   **Maintainer**: Project Lead | canonical (by recency; no declared status) |
| _46 additional document(s) omitted to stay within token budget_ | | | | |
| _1 earlier/historical draft(s) at `readme_` | | | | historical |

## Retrieval Pointers

- For orientation: `README.md`
- For architecture / system design: `ARCHITECTURE.md`
- For roadmap / priorities: `ROADMAP.md`
- For decisions / ADRs: `DECISION_LOG.md`