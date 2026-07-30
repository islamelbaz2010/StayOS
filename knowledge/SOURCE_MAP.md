# Source Map — StayOS Knowledge Base

**Purpose**: Maps every knowledge article to its source materials — business rules, source code, and documentation. Use this when a knowledge article references something and you need the authoritative source.

**Last Updated**: 2026-07-27

---

## Business Rules → Knowledge Documents

| Business Rule | Definition Source | Knowledge Documents That Apply This Rule |
|--------------|-------------------|------------------------------------------|
| BR-ID-01 (KYC required for all users) | `docs/02_product/BUSINESS_RULES.md` | `trust/identity_verification_guide.md`, `training/host_success_training.md`, `training/support_training.md` |
| BR-ID-02 (Payout name must match KYC) | `docs/02_product/BUSINESS_RULES.md` | `trust/identity_verification_guide.md`, `finance/payout_operations.md`, `customer_success/host_lifecycle.md` |
| BR-INV-01 (No overlapping confirmed reservations) | `docs/02_product/BUSINESS_RULES.md` | `product/feature_reasoning.md` (FC-03) |
| BR-INV-02 (Minimum turnover gap between bookings) | `docs/02_product/BUSINESS_RULES.md` | `hospitality/turnover_operations.md`, `training/operations_training.md` |
| BR-OPS-01 (No check-in without confirmed turnover) | `docs/02_product/BUSINESS_RULES.md` | `operations/daily_operations_runbook.md`, `hospitality/turnover_operations.md`, `training/operations_training.md` |
| BR-OPS-02 (Operations coordinates cleaning/inspection) | `docs/02_product/BUSINESS_RULES.md` | `hospitality/turnover_operations.md`, `operations/daily_operations_runbook.md` |
| BR-OPS-03 (Photos required at each turnover step) | `docs/02_product/BUSINESS_RULES.md` | `hospitality/turnover_operations.md`, `trust/dispute_resolution.md`, `training/operations_training.md` |
| BR-FIN-01 (24-hour escrow hold post-check-in) | `docs/02_product/BUSINESS_RULES.md` | `finance/escrow_model.md`, `finance/payout_operations.md`, `finance/refund_and_chargeback.md`, `training/finance_training.md` |
| BR-FIN-02 (Tax compliance) | `docs/02_product/BUSINESS_RULES.md` | `finance/payout_operations.md` |
| BR-FIN-03 (Payout halt conditions) | `docs/02_product/BUSINESS_RULES.md` | `finance/escrow_model.md`, `finance/payout_operations.md`, `trust/identity_verification_guide.md` |
| BR-SUP-01 (Support SLA) | `docs/03_customer_experience/TRUST_FRAMEWORK.md` | `support/support_workflows.md`, `support/escalation_playbook.md` |

---

## Source Code → Knowledge Documents

| Source Module | Code Path | Knowledge Documents |
|-------------|----------|---------------------|
| Auth / JWT | `src/app/auth/` | `trust/identity_verification_guide.md` |
| KYC Verification | `src/app/kyc/` | `trust/identity_verification_guide.md` |
| Booking Engine | `src/app/reservations/` | `product/feature_reasoning.md` (FC-03), `finance/escrow_model.md` |
| Spatial Search | PostGIS queries in `src/app/listings/` | `product/feature_reasoning.md` (FC-02) |
| Finance / Escrow | `src/app/finance/` | `finance/escrow_model.md`, `finance/payout_operations.md`, `finance/refund_and_chargeback.md` |
| Operations / Turnover | `src/app/operations/` | `hospitality/turnover_operations.md`, `operations/daily_operations_runbook.md` |
| Notifications | `src/app/notifications/` | `support/communication_templates.md` |
| Celery Tasks | `src/app/celery_app.py` | `product/feature_reasoning.md` (FC-07 hardening) |
| Host Operations API | `src/app/listings/` | `product/feature_reasoning.md` (FC-04) |

---

## Decision Log → Knowledge Documents

| Decision | Log Reference | Knowledge Documents |
|---------|--------------|---------------------|
| MVP scope | DEC-001 | `product/feature_reasoning.md`, `product/product_decision_framework.md` |
| Egypt as PoC market | DEC-002 | `founder/vision_and_principles.md`, `founder/scaling_playbook.md` |
| Arabic-first UX | DEC-003 | `hospitality/guest_host_expectations.md`, `support/communication_templates.md` |
| Paymob as payment processor | DEC-004 | `finance/refund_and_chargeback.md`, `product/failure_modes_guide.md` |
| B2B2C supply strategy | DEC-005 | `marketplace/cold_start_playbook.md`, `founder/scaling_playbook.md` |
| Two-sided marketplace model | DEC-006 | `marketplace/marketplace_lifecycle.md`, `founder/vision_and_principles.md` |
| GCC as primary revenue | DEC-007 | `founder/scaling_playbook.md`, `hospitality/guest_host_expectations.md` |
| Escrow model | DEC-008 | `finance/escrow_model.md` |
| WhatsApp as primary comms | DEC-009 | `support/support_workflows.md`, `support/communication_templates.md` |
| Progressive pricing disclosure | DEC-010 | `hospitality/guest_host_expectations.md` |

---

## Trust Framework → Knowledge Documents

| Trust Framework Element | Source | Knowledge Documents |
|------------------------|--------|---------------------|
| Zero-Ghost Protocol | `docs/03_customer_experience/TRUST_FRAMEWORK.md` | `hospitality/guest_host_expectations.md`, `trust/dispute_resolution.md` |
| Vault Escrow System | `docs/03_customer_experience/TRUST_FRAMEWORK.md` | `finance/escrow_model.md` |
| Dispute SLA (15 min) | `docs/03_customer_experience/TRUST_FRAMEWORK.md` | `trust/dispute_resolution.md`, `support/escalation_playbook.md` |
| Safety features | `docs/03_customer_experience/TRUST_FRAMEWORK.md` | `hospitality/guest_host_expectations.md` |

---

## External Systems → Knowledge Documents

| System | Purpose | Knowledge Documents |
|--------|---------|---------------------|
| AWS Textract | OCR for KYC document processing | `trust/identity_verification_guide.md` |
| AWS Rekognition | Face comparison for KYC | `trust/identity_verification_guide.md` |
| Paymob | Primary payment processing and payout | `finance/escrow_model.md`, `finance/payout_operations.md`, `finance/refund_and_chargeback.md` |
| Stripe | Secondary payment processing | `finance/refund_and_chargeback.md`, `product/failure_modes_guide.md` |
| WhatsApp Business | Primary communication channel | `support/support_workflows.md`, `support/communication_templates.md`, ALL customer_success docs |
| PostGIS | Spatial search | `product/feature_reasoning.md` |
| Redis | Celery task queue | `product/feature_reasoning.md` |
| PostgreSQL 16 | Primary database | `product/feature_reasoning.md` |
