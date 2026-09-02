# PROPERTY IMPORT AND SEEDING STRATEGY — StayOS

**Prepared by:** Executive Marketplace Operations Board  
**Date:** 2026-08-03  
**Purpose:** Define how StayOS launches with real inventory without waiting for hosts to self-register.

---

## 1. Seeding Philosophy

A marketplace cannot launch empty. The fastest way to create supply is for StayOS operations to create listings first and then invite owners to claim them. This flips the funnel: build the listing, verify the data, then transfer ownership.

**Evidence from the repository:**
- `knowledge/marketplace/cold_start_playbook.md` — manual operations, institutional supply first
- `MARKETPLACE_SUPPLY_STRATEGY.md` — cold start, seed inventory, claim listing workflow
- `knowledge/hospitality/property_quality_standards.md` — three-gate quality system
- `knowledge/founder/scaling_playbook.md` — institutional-first Phase 1

---

## 2. Why Seeding Is Necessary

- Self-serve host onboarding is slow in Stage 1.
- A marketplace with < 20 listings in an area has no liquidity.
- Institutional partners (hotels, property managers, serviced apartments) already have structured data.
- Manual import and claim allows StayOS to control quality from day one.
- Seeding creates the first 50 listings while self-serve tools are being built.

---

## 3. Seeding Channels

### 3.1 Manual Import

**Definition:** Operations staff manually collect property data and create listings in the admin console.

**Sources:**
- Founder network properties.
- Publicly available listings (with owner permission and no copyright violation).
- Property manager spreadsheets.
- Tourism company inventories.
- Hotel room type data.

**Process:**
1. Operations identifies a property.
2. Collects address, coordinates, photos, amenities, pricing.
3. Creates a `DRAFT` listing in the admin console.
4. Verifies ownership or authorization.
5. Publishes as `UNCLAIMED` or `PENDING_CLAIM`.

**Expected yield (Closed Alpha):**
- 15–25 of the first 50 listings.

**Operational effort:**
- 2–3 hours per listing (data collection, photo upload, verification).
- 1 operations specialist can seed 3–5 listings per day.

### 3.2 Agency Partnerships

**Definition:** Real-estate agencies, tourism agencies, and property management companies provide inventory data under agreement.

**Process:**
1. Identify 3–5 agencies in target area.
2. Sign data-sharing or revenue-share agreement.
3. Receive property list (CSV, spreadsheet, or API).
4. Import into platform.
5. Verify each property.
6. Publish and invite owners to claim.

**Expected yield (Closed Alpha):**
- 10–20 of the first 50 listings.

**Operational effort:**
- BD effort: 1–2 weeks per agency.
- Data import: 1–2 days.
- Verification: 2–3 days.

### 3.3 Bulk Excel Import

**Definition:** Import multiple listings from a spreadsheet.

**CSV Format (per `MARKETPLACE_SUPPLY_STRATEGY.md`):**

| Column | Required | Example |
|--------|----------|---------|
| `owner_phone` | Yes | +201001234567 |
| `property_type` | Yes | apartment |
| `title_ar` | Yes | شقة فاخرة بالتجمع |
| `title_en` | No | Luxury apartment in Tagammoa |
| `description_ar` | Yes | ... |
| `city` | Yes | Cairo |
| `governorate` | Yes | Cairo |
| `lat` | Yes | 30.0444 |
| `lng` | Yes | 31.2357 |
| `max_guests` | Yes | 4 |
| `bedrooms` | Yes | 2 |
| `bathrooms` | Yes | 1 |
| `base_price_egp` | Yes | 2500 |
| `amenities` | No | wifi,parking,ac |
| `photo_urls` | No | https://... |

**Process:**
1. Partner fills CSV template.
2. Operations validates CSV.
3. Admin uploads CSV.
4. System creates `DRAFT` listings.
5. Operations downloads/requests photos.
6. Partner reviews and approves each listing.
7. Listings published.

**Expected yield (Closed Alpha):**
- 5–15 of the first 50 listings.

**Operational effort:**
- Template preparation: 1 day.
- Validation and import: 1 day.
- Photo collection and verification: 3–5 days.

### 3.4 Property Management Companies

