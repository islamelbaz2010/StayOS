# ADR-006: Authentication Strategy

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-001 (Frontend — auth UI), ADR-002 (Backend — JWT handling), ADR-005 (Database — session storage)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — Twilio SMS, WhatsApp Business API
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §6 FC-01 feature definition, §8 BR-ID-01
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §2 AuthGate service boundary
- [`TECH_STACK.md`](../../TECH_STACK.md) — Twilio (confirmed), Firebase Identity or Auth0 (unresolved)
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §8 Security Rules

---

## Problem

FC-01 AuthGate is the root dependency for all other features. Its implementation requires deciding:

1. **OTP delivery**: Twilio is confirmed. No decision needed here.
2. **Social OAuth provider**: `TECH_STACK.md` lists "Firebase Identity or Auth0" — unresolved.
3. **Session/token management**: JWT vs server-side sessions — not specified.
4. **KYC verification**: Third-party OCR provider — not specified.

`ENGINEERING_BACKLOG.md` FC-01 specifies "Configure secure Firebase Identity/Auth0 tenant platform setups for Google and Apple sign-in keys" — but does not choose between them.

The authentication strategy is the security foundation of the entire system. It must be resolved before Sprint 1.

---

## Authentication Components

### Component 1: OTP — Phone Number Verification

**Decision**: Twilio (confirmed, no alternatives to evaluate).

- Twilio Verify API for SMS OTP delivery
- 6-digit tokens, 5-minute TTL (Redis-enforced per ENGINEERING_BACKLOG.md)
- E.164 phone number format validation
- Rate limiting: 3 OTP requests per phone number per 15 minutes (prevents SMS flooding)

### Component 2: Social OAuth — Google and Apple Sign-In

Two candidates from `TECH_STACK.md`:

**Option A: Firebase Authentication**

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Free tier covers Phase 1 volume (50K monthly active users). Pay-as-you-go beyond. |
| **Scalability** | Google-scale. No capacity concern. |
| **Operational Complexity** | Low. Firebase console. SDK handles token exchange, refresh, revocation. |
| **Security** | Google-managed. SOC 2. Handles token refresh transparently. |
| **Performance** | Firebase SDK sub-100ms token validation. |
| **Future Global Expansion** | Firebase available globally. Google OAuth works in Saudi, UAE, Egypt. |
| **Apple Sign-In** | Supported natively. |

Pros: Unified SDK for phone OTP + Google + Apple (can replace Twilio for OTP as well). Firebase Admin SDK for backend token verification. Real-time database option if needed later.
Cons: Google ecosystem dependency. If GCP is not chosen in ADR-007, Firebase adds a second cloud vendor.

**Option B: Auth0**

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Free tier: 7,500 MAU. $23/month for 1,000 MAU beyond. More expensive than Firebase at scale. |
| **Scalability** | Enterprise-grade. Handles any scale. |
| **Operational Complexity** | Moderate. More configuration surfaces than Firebase. Stronger customization. |
| **Security** | SOC 2 Type II, ISO 27001. MFA, anomaly detection built-in. |
| **Performance** | Auth0 CDN-distributed. Comparable to Firebase. |
| **Future Global Expansion** | Available globally. EU/US/AU data residency options. No MENA data residency. |
| **Apple Sign-In** | Supported. |

Pros: More customizable flows. Better audit logs for enterprise clients. Social connections management UI.
Cons: Higher cost at Phase 1 scale. More complex configuration. ENGINEERING_BACKLOG.md lists Firebase as the first option — Firebase is the natural choice when both are mentioned together.

### Component 3: JWT Token Management

**Session strategy**: Stateless JWT (JSON Web Tokens) with Redis-backed revocation list.

- Access token: 15-minute expiry, signed with RS256 (asymmetric — FastAPI holds private key, clients verify with public key)
- Refresh token: 7-day expiry, stored in Redis (allows server-side revocation on logout or account suspension)
- KYC status embedded in access token claims — avoids a database lookup on every request

