# OLX / Facebook / Dubizzle Sourcing Guide

**Mode:** Manual browse + contact. No scraping. No automation.

---

## OLX Egypt (olx.com.eg)

### Search Queries (do all of these)

| Query (Arabic) | What you're looking for |
|---------------|------------------------|
| شقق مفروشة التجمع الخامس يومي | Furnished apartments New Cairo daily |
| شقق مفروشة التجمع الخامس اسبوعي | Furnished apartments New Cairo weekly |
| شقق مفروشة الرحاب يومي | Furnished apartments Rehab daily |
| فيلات مفروشة التجمع الخامس يومي | Furnished villas New Cairo daily |
| شقة مفروشة للإيجار اليومي القاهرة الجديدة | Furnished apt daily Cairo New |
| استوديو مفروش التجمع الخامس | Studio furnished 5th Settlement |

### Filters to Apply
- Category: Real Estate → Apartments for Rent
- Location: New Cairo / التجمع الخامس (or Rehab / الرحاب)
- Price: Leave open (you want all price ranges)

### What to Note for Each Listing

| Field | Where to find it |
|-------|-----------------|
| Owner name | Usually shown on listing |
| Phone | Listed or via "Show number" button |
| WhatsApp | Sometimes listed explicitly |
| Property description | Listing text |
| Location (zone) | Listing location field |
| Price per day/week | Listed price |
| Property type | Listing title/description |

### Quality Filters (skip listings that are)
- Hotels or hotel rooms (not apartment owners)
- Less than EGP 200/night (too low = problematic owner expectations)
- No photos (incomplete data, won't import well)
- Listing is older than 60 days (likely already rented or owner not responsive)

### Contact Protocol
1. If phone is listed: add to tracker, use §P1 (phone call) or §W1 (WhatsApp)
2. If only OLX messaging: use §F1 (adapted for OLX message)
3. Never call before 9:00 AM or after 9:00 PM

---

## Facebook Marketplace (facebook.com/marketplace)

### Search Queries

| Query | Location |
|-------|---------|
| شقة مفروشة يومي | New Cairo (التجمع الخامس) |
| شقة مفروشة اسبوعي | New Cairo |
| furnished apartment short term | New Cairo |
| شقة فندقية التجمع | New Cairo |
| شقة مفروشة الرحاب | Rehab City |

### Filters
- Category: Housing → Rental
- Location: Set radius to New Cairo / Cairo
- Availability: "For rent" active listings

### Quality Filters
Keep listings that show:
- Real photos (not stock images)
- Person posting (not business page that requires Facebook account to contact)
- Response time "usually responds quickly" or similar signal
- Price stated in description

Skip:
- Agency listings you've already contacted
- Listings with no photos
- Listings that look like sub-let scams (price unrealistically low)

### Contact via Marketplace Message
Use §F1 script. Do NOT mass message — write individual messages tailored to the listing.

---

## Facebook Groups to Browse

These are community groups where individual owners post. Do NOT post promotional content in all groups simultaneously — use one post per day maximum per group.

**1. جروب شقق مفروش فى التجمع والرحاب**  
URL: fb.com/groups/1442434226615968  
Activity: Active (members posting rentals)  
Action: Browse members who post rentals, DM them with §W1

**2. شقق للايجار مفروش بمدينتي والرحاب**  
URL: fb.com/p/100064055923198  
Action: Browse posts, contact posters directly

**3. Find additional groups by searching Facebook:**
- "شقق مفروشة التجمع الخامس"
- "إيجار يومي التجمع"
- "furnished apartments new cairo egypt"

### What to Post in Groups (once, read rules first)

```
أهلاً أعضاء الجروب 🏠 

أنا إسلام، مؤسس StayOS — أول منصة مصرية متخصصة في الإيجار اليومي والأسبوعي في التجمع الخامس والرحاب.

لو عندك شقة مفروشة في المنطقة دي، أو تعرف حد عنده، بدور على ملاك أوائل للانضمام للمنصة.

المميزات:
✅ 0% عمولة على أول 3 حجوزات
✅ تحكم كامل في المواعيد والسعر
✅ دفع مضمون بعد كل حجز

للتواصل: [رقم الواتساب]
```

---

## Dubizzle Egypt (dubizzle.com.eg)

### Search
Go to: dubizzle.com.eg → Properties → Residential → Apartments for Rent  
Location: New Cairo  
Query: "furnished" or "مفروش"

Same protocol as OLX. Same quality filters. Same contact scripts.

---

## Property Finder Egypt (propertyfinder.eg)

**Note:** Most Property Finder listings are agency-listed. Contact the agent (who represents the owner). Use §W2 (Agency script) not §W1 (Owner script).

Search: furnished apartments → New Cairo → Sort by Newest

---

## Adding New Leads to the Tracker

When you find a listing to contact:
1. Add a new row to SUPPLY_TRACKER.csv
2. Lead_ID format: `OLX_006`, `FB_006`, `DUBI_001`, etc.
3. Fill in: Name, Source, Type=SUPPLY_LEAD, Area, Phone, WhatsApp
4. Set Contact_Status = READY_TO_CONTACT
5. Add Notes: URL of the original listing (for reference)
6. After you send: set Contact_Status = CONTACTED, Contact_Date = today

---

## Daily Sourcing Target

| Source | Leads to Contact Per Day |
|--------|-------------------------|
| OLX | 5–10 |
| Facebook Marketplace | 5–10 |
| Facebook Groups | 3–5 (via DM to posters) |
| Dubizzle | 3–5 |
| **Total** | **15–25/day** |

With a 10% response rate and 50% conversion to interested, that's 1–2 new interested leads per day from this channel alone.
