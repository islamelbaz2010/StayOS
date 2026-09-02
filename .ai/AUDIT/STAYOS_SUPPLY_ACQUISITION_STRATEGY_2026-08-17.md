# STAYOS SUPPLY ACQUISITION STRATEGY

**Date:** 2026-08-17  
**Objective:** Acquire the first 3–5 real owner-authorized listings for StayOS V1 Closed Alpha, and establish a repeatable path to the next 50–100 listings.  
**Constraints:** No scraping. No fake inventory. No unauthorized use of competitor content. No channel-manager integrations (excluded per `MVP_FREEZE.md`).

---

## 1. First Target

**3–5 real owner-authorized listings in Greater Cairo.**

- Geographic scope: New Cairo, 6th October, Maadi, Zamalek, Nasr City (per `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md`).
- Minimum data per listing: title, city, governorate, price, property type, host phone number, photos.
- Authorization: explicit owner/manager agreement to list on StayOS.
- Verification: founder manually confirms authority before admin approval.

---

## 2. Source Rankings

| Rank | Source | Speed | Cost | Quality | Owner Access | Likelihood | Priority |
|---|---|---|---|---|---|---|---|
| 1 | Founder's personal network | Very fast | Free | High | Direct | Very high | P0 |
| 2 | Property management agencies | Fast | Free | Very high | One meeting | High | P0 |
| 3 | Airbnb/Booking public listings as lead signals | Fast | Free | Very high | Cold outreach | Medium | P0 |
| 4 | Referrals from onboarded hosts | Medium | Free | High | Warm intro | High | P1 |
| 5 | Facebook property groups | Fast | Free | Mixed | Direct DM | Medium | P1 |
| 6 | OLX Egypt / Dubizzle | Fast | Free | Mixed | Phone listed | Medium | P1 |
| 7 | Property photographers / cleaning companies | Slow | Low | High | Indirect | Medium | P2 |

The existing `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md` provides full scripts for each source. The `SUPPLY_PIPELINE_AUDIT.md` confirms the current software can import, review, and publish listings via CSV.

---

## 3. Legitimate Route Inventory

### Already Feasible (Use Now)

- **CSV import via `/admin/import`** — fully implemented: upload, parse, validate, preview, confirm, create `Unit`/`UnitListing`/`UnitPhoto`, auto-create host user.
- **Web host listing creation (`/host/listings/new`)** — for owners who self-register.
- **Admin pending queue (`/admin/pending`)** — approve/reject imported listings.
- **Host KYC bypass for imported listings** — imported hosts are auto `VERIFIED` to speed onboarding.

### Not Authorized and NOT Used

- Scraping Airbnb/Booking listing pages or APIs.
- Copying photos, descriptions, prices, reviews, host profiles.
- Representing scraped competitor content as StayOS listings.

### Allowed but Require Owner Authorization

- **Airbnb / Booking listings as lead signals only** — identify the property, find the owner/manager's contact, and ask for permission. No data import without explicit authorization.
- **Property management agencies** — one agreement can unlock multiple units.
- **Owner-direct** — property owners provide their own data and photos.

---

## 4. Recommended Workflow

The fastest path to the first 3–5 listings is the **admin-assisted import workflow**, already implemented:

```
DISCOVER (founder)
  ↓
CONTACT owner/manager (WhatsApp / SMS / phone / DM)
  ↓
COLLECT authorization + property data + photos
  ↓
FILL CSV using apps/web/public/import-template.csv
  ↓
UPLOAD via /admin/import
  ↓
PREVIEW + validate rows
  ↓
CONFIRM import
  ↓
ADMIN REVIEW pending queue
  ↓
APPROVE → LISTED
  ↓
NOTIFY owner outside system (WhatsApp)
  ↓
LISTING LIVE
```

### Data to Collect per Property

- Title (Arabic + English optional)
- Description
- City, governorate, district, address
- Latitude / longitude
- Property type
- Price per night
- Bedrooms, beds, bathrooms, max guests
- Amenities
- Image URLs or files
- Host name, phone number, email

### Critical Requirement

Each CSV row **must include `host_phone`** so the owner can later authenticate via OTP and manage their listing. If a property is imported without a phone number, the host account exists but is inaccessible.

---

## 5. Operational Targets for Week 1

| Source | Target Properties | Target Contacts | Owner |
|---|---|---|---|
| Founder's personal network | 2 | 5 | Founder |
| Property management agencies | 1–2 | 3 agencies | Founder |
| Airbnb/Booking lead signals | 1–2 | 10 listings | Founder |
| **Total** | **4–6** | **18 contacts** | |

Buffer is included because not all contacts convert. Target is to end Week 1 with **3 published listings**.

---

## 6. Owner Outreach

The `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md` contains verified scripts. For the first 3–5 properties, use the WhatsApp / phone call variants and personalize the `[source]` placeholder.

**Core value proposition:**
- Egyptian platform, EGP payments, Arabic support.
- First 3 completed bookings commission-free.
- Then 10% commission + 2% operational fee (lower than Airbnb's 15%).
- No subscription fees.
- Free account and listing creation.

---

## 7. Technical Import Steps

1. **Download template:** `apps/web/public/import-template.csv`.
2. **Fill one row per property**, ensuring `host_phone` and at least one `image_url` are present.
3. **Set status** to `PENDING_VERIFICATION` (default in template).
4. **Upload** via `/admin/import` (frontend) or `POST /api/v1/import/preview`.
5. **Review preview** for validation errors and duplicates.
6. **Confirm import** to create `Unit`, `UnitListing`, `UnitPhoto`, and auto-create `User` with `role=HOST` and `kyc_status=VERIFIED`.
7. **Review pending queue** and approve only complete, well-photographed listings.

---

## 8. Success Criteria for This Sprint

- [ ] At least 3 owner-authorized properties are imported.
- [ ] Each imported listing has real photos, real price, and real coordinates.
- [ ] Each listing has `host_phone` for owner access.
- [ ] Admin has approved and published the listings (`status=LISTED`).
- [ ] `GET /api/v1/listings` returns the new real listings.
- [ ] The OPPO device smoke test can browse the new listings.

---

## 9. Remaining Gaps

| Gap | Severity | Mitigation |
|---|---|---|
| No automated owner-outreach notification | Low | Manual WhatsApp/SMS; template exists |
| No owner response portal | Low | Manual conversation; access via OTP once host_phone is set |
| No listing quality gate before approval | Low | Founder/admin manual review for 3–5 listings |
| No payment provider for bookings | Critical | Configure Paymob/Stripe per `MVP_FREEZE.md` |
| Only 3 seed listings currently live | Critical | Execute this strategy immediately |