### Component 4: KYC Document Verification

`ENGINEERING_BACKLOG.md` specifies "Integrate automated third-party validation APIs parsing document identity fields" but does not name the provider. Two candidates evaluated:

**Option A: AWS Rekognition + Textract**
- Face liveness detection + ID document OCR
- Stays within AWS ecosystem (aligned with ADR-007 deployment decision)
- Arabic document support (Egyptian national ID — البطاقة الشخصية)

**Option B: Jumio / Onfido / Sumsub**
- Specialized KYC/AML platforms
- Arabic document support
- Higher per-verification cost (~$0.50–3.00 per verification)
- Regulatory reporting features useful for CBE compliance

---

## Decision

**Social OAuth**: Firebase Authentication (Google + Apple Sign-In)
**OTP**: Twilio Verify API (confirmed)
**Session tokens**: Stateless JWT (RS256) + Redis refresh token store
**KYC Document Verification**: AWS Rekognition + Textract (Phase 1) — upgrade to Sumsub if CBE compliance requires AML reporting in Phase 2

---

## Decision Rationale

1. **Firebase over Auth0 on cost**: Firebase's free tier covers Phase 1. Auth0 at $23/month per 1,000 MAU becomes expensive at the 10K+ MAU Phase 1 target. Firebase is explicitly listed first in ENGINEERING_BACKLOG.md.

2. **Firebase ecosystem alignment**: Firebase Authentication integrates with Google Cloud. If ADR-007 later chooses GCP, Firebase is a native service. If AWS is chosen, Firebase still operates as a standalone service — no dependency conflict.

3. **JWT over server sessions**: Stateless JWT allows FastAPI backend to scale horizontally without sticky sessions. Redis refresh token store provides revocation without full server-side session management overhead.

4. **AWS Rekognition/Textract for KYC**: Stays within AWS ecosystem (ADR-007). Arabic OCR support for Egyptian national IDs. Lower per-verification cost than specialized KYC platforms at Phase 1 volume.

5. **BR-ID-01 enforcement**: The KYC `VERIFIED` status is embedded in the JWT access token claims. Every API endpoint protected by the auth middleware reads this claim — no database lookup required per request. KYC status updates (from UNVERIFIED → VERIFIED) trigger immediate token refresh.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| Auth0 | Higher cost at Phase 1 scale; more complex configuration without proportional benefit; Firebase listed first in ENGINEERING_BACKLOG.md |
| Server-side sessions (no JWT) | Requires sticky sessions or shared session store — creates horizontal scaling constraint for FastAPI |
| Sumsub/Onfido (Phase 1) | Higher cost per verification at Phase 1 volume; AWS Rekognition sufficient for basic OCR; evaluate Sumsub at Phase 2 if AML reporting required |

---

## Migration Cost

**OTP → Firebase Phone Auth**: Twilio is spec'd in ENGINEERING_BACKLOG.md. Migrating later to Firebase Phone Auth (if desired) is a one-service swap. Migration cost: low.

**JWT → different token scheme**: RS256 JWT is an open standard. Changing signing algorithm requires a key rotation and a forced re-login. Migration cost: moderate. Choose once and commit.

---

## Dependencies

- ADR-001 (Frontend) — Firebase Auth SDK integrates with Next.js via `firebase/auth`
- ADR-005 (Database) — Redis for refresh token store and OTP token store
- ADR-007 (Deployment) — AWS Rekognition + Textract provisioned in Middle East region

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| FC-01 AuthGate | Entire implementation |
| BR-ID-01 | KYC `VERIFIED` claim in JWT enforced by auth middleware |
| FC-02, FC-03, FC-04, FC-05, FC-06 | All depend on FC-01 JWT token |
| Security | RS256 asymmetric signing prevents token forgery |
| GCC travelers | Google/Apple Sign-In familiar to GCC users; reduces friction |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
