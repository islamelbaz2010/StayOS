# Founder: How to Export the 9 HIGH_PRIORITY Discovery Leads

**Why this document exists:** The discovery database on Railway contains 240 property candidates, including 9 scored ≥ 80 (HIGH_PRIORITY) with publicly available contact information. Engineering cannot access these remotely — Railway's production JWT keys differ from local dev keys. You must access them directly via the web admin UI.

**Time required:** 10–15 minutes. Do this TODAY before contacting anyone.

---

## Step 1 — Open the Admin UI

Navigate to: **[your Vercel web URL]/admin/discovery**

If you don't remember the Vercel URL, find it at vercel.com dashboard → StayOS project → Deployments → Production URL.

---

## Step 2 — Log In as Admin

Credentials (from seed data):
- Phone: `+20100000001`
- You will need the OTP SMS — but Twilio is not configured yet.

**PROBLEM:** Twilio OTP is not active. If the admin UI requires OTP to log in, you have two options:

**Option A (Recommended) — Direct DB query via Railway console:**
1. Go to railway.app → Your StayOS project
2. Open the PostgreSQL service → **Data** tab (Railway's built-in DB browser)
3. Run this query:
```sql
SELECT 
  id,
  title,
  city,
  zone,
  property_type,
  qualification_score,
  contact_status,
  contact_value,
  source,
  raw_contact
FROM discovery.discovery_candidates
WHERE qualification_score >= 80
  AND contact_status = 'AVAILABLE'
ORDER BY qualification_score DESC
LIMIT 20;
```

**Option B — Dev login bypass:**
If `EXPO_PUBLIC_ENABLE_DEV_LOGIN=true` is set on the web app, there may be a bypass. Check the Vercel environment variables.

---

## Step 3 — Filter for High-Priority Contactable Leads

If Option A (DB query), you have the data directly. Skip to Step 4.

If using admin UI:
1. Set filter: **Contact Status = AVAILABLE**
2. Set filter: **Min Score = 80**
3. Sort by: **Score (highest first)**
4. You should see 9 rows

---

## Step 4 — Record Each Lead in the Supply Tracker

For each of the 9 rows (DISC_001 through DISC_009 in `SUPPLY_TRACKER.csv`), record:

| Field | Where to find it |
|-------|-----------------|
| Name | `title` column — usually a compound name or building name |
| Area | `zone` column — should be New Cairo sub-areas |
| Property_Type | `property_type` column |
| Phone | `contact_value` column (primary contact) |
| WhatsApp | Check `raw_contact` JSON: look for `whatsapp` key |
| Lead_Score | `qualification_score` column |
| Notes | `source` column + any notes from raw_contact |

---

## Step 5 — Update the Tracker

After filling in all 9 rows:
1. Replace `PENDING_FOUNDER_EXPORT` in `Name` with the actual title
2. Replace `FILL_FROM_ADMIN_UI` in Phone/WhatsApp with actual values
3. Set `Contact_Status = READY_TO_CONTACT`
4. Set `Next_Followup = 2026-08-24`

---

## Step 6 — Contact Them

Use the outreach scripts from:
```
.ai/SUPPLY/OUTREACH_SCRIPTS.md
```

Script §W1 = WhatsApp (first contact, individual owner)
Script §P1 = Phone call opener
Script §S1 = SMS fallback

**CRITICAL:** 
- Status = READY_TO_CONTACT means the message is drafted and you are authorized to send it
- Only YOU send the messages — no automation, no bot
- After sending: update Contact_Date in tracker, set Contact_Status = CONTACTED

---

## What Happens After They Respond

If INTERESTED → Collect their data package (see `OWNER_DATA_COLLECTION.md`)
If DECLINED → Set Contact_Status = DECLINED, do not re-contact for 30 days
If NO RESPONSE after 7 days → One follow-up attempt, then move to next lead

---

## Escalation Path If Admin UI Is Completely Inaccessible

1. Contact Engineering: set `AUTH_BYPASS_ADMIN=true` (temp Railway env var for admin access without OTP)
2. Or: Engineering runs a one-time Railway CLI command to dump the 9 rows as JSON and share with you
3. Or: Engineering adds a temporary admin token endpoint that bypasses Twilio for the first login

The 9 leads ARE in the database. This is a key access problem that needs to be solved by end of 2026-08-24.
