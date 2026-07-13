# ADR-007: Deployment Strategy

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-001 (Frontend — hosting), ADR-002 (Backend — containerization), ADR-005 (Database — RDS region), ADR-015 (Multi-region)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — "Hosting: AWS or GCP (region: Middle East)"
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §2 Market Context (Egypt + GCC corridor)
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §1 System Type (modular monolith)
- [`TECH_STACK.md`](../../TECH_STACK.md) — §1 Confirmed (AWS or GCP, Middle East)
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §1 Phase Gate

---

## Problem

`MASTER_CONTEXT.md` says "AWS or GCP (region: Middle East)." No decision was recorded. This blocks:
- Infrastructure provisioning
- Database region selection (RDS vs Cloud SQL)
- CI/CD pipeline design
- Container registry choice
- Network and VPC architecture

The deployment choice affects latency for Egyptian and GCC users, data residency for regulatory compliance, and operational complexity for a small Phase 1 team.

---

## Options Evaluated

### Option A: AWS (Amazon Web Services)

**Relevant Regions**:
- `me-south-1` — Bahrain (operational, lower latency from GCC)
- `me-central-1` — UAE (launched 2022, lower latency from UAE and Saudi)
- `eu-south-1` — Milan (fallback if Middle East regions have gaps)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Moderate. EC2 + RDS + ElastiCache in Middle East ~$800–2,000/month at Phase 1 scale. Reserved instances reduce cost 40–60% with 1-year commitment. |
| **Scalability** | Excellent. ECS for container scaling. RDS read replicas for database. CloudFront CDN globally. |
| **Operational Complexity** | Moderate. AWS has the steepest learning curve but deepest documentation. ECS (Fargate) removes EC2 management. |
| **Security** | Industry-standard. VPC isolation. IAM role-based access. AWS WAF for DDoS. |
| **Performance** | me-central-1 (UAE) provides ~20–40ms latency from Egypt and GCC. CloudFront edge nodes in Cairo and Riyadh. |
| **Future Global Expansion** | AWS regions in Saudi (me-central-1), UAE, Bahrain. Full coverage for GCC expansion per ADR-015. |

**Pros**: Broadest service catalog. RDS for PostgreSQL with PostGIS is first-class. ElastiCache for Redis. S3 for file storage (already confirmed in TECH_STACK.md). Rekognition + Textract for KYC (ADR-006). SES for email. Largest MENA enterprise customer base. Best documentation.

**Cons**: Higher cost than GCP at equivalent specs. IAM complexity. AWS has historically had more service outages than GCP.

---

### Option B: GCP (Google Cloud Platform)

**Relevant Regions**:
- `me-central1` — Qatar
- `me-west1` — Israel (Tel Aviv) — geopolitically problematic for MENA market
- `me-central2` — Saudi Arabia (available)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Slightly lower than AWS for compute. Sustained use discounts automatic (no reserved instance commitment). |
| **Scalability** | Excellent. Cloud Run for serverless containers. Cloud SQL for PostgreSQL. |
| **Operational Complexity** | Moderate. Cloud Run is simpler than ECS Fargate for small teams. |
| **Security** | Comparable to AWS. VPC, IAM, Cloud Armor for DDoS. |
| **Performance** | GCP backbone known for low inter-region latency. |
| **Future Global Expansion** | me-central2 (Saudi Arabia) available. Cloud Run regions expanding. |

**Pros**: Cloud Run is simpler for small team than ECS. Firebase is a native service (aligns with ADR-006 Firebase Auth decision). Vertex AI for Phase 3 (ADR-004). Automatic sustained use discounts.

**Cons**: Cloud SQL PostGIS support is available but less mature than AWS RDS PostGIS. GCP Middle East region coverage narrower than AWS. `me-west1` (Israel) is geopolitically sensitive — would affect trust with Egyptian and GCC customers if data were stored there.

---

### Option C: Hybrid (AWS for infrastructure + Vercel for Next.js frontend)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Vercel Pro: $20/month base + usage. Low for frontend. AWS for backend/database. |
| **Scalability** | Excellent for frontend (Vercel edge). Backend scales independently on AWS. |
| **Operational Complexity** | Low for frontend (zero-config deployments). Moderate for backend. |
| **Security** | Vercel edge in multiple regions; AWS backend in Middle East. |
| **Performance** | Vercel edge CDN provides global performance for Next.js. Backend in Middle East for data. |
| **Future Global Expansion** | Vercel edge in MENA PoPs. AWS backend scales to GCC. |

