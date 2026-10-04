# 25 — Storage & Media

## Provider
S3-compatible object storage (`S3_ENDPOINT_URL` configurable — Tigris or
AWS). Buckets by purpose:

| Env var | Purpose | Access |
|---|---|---|
| `S3_LISTINGS_BUCKET` | Listing photos | private refs → signed GET (`S3_PRESIGNED_GET_TTL_SECONDS`) |
| `S3_KYC_BUCKET` | KYC documents | private; dedicated `S3_KYC_*` creds (fallback `AWS_*`) |
| `S3_ATTACHMENTS_BUCKET` | Messages + payment-proof media | private signed URLs |
| `S3_REPORTS_BUCKET` | Generated reports/exports | private signed URLs |

## Mechanism (`storage` service)
- Presigned **PUT** for uploads (`S3_PRESIGNED_PUT_TTL_SECONDS`), presigned
  **GET** for reads — media never proxied through the API as bytes.
- `s3://bucket/key` stored in DB; resolved at read time.
- `IMAGE_HOST_ALLOWLIST` gates only *external* image URLs in API payloads —
  internal `s3://` refs always resolve through the signer.
- `MAX_IMAGE_BYTES` caps upload size; content-type validated at presign.

## Rules
- No public buckets. `cover_image` for SEO/list cards still resolves via
  the same canonical signed path.
- CORS must allow the web origin for direct PUTs (see TROUBLESHOOTING).
- Deletion on listing/KYC removal follows service-layer rules; orphaned
  objects are the caller's responsibility — there is no GC sweeper yet.
