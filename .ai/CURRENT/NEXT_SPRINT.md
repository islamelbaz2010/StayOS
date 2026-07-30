# NEXT_SPRINT — StayOS

**Version:** 2026-07-30  
**Sprint:** Sprint 3 — Supply Enablement & Closed Alpha Preparation  
**Status:** Proposed (pending founder/product-lead confirmation)  
**Duration:** 2 weeks  
**Due date:** 2026-08-14 (proposed)

---

## 1. Objective

Enable hosts to create and publish verified listings, enable operations staff to manually seed and claim inventory, and prepare a closed alpha with 50–100 listings in Cairo/Alexandria.

## 2. Scope

### 2.1 In Scope

- Listing photo upload (migration + endpoint + UI).
- Host onboarding wizard (phone OTP, role selection, KYC intro).
- Listing creation multi-step form (location, details, pricing, photos, calendar, publish).
- KYC document upload flow from the web.
- Admin KYC review queue.
- Admin listing-claim queue (create claim, approve/reject, transfer ownership).
- Admin bulk CSV import for listings.
- Duplicate detection service.
- Map integration on search page.
- Search card availability overlay.
- Payment checkout flow (Paymob iframe / Stripe redirect).
- Host calendar/pricing dashboard.
- Host landing page.
- Listing quality score.

### 2.2 Out of Scope

- Native iOS/Android app.
- AI pricing / matching.
- Field operations / turnover tickets.
- Channel manager sync.
- Real-time messaging (SSE/WebSocket).
- Advanced admin CRM / incident console.
- Reviews (V1.1 unless time allows).

## 3. Exclusions

- No public marketing or launch.
- No new city expansion beyond Cairo/Alexandria.
- No B2B SaaS billing.
- No automated KYC OCR/biometric (manual review only).

## 4. Acceptance Criteria

1. A host can sign up, complete KYC, create a listing with photos, set pricing/calendar, and publish.
2. An admin can bulk import, claim, review, and approve listings.
3. Staging has at least 50 draft listings created by ops.
4. Search page displays map pins and availability for selected dates.
5. Booking panel initiates a reservation and redirects to Paymob/Stripe checkout.
6. 326+ backend tests and `mypy`/`ruff` remain passing.
7. Frontend build, lint, and type-check pass.

## 5. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Founder does not confirm re-scope | Medium | High | Present decision memo and require GO/NO-GO within 48h. |
| Paymob/Stripe IDs not available | Medium | High | Use sandbox/stub mode; defer live checkout to Sprint 4. |
| Photo upload requires S3/Infrastructure | Medium | High | Use local MinIO or existing S3 dev bucket. |
| Phase 0 validation still missing | High | Medium | Run customer interviews in parallel with engineering. |
| Host UI takes longer than 2 weeks | Medium | Medium | Cut map/quality score to P2 if needed. |

## 6. Dependencies

- Founder approval of Sprint 3 re-scope.
- Paymob sandbox account + integration/iframe IDs.
- Stripe scope confirmation.
- AWS S3 bucket for listing photos.
- WhatsApp Business API account for host notifications.
- 2–3 operations staff for manual listing seeding.

## 7. Responsible Roles

| Role | Responsibility |
|------|----------------|
| Founder/CEO | Confirm re-scope, close Paymob/Stripe commercial agreements, sign off on host incentives. |
| Product Lead | Own backlog, acceptance criteria, host UX copy. |
| Backend Lead | Photo upload, admin import/claim, duplicate detection, payment checkout wiring. |
| Frontend Lead | Host onboarding, listing creation, map, booking panel payment integration. |
| Operations Lead | Manual listing seeding, host outreach, KYC review support. |

## 8. Next Action

Founder and product lead must review and confirm this NEXT_SPRINT within 48 hours. Engineering begins with the hard blockers as soon as confirmed.
