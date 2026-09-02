# Engineering: How to Import an Authorized Listing

**Triggered when:** Founder sends you a complete data package for an owner-authorized property.

**Prerequisites before import:**
- [ ] Owner authorization confirmed (see AUTHORIZATION_WORKFLOW.md)
- [ ] Data package complete (title, address zone, price, property_type, host details)
- [ ] At least 5 photos received

---

## Import Path A: Discovery Candidate Exists (preferred for DISC_001–DISC_009)

When the property was already in the discovery database, use the existing candidate ID.

**Step 1 — Find the candidate ID**

The candidate ID is in the SUPPLY_TRACKER.csv. For DISC_* rows, get it from the Railway DB:
```sql
SELECT id, title, qualification_score, contact_value
FROM discovery.discovery_candidates  
WHERE qualification_score >= 80 AND contact_status = 'AVAILABLE'
ORDER BY qualification_score DESC;
```

**Step 2 — Update the candidate status to PROSPECT**

```sql
UPDATE discovery.discovery_candidates
SET status = 'PROSPECT', contact_status = 'RESPONDED'
WHERE id = '[candidate_uuid]';
```

**Step 3 — Call the import endpoint**

```bash
POST /api/v1/discovery/candidates/{candidate_id}/import
Authorization: Bearer {admin_jwt}
Content-Type: application/json

{
  "host_name": "Ahmed Hassan",
  "host_phone": "+201001234567",
  "host_email": "ahmed@email.com",
  "overrides": {
    "title": "Luxury 2BR in Sodic Villette",
    "price_per_night": 1500,
    "max_guests": 4,
    "bedrooms": 2,
    "bathrooms": 1
  }
}
```

This creates: Unit + UnitListing + host account. Returns: `{ "unit_id": "...", "listing_id": "...", "host_id": "..." }`

**Step 4 — Upload photos**

```bash
POST /api/v1/listings/{unit_id}/photos
# Use multipart form upload
# Each photo = one request
# Requires S3 to be configured in Railway env vars
```

If S3 is not yet configured: save photos locally and note the listing as PENDING_PHOTOS in tracker.

**Step 5 — Admin approval**

1. Log in to `/admin/pending` (Vercel web app) as admin
2. Find the new listing in pending queue
3. Review details + photos
4. Click Approve → listing goes LIVE

---

## Import Path B: New Property (no discovery record)

Use this for personal network contacts, OLX/Facebook leads, agency bulk imports.

**Option B1 — Bulk CSV Upload (preferred for 3+ units)**

Create a CSV with the format from OWNER_DATA_COLLECTION.md, then:

```bash
# Check if bulk import endpoint exists
GET /api/v1/discovery/bulk-import  # admin only

# If not: use admin UI or manual DB insert
```

If the bulk import endpoint doesn't exist yet (check router.py), Engineering can run a script:

```python
# scripts/bulk_import_listings.py
# Uses existing discovery import service
# Reads CSV, creates DiscoveryCandidate records, then triggers import
```

**Option B2 — Manual DB + Admin Flow**

For one-off imports:
1. Create a DiscoveryCandidate record directly with `status=READY_FOR_IMPORT`
2. Use the import endpoint (Path A Step 3 above)

SQL to create a minimal candidate for import:
```sql
INSERT INTO discovery.discovery_candidates (
  id, source, title, city, zone, property_type,
  contact_status, contact_value, status,
  raw_contact, qualification_score, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'manual',
  'Luxury 2BR in Sodic Villette',
  'Cairo',
  '5th Settlement',
  'apartment',
  'RESPONDED',
  '+201001234567',
  'READY_FOR_IMPORT',
  '{"phone": "+201001234567", "whatsapp": "+201001234567"}',
  90,
  NOW(), NOW()
);
```

---

## Post-Import Checklist

After every import, update the tracker:

| Field | Value |
|-------|-------|
| Imported_to_StayOS | YES |
| Admin_Review | PENDING (until approved) |
| LIVE | NO (until admin approves) |

After admin approval:
| Field | Value |
|-------|-------|
| Admin_Review | APPROVED |
| LIVE | YES |

---

## Photo Upload Without S3 (Interim Workaround)

If S3 is not configured and owner has already sent photos:
1. Store photos in `.ai/SUPPLY/PROPERTY_PHOTOS/[Lead_ID]/`
2. Note `Photos_Received = COMPLETE, CSV_Ready = YES` in tracker
3. Block note: "PENDING_S3_CONFIG — photos stored locally, upload after S3 configured"
4. As soon as S3 env vars are set on Railway, run batch upload

**S3 env vars needed on Railway:**
```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=stayos-photos
AWS_REGION=me-south-1 (or eu-west-1 — wherever bucket is)
```

---

## Admin JWT for Railway API Calls

The local dev `.env` JWT key does NOT work against Railway production.

To generate a valid Railway admin JWT:
1. Get the Railway production `JWT_PRIVATE_KEY` from Railway → Service → Variables
2. Generate token using: `python3 scripts/generate_admin_token.py --key [railway_key]`
3. Or: use the admin UI login once Twilio is configured

Until Twilio is live, Railway admin operations should go through:
- Railway Data tab (direct SQL)
- Or: temporarily set a static admin bypass token in Railway env

**NEVER commit Railway production keys to git.**