**Pros**: Zero-config Next.js deployment on Vercel (optimized for Next.js). AWS for backend data sovereignty. Best of both.
**Cons**: Two cloud vendors to manage. Vercel does not have a Middle East edge PoP yet (as of 2026) — Arabic content served from closest edge. AWS backend handles sensitive data in Middle East region.

---

## Decision

**AWS as primary cloud provider** + **Vercel for Next.js frontend**

**Primary AWS Region**: `me-central-1` (UAE — Abu Dhabi)
**Secondary AWS Region (DR only)**: `me-south-1` (Bahrain)

**Rationale for Hybrid**:
- Vercel is the optimal host for Next.js (ADR-001) — zero-config deployment, ISR, edge functions
- AWS hosts all backend services, databases, and file storage in Middle East region
- Data never leaves AWS Middle East; Vercel only serves the frontend (no sensitive data)

### Service Deployment Map

| Service | Platform | Config |
|---------|---------|--------|
| Next.js frontend | Vercel | Edge-optimized, ISR |
| FastAPI backend | AWS ECS Fargate | Containerized, auto-scaling |
| PostgreSQL | AWS RDS Multi-AZ | `me-central-1`, automated backups |
| Redis | AWS ElastiCache | `me-central-1`, cluster mode |
| File storage | AWS S3 | `me-central-1`, versioning enabled |
| Container registry | AWS ECR | Private, scanned |
| CDN | AWS CloudFront | Arabic content, MENA edge |
| DNS | AWS Route 53 | Weighted routing, health checks |
| CI/CD | GitHub Actions → AWS | Existing `.github/workflows/` |

---

## Decision Rationale

1. **AWS Middle East coverage is broader**: AWS has operational regions in UAE and Bahrain, with Saudi Arabia regions announced. This covers the full Egypt → GCC expansion path (ADR-015).

2. **Data sovereignty**: All user data, financial records, and KYC documents stored in AWS `me-central-1` (UAE). This addresses anticipated Egyptian and UAE data residency requirements.

3. **S3 is already confirmed**: `TECH_STACK.md` confirms AWS S3 for file storage. Choosing AWS as primary aligns all storage in one provider.

4. **Vercel for Next.js is the lowest-friction option**: Next.js is Vercel's product. Deployment, preview environments, ISR revalidation, and edge middleware work out-of-the-box. No DevOps work needed for frontend.

5. **ECS Fargate removes EC2 management**: The Phase 1 team does not need to manage server fleets. Fargate abstracts compute management while retaining container portability.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| GCP primary | PostGIS maturity on Cloud SQL lags AWS RDS; Firebase is used (ADR-006) but as a standalone service, not requiring GCP for the rest of the stack; `me-west1` Israel is geopolitically problematic |
| AWS only (no Vercel) | Next.js on ECS is significantly more complex than Vercel; no operational advantage that justifies the configuration overhead |
| Single-region deployment | Bahrain (`me-south-1`) alone has higher latency from Egypt (~80ms vs ~40ms from UAE). Multi-AZ in `me-central-1` provides equivalent resilience. |

---

## Migration Cost

**Future**: If GCP becomes preferred (e.g., Vertex AI for Phase 3 AI, ADR-004), FastAPI containers are portable. PostgreSQL dump/restore to Cloud SQL. Redis state is ephemeral — migration cost is low. S3 → Cloud Storage via `gsutil rsync`.

---

## Dependencies

- ADR-001 (Frontend) — Vercel deployment target
- ADR-005 (Database) — AWS RDS + ElastiCache in `me-central-1`
- ADR-006 (Auth) — AWS Rekognition + Textract in `me-central-1`
- ADR-009 (Storage) — AWS S3 in `me-central-1`
- ADR-015 (Multi-region) — Secondary region expansion plan

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| Phase 1 infrastructure cost | ~$1,000–2,500/month (RDS + Fargate + ElastiCache + S3) |
| Latency for Egyptian users | ~40–60ms from Cairo to UAE region |
| Latency for GCC users | ~15–30ms from UAE/Saudi to UAE region |
| Data residency | All PII and financial data in UAE (AWS me-central-1) |
| CI/CD | GitHub Actions → ECR → ECS Fargate (backend) + Vercel (frontend) |
| DR | Multi-AZ within `me-central-1`; Bahrain region as warm DR target |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
