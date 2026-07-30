# MASTER DELIVERY BACKLOG
## StayOS Engineering Bible — Complete Execution Backlog

**Document ID:** MDB-001  
**Version:** 1.0  
**Status:** OFFICIAL — ENGINEERING BIBLE  
**Authority:** PROJECT DIRECTOR EXECUTIVE ORDER 010  
**Date:** 2026-07-29  
**Classification:** INTERNAL — ENGINEERING TEAM ONLY  

> Every developer. Every AI. Every sprint. Every task. Must come from this backlog.  
> Nothing gets built that is not in this document. Nothing in this document goes unbuilt.

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Product Breakdown Structure](#2-product-breakdown-structure)
3. [Engineering Backlog](#3-engineering-backlog)
4. [Backend Delivery](#4-backend-delivery)
5. [Frontend Delivery](#5-frontend-delivery)
6. [Mobile Delivery](#6-mobile-delivery)
7. [Infrastructure Delivery](#7-infrastructure-delivery)
8. [QA Delivery](#8-qa-delivery)
9. [Sprint Allocation](#9-sprint-allocation)
10. [Critical Path](#10-critical-path)
11. [Risk Mapping](#11-risk-mapping)
12. [Delivery Metrics](#12-delivery-metrics)
13. [Release Plan](#13-release-plan)
14. [Traceability Matrix](#14-traceability-matrix)
15. [Change Control](#15-change-control)

---

# 1. EXECUTIVE SUMMARY

## 1.1 Product Mission

StayOS is an AI-powered two-sided accommodation marketplace purpose-built for MENA (Egypt + GCC corridor). Arabic-first UX. Verified listings. Local Egyptian payment rails (Fawry, Meeza, Vodafone Cash, InstaPay). Trust-first infrastructure.

## 1.2 Delivery Scope

| Dimension | Scope |
|-----------|-------|
| MVP Target | 65 story points — one complete real booking with EGP payment + host payout |
| Backend Completeness | 78% (FC-01–FC-07 implemented; messaging, reviews, FCM, photo upload missing) |
| Web Frontend | 5% (Next.js 14 scaffold only — 95% to build) |
| Mobile | 0% (Flutter framework not started) |
| Infrastructure | 40% (Terraform defined, not provisioned) |
| Total Sprints | S0 (foundation) → S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8 → Beta → RC → Production |

## 1.3 Architecture Freeze (ADR-001 through ADR-016)

All architectural decisions are frozen. No ADR changes are permitted without a formal Change Request.

| ADR | Decision |
|-----|----------|
| ADR-001 | Next.js 14 App Router + TypeScript (frontend) |
| ADR-002 | Python 3.11 / FastAPI / SQLAlchemy 2.0 async (backend) |
| ADR-003 | Paymob (Fawry, Meeza, Vodafone Cash, InstaPay) + Stripe (international cards) |
| ADR-004 | AI provider (Claude / Anthropic) |
| ADR-005 | PostgreSQL 16 + PostGIS for spatial search |
| ADR-006 | RS256 JWT (access 15 min, refresh 7 days, Redis revocation) |
| ADR-007 | AWS me-central-1 (UAE) primary region |
| ADR-008 | SSE + Redis pub/sub for real-time |
| ADR-009 | AWS S3 for storage |
| ADR-010 | PostGIS spatial extension on PostgreSQL |
| ADR-012 | Celery + Redis background task queue |
| ADR-013 | Transactional Outbox pattern |
| ADR-014 | REST API style |
| ADR-015 | amount_minor INTEGER + currency CHAR(3); locale VARCHAR(10); country CHAR(2) |
| ADR-016 | EPOS governance adoption |

## 1.4 Feature Components Implemented

| ID | Feature Component | Status | Tests |
|----|-------------------|--------|-------|
| FC-01 | AuthGate (OTP + Firebase + JWT + RS256) | COMPLETE | ✅ |
| FC-02 | KYC (document upload + Sumsub) | COMPLETE | ✅ |
| FC-03 | PMS / Listings (CRUD + calendar + pricing) | COMPLETE | ✅ |
| FC-04 | Reservation Engine (initiate → confirm → check-in → check-out) | COMPLETE | ✅ |
| FC-05 | Finance & Escrow (Paymob + Stripe + wallets + payouts) | COMPLETE | ✅ |
| FC-06 | OpsManager (tasks + maintenance + staff + readiness) | COMPLETE | ✅ |
| FC-07 | Platform Hardening (security + audit + rate limit + PII + Sentry) | COMPLETE | ✅ |

**Backend baseline: 283 tests, 80.42% coverage. Must not regress below 80%.**

## 1.5 What Remains to Build

| Category | Items |
|----------|-------|
| Backend (Missing) | Messaging service, Reviews service, Email provider, Photo upload API, Device token API, Notification center endpoint, Analytics event log tables |
| Web Frontend | 95% of all screens (Next.js pages, components, RTL, accessibility, SEO) |
| Mobile | 100% (Flutter — full app from scratch) |
| Infrastructure | AWS provisioning, Secrets Manager wiring, CI/CD hardening, monitoring |
| QA | Unit gaps to 90%, Integration tests, E2E suite, Performance, Security scan |

## 1.6 MVP Definition

MVP v1 = one complete, real booking + EGP collection + host payout on production.  
Story points: 65 SP minimum.  
Gate: 10 live transactions + 80 customer interviews before Phase 1 unlock.

---

# 2. PRODUCT BREAKDOWN STRUCTURE

## 2.1 Hierarchy

```
EP (Epic)
└── CAP (Capability)
    └── FEAT (Feature)
        └── US (User Story)
            └── TASK (Engineering Task)
                └── SUB (Subtask)
```

## 2.2 Epic Register

| ID | Epic | Description | Release |
|----|------|-------------|---------|
| EP-01 | Identity & Trust | Authentication, OTP, Firebase, KYC, verification | MVP v1 |
| EP-02 | Property Management | Listings CRUD, calendar, pricing, availability | MVP v1 |
| EP-03 | Discovery & Search | Search, filters, map, PostGIS spatial, recommendations | MVP v1 |
| EP-04 | Booking Engine | Initiation, confirmation, cancellation, check-in, check-out | MVP v1 |
| EP-05 | Payments & Finance | Paymob, Stripe, escrow, wallets, payouts | MVP v1 |
| EP-06 | Operations | Task management, maintenance, staff, readiness scoring | MVP v1 |
| EP-07 | Messaging | Host-guest chat, SSE real-time, admin inbox | V1.1 |
| EP-08 | Reviews & Trust | Guest reviews, host reviews, verified ratings | V1.1 |
| EP-09 | Notifications | Push (FCM), in-app, email, SMS | V1.1 |
| EP-10 | Admin & Moderation | Admin panel, user management, listing moderation, fraud | V1.5 |
| EP-11 | Analytics & AI | Event log, AI pricing, AI recommendations, dashboards | Phase 2 |
| EP-12 | Mobile App | Flutter full mobile application | V1.1 |
| EP-13 | Web Frontend | Next.js 14 complete web application | MVP v1 |
| EP-14 | Infrastructure | AWS, Terraform, Docker, CI/CD, monitoring, security | MVP v1 |
| EP-15 | QA & Testing | Unit, integration, E2E, performance, security testing | MVP v1 |

## 2.3 Capability Map

| Cap ID | Epic | Capability |
|--------|------|------------|
| CAP-01 | EP-01 | OTP Authentication |
| CAP-02 | EP-01 | Firebase Social Login |
| CAP-03 | EP-01 | JWT Token Management |
| CAP-04 | EP-01 | KYC Document Verification |
| CAP-05 | EP-01 | User Profile Management |
| CAP-06 | EP-02 | Listing CRUD |
| CAP-07 | EP-02 | Availability Calendar |
| CAP-08 | EP-02 | Dynamic Pricing Rules |
| CAP-09 | EP-02 | Photo Management |
| CAP-10 | EP-03 | Text Search |
| CAP-11 | EP-03 | Spatial / PostGIS Search |
| CAP-12 | EP-03 | Filter & Sort |
| CAP-13 | EP-03 | Map View |
| CAP-14 | EP-04 | Booking Initiation |
| CAP-15 | EP-04 | Booking Confirmation & Payment Hold |
| CAP-16 | EP-04 | Cancellation & Refund |
| CAP-17 | EP-04 | Check-In & Check-Out |
| CAP-18 | EP-05 | Paymob Integration |
| CAP-19 | EP-05 | Stripe Integration |
| CAP-20 | EP-05 | Escrow Management |
| CAP-21 | EP-05 | Wallet & Ledger |
| CAP-22 | EP-05 | Payout Processing |
| CAP-23 | EP-06 | Task Management |
| CAP-24 | EP-06 | Maintenance Scheduling |
| CAP-25 | EP-06 | Staff Management |
| CAP-26 | EP-06 | Readiness Scoring |
| CAP-27 | EP-07 | Real-Time Messaging |
| CAP-28 | EP-08 | Review Submission |
| CAP-29 | EP-08 | Rating Aggregation |
| CAP-30 | EP-09 | Push Notifications (FCM) |
| CAP-31 | EP-09 | In-App Notification Center |
| CAP-32 | EP-09 | Email Notifications |
| CAP-33 | EP-10 | Admin Dashboard |
| CAP-34 | EP-10 | Listing Moderation |
| CAP-35 | EP-10 | User Management |
| CAP-36 | EP-11 | Analytics Event Log |
| CAP-37 | EP-11 | AI Pricing Engine |
| CAP-38 | EP-13 | Web Auth Screens |
| CAP-39 | EP-13 | Web Search & Discovery |
| CAP-40 | EP-13 | Web Booking Flow |
| CAP-41 | EP-13 | Web Host Management |
| CAP-42 | EP-13 | Web Admin Panel |
| CAP-43 | EP-12 | Mobile Auth & Onboarding |
| CAP-44 | EP-12 | Mobile Discovery |
| CAP-45 | EP-12 | Mobile Booking |
| CAP-46 | EP-12 | Mobile Host Tools |
| CAP-47 | EP-14 | AWS Infrastructure |
| CAP-48 | EP-14 | CI/CD Pipeline |
| CAP-49 | EP-14 | Observability |
| CAP-50 | EP-14 | Security Hardening |
| CAP-51 | EP-15 | Unit Testing |
| CAP-52 | EP-15 | Integration Testing |
| CAP-53 | EP-15 | E2E Testing |
| CAP-54 | EP-15 | Performance Testing |
| CAP-55 | EP-15 | Security Testing |

---

# 3. ENGINEERING BACKLOG

> Format: Every task contains all 14 fields. Nothing is omitted.

## 3.1 Field Definitions

| Field | Description |
|-------|-------------|
| ID | Unique task ID (TASK-nnn) |
| Title | Short descriptive name |
| Description | What must be built |
| Acceptance Criteria | Testable conditions for Done |
| Dependencies | Tasks that must complete first |
| Priority | P0 (blocker) / P1 (critical path) / P2 (important) / P3 (nice-to-have) |
| Complexity | XS (0.5h) / S (1-2h) / M (4-8h) / L (1-2d) / XL (3-5d) |
| Owner | Engineering role responsible |
| Reviewer | Who approves the work |
| Estimated Hours | Best-case estimate |
| Sprint | Sprint assignment (S0–S8, Beta, RC) |
| Evidence Required | Artifact proving completion |
| Definition of Done | Complete DoD checklist |

---

## TRACK A — BACKEND

### TASK-001: Messaging Service — Models & Schema

| Field | Value |
|-------|-------|
| ID | TASK-001 |
| Title | Messaging service models and database schema |
| Description | Create SQLAlchemy models for conversations, messages, message_reads, conversation_participants. Add Alembic migration. |
| Acceptance Criteria | 1. Migration runs without error. 2. Models pass mypy. 3. Tables appear in DB with correct FK constraints. 4. Conversation uniqueness enforced per participant pair. |
| Dependencies | None (PostgreSQL schema available) |
| Priority | P1 |
| Complexity | M |
| Owner | Backend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 6 |
| Sprint | S1 |
| Evidence Required | Migration file committed, mypy output clean |
| Definition of Done | ✅ Migration created and tested ✅ Models in src/app/messaging/models.py ✅ mypy passes ✅ ruff passes ✅ Unit tests cover model constraints |

---

### TASK-002: Messaging Service — Router & SSE Endpoint

| Field | Value |
|-------|-------|
| ID | TASK-002 |
| Title | Messaging router with SSE real-time delivery |
| Description | Implement GET /messages/conversations, POST /messages/conversations/{id}/send, GET /messages/conversations/{id}/stream (SSE). Use Redis pub/sub per ADR-008. |
| Acceptance Criteria | 1. SSE stream delivers messages within 500ms. 2. Auth required on all endpoints. 3. Messages persisted to DB. 4. Read receipts updated on stream connect. |
| Dependencies | TASK-001, Redis available |
| Priority | P1 |
| Complexity | L |
| Owner | Backend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 12 |
| Sprint | S1 |
| Evidence Required | Postman collection showing SSE stream, test coverage ≥80% |
| Definition of Done | ✅ Router registered in main.py ✅ SSE stream tested with concurrent clients ✅ Redis pub/sub wired ✅ Integration tests pass |

---

### TASK-003: Reviews Service — Models & Schema

| Field | Value |
|-------|-------|
| ID | TASK-003 |
| Title | Reviews service models and database schema |
| Description | Create SQLAlchemy models for reviews, review_responses, review_aggregates. Guest reviews listing. Host reviews guest. Both require completed reservation. |
| Acceptance Criteria | 1. Migration runs. 2. One review per reservation per direction enforced. 3. Aggregate rating auto-computes on insert. |
| Dependencies | Reservations schema (alembic/versions/005) |
| Priority | P1 |
| Complexity | M |
| Owner | Backend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 5 |
| Sprint | S1 |
| Evidence Required | Migration file, model tests |
| Definition of Done | ✅ Migration clean ✅ One-review constraint tested ✅ Aggregate computed ✅ mypy clean |

---

### TASK-004: Reviews Service — Router

| Field | Value |
|-------|-------|
| ID | TASK-004 |
| Title | Reviews router — submit, list, aggregate |
| Description | POST /reviews/, GET /reviews/listings/{unit_id}, GET /reviews/guests/{user_id}, POST /reviews/{id}/response. Require reservation status=checked_out. |
| Acceptance Criteria | 1. Cannot submit review without completed reservation. 2. Host can respond once. 3. Listing average rating updates. 4. All endpoints auth-gated. |
| Dependencies | TASK-003, FC-04 (reservations) |
| Priority | P1 |
| Complexity | M |
| Owner | Backend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S1 |
| Evidence Required | API tests, coverage report |
| Definition of Done | ✅ All endpoints return correct status codes ✅ Business rules enforced ✅ 80%+ test coverage |

---

### TASK-005: Photo Upload API — S3 Presigned URLs

| Field | Value |
|-------|-------|
| ID | TASK-005 |
| Title | Photo upload API with S3 presigned URL generation |
| Description | POST /media/upload-url returns presigned S3 URL for direct client upload per ADR-009. Accept content-type, file size limit 10MB, image/* only. POST /media/confirm after upload. |
| Acceptance Criteria | 1. Presigned URL expires in 15 minutes. 2. Confirms file exists in S3 before returning public URL. 3. Rejects non-image types. 4. File size enforced. |
| Dependencies | AWS S3 bucket provisioned (TASK-INF-003) |
| Priority | P1 |
| Complexity | M |
| Owner | Backend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 6 |
| Sprint | S0 |
| Evidence Required | S3 upload verified end-to-end in staging |
| Definition of Done | ✅ Presigned URL generation working ✅ Confirm endpoint validates S3 presence ✅ Tests mock boto3 ✅ Error paths tested |

---

### TASK-006: FCM Device Token Registration API

| Field | Value |
|-------|-------|
| ID | TASK-006 |
| Title | FCM device token registration and management |
| Description | POST /notifications/devices (register token), DELETE /notifications/devices/{token} (unregister). Store in user_device_tokens table. Associate with user_id. |
| Acceptance Criteria | 1. Token stored per user per device. 2. Old token replaced on re-register. 3. Unregister cleans FCM subscription. 4. Async task sends FCM test message on first register. |
| Dependencies | FC-07 (notifications module exists), Firebase Admin SDK configured |
| Priority | P1 |
| Complexity | S |
| Owner | Backend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 4 |
| Sprint | S1 |
| Evidence Required | FCM message received on test device |
| Definition of Done | ✅ DB table migration ✅ Token stored/replaced correctly ✅ FCM test push confirmed ✅ Tests pass |

---

### TASK-007: Notification Center Endpoint

| Field | Value |
|-------|-------|
| ID | TASK-007 |
| Title | In-app notification center GET endpoint |
| Description | GET /notifications/me — return paginated notifications for authenticated user. PATCH /notifications/{id}/read — mark read. PATCH /notifications/read-all. |
| Acceptance Criteria | 1. Returns unread count in header. 2. Pagination via cursor. 3. Read status persisted. 4. Only own notifications returned. |
| Dependencies | FC-07 (notifications module), TASK-006 |
| Priority | P2 |
| Complexity | S |
| Owner | Backend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 4 |
| Sprint | S1 |
| Evidence Required | API test showing correct user isolation |
| Definition of Done | ✅ Pagination works ✅ User isolation enforced ✅ Unread count correct ✅ Tests pass |

---

### TASK-008: Analytics Event Log — Model & Ingestion API

| Field | Value |
|-------|-------|
| ID | TASK-008 |
| Title | Analytics event log table and ingestion endpoint |
| Description | Create analytics_events table per ADR-015 (locale VARCHAR(10), country CHAR(2), amount_minor INTEGER, currency CHAR(3)). POST /analytics/events — batch ingest from web/mobile. Async Celery task processes batch. |
| Acceptance Criteria | 1. Events stored with timestamp, user_id (nullable), session_id, event_type, properties JSONB. 2. Batch endpoint accepts up to 100 events. 3. No PII stored in event properties. |
| Dependencies | Celery (ADR-012), FC-07 security (PII scrubbing) |
| Priority | P3 |
| Complexity | M |
| Owner | Backend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 6 |
| Sprint | S2 |
| Evidence Required | Migration, ingestion test |
| Definition of Done | ✅ Migration clean ✅ Batch ingest tested ✅ PII scrub verified ✅ Celery task tested |

---

### TASK-009: CORS Configuration Fix

| Field | Value |
|-------|-------|
| ID | TASK-009 |
| Title | CORS configuration — web and mobile origins |
| Description | Configure FastAPI CORS middleware with correct allowed origins for production, staging, localhost. Allow credentials. Expose SSE headers. |
| Acceptance Criteria | 1. Web app origin allowed in prod. 2. Mobile deep link origin allowed. 3. CORS preflight returns 200. 4. Credentials=true works with specific origins (not wildcard). |
| Dependencies | ADR-007 (AWS region / domains known) |
| Priority | P0 |
| Complexity | XS |
| Owner | Backend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 1 |
| Sprint | S0 |
| Evidence Required | Browser CORS check in staging |
| Definition of Done | ✅ No wildcard CORS in prod ✅ Credentials flow works ✅ SSE headers pass |

---

### TASK-010: Secrets Manager Wiring

| Field | Value |
|-------|-------|
| ID | TASK-010 |
| Title | AWS Secrets Manager integration for all secrets |
| Description | Wire src/app/security/secrets.py to pull all secrets from AWS Secrets Manager at startup. Remove any hardcoded values. Rotate Paymob, Stripe, Firebase, SMTP secrets. |
| Acceptance Criteria | 1. No secrets in environment variables in production. 2. Startup fails fast if secret missing. 3. Secret rotation does not require restart. |
| Dependencies | AWS provisioned (TASK-INF-001), IAM role for ECS task (TASK-INF-002) |
| Priority | P0 |
| Complexity | M |
| Owner | Backend Engineer + DevOps |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S0 |
| Evidence Required | Production startup log shows secrets loaded from AWS SM |
| Definition of Done | ✅ No secrets in .env in prod ✅ Rotation tested ✅ Startup failure on missing secret tested |

---

### TASK-011: Email Provider Integration

| Field | Value |
|-------|-------|
| ID | TASK-011 |
| Title | Email provider — SES integration for transactional email |
| Description | Wire AWS SES into notifications/providers.py. Implement send_email(to, subject, html_body, text_body). Templates: booking confirmation, OTP fallback, payout notification, KYC status. |
| Acceptance Criteria | 1. SES sandbox → production verified. 2. All 4 templates send correctly. 3. Bounce handling via SNS webhook. 4. Async Celery task wraps send. |
| Dependencies | AWS SES domain verified (TASK-INF-004), SMTP credentials in Secrets Manager (TASK-010) |
| Priority | P1 |
| Complexity | M |
| Owner | Backend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S1 |
| Evidence Required | All 4 email templates received in inbox |
| Definition of Done | ✅ SES integration functional ✅ Templates rendered correctly ✅ Bounce SNS wired ✅ Tests mock SES |

---

## TRACK B — WEB FRONTEND

### TASK-FE-001: Next.js 14 Project Setup — RTL, i18n, Theme

| Field | Value |
|-------|-------|
| ID | TASK-FE-001 |
| Title | Next.js 14 base configuration — RTL, i18n, Tailwind, theme |
| Description | Configure next-intl for Arabic/English. Configure Tailwind with RTL plugin. Set up Arabic (Cairo) + English (Inter) fonts. Create design tokens: colors, spacing, radius, shadows. |
| Acceptance Criteria | 1. /ar route renders RTL. 2. /en route renders LTR. 3. Font loads correctly. 4. Design tokens match brand spec. 5. No hydration errors. |
| Dependencies | Node.js, pnpm workspace |
| Priority | P0 |
| Complexity | M |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S0 |
| Evidence Required | Browser screenshots AR + EN rendering |
| Definition of Done | ✅ RTL verified in Chrome ✅ i18n routing works ✅ No hydration errors ✅ Fonts load < 100ms |

---

### TASK-FE-002: API Client — Axios/Fetch + Auth Token Interceptor

| Field | Value |
|-------|-------|
| ID | TASK-FE-002 |
| Title | Web API client with auth token interceptor and refresh logic |
| Description | Create apps/web/lib/api.ts — configured axios/fetch client. Auto-attach JWT Bearer. On 401, call /auth/refresh, retry original. On second 401, redirect to login. |
| Acceptance Criteria | 1. Access token attached to all protected requests. 2. 401 triggers silent refresh. 3. Token stored in httpOnly cookie (not localStorage). 4. CSRF token on mutations. |
| Dependencies | TASK-FE-001, FC-01 (auth endpoints) |
| Priority | P0 |
| Complexity | M |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 6 |
| Sprint | S0 |
| Evidence Required | Network trace showing token refresh without user impact |
| Definition of Done | ✅ Token in httpOnly cookie ✅ Silent refresh working ✅ CSRF on POST/PUT/DELETE ✅ Tests cover refresh flow |

---

### TASK-FE-003: SCR-003 — Phone Entry / OTP Request Screen

| Field | Value |
|-------|-------|
| ID | TASK-FE-003 |
| Title | Phone entry screen — OTP request (Web) |
| Description | Implement /[locale]/auth/phone — phone number input with country selector (EGY +20 default). POST /auth/otp/send on submit. Arabic + English copy. RTL input layout. |
| Acceptance Criteria | 1. Egyptian phone format validated (+20 10xxxxxxxx). 2. Loading state on submit. 3. Error displayed inline. 4. RTL layout correct. 5. Accessible (WCAG AA). |
| Dependencies | TASK-FE-002, FC-01 OTP endpoint |
| Priority | P0 |
| Complexity | S |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 4 |
| Sprint | S1 |
| Evidence Required | Screenshot + Lighthouse a11y score ≥90 |
| Definition of Done | ✅ Phone validation works ✅ API call correct ✅ RTL verified ✅ Error states shown ✅ Accessible |

---

### TASK-FE-004: SCR-004 — OTP Verify Screen (Web)

| Field | Value |
|-------|-------|
| ID | TASK-FE-004 |
| Title | OTP verification screen (Web) |
| Description | 6-digit OTP input with auto-advance. POST /auth/otp/verify. On success → JWT stored → redirect to intended page. Resend countdown 60 seconds. |
| Acceptance Criteria | 1. Auto-focus next digit on input. 2. Paste full OTP works. 3. Resend timer visible. 4. On success, redirect to return URL or /home. |
| Dependencies | TASK-FE-003 |
| Priority | P0 |
| Complexity | S |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 4 |
| Sprint | S1 |
| Evidence Required | E2E test OTP flow |
| Definition of Done | ✅ OTP input UX polished ✅ Paste works ✅ Redirect correct ✅ Resend functional |

---

### TASK-FE-005: SCR-005 — Social Login (Firebase) Screen (Web)

| Field | Value |
|-------|-------|
| ID | TASK-FE-005 |
| Title | Firebase social login — Google OAuth (Web) |
| Description | Google sign-in button → Firebase popup → POST /auth/firebase with ID token → JWT stored. Handle existing account merge. |
| Acceptance Criteria | 1. Google popup opens. 2. Firebase token POSTed to backend. 3. JWT stored correctly. 4. Existing OTP account merged. |
| Dependencies | TASK-FE-002, Firebase project configured |
| Priority | P1 |
| Complexity | S |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 4 |
| Sprint | S1 |
| Evidence Required | Google login flow working in staging |
| Definition of Done | ✅ Google login functional ✅ Token exchange correct ✅ Merge case handled |

---

### TASK-FE-006: SCR-009 — KYC Pending Screen (Web)

| Field | Value |
|-------|-------|
| ID | TASK-FE-006 |
| Title | KYC status / pending screen (Web) |
| Description | Poll GET /kyc/status every 10s. Show: pending / under_review / approved / rejected states with appropriate UI. Rejection shows reason + retry CTA. |
| Acceptance Criteria | 1. Polling stops on terminal state. 2. Approved redirects to intended page. 3. Rejection shows human-readable reason. 4. Loading skeleton shown during poll. |
| Dependencies | TASK-FE-002, FC-02 (KYC endpoint) |
| Priority | P1 |
| Complexity | S |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 3 |
| Sprint | S1 |
| Evidence Required | All 4 states rendered in screenshot |
| Definition of Done | ✅ All states shown ✅ Polling stops at terminal state ✅ Retry CTA works |

---

### TASK-FE-007: SCR-011 — Search Results Page (Web)

| Field | Value |
|-------|-------|
| ID | TASK-FE-007 |
| Title | Search results page with filters (Web) |
| Description | GET /listings/ with query params (location, checkin, checkout, guests, price_min, price_max, amenities). Grid layout. Skeleton loading. Infinite scroll or pagination. |
| Acceptance Criteria | 1. Results render within 2s. 2. Filters update URL params. 3. Skeleton shown during load. 4. Empty state shown. 5. RTL grid layout correct. |
| Dependencies | TASK-FE-002, FC-03 listings API |
| Priority | P0 |
| Complexity | L |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 12 |
| Sprint | S2 |
| Evidence Required | Lighthouse performance ≥80, screenshot |
| Definition of Done | ✅ Results load ✅ Filters work ✅ URL params sync ✅ Empty state ✅ RTL ✅ Pagination |

---

### TASK-FE-008: SCR-014 — Listing Detail Page (Web)

| Field | Value |
|-------|-------|
| ID | TASK-FE-008 |
| Title | Listing detail page (Web) |
| Description | GET /listings/{id}. Show: photo gallery, title, location, description, amenities, pricing calendar, host info, reviews, Book CTA. OG meta tags for SEO. |
| Acceptance Criteria | 1. Photos load lazily. 2. Pricing calendar shows availability. 3. Book CTA requires auth. 4. OG tags correct for sharing. 5. Structured data (JSON-LD). |
| Dependencies | TASK-FE-007, TASK-FE-002 |
| Priority | P0 |
| Complexity | L |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 14 |
| Sprint | S2 |
| Evidence Required | Lighthouse SEO ≥90, screenshot |
| Definition of Done | ✅ All sections rendered ✅ SEO meta correct ✅ Auth gate on CTA ✅ Calendar accurate |

---

### TASK-FE-009: SCR-016-018 — Booking Flow (Web)

| Field | Value |
|-------|-------|
| ID | TASK-FE-009 |
| Title | Booking flow — summary, payment, confirmation (Web) |
| Description | 3-step flow: (1) Booking Summary (POST /reservations/initiate), (2) Payment (Paymob iframe), (3) Confirmation. Handle Paymob callback. |
| Acceptance Criteria | 1. Total price calculated correctly. 2. Paymob iframe loads. 3. Payment success → confirmation screen. 4. Failed payment → retry shown. 5. Booking in DB on success. |
| Dependencies | TASK-FE-008, FC-04 (reservations), FC-05 (finance) |
| Priority | P0 |
| Complexity | XL |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 20 |
| Sprint | S3 |
| Evidence Required | End-to-end booking test with real Paymob sandbox |
| Definition of Done | ✅ Full flow working ✅ Paymob iframe tested ✅ Success/failure states ✅ DB record confirmed |

---

### TASK-FE-010: SCR-019-020 — Trips / Booking History (Web)

| Field | Value |
|-------|-------|
| ID | TASK-FE-010 |
| Title | Trips list and trip detail pages (Web) |
| Description | GET /reservations/ (paginated). GET /reservations/{id} (detail with status timeline). Actions: cancel (if policy allows), download receipt. |
| Acceptance Criteria | 1. Trips sorted by date desc. 2. Status shown with icon. 3. Cancellation flow with confirm dialog. 4. Receipt PDF link. |
| Dependencies | TASK-FE-009, FC-04 |
| Priority | P1 |
| Complexity | M |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S3 |
| Evidence Required | Screenshot all trip states |
| Definition of Done | ✅ All states rendered ✅ Cancel works ✅ Receipt accessible |

---

### TASK-FE-011: SCR-033-034 — Host Dashboard & My Listings (Web)

| Field | Value |
|-------|-------|
| ID | TASK-FE-011 |
| Title | Host dashboard and listings management (Web) |
| Description | GET /listings/host/dashboard — revenue summary, occupancy, pending tasks. GET listings list. Publish/unpublish toggle. Quick actions. |
| Acceptance Criteria | 1. Revenue shown in EGP. 2. Occupancy rate calculated. 3. Pending tasks count shown. 4. Publish toggle updates immediately. |
| Dependencies | TASK-FE-002, FC-03, FC-06 |
| Priority | P1 |
| Complexity | L |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 12 |
| Sprint | S3 |
| Evidence Required | Screenshot with data |
| Definition of Done | ✅ Dashboard metrics correct ✅ Toggle works ✅ Tasks visible |

---

### TASK-FE-012: SCR-035-040 — New Listing Creation Wizard (Web, 6 Steps)

| Field | Value |
|-------|-------|
| ID | TASK-FE-012 |
| Title | New listing creation wizard — 6-step form (Web) |
| Description | Step 1: Property type. Step 2: Location + map pin. Step 3: Amenities. Step 4: Photos (presigned upload). Step 5: Pricing + rules. Step 6: Availability + review + publish. POST /listings/. |
| Acceptance Criteria | 1. Progress bar shows step. 2. Each step validates before Next. 3. Photo upload uses presigned URL (TASK-005). 4. Map pin sets coordinates. 5. Draft saved on browser close. |
| Dependencies | TASK-FE-011, TASK-005, FC-03 |
| Priority | P1 |
| Complexity | XL |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 24 |
| Sprint | S3 |
| Evidence Required | Full listing creation E2E test |
| Definition of Done | ✅ All 6 steps complete ✅ Validation on each step ✅ Photos upload ✅ Map pin works ✅ Publish creates live listing |

---

### TASK-FE-013: SCR-027 — Wallet & Payout Request (Web)

| Field | Value |
|-------|-------|
| ID | TASK-FE-013 |
| Title | Wallet and payout request screen (Web) |
| Description | GET /finance/wallets/me — show balance. GET /finance/wallets/{id}/ledger — transaction history. POST /finance/payouts — request payout (min amount EGP 100). |
| Acceptance Criteria | 1. Balance in EGP. 2. Ledger paginated. 3. Payout request with bank details. 4. Pending payout shown. |
| Dependencies | TASK-FE-002, FC-05 |
| Priority | P1 |
| Complexity | M |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S4 |
| Evidence Required | Payout request E2E test |
| Definition of Done | ✅ Balance correct ✅ Ledger loads ✅ Payout request submitted ✅ Pending state shown |

---

### TASK-FE-014: Global Error Boundary, Loading Skeletons, Empty States

| Field | Value |
|-------|-------|
| ID | TASK-FE-014 |
| Title | Global error boundary, loading skeletons, and empty states |
| Description | Implement React error boundary for all pages. Create skeleton components matching each page layout. Define empty state illustrations for: no results, no trips, no listings, error. |
| Acceptance Criteria | 1. Error boundary catches render errors without crashing app. 2. Skeleton matches page layout. 3. Empty states have actionable CTA. 4. Network error shows retry button. |
| Dependencies | TASK-FE-001 |
| Priority | P1 |
| Complexity | M |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S1 |
| Evidence Required | Screenshot all empty/error states |
| Definition of Done | ✅ Error boundary in place ✅ Skeletons match layout ✅ Empty states have CTA ✅ Retry works |

---

### TASK-FE-015: SEO — sitemap.xml, robots.txt, OG, JSON-LD

| Field | Value |
|-------|-------|
| ID | TASK-FE-015 |
| Title | SEO foundation — sitemap, robots, OG tags, structured data |
| Description | Dynamic sitemap.xml (all published listings). robots.txt. Open Graph tags on listing pages. JSON-LD schema (LodgingBusiness). Arabic hreflang. |
| Acceptance Criteria | 1. sitemap.xml validates. 2. OG tags appear on listing pages. 3. JSON-LD validates in Google Rich Results test. 4. hreflang AR/EN correct. |
| Dependencies | TASK-FE-008 |
| Priority | P2 |
| Complexity | M |
| Owner | Frontend Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 6 |
| Sprint | S4 |
| Evidence Required | Google Rich Results test passing |
| Definition of Done | ✅ Sitemap generates ✅ OG tags correct ✅ JSON-LD valid ✅ hreflang set |

---

## TRACK C — MOBILE (FLUTTER)

### TASK-MOB-001: Flutter Project Initialization

| Field | Value |
|-------|-------|
| ID | TASK-MOB-001 |
| Title | Flutter project setup — mono-repo integration, DI, routing |
| Description | Initialize Flutter project in apps/mobile/. Configure: go_router (navigation), riverpod (state), dio (HTTP), flutter_localizations + ARB (AR/EN). Configure CI build. |
| Acceptance Criteria | 1. flutter run succeeds on iOS + Android. 2. AR locale renders RTL. 3. Basic route /splash → /home works. 4. DI container initializes. |
| Dependencies | Mobile framework decision (BLK-01 resolved) |
| Priority | P0 |
| Complexity | L |
| Owner | Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 12 |
| Sprint | S1 |
| Evidence Required | Screenshot app running on both platforms |
| Definition of Done | ✅ Runs on iOS ✅ Runs on Android ✅ RTL works ✅ Routing initialized ✅ DI works |

---

### TASK-MOB-002: SCR-001-002 — Splash + Onboarding (Mobile)

| Field | Value |
|-------|-------|
| ID | TASK-MOB-002 |
| Title | Splash screen and onboarding carousel (Mobile) |
| Description | Animated splash screen with StayOS logo. 3-slide onboarding carousel (skip if seen before). Stored in SharedPreferences. |
| Acceptance Criteria | 1. Splash shows ≤2s. 2. Onboarding skippable. 3. Never shown again after first view. 4. AR/EN localized copy. |
| Dependencies | TASK-MOB-001 |
| Priority | P1 |
| Complexity | S |
| Owner | Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 6 |
| Sprint | S1 |
| Evidence Required | Video recording of flow |
| Definition of Done | ✅ Splash ≤2s ✅ Skip works ✅ Shown once ✅ Localized |

---

### TASK-MOB-003: SCR-003-004 — OTP Auth Flow (Mobile)

| Field | Value |
|-------|-------|
| ID | TASK-MOB-003 |
| Title | OTP authentication — phone entry + OTP verify (Mobile) |
| Description | Phone entry → POST /auth/otp/send → OTP entry (6-digit, auto-advance) → POST /auth/otp/verify → JWT stored in flutter_secure_storage. |
| Acceptance Criteria | 1. Egyptian phone validation. 2. 6-digit OTP auto-advances. 3. JWT in secure storage. 4. Resend timer. 5. RTL input. |
| Dependencies | TASK-MOB-001, FC-01 |
| Priority | P0 |
| Complexity | M |
| Owner | Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S1 |
| Evidence Required | Auth flow video on device |
| Definition of Done | ✅ Phone validates ✅ OTP sent/received ✅ JWT secure storage ✅ RTL ✅ Error states |

---

### TASK-MOB-004: SCR-006-009 — KYC Flow (Mobile)

| Field | Value |
|-------|-------|
| ID | TASK-MOB-004 |
| Title | KYC document capture + selfie + pending screen (Mobile) |
| Description | Camera capture (image_picker). Upload via presigned URL (TASK-005). POST /kyc/submit. Poll GET /kyc/status. Show pending/approved/rejected states. |
| Acceptance Criteria | 1. Camera permissions requested correctly. 2. Image compressed before upload. 3. Upload progress shown. 4. Polling stops at terminal state. |
| Dependencies | TASK-MOB-003, TASK-005, FC-02 |
| Priority | P1 |
| Complexity | L |
| Owner | Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 12 |
| Sprint | S2 |
| Evidence Required | KYC flow video on real device |
| Definition of Done | ✅ Camera works ✅ Upload complete ✅ Status polling ✅ All states shown |

---

### TASK-MOB-005: SCR-010 — Home / Discovery (Mobile)

| Field | Value |
|-------|-------|
| ID | TASK-MOB-005 |
| Title | Home / Discovery screen (Mobile) |
| Description | GET /listings/ with default params. Horizontal category scroll. Vertical featured listings grid. Search bar opens SCR-011. Location permission → coordinates sent. |
| Acceptance Criteria | 1. Listings load within 2s. 2. Location permission handled gracefully (denied = city default). 3. Category filter works. 4. Pull-to-refresh. |
| Dependencies | TASK-MOB-003, FC-03 |
| Priority | P0 |
| Complexity | L |
| Owner | Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 10 |
| Sprint | S2 |
| Evidence Required | Screenshot with real data |
| Definition of Done | ✅ Loads listings ✅ Location permission ✅ Pull-to-refresh ✅ Category filter ✅ RTL |

---

### TASK-MOB-006: SCR-012 — Map View (Mobile)

| Field | Value |
|-------|-------|
| ID | TASK-MOB-006 |
| Title | Map view with listing pins (Mobile) |
| Description | Google Maps integration. Listing markers with price labels. Tap pin → mini-card → tap card → SCR-014. Cluster markers at zoom out. |
| Acceptance Criteria | 1. Map loads with listing pins. 2. Clustering works. 3. Pin tap shows mini-card. 4. Mini-card links to detail. |
| Dependencies | TASK-MOB-005, Google Maps API key configured |
| Priority | P1 |
| Complexity | L |
| Owner | Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 10 |
| Sprint | S3 |
| Evidence Required | Video of map interaction |
| Definition of Done | ✅ Map loads ✅ Pins show ✅ Clustering ✅ Tap works |

---

### TASK-MOB-007: SCR-011/013 — Search Results + Filters (Mobile)

| Field | Value |
|-------|-------|
| ID | TASK-MOB-007 |
| Title | Search results + filter sheet (Mobile) |
| Description | Search bar → GET /listings/ with params. Bottom sheet filter: price range (slider), amenities (checkboxes), property type (chips), availability. Apply filter refreshes results. |
| Acceptance Criteria | 1. Filter state persisted across closes. 2. Amenity count shown on filter button. 3. Clear all resets. 4. RTL layout. |
| Dependencies | TASK-MOB-005 |
| Priority | P1 |
| Complexity | M |
| Owner | Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S2 |
| Evidence Required | Screenshot all filter states |
| Definition of Done | ✅ Search works ✅ Filters apply ✅ State persists ✅ RTL |

---

### TASK-MOB-008: SCR-014-015 — Listing Detail + Calendar (Mobile)

| Field | Value |
|-------|-------|
| ID | TASK-MOB-008 |
| Title | Listing detail page + availability calendar (Mobile) |
| Description | Photo gallery (PageView, swipe). Scrolling detail sections. Availability calendar (blocked dates greyed). Book CTA sticky at bottom. |
| Acceptance Criteria | 1. Photos swipe. 2. Calendar shows blocked dates. 3. Book CTA disabled if dates not selected. 4. Deep link opens this screen. |
| Dependencies | TASK-MOB-007, FC-03 |
| Priority | P0 |
| Complexity | L |
| Owner | Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 12 |
| Sprint | S2 |
| Evidence Required | Screenshot + deep link test |
| Definition of Done | ✅ Photos swipe ✅ Calendar accurate ✅ CTA gated ✅ Deep link works |

---

### TASK-MOB-009: SCR-016-018 — Booking Flow (Mobile)

| Field | Value |
|-------|-------|
| ID | TASK-MOB-009 |
| Title | Booking flow — summary, payment, confirmation (Mobile) |
| Description | Booking summary screen → Paymob WebView payment → confirmation. Handle Paymob deep link callback. Show booking ID on success. |
| Acceptance Criteria | 1. Summary shows dates, price breakdown. 2. Paymob WebView loads. 3. Payment callback handled. 4. Success shows confirmation. 5. Failed shows retry. |
| Dependencies | TASK-MOB-008, FC-04, FC-05 |
| Priority | P0 |
| Complexity | XL |
| Owner | Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 16 |
| Sprint | S3 |
| Evidence Required | Full booking E2E on device |
| Definition of Done | ✅ Summary correct ✅ Paymob WebView works ✅ Callback handled ✅ Confirmation shown |

---

### TASK-MOB-010: SCR-021-023 — Check-In / Check-Out (Mobile)

| Field | Value |
|-------|-------|
| ID | TASK-MOB-010 |
| Title | Self check-in, active stay, check-out screens (Mobile) |
| Description | SCR-021: POST /reservations/{id}/check-in → show access code / door instructions. SCR-022: Active stay dashboard (time remaining, support contact). SCR-023: POST /reservations/{id}/check-out. |
| Acceptance Criteria | 1. Check-in only available within 2h of start time. 2. Access instructions shown clearly. 3. Check-out confirms with dialog. 4. Review prompt shown after check-out. |
| Dependencies | TASK-MOB-009, FC-04 |
| Priority | P1 |
| Complexity | M |
| Owner | Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 10 |
| Sprint | S4 |
| Evidence Required | Check-in/out flow video |
| Definition of Done | ✅ Time gate works ✅ Instructions shown ✅ Check-out confirmed ✅ Review prompted |

---

### TASK-MOB-011: FCM Push Notification Integration (Mobile)

| Field | Value |
|-------|-------|
| ID | TASK-MOB-011 |
| Title | FCM push notifications — permission + registration + display (Mobile) |
| Description | Request push permission (iOS). Register FCM token → POST /notifications/devices. Handle foreground + background notifications. Navigate to correct screen on tap. |
| Acceptance Criteria | 1. Permission requested on first auth. 2. Token registered. 3. Notification received in foreground. 4. Tap navigates to correct screen. 5. Background delivery works. |
| Dependencies | TASK-MOB-003, TASK-006, Firebase project |
| Priority | P1 |
| Complexity | M |
| Owner | Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S2 |
| Evidence Required | Push notification received on device from API trigger |
| Definition of Done | ✅ Permission works ✅ Token registered ✅ Foreground shown ✅ Tap navigates ✅ Background tested |

---

### TASK-MOB-012: Offline Mode — Local Cache & Graceful Degradation

| Field | Value |
|-------|-------|
| ID | TASK-MOB-012 |
| Title | Offline mode — local cache for key screens |
| Description | Cache last-viewed listings, active trips, and profile using Hive. Show "offline" banner when no connectivity. Disable booking/payment actions offline. |
| Acceptance Criteria | 1. Previously loaded listings shown offline. 2. Active trip info available offline. 3. Offline banner visible. 4. Payment action blocked with message. |
| Dependencies | TASK-MOB-005, TASK-MOB-009 |
| Priority | P2 |
| Complexity | M |
| Owner | Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S4 |
| Evidence Required | Video with airplane mode enabled |
| Definition of Done | ✅ Cache works ✅ Banner shown ✅ Payment blocked ✅ Data stale-indicator visible |

---

## TRACK D — INFRASTRUCTURE

### TASK-INF-001: AWS Core Infrastructure — VPC, ECS, RDS, Redis

| Field | Value |
|-------|-------|
| ID | TASK-INF-001 |
| Title | AWS core infrastructure provisioning — VPC, ECS Fargate, RDS PostgreSQL 16, ElastiCache Redis |
| Description | Apply Terraform in infra/terraform/. Provision: VPC (2 AZ), ECS Fargate cluster, RDS PostgreSQL 16 (Multi-AZ), ElastiCache Redis (cluster mode). Region: me-central-1 (ADR-007). |
| Acceptance Criteria | 1. RDS reachable from ECS task. 2. Redis reachable. 3. No public RDS/Redis endpoints. 4. VPC flow logs enabled. 5. All in me-central-1. |
| Dependencies | AWS account + credentials (BLK-01 resolved), Terraform state bucket |
| Priority | P0 |
| Complexity | XL |
| Owner | DevOps |
| Reviewer | Tech Lead |
| Estimated Hours | 16 |
| Sprint | S0 |
| Evidence Required | Terraform plan/apply output, AWS console screenshots |
| Definition of Done | ✅ Terraform apply succeeds ✅ RDS accessible ✅ Redis accessible ✅ No public endpoints ✅ Flow logs on |

---

### TASK-INF-002: IAM Roles — ECS Task Role, CI/CD Role

| Field | Value |
|-------|-------|
| ID | TASK-INF-002 |
| Title | IAM roles — ECS task role + CI/CD deploy role |
| Description | ECS task role: S3 read/write, Secrets Manager read, SES send. CI/CD role: ECR push, ECS deploy, S3 sync. Least-privilege. No wildcard permissions. |
| Acceptance Criteria | 1. Task role allows S3, SM, SES only. 2. CI/CD role allows ECR + ECS only. 3. No admin IAM policies. 4. Roles attached in Terraform. |
| Dependencies | TASK-INF-001 |
| Priority | P0 |
| Complexity | M |
| Owner | DevOps |
| Reviewer | Tech Lead |
| Estimated Hours | 6 |
| Sprint | S0 |
| Evidence Required | IAM policy JSON review, no overly permissive actions |
| Definition of Done | ✅ Least-privilege confirmed ✅ No wildcards ✅ Roles functional |

---

### TASK-INF-003: S3 Buckets — Media, Backups, Terraform State

| Field | Value |
|-------|-------|
| ID | TASK-INF-003 |
| Title | S3 buckets — media storage, backups, Terraform state |
| Description | Create: stayos-media-{env} (photo uploads, public-read via CloudFront), stayos-backups-{env} (encrypted, versioned, private), stayos-tf-state (Terraform state, versioned). Configure lifecycle rules. |
| Acceptance Criteria | 1. Media bucket has CloudFront distribution. 2. Backup bucket encrypted at rest. 3. All buckets block public access (except media via CloudFront). 4. Lifecycle: media 90d Glacier, backups 30d retention. |
| Dependencies | TASK-INF-001 |
| Priority | P0 |
| Complexity | M |
| Owner | DevOps |
| Reviewer | Tech Lead |
| Estimated Hours | 6 |
| Sprint | S0 |
| Evidence Required | Bucket policy docs, CloudFront distribution URL |
| Definition of Done | ✅ Buckets created ✅ CloudFront wired ✅ Lifecycle rules set ✅ Encryption confirmed |

---

### TASK-INF-004: AWS SES — Domain Verification + DKIM + DMARC

| Field | Value |
|-------|-------|
| ID | TASK-INF-004 |
| Title | AWS SES domain verification with DKIM and DMARC |
| Description | Verify stayos.com (or staging domain) in SES. Configure DKIM (Route 53 records). Set DMARC policy. Move SES out of sandbox (production access request). Set up SNS for bounce/complaint handling. |
| Acceptance Criteria | 1. SES domain verified. 2. DKIM pass on test email. 3. DMARC record set. 4. SES out of sandbox. 5. Bounce SNS topic created. |
| Dependencies | Domain registered, AWS account |
| Priority | P1 |
| Complexity | M |
| Owner | DevOps |
| Reviewer | Tech Lead |
| Estimated Hours | 4 |
| Sprint | S1 |
| Evidence Required | Email headers showing DKIM pass, SES sending quota confirmed |
| Definition of Done | ✅ DKIM pass ✅ DMARC set ✅ Production access ✅ Bounce handling wired |

---

### TASK-INF-005: GitHub Actions CI/CD Pipeline

| Field | Value |
|-------|-------|
| ID | TASK-INF-005 |
| Title | GitHub Actions CI/CD — build, test, deploy to ECS |
| Description | ci.yml: on push to main → run tests (pytest, jest, flutter test) → build Docker images → push to ECR → deploy to ECS (rolling update). Separate staging + production workflows. |
| Acceptance Criteria | 1. Tests run on every PR. 2. Deploy only on main merge. 3. Rollback on failed deploy. 4. Slack notification on deploy. 5. No secrets in logs. |
| Dependencies | TASK-INF-001, TASK-INF-002, ECR repositories |
| Priority | P0 |
| Complexity | L |
| Owner | DevOps |
| Reviewer | Tech Lead |
| Estimated Hours | 12 |
| Sprint | S0 |
| Evidence Required | Successful CI run on main branch |
| Definition of Done | ✅ Tests run on PR ✅ Deploy on merge ✅ Rollback works ✅ No secret leaks |

---

### TASK-INF-006: Observability — CloudWatch + Sentry + Structured Logging

| Field | Value |
|-------|-------|
| ID | TASK-INF-006 |
| Title | Observability stack — CloudWatch dashboards, Sentry, structured logs |
| Description | CloudWatch: ECS metrics dashboard (CPU, memory, request count, error rate, P95 latency). Sentry: DSN configured for backend + web + mobile. Structured JSON logging in FastAPI. Log groups with 30-day retention. |
| Acceptance Criteria | 1. CloudWatch dashboard shows all 5 metrics. 2. Sentry receives errors from all 3 surfaces. 3. Logs are JSON structured. 4. Alert on >5% error rate. |
| Dependencies | TASK-INF-001, FC-07 (Sentry stub wired) |
| Priority | P1 |
| Complexity | L |
| Owner | DevOps |
| Reviewer | Tech Lead |
| Estimated Hours | 10 |
| Sprint | S1 |
| Evidence Required | Sentry event + CloudWatch screenshot |
| Definition of Done | ✅ Sentry events visible ✅ CloudWatch dashboard live ✅ JSON logs ✅ Alert wired |

---

### TASK-INF-007: Automated Backup & Restore Verification

| Field | Value |
|-------|-------|
| ID | TASK-INF-007 |
| Title | Automated DB backup and restore verification |
| Description | scripts/backup.py: daily RDS snapshot → S3. scripts/restore_verify.py: weekly restore to temp RDS → schema validation → cleanup. Alert on failure. |
| Acceptance Criteria | 1. Daily backup runs via EventBridge. 2. Weekly restore test passes. 3. Alert on any failure. 4. Backup retention 30 days. |
| Dependencies | TASK-INF-001, TASK-INF-003 |
| Priority | P1 |
| Complexity | M |
| Owner | DevOps |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S1 |
| Evidence Required | Restore verification log from scripts/restore_verify.py |
| Definition of Done | ✅ Daily backup confirmed ✅ Restore test passes ✅ Alert wired ✅ 30-day retention |

---

### TASK-INF-008: Security — WAF, Shield, VPN Bastion

| Field | Value |
|-------|-------|
| ID | TASK-INF-008 |
| Title | AWS WAF + Shield Standard + VPN bastion |
| Description | WAF on ALB: OWASP ruleset, rate limiting (100 req/min per IP), geo-block non-MENA in MVP. Shield Standard auto-enabled. Bastion host in private subnet (SSM Session Manager, no SSH keys). |
| Acceptance Criteria | 1. WAF OWASP rules active. 2. Rate limit fires at 100 req/min. 3. No direct SSH to production. 4. Bastion reachable via SSM only. |
| Dependencies | TASK-INF-001 |
| Priority | P1 |
| Complexity | L |
| Owner | DevOps |
| Reviewer | Tech Lead |
| Estimated Hours | 10 |
| Sprint | S1 |
| Evidence Required | WAF block log, SSM session working |
| Definition of Done | ✅ WAF rules active ✅ Rate limit fires ✅ No SSH ✅ SSM works |

---

## TRACK E — QA

### TASK-QA-001: Achieve 90% Backend Test Coverage

| Field | Value |
|-------|-------|
| ID | TASK-QA-001 |
| Title | Backend unit test coverage — raise from 80.42% to 90% |
| Description | Identify uncovered lines via pytest-cov. Add unit tests for: messaging (TASK-001–002), reviews (TASK-003–004), edge cases in finance, auth refresh, KYC rejection paths. |
| Acceptance Criteria | 1. Coverage ≥90% on main. 2. No test file with <70% coverage. 3. All new services at 85%+. |
| Dependencies | TASK-001, TASK-003 |
| Priority | P1 |
| Complexity | L |
| Owner | QA Engineer + Backend Engineers |
| Reviewer | Tech Lead |
| Estimated Hours | 16 |
| Sprint | S1 |
| Evidence Required | pytest --cov report showing ≥90% |
| Definition of Done | ✅ Coverage ≥90% ✅ No file <70% ✅ CI enforces coverage gate |

---

### TASK-QA-002: Integration Test Suite — API → DB → Redis

| Field | Value |
|-------|-------|
| ID | TASK-QA-002 |
| Title | Integration test suite — full API → DB → Redis flows |
| Description | Docker Compose test environment: FastAPI + PostgreSQL + Redis. Tests for: complete booking flow (initiate → pay → confirm → check-in → check-out), payout flow, KYC flow. No mocks on DB or Redis. |
| Acceptance Criteria | 1. All 3 flows pass in CI. 2. DB state verified after each step. 3. Run time <5 minutes. 4. Tests independent (no shared state). |
| Dependencies | TASK-001, TASK-003, Docker Compose available |
| Priority | P1 |
| Complexity | XL |
| Owner | QA Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 20 |
| Sprint | S2 |
| Evidence Required | CI run showing integration test pass |
| Definition of Done | ✅ 3 flows tested ✅ No mocks on DB/Redis ✅ Run <5min ✅ CI gated |

---

### TASK-QA-003: E2E Test Suite — Web (Playwright)

| Field | Value |
|-------|-------|
| ID | TASK-QA-003 |
| Title | E2E test suite — web booking flow (Playwright) |
| Description | Playwright tests for: (1) Search → Listing Detail → Book → Pay (Paymob sandbox) → Confirmation, (2) Host: Create Listing → Publish, (3) Auth: OTP → KYC. Run in CI on staging. |
| Acceptance Criteria | 1. All 3 flows pass on staging. 2. Tests run in CI. 3. Screenshots on failure. 4. Run time <10 minutes. |
| Dependencies | TASK-FE-009, TASK-FE-012, Staging environment |
| Priority | P1 |
| Complexity | XL |
| Owner | QA Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 20 |
| Sprint | S4 |
| Evidence Required | CI Playwright report |
| Definition of Done | ✅ 3 flows passing ✅ CI integrated ✅ Screenshots on failure |

---

### TASK-QA-004: E2E Test Suite — Mobile (Flutter Integration Tests)

| Field | Value |
|-------|-------|
| ID | TASK-QA-004 |
| Title | E2E test suite — mobile booking flow (Flutter integration tests) |
| Description | Flutter integration tests: (1) Onboarding → OTP auth, (2) Search → Book → Pay, (3) Check-in → Check-out. Run on emulator in CI. |
| Acceptance Criteria | 1. All 3 flows pass on emulator. 2. CI integration (Android emulator). 3. Test run <15 minutes. |
| Dependencies | TASK-MOB-009, TASK-MOB-010 |
| Priority | P1 |
| Complexity | XL |
| Owner | QA Engineer + Mobile Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 16 |
| Sprint | S4 |
| Evidence Required | Flutter integration test report |
| Definition of Done | ✅ Flows passing ✅ CI running ✅ Run <15min |

---

### TASK-QA-005: Performance Test — API Load (k6)

| Field | Value |
|-------|-------|
| ID | TASK-QA-005 |
| Title | API load testing with k6 — P95 latency targets |
| Description | k6 scenarios: 100 VU search, 50 VU listing detail, 20 VU concurrent booking. Targets: P95 <500ms search, P95 <300ms detail, P95 <2s booking. |
| Acceptance Criteria | 1. All P95 targets met at target VU count. 2. Error rate <1% at target load. 3. Report committed to repo. |
| Dependencies | Staging environment, TASK-INF-001 |
| Priority | P2 |
| Complexity | L |
| Owner | QA Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 10 |
| Sprint | S3 |
| Evidence Required | k6 HTML report |
| Definition of Done | ✅ P95 targets met ✅ Error rate <1% ✅ Report committed |

---

### TASK-QA-006: Security Testing — OWASP ZAP + Dependency Scan

| Field | Value |
|-------|-------|
| ID | TASK-QA-006 |
| Title | Security test — OWASP ZAP scan + pip-audit + npm audit |
| Description | OWASP ZAP baseline scan against staging API. pip-audit on Python dependencies. npm audit on Node dependencies. Block CI on Critical/High CVEs. |
| Acceptance Criteria | 1. No Critical ZAP findings. 2. No High+ CVEs unfixed. 3. Scan runs in CI on weekly schedule. 4. Report artifact saved. |
| Dependencies | Staging environment, TASK-INF-005 |
| Priority | P1 |
| Complexity | M |
| Owner | QA Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 8 |
| Sprint | S2 |
| Evidence Required | ZAP report, pip-audit output |
| Definition of Done | ✅ No Critical ZAP findings ✅ No unfixed High CVEs ✅ CI weekly scan |

---

### TASK-QA-007: Regression Test Suite + Nightly CI Run

| Field | Value |
|-------|-------|
| ID | TASK-QA-007 |
| Title | Regression test suite — nightly CI against staging |
| Description | Combine unit + integration + E2E suites. Nightly CI run against staging. Slack alert on failure. Coverage report attached to run. |
| Acceptance Criteria | 1. All suites run nightly. 2. Failure triggers Slack alert. 3. Coverage report in CI artifact. 4. Run time <20 minutes. |
| Dependencies | TASK-QA-001, TASK-QA-002, TASK-QA-003 |
| Priority | P2 |
| Complexity | M |
| Owner | QA Engineer |
| Reviewer | Tech Lead |
| Estimated Hours | 6 |
| Sprint | S3 |
| Evidence Required | Nightly CI run passing |
| Definition of Done | ✅ Nightly runs ✅ Alert on failure ✅ Coverage in artifact ✅ <20min |

---

### TASK-QA-008: Acceptance Testing — UAT Script for MVP v1

| Field | Value |
|-------|-------|
| ID | TASK-QA-008 |
| Title | UAT acceptance test script for MVP v1 — real booking end-to-end |
| Description | Written test script for manual UAT: Guest books real listing → pays EGP via Paymob → host receives notification → host checks-out guest → payout processed. Run by QA + founder on staging before RC. |
| Acceptance Criteria | 1. Script covers 1 complete booking lifecycle. 2. EGP payment actually processed in Paymob sandbox. 3. Host payout initiated. 4. No blocker bugs. |
| Dependencies | All MVP v1 tasks complete |
| Priority | P0 |
| Complexity | M |
| Owner | QA Engineer |
| Reviewer | Project Director |
| Estimated Hours | 8 |
| Sprint | RC |
| Evidence Required | Signed UAT sign-off document |
| Definition of Done | ✅ UAT script executed ✅ Real payment tested ✅ Payout verified ✅ Sign-off received |

---


---

# 4. BACKEND DELIVERY

## 4.1 API Inventory — Implemented (FC-01 through FC-07)

### Auth Module — src/app/auth/

| Method | Endpoint | Status | Auth | Sprint |
|--------|----------|--------|------|--------|
| GET | /.well-known/jwks.json | ✅ LIVE | Public | S0 |
| POST | /auth/firebase | ✅ LIVE | Public | S0 |
| POST | /auth/logout | ✅ LIVE | Bearer | S0 |
| GET | /auth/me | ✅ LIVE | Bearer | S0 |
| PATCH | /auth/me/account | ✅ LIVE | Bearer | S0 |
| POST | /auth/otp/send | ✅ LIVE | Public | S0 |
| POST | /auth/otp/verify | ✅ LIVE | Public | S0 |
| POST | /auth/refresh | ✅ LIVE | Refresh token | S0 |

### KYC Module — src/app/kyc/

| Method | Endpoint | Status | Auth | Sprint |
|--------|----------|--------|------|--------|
| POST | /kyc/documents/{id}/process | ✅ LIVE | Admin | S0 |
| POST | /kyc/documents/{id}/submit | ✅ LIVE | Bearer | S0 |
| GET | /kyc/status | ✅ LIVE | Bearer | S0 |

### Listings Module — src/app/listings/

| Method | Endpoint | Status | Auth | Sprint |
|--------|----------|--------|------|--------|
| GET | /listings/{unit_id} | ✅ LIVE | Public | S0 |
| POST | /listings/ | ✅ LIVE | Host | S0 |
| PATCH | /listings/{unit_id} | ✅ LIVE | Host | S0 |
| POST | /listings/{unit_id}/archive | ✅ LIVE | Host | S0 |
| GET | /listings/{unit_id}/availability | ✅ LIVE | Public | S0 |
| GET | /listings/{unit_id}/calendar | ✅ LIVE | Host | S0 |
| POST | /listings/{unit_id}/calendar | ✅ LIVE | Host | S0 |
| DELETE | /listings/{unit_id}/calendar/{rule_id} | ✅ LIVE | Host | S0 |
| POST | /listings/calendar/bulk-availability | ✅ LIVE | Host | S0 |
| POST | /listings/calendar/bulk-pricing | ✅ LIVE | Host | S0 |
| POST | /listings/{unit_id}/publish | ✅ LIVE | Host | S0 |
| POST | /listings/{unit_id}/unpublish | ✅ LIVE | Host | S0 |
| GET | /listings/host/dashboard | ✅ LIVE | Host | S0 |
| GET | /listings/host/reservations | ✅ LIVE | Host | S0 |
| GET | /listings/ | ✅ LIVE | Public | S0 |

### Reservations Module — src/app/reservations/

| Method | Endpoint | Status | Auth | Sprint |
|--------|----------|--------|------|--------|
| POST | /reservations/initiate | ✅ LIVE | Bearer | S0 |
| POST | /reservations/confirm | ✅ LIVE | Bearer | S0 |
| POST | /reservations/cancel | ✅ LIVE | Bearer | S0 |
| POST | /reservations/check-in | ✅ LIVE | Bearer | S0 |
| POST | /reservations/check-out | ✅ LIVE | Bearer | S0 |
| POST | /reservations/promo | ✅ LIVE | Bearer | S0 |
| GET | /reservations/{reservation_id} | ✅ LIVE | Bearer | S0 |
| GET | /reservations/ | ✅ LIVE | Bearer | S0 |

### Finance Module — src/app/finance/

| Method | Endpoint | Status | Auth | Sprint |
|--------|----------|--------|------|--------|
| POST | /finance/escrow | ✅ LIVE | Internal | S0 |
| POST | /finance/escrow/{id}/hold | ✅ LIVE | Internal | S0 |
| POST | /finance/escrow/{id}/release | ✅ LIVE | Internal | S0 |
| GET | /finance/payouts | ✅ LIVE | Host | S0 |
| POST | /finance/payouts/{id}/process | ✅ LIVE | Admin | S0 |
| GET | /finance/wallets/me | ✅ LIVE | Bearer | S0 |
| GET | /finance/wallets/{id}/ledger | ✅ LIVE | Bearer | S0 |
| POST | /finance/webhooks/paymob | ✅ LIVE | Public (HMAC) | S0 |
| POST | /finance/webhooks/stripe | ✅ LIVE | Public (sig) | S0 |

### Operations Module — src/app/operations/

| Method | Endpoint | Status | Auth | Sprint |
|--------|----------|--------|------|--------|
| GET | /operations/tasks | ✅ LIVE | Staff/Host | S0 |
| POST | /operations/tasks | ✅ LIVE | Host | S0 |
| GET | /operations/tasks/{id} | ✅ LIVE | Staff/Host | S0 |
| POST | /operations/tasks/{id}/assign | ✅ LIVE | Host | S0 |
| POST | /operations/tasks/{id}/complete | ✅ LIVE | Staff | S0 |
| POST | /operations/tasks/{id}/start | ✅ LIVE | Staff | S0 |
| POST | /operations/tasks/{id}/attachments | ✅ LIVE | Staff | S0 |
| POST | /operations/tasks/{id}/notes | ✅ LIVE | Staff | S0 |
| GET | /operations/tasks/{id}/timeline | ✅ LIVE | Host | S0 |
| GET | /operations/maintenance | ✅ LIVE | Host | S0 |
| POST | /operations/maintenance | ✅ LIVE | Host | S0 |
| GET | /operations/maintenance/{id} | ✅ LIVE | Host | S0 |
| GET | /operations/readiness/{unit_id} | ✅ LIVE | Host | S0 |
| POST | /operations/recurring-maintenance | ✅ LIVE | Host | S0 |
| GET | /operations/staff | ✅ LIVE | Host | S0 |
| GET | /operations/dashboard | ✅ LIVE | Host | S0 |

## 4.2 API Inventory — Missing (Must Build)

| Method | Endpoint | Task ID | Sprint |
|--------|----------|---------|--------|
| GET | /messages/conversations | TASK-002 | S1 |
| POST | /messages/conversations/{id}/send | TASK-002 | S1 |
| GET | /messages/conversations/{id}/stream (SSE) | TASK-002 | S1 |
| POST | /reviews/ | TASK-004 | S1 |
| GET | /reviews/listings/{unit_id} | TASK-004 | S1 |
| GET | /reviews/guests/{user_id} | TASK-004 | S1 |
| POST | /reviews/{id}/response | TASK-004 | S1 |
| POST | /media/upload-url | TASK-005 | S0 |
| POST | /media/confirm | TASK-005 | S0 |
| POST | /notifications/devices | TASK-006 | S1 |
| DELETE | /notifications/devices/{token} | TASK-006 | S1 |
| GET | /notifications/me | TASK-007 | S1 |
| PATCH | /notifications/{id}/read | TASK-007 | S1 |
| POST | /analytics/events | TASK-008 | S2 |

## 4.3 Database Schema — All Tables

### Migrations Completed (alembic/versions/)

| Migration | Tables Created | Status |
|-----------|---------------|--------|
| 001 | Initial schema | ✅ |
| 002 | outbox_events | ✅ |
| 003 | users, otp_codes, refresh_tokens, firebase_accounts | ✅ |
| 004 | units, unit_amenities, unit_photos, pricing_rules, calendar_blocks | ✅ |
| 005 | reservations, reservation_events, promo_codes | ✅ |
| 006 | host_operations columns on units | ✅ |
| 007 | operations_tasks, maintenance_requests, staff_members, recurring_maintenance | ✅ |
| 008 | escrow_holds, wallets, wallet_ledger_entries, payout_requests | ✅ |
| 009 | calendar_exclusions | ✅ |
| 010 | notification_log, security_events, rate_limit_log, audit_log | ✅ |

### Migrations Required

| Migration | Tables to Create | Task ID | Sprint |
|-----------|-----------------|---------|--------|
| 011 | conversations, messages, message_reads, conversation_participants | TASK-001 | S1 |
| 012 | reviews, review_responses, review_aggregates | TASK-003 | S1 |
| 013 | user_device_tokens | TASK-006 | S1 |
| 014 | analytics_events | TASK-008 | S2 |

## 4.4 Backend Performance Targets

| Endpoint Category | P50 Target | P95 Target | P99 Target |
|-------------------|-----------|-----------|-----------|
| Search (GET /listings/) | 150ms | 500ms | 1000ms |
| Listing Detail | 80ms | 300ms | 500ms |
| Booking Initiate | 200ms | 800ms | 1500ms |
| Payment Confirm | 300ms | 1000ms | 2000ms |
| Auth (OTP verify) | 50ms | 200ms | 400ms |

## 4.5 Background Tasks (Celery)

| Task | Module | Trigger | Sprint |
|------|--------|---------|--------|
| Send OTP SMS | auth | OTP request | S0 ✅ |
| KYC document processing | kyc | Submit | S0 ✅ |
| Paymob payment initiation | finance | Booking confirm | S0 ✅ |
| Escrow release after check-out | finance | Check-out + 24h | S0 ✅ |
| Payout processing | finance | Manual trigger | S0 ✅ |
| Operations task reminders | operations | Scheduled | S0 ✅ |
| FCM push notification send | notifications | Event trigger | S1 |
| Email send (SES) | notifications | Event trigger | S1 |
| Analytics batch process | analytics | Batch ingest | S2 |

---

# 5. FRONTEND DELIVERY

## 5.1 Web Screen Inventory — All 45 Web Screens

| Screen | ID | Route | API | Status | Sprint |
|--------|----|-------|-----|--------|--------|
| Phone Entry / OTP | SCR-003 | /auth/phone | POST /auth/otp/send | 🔴 TODO | S1 |
| OTP Verify | SCR-004 | /auth/otp | POST /auth/otp/verify | 🔴 TODO | S1 |
| Social Login | SCR-005 | /auth/social | POST /auth/firebase | 🔴 TODO | S1 |
| KYC Pending | SCR-009 | /kyc/pending | GET /kyc/status | 🔴 TODO | S1 |
| Search Results | SCR-011 | /search | GET /listings/ | 🔴 TODO | S2 |
| Search Filters | SCR-013 | /search/filters | — | 🔴 TODO | S2 |
| Listing Detail | SCR-014 | /listings/[id] | GET /listings/{id} | 🔴 TODO | S2 |
| Availability Calendar | SCR-015 | /listings/[id]/calendar | GET /listings/{id}/availability | 🔴 TODO | S2 |
| Booking Summary | SCR-016 | /book/[id]/summary | POST /reservations/initiate | 🔴 TODO | S3 |
| Payment Screen | SCR-017 | /book/[id]/payment | Paymob iframe | 🔴 TODO | S3 |
| Booking Confirmation | SCR-018 | /book/[id]/confirmation | — | 🔴 TODO | S3 |
| Trips List | SCR-019 | /trips | GET /reservations/ | 🔴 TODO | S3 |
| Trip Detail | SCR-020 | /trips/[id] | GET /reservations/{id} | 🔴 TODO | S3 |
| Wallet | SCR-027 | /wallet | GET /finance/wallets/me | 🔴 TODO | S4 |
| Notification Center | SCR-028 | /notifications | GET /notifications/me | 🔴 TODO | S4 |
| Profile | SCR-029 | /profile | GET /auth/me | 🔴 TODO | S2 |
| Edit Profile | SCR-030 | /profile/edit | PATCH /auth/me/account | 🔴 TODO | S2 |
| Settings | SCR-031 | /settings | — | 🔴 TODO | S4 |
| Host Dashboard | SCR-033 | /host | GET /listings/host/dashboard | 🔴 TODO | S3 |
| My Listings | SCR-034 | /host/listings | GET /listings/ | 🔴 TODO | S3 |
| New Listing Step 1 | SCR-035 | /host/listings/new/type | POST /listings/ | 🔴 TODO | S3 |
| New Listing Step 2 | SCR-036 | /host/listings/new/location | POST /listings/ | 🔴 TODO | S3 |
| New Listing Step 3 | SCR-037 | /host/listings/new/amenities | POST /listings/ | 🔴 TODO | S3 |
| New Listing Step 4 | SCR-038 | /host/listings/new/photos | POST /media/upload-url | 🔴 TODO | S3 |
| New Listing Step 5 | SCR-039 | /host/listings/new/pricing | POST /listings/ | 🔴 TODO | S3 |
| New Listing Step 6 | SCR-040 | /host/listings/new/review | POST /listings/{id}/publish | 🔴 TODO | S3 |
| Listing Edit | SCR-041 | /host/listings/[id]/edit | PATCH /listings/{id} | 🔴 TODO | S3 |
| Calendar & Availability | SCR-042 | /host/listings/[id]/calendar | POST /listings/{id}/calendar | 🔴 TODO | S3 |
| Reservation Inbox | SCR-043 | /host/reservations | GET /listings/host/reservations | 🔴 TODO | S3 |
| Reservation Detail Host | SCR-044 | /host/reservations/[id] | GET /reservations/{id} | 🔴 TODO | S3 |
| Revenue & Payouts | SCR-045 | /host/payouts | GET /finance/payouts | 🔴 TODO | S4 |
| Request Payout | SCR-046 | /host/payouts/request | POST /finance/payouts | 🔴 TODO | S4 |
| Operations Dashboard | SCR-047 | /operations | GET /operations/dashboard | 🔴 TODO | S5 |
| Task List | SCR-048 | /operations/tasks | GET /operations/tasks | 🔴 TODO | S5 |
| Task Detail | SCR-049 | /operations/tasks/[id] | GET /operations/tasks/{id} | 🔴 TODO | S5 |
| Maintenance | SCR-050 | /operations/maintenance | GET /operations/maintenance | 🔴 TODO | S5 |
| Staff Management | SCR-051 | /operations/staff | GET /operations/staff | 🔴 TODO | S5 |
| Readiness Score | SCR-052 | /operations/readiness | GET /operations/readiness/{unit_id} | 🔴 TODO | S5 |
| Host Chat | SCR-054 | /host/messages | GET /messages/conversations | 🔴 TODO | S6 |
| Host KYC | SCR-056 | /host/kyc | GET /kyc/status | 🔴 TODO | S2 |
| Admin Dashboard | SCR-057 | /admin | Admin only | 🔴 TODO | S5 |
| Admin Users | SCR-058 | /admin/users | Admin only | 🔴 TODO | S5 |
| Admin Listings | SCR-059 | /admin/listings | Admin only | 🔴 TODO | S6 |
| Home (public) | SCR-070 | / | GET /listings/ | 🟡 PARTIAL | S1 |
| About / Legal | SCR-075 | /about, /terms, /privacy | Static | 🔴 TODO | S1 |

## 5.2 Component Library Requirements

| Component | Used By Screens | Sprint |
|-----------|----------------|--------|
| ListingCard | SCR-011, SCR-034, SCR-070 | S1 |
| PriceDisplay (EGP / amount_minor) | SCR-014, SCR-016, SCR-045 | S1 |
| DateRangePicker | SCR-013, SCR-015, SCR-042 | S2 |
| AmenityGrid | SCR-014, SCR-037 | S2 |
| PhotoGallery | SCR-014, SCR-038 | S2 |
| BookingStatusBadge | SCR-019, SCR-020, SCR-043 | S3 |
| MapPicker | SCR-036 | S3 |
| OTPInput (6 digits, auto-advance) | SCR-004 | S1 |
| PhoneInput (country selector) | SCR-003 | S1 |
| StepWizard (progress bar) | SCR-035–040 | S3 |
| WalletBalance | SCR-027, SCR-033 | S4 |
| NotificationItem | SCR-028 | S4 |
| TaskCard | SCR-048, SCR-049 | S5 |
| MaintenanceCard | SCR-050 | S5 |

## 5.3 Accessibility Requirements

| Requirement | Standard | Applies To |
|-------------|----------|------------|
| Color contrast | WCAG AA (4.5:1) | All text |
| Keyboard navigation | Full keyboard flow | All interactive elements |
| Screen reader labels | aria-label on all icons | All icons + images |
| Focus management | Visible focus ring | All interactive |
| RTL text direction | dir="rtl" on AR pages | All AR routes |
| Font scaling | Support 200% zoom | All layouts |

## 5.4 Frontend Performance Targets

| Metric | Target | Measured On |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | <2.5s | /listings/[id] |
| FID (First Input Delay) | <100ms | All pages |
| CLS (Cumulative Layout Shift) | <0.1 | All pages |
| Lighthouse Performance | ≥80 | All pages |
| Lighthouse Accessibility | ≥90 | All pages |
| Lighthouse SEO | ≥90 | Listing pages |
| Bundle size (initial) | <250KB gzipped | / |

---

# 6. MOBILE DELIVERY

## 6.1 Mobile Screen Inventory — All 33 Mobile Screens

| Screen | ID | Platform | API | Status | Sprint |
|--------|----|----------|-----|--------|--------|
| Splash/Loading | SCR-001 | iOS + Android | — | 🔴 TODO | S1 |
| Onboarding Carousel | SCR-002 | iOS + Android | — | 🔴 TODO | S1 |
| Phone Entry/OTP | SCR-003 | iOS + Android | POST /auth/otp/send | 🔴 TODO | S1 |
| OTP Verify | SCR-004 | iOS + Android | POST /auth/otp/verify | 🔴 TODO | S1 |
| Social Login | SCR-005 | iOS + Android | POST /auth/firebase | 🔴 TODO | S1 |
| KYC Start | SCR-006 | iOS + Android | — | 🔴 TODO | S2 |
| KYC Document Capture | SCR-007 | iOS + Android | POST /media/upload-url | 🔴 TODO | S2 |
| KYC Selfie | SCR-008 | iOS + Android | POST /kyc/submit | 🔴 TODO | S2 |
| KYC Pending | SCR-009 | iOS + Android | GET /kyc/status | 🔴 TODO | S2 |
| Home/Discovery | SCR-010 | iOS + Android | GET /listings/ | 🔴 TODO | S2 |
| Search Results | SCR-011 | iOS + Android | GET /listings/ | 🔴 TODO | S2 |
| Map View | SCR-012 | iOS + Android | GET /listings/ + PostGIS | 🔴 TODO | S3 |
| Search Filters | SCR-013 | iOS + Android | — | 🔴 TODO | S2 |
| Listing Detail | SCR-014 | iOS + Android | GET /listings/{id} | 🔴 TODO | S2 |
| Availability Calendar | SCR-015 | iOS + Android | GET /listings/{id}/availability | 🔴 TODO | S2 |
| Booking Summary | SCR-016 | iOS + Android | POST /reservations/initiate | 🔴 TODO | S3 |
| Payment Screen | SCR-017 | iOS + Android | Paymob WebView | 🔴 TODO | S3 |
| Booking Confirmation | SCR-018 | iOS + Android | — | 🔴 TODO | S3 |
| Trips List | SCR-019 | iOS + Android | GET /reservations/ | 🔴 TODO | S3 |
| Trip Detail | SCR-020 | iOS + Android | GET /reservations/{id} | 🔴 TODO | S3 |
| Self Check-In | SCR-021 | iOS + Android | POST /reservations/{id}/check-in | 🔴 TODO | S4 |
| Active Stay Dashboard | SCR-022 | iOS + Android | — | 🔴 TODO | S4 |
| Check-Out | SCR-023 | iOS + Android | POST /reservations/{id}/check-out | 🔴 TODO | S4 |
| Wallet | SCR-027 | iOS + Android | GET /finance/wallets/me | 🔴 TODO | S4 |
| Notification Center | SCR-028 | iOS + Android | GET /notifications/me | 🔴 TODO | S4 |
| Profile | SCR-029 | iOS + Android | GET /auth/me | 🔴 TODO | S2 |
| Edit Profile | SCR-030 | iOS + Android | PATCH /auth/me/account | 🔴 TODO | S2 |
| Settings | SCR-031 | iOS + Android | — | 🔴 TODO | S4 |
| Language/RTL Toggle | SCR-032 | iOS + Android | — | 🔴 TODO | S3 |
| Host Dashboard | SCR-033 | iOS + Android | GET /listings/host/dashboard | 🔴 TODO | S4 |
| Calendar & Availability | SCR-042 | iOS + Android | POST /listings/{id}/calendar | 🔴 TODO | S4 |
| Reservation Inbox | SCR-043 | iOS + Android | GET /listings/host/reservations | 🔴 TODO | S4 |
| Host Profile / KYC | SCR-055-056 | iOS + Android | GET /kyc/status | 🔴 TODO | S2 |

## 6.2 Flutter Package Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| go_router | Navigation + deep links | ^13.0.0 |
| flutter_riverpod | State management | ^2.5.0 |
| dio | HTTP client | ^5.4.0 |
| flutter_secure_storage | JWT storage | ^9.0.0 |
| google_maps_flutter | Map view | ^2.5.0 |
| firebase_messaging | FCM push | ^14.0.0 |
| firebase_auth | Social login | ^4.0.0 |
| image_picker | Camera/gallery | ^1.0.0 |
| hive_flutter | Local cache | ^1.1.0 |
| flutter_localizations | i18n | SDK |
| intl | Number/date formatting | ^0.19.0 |
| webview_flutter | Paymob iframe | ^4.4.0 |
| cached_network_image | Photo caching | ^3.3.0 |
| flutter_svg | Icons | ^2.0.0 |

## 6.3 Mobile Platform Requirements

| Requirement | iOS | Android |
|-------------|-----|---------|
| Min OS version | iOS 15.0 | API 24 (Android 7.0) |
| Push notifications | APNs + FCM | FCM |
| Camera permission | NSCameraUsageDescription | CAMERA |
| Location permission | NSLocationWhenInUseUsageDescription | ACCESS_FINE_LOCATION |
| Deep link scheme | stayos:// | stayos:// |
| App Store compliance | Yes | Yes |
| RTL support | Native (UIView) | Native (ViewCompat) |

## 6.4 Mobile Performance Targets

| Metric | Target |
|--------|--------|
| App cold start | <3s |
| Screen transition | <300ms |
| API response render | <500ms |
| Image load (cached) | <100ms |
| Image load (network) | <2s |
| Offline graceful | Yes (Hive cache) |

---

# 7. INFRASTRUCTURE DELIVERY

## 7.1 AWS Resource Inventory

| Resource | Type | Region | Environment | Status |
|----------|------|--------|-------------|--------|
| VPC | VPC (2 AZ) | me-central-1 | All | 🔴 PENDING |
| ECS Cluster | Fargate | me-central-1 | All | 🔴 PENDING |
| RDS PostgreSQL 16 | db.t3.medium (staging), db.r7g.large (prod) | me-central-1 | All | 🔴 PENDING |
| ElastiCache Redis | cache.t3.micro (staging), cache.r7g.large (prod) | me-central-1 | All | 🔴 PENDING |
| ALB | Application Load Balancer | me-central-1 | All | 🔴 PENDING |
| ECR | Container registry | me-central-1 | All | 🔴 PENDING |
| S3 (media) | Standard + CloudFront | me-central-1 | All | 🔴 PENDING |
| S3 (backups) | Standard-IA + Glacier | me-central-1 | All | 🔴 PENDING |
| S3 (tf-state) | Standard + versioning | us-east-1 | All | 🔴 PENDING |
| Secrets Manager | Secrets | me-central-1 | All | 🔴 PENDING |
| CloudWatch | Logs + Metrics | me-central-1 | All | 🔴 PENDING |
| SES | Email | eu-west-1 (closest) | All | 🔴 PENDING |
| WAF | Web ACL on ALB | me-central-1 | Prod | 🔴 PENDING |
| Route 53 | DNS | Global | All | 🔴 PENDING |
| ACM | SSL Certificates | me-central-1 | All | 🔴 PENDING |

## 7.2 Container Configuration

| Service | Image | CPU | Memory | Replicas (Staging) | Replicas (Prod) |
|---------|-------|-----|--------|-------------------|-----------------|
| api | stayos-api:latest | 512 | 1024 MB | 1 | 3 |
| celery-worker | stayos-api:latest | 512 | 512 MB | 1 | 2 |
| celery-beat | stayos-api:latest | 256 | 256 MB | 1 | 1 |
| web (Next.js) | stayos-web:latest | 512 | 512 MB | 1 | 2 |

## 7.3 Secrets Inventory — All Production Secrets

| Secret Name | Value Type | Rotation |
|-------------|------------|----------|
| stayos/db/password | DB master password | 90 days |
| stayos/redis/auth | Redis AUTH token | Never (managed) |
| stayos/jwt/rs256-private | RSA private key PEM | Manual |
| stayos/jwt/rs256-public | RSA public key PEM | Manual |
| stayos/paymob/api-key | Paymob API key | 180 days |
| stayos/paymob/hmac-secret | Paymob webhook HMAC | 180 days |
| stayos/stripe/secret-key | Stripe secret | 180 days |
| stayos/stripe/webhook-secret | Stripe webhook secret | Never |
| stayos/firebase/service-account | Firebase SA JSON | Manual |
| stayos/sumsub/app-token | Sumsub API token | 90 days |
| stayos/sumsub/secret-key | Sumsub secret | 90 days |
| stayos/sentry/dsn-backend | Sentry DSN | Never |
| stayos/sentry/dsn-web | Sentry DSN | Never |
| stayos/sentry/dsn-mobile | Sentry DSN | Never |

## 7.4 CI/CD Pipeline Stages

```
PR Opened
    │
    ▼
[Stage 1: Lint + Type Check]
    • ruff check (Python)
    • mypy (Python)
    • eslint + tsc (TypeScript)
    • flutter analyze (Dart)
    │
    ▼
[Stage 2: Unit Tests]
    • pytest (Python, must be ≥80% coverage)
    • jest (TypeScript)
    • flutter test (Dart)
    │
    ▼
[Stage 3: Integration Tests]  ← Docker Compose
    • pytest integration (real DB + Redis)
    │
    ▼
[Merge to main]
    │
    ▼
[Stage 4: Build]
    • docker build api
    • docker build web
    • flutter build apk + ipa
    │
    ▼
[Stage 5: Push to ECR]
    │
    ▼
[Stage 6: Deploy to Staging]
    • ECS rolling update (api + celery)
    • Next.js deploy
    │
    ▼
[Stage 7: Smoke Test]
    • GET /health → 200
    • GET /listings/ → 200
    │
    ▼
[Manual Gate: QA Sign-off]
    │
    ▼
[Stage 8: Deploy to Production]
    • ECS rolling update
    • Slack notification
```

## 7.5 Monitoring Thresholds and Alerts

| Metric | Warning Threshold | Critical Threshold | Action |
|--------|------------------|--------------------|--------|
| API error rate | >2% | >5% | PagerDuty |
| API P95 latency | >800ms | >2000ms | PagerDuty |
| RDS CPU | >60% | >80% | Scale up |
| RDS storage | >70% | >85% | Alert + scale |
| Redis memory | >70% | >85% | Alert |
| ECS CPU (api) | >70% | >85% | Auto-scale |
| ECS memory (api) | >80% | >90% | Alert |
| Failed login rate | >10/min | >50/min | Security alert |
| Paymob webhook error | >1% | >5% | Finance alert |

---

# 8. QA DELIVERY

## 8.1 Test Suite Architecture

```
tests/
├── unit/
│   ├── test_auth/
│   ├── test_kyc/
│   ├── test_listings/
│   ├── test_reservations/
│   ├── test_finance/
│   ├── test_operations/
│   ├── test_notifications/
│   ├── test_messaging/      ← New (TASK-001)
│   └── test_reviews/        ← New (TASK-003)
├── integration/
│   ├── test_booking_flow.py
│   ├── test_payout_flow.py
│   └── test_kyc_flow.py
├── e2e/
│   ├── web/                 ← Playwright
│   │   ├── auth.spec.ts
│   │   ├── search.spec.ts
│   │   ├── booking.spec.ts
│   │   └── host.spec.ts
│   └── mobile/              ← Flutter integration
│       ├── auth_test.dart
│       ├── booking_test.dart
│       └── checkin_test.dart
├── performance/
│   └── k6/
│       ├── search.js
│       ├── listing_detail.js
│       └── booking.js
└── security/
    ├── zap_baseline.yaml
    └── dependency_scan.sh
```

## 8.2 Coverage Requirements

| Layer | Current | Target | Sprint |
|-------|---------|--------|--------|
| Backend unit | 80.42% | 90% | S1 |
| Backend integration | 0% | Coverage of 3 critical flows | S2 |
| Web E2E | 0% | 3 critical user journeys | S4 |
| Mobile E2E | 0% | 3 critical user journeys | S4 |
| Performance | 0 scenarios | 3 load scenarios | S3 |
| Security | 0 scans | Weekly OWASP ZAP | S2 |

## 8.3 Definition of Done — Global

Every task is Done when ALL of the following are true:

- [ ] Code committed and merged to main branch
- [ ] Unit tests written and passing (≥80% coverage on new code)
- [ ] mypy / eslint / flutter analyze clean
- [ ] API documented (docstring or OpenAPI schema)
- [ ] PR reviewed and approved by Tech Lead
- [ ] CI pipeline green
- [ ] Deployed to staging and smoke-tested
- [ ] Evidence artifact committed (screenshot, test report, or API trace)
- [ ] Task status updated to DONE in MASTER_EXECUTION_BOARD_v2.0.md

## 8.4 Bug Severity Classification

| Severity | Definition | SLA to Fix |
|----------|------------|-----------|
| P0 — Blocker | Payment fails, data loss, security breach, app crash on launch | Same day |
| P1 — Critical | Booking flow broken, auth broken, host cannot publish | Next sprint day |
| P2 — Major | Feature missing, incorrect calculations, UI broken on one platform | This sprint |
| P3 — Minor | Copy error, cosmetic issue, minor UX friction | Next sprint |

## 8.5 Manual Test Protocols

| Protocol | Frequency | Owner |
|----------|-----------|-------|
| Full booking flow (guest) | Every release | QA Engineer |
| Full listing creation (host) | Every release | QA Engineer |
| OTP + KYC flow | Every release | QA Engineer |
| Payout request | Every release | QA Engineer |
| RTL layout check (AR) | Every UI change | Frontend Engineer |
| Accessibility audit (WCAG) | Monthly | QA Engineer |
| Paymob payment methods (Fawry/Meeza/VodaCash/InstaPay) | Every release | QA Engineer |


---

# 9. SPRINT ALLOCATION

> Every task assigned to a sprint. No orphans permitted.

## 9.1 Sprint 0 — Foundation (Weeks 1-2)

**Goal:** Infrastructure live, all Day-1 blockers cleared, CI/CD green.

| Task ID | Title | Track | Hours | Owner |
|---------|-------|-------|-------|-------|
| TASK-009 | CORS configuration fix | Backend | 1 | BE |
| TASK-010 | Secrets Manager wiring | Backend + DevOps | 8 | BE + DevOps |
| TASK-005 | Photo upload API (S3 presigned) | Backend | 6 | BE |
| TASK-INF-001 | AWS core infrastructure provisioning | Infra | 16 | DevOps |
| TASK-INF-002 | IAM roles (ECS task + CI/CD) | Infra | 6 | DevOps |
| TASK-INF-003 | S3 buckets (media, backups, tf-state) | Infra | 6 | DevOps |
| TASK-INF-005 | GitHub Actions CI/CD pipeline | Infra | 12 | DevOps |
| TASK-FE-001 | Next.js RTL, i18n, Tailwind, theme | Frontend | 8 | FE |
| TASK-FE-002 | API client + auth token interceptor | Frontend | 6 | FE |

**Sprint 0 Total: 69 hours**  
**Exit Gate:** AWS provisioned, CI green, CORS fixed, secrets wired, web scaffold RTL-ready.

---

## 9.2 Sprint 1 — Auth, KYC, Messaging, Reviews, Notifications (Weeks 3-4)

**Goal:** Complete missing backend services. Web auth screens live. Mobile project initialized.

| Task ID | Title | Track | Hours | Owner |
|---------|-------|-------|-------|-------|
| TASK-001 | Messaging models + migration | Backend | 6 | BE |
| TASK-002 | Messaging router + SSE | Backend | 12 | BE |
| TASK-003 | Reviews models + migration | Backend | 5 | BE |
| TASK-004 | Reviews router | Backend | 8 | BE |
| TASK-006 | FCM device token API | Backend | 4 | BE |
| TASK-007 | Notification center endpoint | Backend | 4 | BE |
| TASK-011 | Email provider (SES) | Backend | 8 | BE |
| TASK-QA-001 | Backend coverage → 90% | QA | 16 | QA + BE |
| TASK-INF-004 | SES domain verification + DKIM | Infra | 4 | DevOps |
| TASK-INF-006 | Observability (CloudWatch + Sentry) | Infra | 10 | DevOps |
| TASK-INF-007 | Automated backup + restore | Infra | 8 | DevOps |
| TASK-INF-008 | WAF + Shield + bastion | Infra | 10 | DevOps |
| TASK-FE-003 | SCR-003 Phone Entry OTP (Web) | Frontend | 4 | FE |
| TASK-FE-004 | SCR-004 OTP Verify (Web) | Frontend | 4 | FE |
| TASK-FE-005 | SCR-005 Social Login (Web) | Frontend | 4 | FE |
| TASK-FE-006 | SCR-009 KYC Pending (Web) | Frontend | 3 | FE |
| TASK-FE-014 | Error boundary + skeletons + empty states | Frontend | 8 | FE |
| TASK-MOB-001 | Flutter project initialization | Mobile | 12 | Mobile |
| TASK-MOB-002 | SCR-001-002 Splash + Onboarding | Mobile | 6 | Mobile |
| TASK-MOB-003 | SCR-003-004 OTP Auth (Mobile) | Mobile | 8 | Mobile |

**Sprint 1 Total: 148 hours**  
**Exit Gate:** All backend services complete, 90% coverage, web auth live, Flutter running.

---

## 9.3 Sprint 2 — Discovery, Search, Listings, KYC Mobile (Weeks 5-6)

**Goal:** Listings browsable on web + mobile. KYC flow on mobile.

| Task ID | Title | Track | Hours | Owner |
|---------|-------|-------|-------|-------|
| TASK-008 | Analytics event log | Backend | 6 | BE |
| TASK-QA-002 | Integration test suite | QA | 20 | QA |
| TASK-QA-006 | OWASP ZAP + dependency scan | QA | 8 | QA |
| TASK-FE-007 | SCR-011 Search Results (Web) | Frontend | 12 | FE |
| TASK-FE-008 | SCR-014 Listing Detail (Web) | Frontend | 14 | FE |
| TASK-MOB-004 | SCR-006-009 KYC Flow (Mobile) | Mobile | 12 | Mobile |
| TASK-MOB-005 | SCR-010 Home/Discovery (Mobile) | Mobile | 10 | Mobile |
| TASK-MOB-007 | SCR-011/013 Search + Filters (Mobile) | Mobile | 8 | Mobile |
| TASK-MOB-008 | SCR-014-015 Listing Detail + Calendar | Mobile | 12 | Mobile |
| TASK-MOB-011 | FCM Push Notifications (Mobile) | Mobile | 8 | Mobile |

**Sprint 2 Total: 110 hours**  
**Exit Gate:** Search working on web + mobile, listing detail rendered, KYC mobile flow complete.

---

## 9.4 Sprint 3 — Booking Flow Web + Mobile, Host Listings (Weeks 7-8)

**Goal:** Complete booking from search → pay → confirmation on both platforms.

| Task ID | Title | Track | Hours | Owner |
|---------|-------|-------|-------|-------|
| TASK-FE-009 | SCR-016-018 Booking Flow (Web) | Frontend | 20 | FE |
| TASK-FE-010 | SCR-019-020 Trips (Web) | Frontend | 8 | FE |
| TASK-FE-011 | SCR-033-034 Host Dashboard + Listings (Web) | Frontend | 12 | FE |
| TASK-FE-012 | SCR-035-040 New Listing Wizard (Web) | Frontend | 24 | FE |
| TASK-MOB-006 | SCR-012 Map View (Mobile) | Mobile | 10 | Mobile |
| TASK-MOB-009 | SCR-016-018 Booking Flow (Mobile) | Mobile | 16 | Mobile |
| TASK-QA-005 | Performance test k6 | QA | 10 | QA |
| TASK-QA-007 | Regression suite + nightly CI | QA | 6 | QA |

**Sprint 3 Total: 106 hours**  
**Exit Gate:** Full booking end-to-end on web + mobile, host can create and publish listing.

---

## 9.5 Sprint 4 — Check-In, Wallet, Payouts, Operations Web, Host Mobile (Weeks 9-10)

**Goal:** Operational flows complete. Hosts can manage and get paid.

| Task ID | Title | Track | Hours | Owner |
|---------|-------|-------|-------|-------|
| TASK-FE-013 | SCR-027 Wallet + Payout (Web) | Frontend | 8 | FE |
| TASK-FE-015 | SEO — sitemap, robots, OG, JSON-LD | Frontend | 6 | FE |
| TASK-MOB-010 | SCR-021-023 Check-In/Out (Mobile) | Mobile | 10 | Mobile |
| TASK-MOB-012 | Offline mode + local cache | Mobile | 8 | Mobile |
| TASK-QA-003 | E2E Playwright (Web) | QA | 20 | QA |
| TASK-QA-004 | E2E Flutter integration (Mobile) | QA | 16 | QA |

**Sprint 4 Total: 68 hours**  
**Exit Gate:** Check-in/out working, wallet live, payout request working, E2E suites passing.

---

## 9.6 Sprint 5 — Operations, Admin, Messaging (Weeks 11-12)

**Goal:** Operations dashboards, admin panel, messaging live.

| Task ID | Title | Track | Hours | Owner |
|---------|-------|-------|-------|-------|
| SCR-047–052 | Operations screens (Web) | Frontend | 20 | FE |
| SCR-057–059 | Admin panel — dashboard, users, listings (Web) | Frontend | 16 | FE |
| SCR-025–026 | Messaging — list + thread (Web) | Frontend | 14 | FE |
| SCR-054 | Host Chat (Web) | Frontend | 8 | FE |

**Sprint 5 Total: 58 hours**  
**Exit Gate:** Operations dashboard functional, admin panel accessible, messaging working.

---

## 9.7 Sprint 6 — Reviews, Notifications, Mobile Host Tools (Weeks 13-14)

**Goal:** Reviews, in-app notifications, and host mobile tools complete.

| Task ID | Title | Track | Hours | Owner |
|---------|-------|-------|-------|-------|
| SCR-024 | Write Review (Mobile) | Mobile | 6 | Mobile |
| SCR-028 | Notification Center (Web + Mobile) | Frontend + Mobile | 8 | FE + Mobile |
| SCR-033 | Host Dashboard (Mobile) | Mobile | 8 | Mobile |
| SCR-043 | Reservation Inbox (Mobile) | Mobile | 8 | Mobile |
| Reviews frontend | Review display on listing detail | Frontend | 6 | FE |

**Sprint 6 Total: 36 hours**  
**Exit Gate:** Reviews submittable, notifications live, host mobile tools functional.

---

## 9.8 Sprint 7-8 — Hardening, Performance, MVP Gate (Weeks 15-18)

**Goal:** Performance targets met. Security hardened. UAT passed.

| Task ID | Title | Track | Hours | Owner |
|---------|-------|-------|-------|-------|
| Performance optimization | API response caching, DB query optimization | Backend | 16 | BE |
| Mobile performance | Flutter widget optimization, image caching | Mobile | 12 | Mobile |
| Web performance | Next.js Image optimization, ISR, CDN | Frontend | 10 | FE |
| Security hardening | Penetration test response, CVE fixes | All | 12 | All |
| Accessibility audit | WCAG AA compliance pass | Frontend | 8 | FE |

**Sprint 7-8 Total: 58 hours**

---

## 9.9 Beta — UAT + Invite-Only Launch

| Task ID | Title | Track | Hours | Owner |
|---------|-------|-------|-------|-------|
| TASK-QA-008 | UAT acceptance test script | QA | 8 | QA + Project Director |
| Staging → production config | Environment config migration | DevOps | 4 | DevOps |
| App Store submission | iOS + Android submission | Mobile | 8 | Mobile |
| Beta user onboarding | 10 invited users, 5 hosts + 5 guests | PM | 8 | PM |

---

## 9.10 RC — Release Candidate

**Gate:** 10 completed real transactions. UAT sign-off. All P0/P1 bugs resolved.

## 9.11 Production Launch — Go Live

**Gate:** RC signed off. Payment processor production keys live. Monitoring green.

---

## 9.12 Sprint Summary Table

| Sprint | Focus | Tasks | Hours | Exit Gate |
|--------|-------|-------|-------|-----------|
| S0 | Infrastructure + Foundation | 9 | 69 | AWS live, CI green |
| S1 | Missing Backend + Auth Web + Mobile Init | 21 | 148 | 90% coverage, auth live, Flutter running |
| S2 | Discovery + Search + KYC Mobile | 10 | 110 | Search + listing detail working |
| S3 | Booking Flow (Web + Mobile) + Host Listings | 8 | 106 | Full booking E2E |
| S4 | Check-In + Wallet + Payouts + E2E | 6 | 68 | Payouts working, E2E suites passing |
| S5 | Operations + Admin + Messaging | 4 | 58 | Messaging + ops live |
| S6 | Reviews + Notifications + Host Mobile | 5 | 36 | Reviews + notifications live |
| S7-S8 | Hardening + Performance | 5 | 58 | Performance targets met |
| Beta | UAT + App Store + Invite Users | 4 | 28 | 10 real transactions |
| RC | Release Candidate | — | — | UAT signed off |
| Production | Go Live | — | — | Public launch |
| **Total** | | **73** | **681** | |


---

# 10. CRITICAL PATH

## 10.1 Blocking Dependency Chain

```
[BLK-01: Mobile framework decision]
    │
    ▼
[TASK-MOB-001: Flutter init]
    │
    ├──► [TASK-MOB-003: OTP Mobile]
    │        │
    │        ├──► [TASK-MOB-004: KYC Mobile]
    │        │        │
    │        │        └──► [TASK-MOB-005: Home/Discovery]
    │        │                  │
    │        │                  └──► [TASK-MOB-008: Listing Detail]
    │        │                            │
    │        │                            └──► [TASK-MOB-009: Booking Flow]  ← MVP GATE
    │        │
    │        └──► [TASK-MOB-011: FCM Push]
    │
[BLK-02: Terraform provisioning]
    │
    ▼
[TASK-INF-001: AWS Core]
    │
    ├──► [TASK-INF-002: IAM Roles]
    │        │
    │        └──► [TASK-INF-005: CI/CD Pipeline]
    │
    ├──► [TASK-INF-003: S3 Buckets]
    │        │
    │        └──► [TASK-005: Photo Upload API]
    │                  │
    │                  └──► [TASK-FE-012: New Listing Wizard]
    │
    ├──► [TASK-010: Secrets Manager Wiring]
    │
    └──► [TASK-INF-004: SES]
             │
             └──► [TASK-011: Email Provider]

[TASK-FE-001: Next.js RTL Setup]
    │
    ▼
[TASK-FE-002: API Client]
    │
    ├──► [TASK-FE-003: Phone Entry]
    │        │
    │        └──► [TASK-FE-004: OTP Verify] → [TASK-FE-007: Search] → [TASK-FE-008: Listing Detail]
    │                                                                         │
    │                                                                         └──► [TASK-FE-009: Booking Flow]  ← MVP GATE
    │
    └──► [TASK-FE-011: Host Dashboard] → [TASK-FE-012: Listing Wizard]

[TASK-001: Messaging Models]
    │
    └──► [TASK-002: Messaging Router + SSE] → [SCR-025-026: Web Messaging]

[TASK-003: Reviews Models]
    │
    └──► [TASK-004: Reviews Router] → [SCR-024: Write Review Mobile]
```

## 10.2 MVP v1 Critical Path (Minimum Deliverable)

The minimum set of tasks that must complete for one real EGP booking:

```
TASK-INF-001 → TASK-INF-002 → TASK-INF-005 → [CI/CD live]
TASK-010 [Secrets] → TASK-009 [CORS] → [API in staging]
TASK-FE-001 → TASK-FE-002 → TASK-FE-003 → TASK-FE-004 [Web Auth]
TASK-FE-007 [Search] → TASK-FE-008 [Listing Detail] → TASK-FE-009 [Booking + Pay]
TASK-005 [Photo Upload] → TASK-FE-012 [List Creation] → [Live Listings]
FC-04 [Reservations] + FC-05 [Finance] → [Paymob payment in prod]
TASK-QA-008 [UAT] → [First real booking]
```

## 10.3 Parallel Tracks (Can Run Simultaneously)

| Group | Parallel Tasks |
|-------|---------------|
| Group A | TASK-INF-001 + TASK-FE-001 + TASK-MOB-001 (all start S0) |
| Group B | TASK-001 + TASK-003 + TASK-006 + TASK-011 (all S1, no mutual dependency) |
| Group C | TASK-FE-007 + TASK-MOB-005 (both S2, independent) |
| Group D | TASK-FE-009 + TASK-MOB-009 (both S3, same API different client) |
| Group E | TASK-QA-002 + TASK-FE-011 + TASK-MOB-006 (all S3, independent) |
| Group F | TASK-QA-003 + TASK-QA-004 + TASK-MOB-012 (all S4, independent) |

## 10.4 Milestone Gates

| Milestone | Required Tasks Complete | Target Sprint |
|-----------|------------------------|---------------|
| M1: Infrastructure Live | TASK-INF-001, 002, 003, 005 | End S0 |
| M2: Auth Working (Web) | TASK-FE-003, 004, 005, TASK-010 | End S1 |
| M3: Mobile Running | TASK-MOB-001, 002, 003 | End S1 |
| M4: Discovery Live | TASK-FE-007, 008, TASK-MOB-005, 008 | End S2 |
| M5: First Web Booking | TASK-FE-009, FC-04, FC-05 in staging | Mid S3 |
| M6: First Mobile Booking | TASK-MOB-009 | End S3 |
| M7: Host Can List | TASK-FE-012, TASK-005, FC-03 | End S3 |
| M8: Payouts Working | TASK-FE-013, FC-05 | End S4 |
| M9: Full E2E Test Suite | TASK-QA-003, 004 | End S4 |
| M10: MVP UAT Pass | TASK-QA-008, all P0/P1 bugs resolved | RC |
| M11: Production Launch | RC signed off, prod secrets live | Production |

---

# 11. RISK MAPPING

## 11.1 Critical Risks (R-C01 through R-C06)

| Risk ID | Task(s) Affected | Description | Probability | Impact | Mitigation |
|---------|-----------------|-------------|-------------|--------|-----------|
| R-C01 | TASK-MOB-001 | BLK-01: Mobile framework not chosen — blocks all mobile | HIGH | CRITICAL | DEC-011: Confirm Flutter immediately. No mobile tasks start until resolved. |
| R-C02 | TASK-INF-001 | BLK-02: AWS not provisioned — blocks all infra + staging | HIGH | CRITICAL | Terraform apply in Sprint 0 Day 1. DevOps owner accountable. |
| R-C03 | TASK-INF-005 | BLK-03: GitHub Secrets not configured — blocks CI | HIGH | CRITICAL | Configure with TASK-INF-001 in parallel. |
| R-C04 | TASK-FE-009, TASK-MOB-009 | Paymob iframe/WebView sandbox testing delays payment flow | MEDIUM | CRITICAL | Start Paymob sandbox account setup Week 1. Test independently of booking flow. |
| R-C05 | TASK-010 | Secrets Manager wiring fails or keys missing — all services broken | MEDIUM | CRITICAL | Local .env for staging development only. Production never uses .env. |
| R-C06 | TASK-QA-008 | MVP UAT fails — real Paymob transaction blocked in production | LOW | CRITICAL | Use Paymob test environment with real card numbers in Beta. |

## 11.2 High Risks (R-H01 through R-H09)

| Risk ID | Task(s) Affected | Description | Probability | Impact | Mitigation |
|---------|-----------------|-------------|-------------|--------|-----------|
| R-H01 | TASK-001, TASK-002 | SSE real-time messaging latency >500ms under load | MEDIUM | HIGH | Load test SSE with 50 concurrent connections in S2. Redis pub/sub per ADR-008. |
| R-H02 | TASK-FE-012, TASK-005 | Photo upload UX — presigned URL expiry during slow network | MEDIUM | HIGH | 15-minute URL expiry. Retry on expiry. Compress images client-side before upload. |
| R-H03 | TASK-MOB-009 | Paymob WebView deep link callback not received on iOS | MEDIUM | HIGH | Test on real iOS device with AppDelegate deep link handling. |
| R-H04 | TASK-FE-001 | RTL layout breaks on some Tailwind components | MEDIUM | HIGH | Use RTL Tailwind plugin from Sprint 0. Manual RTL check on every PR. |
| R-H05 | TASK-MOB-004 | Camera permissions denied — KYC flow blocked | MEDIUM | HIGH | Show rationale before permission request. Handle denied with manual upload fallback. |
| R-H06 | TASK-INF-001 | me-central-1 (UAE) region has limited service availability | MEDIUM | HIGH | Verify all required services (SES, WAF, ElastiCache) are available in me-central-1. SES: use eu-west-1. |
| R-H07 | TASK-QA-001 | Raising coverage to 90% reveals bugs in untested edge cases | MEDIUM | HIGH | Budget 16h for TASK-QA-001. Fix bugs as found rather than suppressing. |
| R-H08 | TASK-INF-007 | Restore test fails — backup not valid | LOW | HIGH | Run restore_verify.py in S1 immediately after first backup. |
| R-H09 | All frontend | Next.js hydration errors in AR/LTR mixed layout | MEDIUM | HIGH | Use suppressHydrationWarning only on dir attribute. Test SSR + CSR on all pages. |

## 11.3 Medium Risks (R-M01 through R-M08)

| Risk ID | Task(s) Affected | Description | Probability | Impact | Mitigation |
|---------|-----------------|-------------|-------------|--------|-----------|
| R-M01 | TASK-QA-002 | Integration tests flaky due to DB state between tests | MEDIUM | MEDIUM | Use transactions + rollback per test. Factory fixtures. |
| R-M02 | TASK-MOB-011 | FCM push delivery delayed on Android doze mode | MEDIUM | MEDIUM | Use high-priority FCM messages for booking events. |
| R-M03 | TASK-FE-015 | Arabic SEO / hreflang indexing issues | LOW | MEDIUM | Submit Arabic sitemap to Search Console separately. |
| R-M04 | TASK-008 | Analytics events contain PII accidentally | MEDIUM | MEDIUM | PII scrubber middleware on event ingestion. QA review event schema. |
| R-M05 | TASK-MOB-012 | Hive cache stale data shown after long offline | LOW | MEDIUM | Show stale-data timestamp. Auto-refresh on reconnect. |
| R-M06 | TASK-INF-006 | Sentry quota exceeded during stress testing | MEDIUM | MEDIUM | Set Sentry sample rate 10% in staging, 100% for errors. |
| R-M07 | TASK-QA-003 | Playwright E2E flaky on Paymob iframe in CI | MEDIUM | MEDIUM | Mock Paymob in E2E, test real Paymob in manual UAT only. |
| R-M08 | TASK-INF-008 | WAF geo-block breaks legitimate GCC users during MVP | LOW | MEDIUM | MVP: block only explicit threat IPs, not geo. Add MENA allowlist. |

## 11.4 Risk per Sprint

| Sprint | Top Risk | Mitigation Owner |
|--------|----------|-----------------|
| S0 | R-C01 (mobile framework), R-C02 (AWS) | Project Director + DevOps |
| S1 | R-H01 (SSE latency), R-H07 (coverage bugs) | BE + QA |
| S2 | R-H05 (camera permissions), R-H09 (hydration) | Mobile + FE |
| S3 | R-C04 (Paymob sandbox), R-H03 (iOS deep link) | BE + Mobile |
| S4 | R-M07 (Playwright flaky), R-M02 (FCM doze) | QA + Mobile |
| Beta | R-C06 (UAT fails) | Project Director + QA |

---

# 12. DELIVERY METRICS

## 12.1 Scope Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Total engineering tasks | 73 | All tracks |
| Total estimated hours | 681h | Across all sprints |
| MVP v1 tasks (critical path) | 28 | Minimum to ship one booking |
| MVP v1 hours | ~320h | Based on critical path tasks |
| Remaining backend tasks | 11 | TASK-001 through TASK-011 |
| Remaining frontend tasks | 15+ | TASK-FE-001 through TASK-FE-015 |
| Remaining mobile tasks | 12 | TASK-MOB-001 through TASK-MOB-012 |
| Remaining infra tasks | 8 | TASK-INF-001 through TASK-INF-008 |
| Remaining QA tasks | 8 | TASK-QA-001 through TASK-QA-008 |

## 12.2 Quality Metrics

| Metric | Baseline | Target | Gate |
|--------|----------|--------|------|
| Backend test coverage | 80.42% | 90% | S1 exit |
| API test count | 283 | 400+ | S2 exit |
| E2E test scenarios (Web) | 0 | 3 critical flows | S4 exit |
| E2E test scenarios (Mobile) | 0 | 3 critical flows | S4 exit |
| P0 bugs open | 0 | 0 | All times |
| P1 bugs open | 0 | 0 | RC entry |
| Lighthouse Performance | — | ≥80 | S4 exit |
| Lighthouse Accessibility | — | ≥90 | S4 exit |

## 12.3 Performance Metrics

| Endpoint | P95 Baseline | P95 Target | Measured Sprint |
|----------|-------------|-----------|----------------|
| GET /listings/ (search) | Unknown | 500ms | S3 |
| GET /listings/{id} | Unknown | 300ms | S3 |
| POST /reservations/initiate | Unknown | 800ms | S3 |
| POST /auth/otp/verify | Unknown | 200ms | S1 |
| Mobile cold start | — | <3s | S3 |
| Web LCP | — | <2.5s | S2 |

## 12.4 Delivery Burndown

| Sprint | Tasks In | Tasks Out | Remaining | % Done |
|--------|----------|-----------|-----------|--------|
| S0 | 73 | 9 | 64 | 12% |
| S1 | 64 | 21 | 43 | 41% |
| S2 | 43 | 10 | 33 | 55% |
| S3 | 33 | 8 | 25 | 66% |
| S4 | 25 | 6 | 19 | 74% |
| S5 | 19 | 4 | 15 | 79% |
| S6 | 15 | 5 | 10 | 86% |
| S7-S8 | 10 | 5 | 5 | 93% |
| Beta | 5 | 4 | 1 | 99% |
| RC | 1 | 1 | 0 | 100% |

## 12.5 Velocity Targets

| Sprint | Team Size | Target Velocity | Notes |
|--------|-----------|----------------|-------|
| S0 | 2 engineers + 1 DevOps | 69h output | Infrastructure-heavy |
| S1 | 3 engineers + 1 DevOps + 1 QA | 148h output | Full team sprint |
| S2–S4 | 4 engineers + 1 QA | ~95h/sprint | Steady state |
| S5–S6 | 4 engineers + 1 QA | ~47h/sprint | Wind-down feature |
| S7–S8 | Full team | ~58h/sprint | Hardening |

---

# 13. RELEASE PLAN

## 13.1 Version Legend

| Version | Trigger | Scope |
|---------|---------|-------|
| MVP v1 | First real booking complete | 65 SP minimum viable |
| V1.1 | 10 bookings completed | Messaging, Reviews, Mobile launch |
| V1.5 | 100 bookings completed | Admin panel, advanced analytics, multi-city |
| Phase 2 | PMF signal confirmed | AI pricing, AI recommendations, scale |
| Phase 3 | 50K+ transactions | GCC expansion, enterprise features |

## 13.2 Alpha — Internal Only

**Target:** End of Sprint 4  
**Audience:** Founders + core team only  
**Scope:**
- Web booking flow functional (staging)
- Mobile booking flow functional (TestFlight + Internal track)
- 5 test listings seeded
- Paymob sandbox — no real money

**Exit Criteria:**
- Complete booking flow on web (end-to-end)
- Complete booking flow on mobile (end-to-end)
- No P0 bugs
- CI pipeline green

## 13.3 Beta — Invite Only

**Target:** End of Sprint 6 / Beta Sprint  
**Audience:** 10 invited users (5 hosts, 5 guests), trusted beta testers  
**Scope:**
- Production AWS environment
- Real Paymob payments (real EGP)
- FCM push notifications live
- Messaging and reviews live
- Mobile apps on TestFlight + Internal track

**Exit Criteria:**
- 10 completed real bookings with EGP payment
- Host payouts processed
- No P0 bugs in 48 hours
- UAT script passed (TASK-QA-008)
- Monitoring: error rate <2%

## 13.4 Release Candidate (RC)

**Target:** End of RC Sprint  
**Scope:** Feature-complete, all P0/P1 bugs resolved  

**Exit Criteria:**
- All 22 Sprint 0 exit criteria (EXIT-01 through EXIT-22) met
- Backend coverage ≥90%
- Lighthouse scores: Performance ≥80, Accessibility ≥90
- P95 latency targets met for all core endpoints
- OWASP ZAP: no Critical findings
- pip-audit + npm audit: no unfixed High CVEs
- App Store review submissions prepared
- GDPR / data handling docs complete (MENA compliance)

## 13.5 Production — Go Live

**Target:** RC signed off + App Store approved  
**Trigger:** Project Director and founder sign-off on RC  

**Go-Live Checklist:**
- [ ] Production AWS secrets all loaded in Secrets Manager
- [ ] Paymob production API keys active
- [ ] Domain DNS cutover complete (stayos.com)
- [ ] SSL certificates valid
- [ ] CloudWatch alerts active
- [ ] Sentry DSNs pointing to production
- [ ] On-call rotation established
- [ ] Rollback plan documented and tested
- [ ] App Store: iOS app approved
- [ ] Play Store: Android app approved
- [ ] First listing published by real host
- [ ] Smoke test: complete booking in production

## 13.6 Feature Release Schedule Post-MVP

| Feature | Version | Trigger | Sprint Target |
|---------|---------|---------|--------------|
| Messaging | V1.1 | 10 bookings | S5 |
| Reviews | V1.1 | 10 bookings | S6 |
| Mobile public launch | V1.1 | 10 bookings | Beta |
| Admin panel | V1.5 | 100 bookings | S7 |
| Advanced analytics | V1.5 | 100 bookings | S8 |
| Multi-city (Alexandria, GCC) | Phase 2 | PMF signal | Post-production |
| AI pricing recommendations | Phase 2 | PMF signal | Post-production |
| AI guest matching | Phase 2 | PMF signal | Post-production |
| Enterprise / corporate housing | Phase 3 | 50K transactions | Long-term |

---

# 14. TRACEABILITY MATRIX

> Every requirement maps to: Feature → Task → Test → Sprint → Release  
> Nothing unmapped. Nothing untracked.

## 14.1 Requirement to Delivery Mapping (REQ-001 through REQ-070)

| REQ ID | Requirement | Epic | Task(s) | Test Reference | Sprint | Release |
|--------|-------------|------|---------|---------------|--------|---------|
| REQ-001 | User registration via phone OTP | EP-01 | FC-01 ✅ | test_auth/test_otp.py | S0 | MVP v1 |
| REQ-002 | User registration via Google/Firebase | EP-01 | FC-01 ✅ | test_auth/test_firebase.py | S0 | MVP v1 |
| REQ-003 | JWT RS256 access + refresh token | EP-01 | FC-01 ✅, ADR-006 | test_auth/test_jwt.py | S0 | MVP v1 |
| REQ-004 | Redis token revocation on logout | EP-01 | FC-01 ✅ | test_auth/test_logout.py | S0 | MVP v1 |
| REQ-005 | KYC document upload (national ID/passport) | EP-01 | FC-02 ✅, TASK-005 | test_kyc/test_submit.py | S0 | MVP v1 |
| REQ-006 | KYC selfie verification (Sumsub) | EP-01 | FC-02 ✅ | test_kyc/test_process.py | S0 | MVP v1 |
| REQ-007 | KYC status polling | EP-01 | FC-02 ✅, TASK-FE-006, TASK-MOB-004 | test_kyc/test_status.py | S0/S2 | MVP v1 |
| REQ-008 | User profile view + edit | EP-01 | FC-01 ✅, TASK-FE-004, TASK-MOB-003 | test_auth/test_profile.py | S0/S1 | MVP v1 |
| REQ-009 | Host KYC requirement before listing | EP-01 | FC-02 ✅ | test_kyc/test_host_gate.py | S0 | MVP v1 |
| REQ-010 | Property listing CRUD | EP-02 | FC-03 ✅ | test_listings/test_crud.py | S0 | MVP v1 |
| REQ-011 | Listing photo management | EP-02 | FC-03 ✅, TASK-005 | test_listings/test_photos.py | S0 | MVP v1 |
| REQ-012 | Listing availability calendar | EP-02 | FC-03 ✅, SCR-015, SCR-042 | test_listings/test_calendar.py | S0 | MVP v1 |
| REQ-013 | Dynamic pricing rules | EP-02 | FC-03 ✅ | test_listings/test_pricing.py | S0 | MVP v1 |
| REQ-014 | Listing publish / unpublish | EP-02 | FC-03 ✅, TASK-FE-012 | test_listings/test_publish.py | S0 | MVP v1 |
| REQ-015 | Listing search with text query | EP-03 | FC-03 ✅, TASK-FE-007, TASK-MOB-007 | test_listings/test_search.py | S0/S2 | MVP v1 |
| REQ-016 | Spatial / location search (PostGIS) | EP-03 | FC-03 ✅, ADR-005/010 | test_listings/test_spatial.py | S0 | MVP v1 |
| REQ-017 | Search filters (price, type, amenities) | EP-03 | FC-03 ✅, TASK-FE-007, TASK-MOB-007 | test_listings/test_filters.py | S0/S2 | MVP v1 |
| REQ-018 | Map view with listing pins | EP-03 | TASK-MOB-006, SCR-012 | E2E: map.spec | S3 | MVP v1 |
| REQ-019 | Booking initiation | EP-04 | FC-04 ✅, TASK-FE-009, TASK-MOB-009 | test_reservations/test_initiate.py | S0/S3 | MVP v1 |
| REQ-020 | Booking confirmation (payment hold) | EP-04 | FC-04 ✅, FC-05 ✅ | test_reservations/test_confirm.py | S0 | MVP v1 |
| REQ-021 | Booking cancellation + refund | EP-04 | FC-04 ✅ | test_reservations/test_cancel.py | S0 | MVP v1 |
| REQ-022 | Guest self check-in | EP-04 | FC-04 ✅, TASK-MOB-010, SCR-021 | test_reservations/test_checkin.py | S0/S4 | MVP v1 |
| REQ-023 | Guest check-out | EP-04 | FC-04 ✅, TASK-MOB-010, SCR-023 | test_reservations/test_checkout.py | S0/S4 | MVP v1 |
| REQ-024 | Booking status tracking | EP-04 | FC-04 ✅, SCR-019-020 | test_reservations/test_status.py | S0 | MVP v1 |
| REQ-025 | Promo code application | EP-04 | FC-04 ✅ | test_reservations/test_promo.py | S0 | MVP v1 |
| REQ-026 | Paymob payment (Fawry, Meeza, VodaCash, InstaPay) | EP-05 | FC-05 ✅, ADR-003 | test_finance/test_paymob.py | S0 | MVP v1 |
| REQ-027 | Stripe payment (international cards) | EP-05 | FC-05 ✅, ADR-003 | test_finance/test_stripe.py | S0 | MVP v1 |
| REQ-028 | Escrow hold on booking confirm | EP-05 | FC-05 ✅ | test_finance/test_escrow.py | S0 | MVP v1 |
| REQ-029 | Escrow release after check-out | EP-05 | FC-05 ✅ | test_finance/test_release.py | S0 | MVP v1 |
| REQ-030 | Host wallet + ledger | EP-05 | FC-05 ✅, TASK-FE-013, SCR-027 | test_finance/test_wallet.py | S0/S4 | MVP v1 |
| REQ-031 | Host payout request + processing | EP-05 | FC-05 ✅, TASK-FE-013, SCR-046 | test_finance/test_payout.py | S0/S4 | MVP v1 |
| REQ-032 | Paymob webhook processing | EP-05 | FC-05 ✅ | test_finance/test_webhook.py | S0 | MVP v1 |
| REQ-033 | Operations task management | EP-06 | FC-06 ✅, SCR-047-049 | test_operations/test_tasks.py | S0/S5 | MVP v1 |
| REQ-034 | Maintenance scheduling | EP-06 | FC-06 ✅, SCR-050 | test_operations/test_maintenance.py | S0/S5 | MVP v1 |
| REQ-035 | Staff management | EP-06 | FC-06 ✅, SCR-051 | test_operations/test_staff.py | S0/S5 | MVP v1 |
| REQ-036 | Unit readiness scoring | EP-06 | FC-06 ✅, SCR-052 | test_operations/test_readiness.py | S0/S5 | MVP v1 |
| REQ-037 | Security audit log | EP-01 | FC-07 ✅ | test_security/test_audit.py | S0 | MVP v1 |
| REQ-038 | Rate limiting | EP-01 | FC-07 ✅ | test_security/test_rate_limit.py | S0 | MVP v1 |
| REQ-039 | PII scrubbing in logs | EP-01 | FC-07 ✅ | test_security/test_pii.py | S0 | MVP v1 |
| REQ-040 | Sentry error tracking | EP-14 | FC-07 ✅, TASK-INF-006 | Manual: Sentry event | S0/S1 | MVP v1 |
| REQ-041 | Transactional outbox pattern | EP-14 | FC-07 ✅, ADR-013 | test_shared/test_outbox.py | S0 | MVP v1 |
| REQ-042 | Real-time messaging (SSE) | EP-07 | TASK-001, TASK-002 | test_messaging/ | S1 | V1.1 |
| REQ-043 | Guest-to-host messaging | EP-07 | TASK-002, SCR-025-026 | E2E: messaging.spec | S1/S5 | V1.1 |
| REQ-044 | Admin messaging inbox | EP-07 | TASK-002, SCR-057 | E2E: admin.spec | S5 | V1.5 |
| REQ-045 | Guest reviews listing | EP-08 | TASK-003, TASK-004, SCR-024 | test_reviews/ | S1/S6 | V1.1 |
| REQ-046 | Host reviews guest | EP-08 | TASK-003, TASK-004 | test_reviews/ | S1/S6 | V1.1 |
| REQ-047 | Review response by host | EP-08 | TASK-004 | test_reviews/ | S1 | V1.1 |
| REQ-048 | Listing average rating | EP-08 | TASK-003 | test_reviews/ | S1 | V1.1 |
| REQ-049 | FCM push notifications | EP-09 | TASK-006, TASK-MOB-011 | Manual: push received | S1/S2 | V1.1 |
| REQ-050 | In-app notification center | EP-09 | TASK-007, SCR-028 | test_notifications/ | S1/S4 | V1.1 |
| REQ-051 | Email notifications (SES) | EP-09 | TASK-011 | Manual: email received | S1 | MVP v1 |
| REQ-052 | Booking confirmation email | EP-09 | TASK-011 | Manual: email template | S1 | MVP v1 |
| REQ-053 | Payout notification email | EP-09 | TASK-011 | Manual: email template | S1 | MVP v1 |
| REQ-054 | Arabic language support (RTL) | EP-13 | TASK-FE-001, TASK-MOB-001 | Manual: RTL screenshot | S0/S1 | MVP v1 |
| REQ-055 | English language support | EP-13 | TASK-FE-001, TASK-MOB-001 | Manual: EN screenshot | S0/S1 | MVP v1 |
| REQ-056 | Web auth screens | EP-13 | TASK-FE-003–005 | E2E: auth.spec | S1 | MVP v1 |
| REQ-057 | Web search + listing detail | EP-13 | TASK-FE-007–008 | E2E: search.spec | S2 | MVP v1 |
| REQ-058 | Web booking flow | EP-13 | TASK-FE-009 | E2E: booking.spec | S3 | MVP v1 |
| REQ-059 | Web host listing creation | EP-13 | TASK-FE-012 | E2E: host.spec | S3 | MVP v1 |
| REQ-060 | Mobile auth + onboarding | EP-12 | TASK-MOB-001–003 | Flutter: auth_test.dart | S1 | MVP v1 |
| REQ-061 | Mobile discovery + search | EP-12 | TASK-MOB-005–008 | Flutter: search | S2 | MVP v1 |
| REQ-062 | Mobile booking flow | EP-12 | TASK-MOB-009 | Flutter: booking_test.dart | S3 | MVP v1 |
| REQ-063 | Mobile check-in / check-out | EP-12 | TASK-MOB-010 | Flutter: checkin_test.dart | S4 | V1.1 |
| REQ-064 | AWS me-central-1 (UAE) deployment | EP-14 | TASK-INF-001, ADR-007 | Terraform output | S0 | MVP v1 |
| REQ-065 | CI/CD pipeline | EP-14 | TASK-INF-005 | GitHub Actions run | S0 | MVP v1 |
| REQ-066 | Automated backups + restore test | EP-14 | TASK-INF-007 | scripts/restore_verify.py | S1 | MVP v1 |
| REQ-067 | WAF + rate limiting | EP-14 | TASK-INF-008 | WAF block log | S1 | MVP v1 |
| REQ-068 | Analytics event log | EP-11 | TASK-008 | test_analytics/ | S2 | V1.5 |
| REQ-069 | SEO — sitemap, OG, JSON-LD | EP-13 | TASK-FE-015 | Lighthouse SEO ≥90 | S4 | MVP v1 |
| REQ-070 | Offline mode (Mobile) | EP-12 | TASK-MOB-012 | Flutter: offline test | S4 | V1.1 |

## 14.2 Screen to API to Task Matrix

| Screen ID | Screen Name | API Endpoint | Task ID | Sprint |
|-----------|-------------|-------------|---------|--------|
| SCR-003 | Phone Entry | POST /auth/otp/send | TASK-FE-003, TASK-MOB-003 | S1 |
| SCR-004 | OTP Verify | POST /auth/otp/verify | TASK-FE-004, TASK-MOB-003 | S1 |
| SCR-005 | Social Login | POST /auth/firebase | TASK-FE-005, TASK-MOB-003 | S1 |
| SCR-006 | KYC Start | — | TASK-MOB-004 | S2 |
| SCR-007 | KYC Document | POST /media/upload-url | TASK-MOB-004, TASK-005 | S2 |
| SCR-008 | KYC Selfie | POST /kyc/submit | TASK-MOB-004 | S2 |
| SCR-009 | KYC Pending | GET /kyc/status | TASK-FE-006, TASK-MOB-004 | S1/S2 |
| SCR-010 | Home/Discovery | GET /listings/ | TASK-MOB-005 | S2 |
| SCR-011 | Search Results | GET /listings/ | TASK-FE-007, TASK-MOB-007 | S2 |
| SCR-012 | Map View | GET /listings/ + PostGIS | TASK-MOB-006 | S3 |
| SCR-013 | Search Filters | — | TASK-FE-007, TASK-MOB-007 | S2 |
| SCR-014 | Listing Detail | GET /listings/{id} | TASK-FE-008, TASK-MOB-008 | S2 |
| SCR-015 | Availability Cal | GET /listings/{id}/availability | TASK-FE-008, TASK-MOB-008 | S2 |
| SCR-016 | Booking Summary | POST /reservations/initiate | TASK-FE-009, TASK-MOB-009 | S3 |
| SCR-017 | Payment | Paymob iframe/WebView | TASK-FE-009, TASK-MOB-009 | S3 |
| SCR-018 | Confirmation | — | TASK-FE-009, TASK-MOB-009 | S3 |
| SCR-019 | Trips List | GET /reservations/ | TASK-FE-010, TASK-MOB-009 | S3 |
| SCR-020 | Trip Detail | GET /reservations/{id} | TASK-FE-010 | S3 |
| SCR-021 | Self Check-In | POST /reservations/{id}/check-in | TASK-MOB-010 | S4 |
| SCR-022 | Active Stay | — | TASK-MOB-010 | S4 |
| SCR-023 | Check-Out | POST /reservations/{id}/check-out | TASK-MOB-010 | S4 |
| SCR-025 | Messages List | GET /messages/conversations | TASK-002 | S5 |
| SCR-026 | Chat Thread | GET /messages/conversations/{id}/stream | TASK-002 | S5 |
| SCR-027 | Wallet | GET /finance/wallets/me | TASK-FE-013 | S4 |
| SCR-028 | Notification Center | GET /notifications/me | TASK-007 | S4 |
| SCR-029 | Profile | GET /auth/me | TASK-FE-002 | S2 |
| SCR-030 | Edit Profile | PATCH /auth/me/account | TASK-FE-002 | S2 |
| SCR-033 | Host Dashboard | GET /listings/host/dashboard | TASK-FE-011, TASK-MOB-010 | S3/S4 |
| SCR-034 | My Listings | GET /listings/ (host) | TASK-FE-011 | S3 |
| SCR-035–040 | New Listing Steps | POST /listings/ + POST /media/upload-url | TASK-FE-012 | S3 |
| SCR-042 | Calendar | POST /listings/{id}/calendar | TASK-FE-012 | S3 |
| SCR-043 | Reservation Inbox | GET /listings/host/reservations | TASK-FE-011 | S3 |
| SCR-045 | Revenue & Payouts | GET /finance/payouts | TASK-FE-013 | S4 |
| SCR-046 | Request Payout | POST /finance/payouts | TASK-FE-013 | S4 |
| SCR-047–052 | Operations | GET /operations/* | S5 | S5 |
| SCR-054 | Host Chat | GET /messages/conversations | TASK-002 | S5 |

---

# 15. CHANGE CONTROL

## 15.1 Change Control Policy

All changes to this backlog require a formal Change Request (CR). No task may be:
- Added to the backlog without a CR
- Removed from the backlog without a CR
- Moved between sprints without a CR
- Descoped without a CR

ADR changes require a separate ADR-nnn document. Architecture is frozen — any proposed change must go through Project Director approval before a new ADR is written.

## 15.2 Change Request Process

```
CR Submitted (form below)
    │
    ▼
Impact Analysis (Tech Lead — 24h max)
    │
    ├── Low impact (< 4h, no dependency change) → Tech Lead approves
    │
    └── High impact (> 4h, adds tasks, changes sprint, architecture) → Project Director approves
              │
              ▼
         CR Approved / Rejected
              │
              ▼ (if Approved)
         Backlog Updated (task added/modified/removed)
              │
              ▼
         MASTER_EXECUTION_BOARD_v2.0.md Updated
              │
              ▼
         Sprint Plan Updated
              │
              ▼
         Team Notified (standup)
```

## 15.3 Change Request Register

| CR ID | Date | Requested By | Description | Impact | Status | Approved By |
|-------|------|-------------|-------------|--------|--------|-------------|
| CR-001 | — | — | [Template — First CR to be recorded here] | — | — | — |

## 15.4 Change Request Template

```
CR ID:          CR-[nnn]
Date:           YYYY-MM-DD
Requested By:   [Name / Role]
Title:          [Short title]
Description:    [What change is being requested and why]
Affected Tasks: [TASK-nnn, TASK-nnn, ...]
Impact:
  - Hours Added/Removed: [+/- Xh]
  - Sprint Impact: [Sprint moves, new tasks, removed tasks]
  - Dependency Impact: [Any chain effects]
  - Risk Impact: [New risks introduced]
  - ADR Impact: [Any architectural decision affected — requires separate ADR]
Priority:       [P0 / P1 / P2 / P3]
Urgency:        [Immediate / This Sprint / Next Sprint]
Approval Required: [Tech Lead / Project Director]
Decision:       [Approved / Rejected / Deferred]
Approved By:    [Name]
Approval Date:  YYYY-MM-DD
Notes:          [Any conditions on approval]
```

## 15.5 Frozen Decisions — Do Not Change

The following are FROZEN and cannot be changed via a CR. Any change requires re-founding the architecture:

| Item | Frozen Decision |
|------|----------------|
| ADR-001 | Next.js 14 App Router (no React Native Web, no Remix) |
| ADR-002 | FastAPI + SQLAlchemy 2.0 async (no Django, no Node backend) |
| ADR-003 | Paymob + Stripe only (no PayPal, no Kashier) |
| ADR-005/010 | PostgreSQL 16 + PostGIS (no MongoDB, no DynamoDB) |
| ADR-006 | RS256 JWT with Redis revocation (no sessions, no symmetric JWT) |
| ADR-007 | me-central-1 UAE primary (no EU primary, no US primary) |
| ADR-008 | SSE + Redis pub/sub (no WebSocket, no Pusher) |
| ADR-009 | AWS S3 storage (no Cloudinary, no DigitalOcean Spaces) |
| ADR-012 | Celery + Redis (no RQ, no Dramatiq) |
| ADR-013 | Transactional Outbox (no direct event publishing) |
| ADR-014 | REST (no GraphQL, no tRPC) |
| ADR-015 | amount_minor + currency CHAR(3) monetary convention |
| MVP Scope | 65 SP — no scope additions without project director approval |

---

# DOCUMENT CONTROL

| Field | Value |
|-------|-------|
| Document ID | MDB-001 |
| Title | Master Delivery Backlog — StayOS Engineering Bible |
| Version | 1.0 |
| Status | OFFICIAL — ENGINEERING BIBLE |
| Created | 2026-07-29 |
| Created By | Technical Program Manager / Delivery Manager |
| Authority | PROJECT DIRECTOR EXECUTIVE ORDER 010 |
| Sections | 15 |
| Tasks Tracked | 73 |
| Total Hours | 681h |
| Sprints Covered | S0 → S8 → Beta → RC → Production |
| Next Review | End of Sprint 0 |
| Owner | Tech Lead |
| Classification | INTERNAL — ENGINEERING TEAM ONLY |

> **This document is the Engineering Bible.**  
> Every developer. Every AI. Every sprint. Every task.  
> Nothing gets built that is not in this backlog.  
> Nothing in this backlog goes unbuilt.

