# ADR-009: Storage Strategy

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-007 (Deployment — AWS region), ADR-005 (Database — no binary in PostgreSQL)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — general infrastructure references
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §6 FC-01 (KYC docs), FC-04 (property photos), FC-05 (field photos)
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §6 Offline Architecture
- [`TECH_STACK.md`](../../TECH_STACK.md) — §1 AWS S3 confirmed
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §8 Security Rules

---

## Problem

Three distinct storage use cases require different handling:

1. **Property listing photos** (FC-04): Uploaded by hosts; served to guests on listing pages. Public read, authenticated write.
2. **KYC identity documents** (FC-01): Passport/ID scans. Highly sensitive PII. Private, encrypted, access-controlled, audit-logged.
3. **Field staff operational photos** (FC-05): Turnover verification photos uploaded from offline mobile app. Initially cached in device sandbox, then uploaded to cloud on connectivity recovery.

`TECH_STACK.md` confirms AWS S3 for file storage. This ADR details the bucket architecture, access control, and lifecycle policies for each use case.

---

## Storage Architecture

### AWS S3 is the decision. The question is how to configure it.

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Standard storage: ~$0.023/GB-month. Transfer out: ~$0.09/GB. At Phase 1 scale (10K photos, avg 2MB each = 20GB): ~$0.50/month storage + transfer costs. Negligible. |
| **Scalability** | AWS S3 scales to exabytes. No capacity concern ever. |
| **Operational Complexity** | Low. S3 is managed. Lifecycle rules are declarative configuration. |
| **Security** | Server-side encryption (SSE-S3 or SSE-KMS). Bucket policies for access control. Signed URLs for time-limited access. VPC endpoint to avoid public internet traversal. |
| **Performance** | CloudFront CDN in front of S3 for listing photos — global edge caching. Pre-signed URL generation is fast (< 10ms). |
| **Future Global Expansion** | S3 Cross-Region Replication for GCC expansion. CloudFront automatically serves from nearest edge. |

---

## Bucket Architecture

### Bucket 1: `stayos-listings-{env}` — Property Photos (Public-facing)

**Access pattern**: Public read via CloudFront CDN. Write via pre-signed URL (authenticated host only).

Configuration:
- **Encryption**: SSE-S3 (AES-256)
- **Public access**: Blocked at bucket level; CloudFront Origin Access Control handles public reads
- **Versioning**: Disabled (photos replaced, not versioned)
- **Lifecycle**: Move to S3 Intelligent-Tiering after 90 days (cost optimization for inactive listings)
- **CloudFront**: Distribution in front of bucket; HTTPS enforced; Cache-Control headers set per image type

Image pipeline:
- Host uploads via pre-signed URL (max 10MB, max 20 photos per listing)
- Lambda trigger on upload: resize to standard sizes (thumbnail 300px, preview 800px, full 1920px) and store all three variants
- Only resized variants served via CloudFront; original deleted after processing

### Bucket 2: `stayos-kyc-{env}` — KYC Identity Documents (Private, Encrypted)

**Access pattern**: Write-once by KYC upload flow. Read-only by backend KYC verification service. Never public.

Configuration:
- **Encryption**: SSE-KMS (AWS KMS with customer-managed key)
- **Public access**: Blocked entirely
- **Versioning**: Enabled (audit trail)
- **Object Lock**: Compliance mode, 7-year retention (financial record requirement)
- **Access**: IAM role-based; only KYC verification Lambda/ECS task has read access
- **Audit logging**: S3 server access logs to separate `stayos-kyc-audit-{env}` bucket
- **Lifecycle**: No automatic expiry (retention managed by Object Lock)

Pre-signed URL for upload:
- Generated server-side by FastAPI after user initiates KYC
- URL valid for 15 minutes only
- URL is single-use (enforced via S3 condition key `s3:x-amz-content-sha256`)

### Bucket 3: `stayos-ops-{env}` — Field Operations Photos (Private)

**Access pattern**: Write from mobile app (post-sync); read by backend for ticket verification.

Configuration:
- **Encryption**: SSE-S3
- **Public access**: Blocked
- **Versioning**: Disabled
- **Lifecycle**: Move to S3 Glacier after 365 days (operational photos rarely retrieved after ticket close)
- **Access**: Pre-signed upload URL provided by FastAPI on job acceptance; IAM role for backend read

Mobile offline sync flow:
1. Photo captured on device → stored in device sandbox (local file path in SQLite)
2. Background sync service detects connectivity
3. FastAPI provides pre-signed upload URL (valid 1 hour)
4. Mobile uploads binary directly to S3 (not through FastAPI — avoids backend bandwidth cost)
5. FastAPI webhook confirms upload; ticket record updated with S3 object key

---

## Security Rules

- No binary files stored in PostgreSQL (ENGINEERING_RULES.md §7)
- No S3 bucket is ever public (all access via signed URLs or CloudFront OAC)
- KYC bucket uses customer-managed KMS key — key rotation every 365 days
- All S3 access logged to audit buckets
- Pre-signed URLs: minimum viable TTL per use case (15 min for KYC, 1 hour for ops upload, CloudFront TTL for listings)

---

## Decision

**AWS S3 with three-bucket architecture** (listings / kyc / ops) in `me-central-1` (UAE, per ADR-007).

---

## Decision Rationale

1. **S3 is already confirmed** in `TECH_STACK.md`. This ADR specifies the configuration, not the provider.
2. **Three separate buckets** enforce principle of least privilege — a compromised KYC bucket IAM role cannot access listing photos or vice versa.
3. **CloudFront for listing photos** delivers property images globally with < 50ms latency for Egyptian and GCC guests — required for fast search results (PRODUCT_CANON.md §11: search < 2 seconds).
4. **Object Lock on KYC** satisfies anticipated data retention requirements under Egyptian financial regulations.
5. **Mobile direct-to-S3 upload** (pre-signed URLs) avoids routing large binary files through FastAPI backend — reduces backend compute cost and eliminates a bottleneck.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| PostgreSQL bytea for photos | Anti-pattern; kills database performance; `ENGINEERING_RULES.md` §7 prohibits this |
| Single S3 bucket for all files | Insufficient security isolation between public listing photos and private KYC documents |
| Self-hosted MinIO | Operational overhead; S3 compatibility is S3 — use actual S3 in Middle East region |

---

## Migration Cost

**Future**: If CloudFront is replaced by another CDN, S3 bucket configuration is unchanged. Migration cost: CDN configuration only.

**GCC expansion**: S3 Cross-Region Replication to a Saudi Arabia bucket for reduced latency. Existing bucket policy unchanged.

---

## Dependencies

- ADR-007 (Deployment) — AWS `me-central-1` region; CloudFront distribution
- ADR-005 (Database) — PostgreSQL stores S3 object keys (not binaries)
- ADR-006 (Auth) — Pre-signed URL generation requires authenticated user session

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| FC-01 KYC | Secure KYC bucket with KMS encryption and Object Lock |
| FC-04 Property photos | CloudFront CDN; host upload via pre-signed URL |
| FC-05 Ops photos | Mobile direct-to-S3; lifecycle to Glacier after 365 days |
| Page load performance | CloudFront edge caching for listing photos |
| Compliance | KYC Object Lock satisfies 7-year retention |
| Monthly cost | ~$10–50/month at Phase 1 volume |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
