# Owner Authorization Workflow

**Purpose:** Every property listed on StayOS must have explicit, documented owner consent before import. This is a legal and operational requirement. Never import a property without one of the authorization forms below.

---

## Authorization Level Hierarchy

From least to most formal. Accept the highest level the owner is comfortable with:

| Level | Form | Acceptable For |
|-------|------|----------------|
| 1 — WhatsApp Text | Specific message consent on WhatsApp | All cases in closed alpha |
| 2 — WhatsApp Voice Note | Voice note saying they authorize | All cases |
| 3 — Email | Written email with explicit consent | All cases |
| 4 — Signed Form | Signed PDF authorization document | Agencies + multi-unit |

Closed alpha standard: **Level 1 (WhatsApp Text)** is sufficient. Upgrade to Level 4 for agencies managing 5+ units before launch.

---

## Level 1 — WhatsApp Text Authorization

Ask the owner to send you this exact message (or an equivalent):

**Arabic:**
```
أنا [الاسم الكامل]، صاحب/مستأجر وحدة [وصف الوحدة] في [العنوان].
بأذن رسمياً لـ StayOS بتمثيل هاي الوحدة على المنصة وقبول حجوزات لحسابي.
بفهم إن هيا بيتعامل مع المبالغ وبيحولهالي بعد كل حجز مكتمل.
```

**English:**
```
I, [Full Name], owner/authorized agent for the unit at [address/description], authorize StayOS to list this property on their platform and accept bookings on my behalf. I understand that StayOS will collect and transfer payments to me after each completed booking.
```

**What to do after receiving:**
1. Screenshot the WhatsApp message (with timestamp visible)
2. Save screenshot as: `AUTH_[Lead_ID]_[Owner_Name]_[Date].jpg`
3. Place in `/Users/ahmed/Documents/Projects/StayOS/.ai/SUPPLY/AUTH_EVIDENCE/`
4. Update `Authorization_Evidence` column in SUPPLY_TRACKER.csv with the filename
5. Update `Authorization_Received = VERBAL` (or `WRITTEN` for email/signed)

---

## Level 4 — Signed PDF Authorization (for Agencies)

Use this template for any agency representing 5+ units. Send them the text below and ask them to put it on company letterhead, sign, and scan.

```
PROPERTY LISTING AUTHORIZATION

Company Name: ___________________________
Commercial Registration #: ___________________________
Authorized Signatory Name: ___________________________
Signatory Position: ___________________________

We, [Company Name], hereby authorize StayOS (operated by [Your Legal Entity]) to list the following properties on their short-term rental marketplace platform:

[List each property: Unit number, compound, area]

Authorization Scope:
- Display property details and photos on StayOS platform
- Accept short-term booking inquiries and confirmed bookings
- Collect guest payments on our behalf
- Transfer net payout to our designated account after each completed booking

This authorization is valid from [Date] until revoked in writing.

Payout Account:
Bank Name: ___________________________
Account Number: ___________________________
Account Holder: ___________________________
(or InstaPay: _____________________________)

Signature: ___________________________ Date: ___________________________
Company Stamp (if applicable):
```

---

## Authorization Evidence File Naming

Always save evidence with this format:
```
AUTH_[Lead_ID]_[OwnerLastName]_[YYYY-MM-DD].[ext]
```

Examples:
- `AUTH_DISC_001_Hassan_2026-08-24.jpg` (WhatsApp screenshot)
- `AUTH_AGY_001_MyntHospitality_2026-08-24.pdf` (Signed form)
- `AUTH_PNET_003_Khalil_2026-08-24.png` (WhatsApp screenshot)

---

## What Disqualifies Authorization

Do NOT proceed to import if:
- Owner gave verbal-only confirmation with no message/record
- Third party authorized without demonstrating they represent the owner
- Authorization is conditional ("let me check with the building management") — wait for firm YES
- Owner is not the property owner or authorized property manager

---

## Engineering Note on Import

After receiving authorization:
1. Engineer receives the data package from Founder
2. Runs CSV import via admin panel or `POST /api/v1/discovery/candidates/{id}/import`
3. Sets host_name, host_phone, host_email in the import payload
4. Admin reviews listing → approves → listing goes LIVE

The `imported_unit_id` field in discovery_candidates links the imported listing back to the candidate record, preserving the full acquisition audit trail.