**Definition:** B2B2C partnerships with companies managing multiple units.

**Process:**
1. Founder/Supply Director meets with property management company.
2. Sign 3-month pilot with zero commission.
3. Receive full unit inventory.
4. Bulk import or admin creates listings.
5. Verify each unit.
6. Publish under a master host account.

**Expected yield (Closed Alpha):**
- 10–25 of the first 50 listings.

**Operational effort:**
- BD and contract: 1–2 weeks.
- Import and verification: 3–5 days per portfolio.

### 3.5 Public Data Enrichment (Where Legally Allowed)

**Allowed sources:**
- Google My Business listings with public phone numbers and addresses.
- Tourism authority registries of licensed properties.
- Property management company websites with public inventory.
- Government tourism promotion sites.

**Not allowed:**
- Scraping copyrighted photos or descriptions from Airbnb, Booking.com, or other OTAs.
- Using private data without consent.
- Reverse engineering competitor databases.

**Process:**
1. Identify properties in target area from public sources.
2. Record name, address, phone, property type.
3. Contact owner directly (phone or WhatsApp).
4. Do not copy photos or descriptions.
5. Ask owner to provide photos and details or claim a pre-created draft.

**Expected yield (Closed Alpha):**
- 5–10 of the first 50 listings.

### 3.6 Internal Admin-Created Listings

**Definition:** Operations staff create listings directly in the admin console without an external import.

**Use case:**
- Founder network properties.
- Walk-in or phone leads.
- Urgent supply needs for a specific guest.

**Process:**
1. Operations creates `Unit` and `UnitListing` in admin.
2. Uploads photos.
3. Sets pricing and calendar.
4. Marks as `PENDING_CLAIM` or publishes under an internal account.
5. Contacts owner to claim.

**Expected yield (Closed Alpha):**
- 10–20 of the first 50 listings.

---

## 4. Claim-Your-Property Workflow

### 4.1 Why Claim Listings?

- StayOS can seed supply without waiting for the owner.
- The owner only needs to verify the listing, not build it from scratch.
- It reduces onboarding friction and time-to-live.

### 4.2 Claim Workflow

```
1. Admin creates a listing from public data or partner data.
   ├── Unit + UnitListing records
   ├── Photos uploaded by admin/ops
   ├── Draft status
   └── "Claim this listing" button shown on public page

2. Owner discovers the listing (via search, direct link, or outreach).

3. Owner clicks "Claim Listing" and completes:
   ├── Phone OTP
   ├── KYC document upload
   ├── Bank/payout information
   └── Ownership proof (deed, contract, utility bill)

4. Admin reviews claim and documents.

5. On approval, ownership is transferred to claimant.

6. Host gains full access to calendar, pricing, and payouts.
```

### 4.3 Claim Review Criteria

- Phone number matches the owner or authorized manager.
- KYC documents are valid.
- Ownership proof matches the listing address.
- No duplicate claims exist for the same listing.
- Claimant passes Trust & Safety review.

### 4.4 Claim Outcomes

| Outcome | Action |
|---------|--------|
| Approved | Transfer ownership, notify host, activate dashboard |
| Rejected | Notify claimant with reason, remove or keep internal |
| Needs more info | Request additional documents, hold claim |
| Duplicate | Merge or reject, flag for review |

---

## 5. Verification Workflow for Seeded Listings

### 5.1 Gate 1: Documentation

- Ownership or authorization document for the property.
- Host identity verification.
- Property details match the seeded record.

### 5.2 Gate 2: Physical Verification

- In-person inspection or video walkthrough.
- Confirm photos match the actual property.
- Check structural, safety, and cleanliness standards.

### 5.3 Gate 3: Guest-Ready Check

- 24–48 hours before first booking.
- Confirm amenities, linens, keys, AC, welcome guide.
- Host reachable on check-in day.

---

## 6. Ownership Transfer

### 6.1 Conditions for Transfer

- Claim approved.
- KYC passed.
- Ownership proof verified.
- Listing quality score ≥ 70.

### 6.2 Transfer Process

