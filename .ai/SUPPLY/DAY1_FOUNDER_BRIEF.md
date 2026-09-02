# Day 1 Founder Brief — 2026-08-24
## Supply Acquisition: Actions to Complete TODAY

**Goal:** Make first contact with 14 warm leads by end of day. No admin UI access required for agency leads.

---

## Priority Order (do in this sequence)

### BLOCK 1 — 9:00–10:00: Admin UI / Railway DB Access (CRITICAL)

This unlocks 9 pre-qualified leads with phone numbers. Do this first.

1. Open Railway dashboard → PostgreSQL → Data tab
2. Run this SQL:
```sql
SELECT id, title, zone, property_type, qualification_score, contact_status, contact_value, raw_contact
FROM discovery.discovery_candidates
WHERE qualification_score >= 80 AND contact_status = 'AVAILABLE'
ORDER BY qualification_score DESC LIMIT 20;
```
3. Copy results into SUPPLY_TRACKER.csv rows DISC_001 through DISC_009
4. For each: fill Name, Area, Property_Type, Phone/WhatsApp from contact_value + raw_contact
5. Detailed steps: `.ai/SUPPLY/FOUNDER_DISCOVERY_EXPORT_INSTRUCTIONS.md`

**If Railway DB access fails:** Skip to Block 2. Come back to this with Engineering.

---

### BLOCK 2 — 10:00–11:00: Agency Outreach (2 messages — NO ADMIN UI NEEDED)

Contact has been pre-researched. All data is ready in SUPPLY_TRACKER.csv.

**Contact 1 — Mynt Hospitality**
- WhatsApp: +20 122 604 4447
- Or call: 17257
- Use script: §W2 (Agency WhatsApp) from OUTREACH_SCRIPTS.md
- Key pitch: "New Cairo-only channel partner, 0% commission pilot, you keep 100% of your management fee"

**Contact 2 — Prime Residence (PHMG)**
- WhatsApp: +20 100 160 2264
- Or call: +20 106 823 3367
- Use script: §W2 from OUTREACH_SCRIPTS.md
- Key pitch: "Egypt's established New Cairo STR brand on a local marketplace — drives Egyptian corporate + domestic demand that OTAs miss"

After each send:
- Update Contact_Status = CONTACTED in SUPPLY_TRACKER.csv
- Record Contact_Date = 2026-08-24

---

### BLOCK 3 — 11:00–12:00: Personal Network (10 WhatsApp messages)

Go through your phone contacts and identify 10 people who:
- Own an apartment in New Cairo (5th Settlement / Rehab / Madinaty / Katameya)
- Might know someone who does
- Would be interested in earning extra income from short-term rental

Add their names to rows PNET_001 through PNET_010 in SUPPLY_TRACKER.csv.

For personal contacts: DON'T use a formal script. Send something natural like:
```
يا [الاسم]، بكلمك بخصوص StayOS اللي بعمله. بنبني منصة إيجار يومي في التجمع الخامس. عندك أو عارف حد عنده شقة مفروشة هناك ممكن تيجيلها حجوزات؟ عمولة 0% على أول 3 حجوزات.
```
Adjust based on how well you know them.

---

### BLOCK 4 — 14:00–15:00: Discovery Leads (if DISC_001–DISC_009 are populated)

By this point you should have contact info from the Railway DB.

Send §W1 (Individual Owner WhatsApp) to all 9.
- Send them in sequence, not in bulk
- Personalize the name where known
- Do not send more than 3 messages per hour (avoid appearing like a bot)

---

### BLOCK 5 — 15:00–16:00: OLX Search Batch

1. Open olx.com.eg (or the OLX Egypt app)
2. Search: **شقق مفروشة التجمع الخامس يومي**
3. Filter: Category = Apartments for Rent, Location = New Cairo / التجمع الخامس
4. Browse listings — look for:
   - Active listings with phone or WhatsApp displayed
   - Price range EGP 500–5000/night
   - Units in compounds (not hotels)
5. For each good match: add to SUPPLY_TRACKER.csv rows OLX_001–OLX_005
6. Send §W1 or §F1 via the OLX messaging or WhatsApp

Repeat search for: **شقق مفروشة الرحاب يومي**

---

### BLOCK 6 — 16:00–17:00: Facebook Marketplace + Groups

1. Facebook Marketplace → Search: "شقة مفروشة التجمع الخامس يومي"
2. Filter: New Cairo, Egypt. Browse top 10 listings
3. For relevant ones: DM the seller using §F1 script
4. Add to FB_001–FB_005 rows in tracker

Also browse/post in:
- Group: "جروب شقق مفروش فى التجمع والرحاب" (fb.com/groups/1442434226615968)
- Group: "شقق للايجار مفروش بمدينتي والرحاب" (fb.com/p/100064055923198)

Post text (don't spam — one post per group):
```
أهلاً، أنا إسلام مؤسس StayOS — منصة إيجار يومي في التجمع الخامس. بدور على شقق مفروشة للإضافة على المنصة. لو عندك وحدة أو تعرف حد، تواصل معايا. 0% عمولة على أول 3 حجوزات.
```

---

## EOD Tracker Review

At end of day, update SUPPLY_TRACKER.csv:
- Every contacted lead: Contact_Status = CONTACTED, Contact_Date = 2026-08-24
- Any responses: Interest_Level = HOT/WARM/COLD, Reply_Date = today
- Set next follow-up dates

Target counts for end of 2026-08-24:
- [ ] 2 agency leads CONTACTED (Mynt + Prime)
- [ ] 5–10 personal network messages sent
- [ ] 9 discovery leads CONTACTED (if DB access works)
- [ ] 5+ OLX/FB leads CONTACTED
- Total: **21+ leads in CONTACTED status**

---

## What to Do When Someone Says YES

1. Send them the data collection checklist (OWNER_DATA_COLLECTION.md §WhatsApp Collection Message)
2. Get: photos + address + price + host details
3. Get authorization (AUTHORIZATION_WORKFLOW.md — Level 1 WhatsApp text is fine for now)
4. Save authorization screenshot to AUTH_EVIDENCE/ folder
5. Update tracker: Authorization_Received = VERBAL, Data_Package_Received = PARTIAL or COMPLETE
6. Hand data package to Engineering for import

Engineering will run: `POST /api/v1/discovery/candidates/{id}/import` with the host data.

---

## Engineering Dependency (separate track)

While you do supply outreach, Engineering needs to:
- [ ] Configure Twilio on Railway (for real OTP auth)
- [ ] Founder decides: Paymob or Stripe (unresolved)
- [ ] Configure chosen payment provider on Railway
- [ ] Configure S3 on Railway (for photo uploads)
- [ ] Rebuild EAS with EXPO_PUBLIC_ENABLE_DEV_LOGIN=false after Twilio live

These are PARALLEL — supply outreach does NOT wait for payment/Twilio. The first listing can be manually imported with data from WhatsApp photos + CSV even before S3 is configured.