1. Update `Unit.host_id` and `UnitListing.owner_id` to claimant.
2. Change listing state to `LISTED`.
3. Notify host via WhatsApp and email.
4. Grant host dashboard access.
5. Schedule Host Success follow-up call within 7 days.

### 6.3 Dispute Resolution

- If multiple parties claim the same property, Trust & Safety reviews evidence.
- The party with the strongest ownership/authorization documentation wins.
- All claim disputes are documented in the fraud/incident registry.

---

## 7. Seeding Milestones

### 7.1 First 50 Listings

| Channel | Target | Notes |
|---------|--------|-------|
| Manual import | 15 | Founder network, ops-created |
| Agency partnerships | 10 | Real-estate/tourism agencies |
| Bulk Excel import | 10 | Property manager CSVs |
| Property management companies | 10 | B2B2C pilots |
| Claim workflow | 5 | Public data or unclaimed listings |
| **Total** | **50** | |

### 7.2 First 100 Listings

| Channel | Target | Notes |
|---------|--------|-------|
| Property management companies | 35 | Scaled B2B2C |
| Manual import | 20 | Continued ops seeding |
| Agency partnerships | 15 | More agencies signed |
| Bulk Excel import | 15 | Larger portfolios |
| Self-serve host onboarding | 15 | As web tools mature |
| **Total** | **100** | |

### 7.3 First 250 Listings

| Channel | Target |
|---------|--------|
| Property management companies | 100 |
| Serviced apartments | 50 |
| Small hotels | 30 |
| Self-serve host onboarding | 40 |
| Manual import | 20 |
| Agency/broker referrals | 10 |
| **Total** | **250** |

---

## 8. Data Quality and Duplicate Prevention

### 8.1 Data Quality Rules

- Minimum 5 photos, 8+ preferred.
- Arabic title and description required.
- Verified lat/lng + city/governorate.
- Accurate max guests, bedrooms, bathrooms.
- Base price in EGP.
- Default availability set.

### 8.2 Duplicate Detection

Per `MARKETPLACE_SUPPLY_STRATEGY.md`:

| Rule | Action |
|------|--------|
| Phone + coordinate match | Auto-flag duplicate |
| Coordinate hash within 50m + similar title | Flag for admin review |
| Same address string + same phone | Auto-flag duplicate |
| Photo hash match | Flag for copyright or duplicate review |

### 8.3 Handling Duplicates

- Auto-merge if confidence > 95%.
- Admin review if 80–95%.
- Reject new listing if a live duplicate exists.

---

## 9. Operational Workflow for Seeding

### 9.1 Weekly Seeding Sprint

| Day | Activity | Owner |
|-----|----------|-------|
| Monday | Review seeding pipeline, assign targets | Supply Director |
| Tuesday–Wednesday | Outreach to agencies and property managers | Supply Managers |
| Thursday | Import and validate data | Operations Specialist |
| Friday | Verify listings and photos | Field Staff / T&S |
| Saturday | Publish and activate claim workflow | Operations Specialist |
| Sunday | Review progress, adjust targets | Supply Director |

### 9.2 Seeding Target per Week

| Phase | Target Listings/Week |
|-------|----------------------|
| Week 1–2 (Closed Alpha) | 15–25 |
| Week 3–4 | 15–20 |
| Month 2 | 20–30 |
| Month 3+ | 30–50 |

---

## 10. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Copyright violation from public data | Never copy photos/descriptions from competitors. Use only public contact data. |
| Owner rejects claim | Outreach before publishing; offer 0% commission and free photography. |
| Quality variance | Three-gate verification; reject substandard listings. |
| Duplicate seeding | Automated duplicate detection + admin review. |
| Fraudulent claims | Strong ownership proof requirement; T&S review. |
| Low owner response rate | Use WhatsApp and phone follow-up, not just platform notifications. |

---

## 11. Implementation Checklist

- [ ] Define CSV import template.
- [ ] Build admin bulk import tool.
- [ ] Build admin claim queue.
- [ ] Build duplicate detection service.
- [ ] Build listing quality score.
- [ ] Build admin verification queue.
- [ ] Define public data sources and legal limits.
- [ ] Sign first 3 agency/property management partners.
- [ ] Train operations team on seeding workflow.
- [ ] Set weekly seeding targets.
