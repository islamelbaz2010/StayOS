# Owner Data Collection — What to Collect After a Host Says YES

When an owner/agency confirms interest, send them this checklist via WhatsApp message and collect everything before submitting to the platform.

---

## WhatsApp Collection Message (send after verbal YES)

**Arabic:**
```
تمام ممتاز! عشان نضيف وحدتك على StayOS، محتاج منك المعلومات دي:

📍 العنوان بالكامل (المجمع + الشارع + الدور + رقم الشقة)
🏠 عدد الغرف | نوع الوحدة (شقة / ستوديو / فيلا)
💰 السعر اليومي المطلوب (بالجنيه المصري)
📸 على الأقل 5 صور (غرفة المعيشة + الغرفة/الغرف + المطبخ + الحمام + المدخل أو الإكسيريور)
✅ وصف قصير للمكان بالعربي (مش لازم رسمي، جملتين تمام)
📋 اسمك الكامل + رقم بنك أو محفظة (إنستاباي / فوري) لاستقبال مدفوعات الحجز

خليك عارف إنك هتفضل المالك والتحكم كامل في المواعيد. هنبعتلك نموذج إذن رسمي تمضيه بعد ما نشوف البيانات.

ممكن تبعتهمولي على الواتساب؟
```

**English version (if needed):**
```
Great! To list your property on StayOS, I need:

📍 Full address (compound + street + floor + unit number)
🏠 Bedrooms count | Unit type (apartment / studio / villa)
💰 Daily rate in EGP
📸 Minimum 5 photos (living room + bedroom(s) + kitchen + bathroom + entrance or exterior)
✅ Short description in Arabic or English (2-3 sentences)
📋 Your full name + bank account or mobile wallet (InstaPay / Fawry) for receiving booking payouts

You stay fully in control of your availability calendar. I'll send you a simple authorization form to sign once I review the details.

Can you send these over WhatsApp?
```

---

## Minimum Required Data Checklist

### BLOCK: Cannot import without these

| Field | Example | Notes |
|-------|---------|-------|
| Title | "Luxury 2BR in Sodic Villette" | Short, market-facing name |
| Address (zone) | "5th Settlement / New Cairo" | Zone-level is sufficient for privacy |
| City | "Cairo" | Fixed for New Cairo properties |
| Unit type | apartment / studio / villa | Maps to property_type enum |
| Bedrooms | 2 | Integer |
| Bathrooms | 1 | Integer |
| Max guests | 4 | Integer |
| Daily price (EGP) | 1500 | Numeric, no decimals |
| Host name | Ahmed Hassan | Full name for account creation |
| Host phone | +201001234567 | E.164 format |
| 5+ photos | [files] | JPEG/PNG, at least 800px wide |
| Authorization | [signed form or WhatsApp explicit consent] | See AUTHORIZATION_WORKFLOW.md |

### RECOMMENDED (improves listing quality — request but don't block on)

| Field | Example |
|-------|---------|
| Arabic title | "شقة فاخرة غرفتين في سوديك فيليت" |
| Description (en) | 2–4 sentences about the unit |
| Description (ar) | 2–4 sentences about the unit |
| Amenities | WiFi, Parking, AC, Kitchen, Washer |
| Check-in time | 14:00 |
| Check-out time | 11:00 |
| Minimum nights | 1 |
| Compound name | "Sodic Villette" |
| Floor | 3 |
| Floor area (sqm) | 120 |
| Host email | For secondary contact |
| Host InstaPay/Fawry | For payout |

---

## Photo Requirements

Send these instructions to every owner:

```
الصور:
✅ على الأقل 5 صور
✅ الإضاءة الطبيعية بالنهار (افتح الستاير)
✅ الغرفة محتاج: غرفة نوم كاملة + غرفة معيشة + مطبخ + حمام + مدخل أو واجهة
✅ الحجم: JPEG أو PNG، أكبر من 800 بكسل
❌ مش صور ضبابية أو داكنة
❌ مش صور فيها ناس

لو بتبعت على الواتساب، ابعت كل صورة كـ "Document" مش "Photo" عشان تحتفظ بالجودة
```

---

## CSV Import Template (once all data is collected)

When you have the above data for one property, enter it in this format:

```csv
title,title_ar,description,description_ar,property_type,bedrooms,bathrooms,max_guests,price_per_night,city,zone,address_hint,amenities,host_name,host_phone,host_email
"Luxury 2BR in Sodic Villette","شقة فاخرة غرفتين في سوديك فيليت","Spacious 2-bedroom apartment in a premium compound...","شقة واسعة بغرفتين في مجمع راقي...","apartment",2,1,4,1500,"Cairo","5th Settlement","Sodic Villette Compound","wifi,parking,ac,kitchen,washer","Ahmed Hassan","+201001234567","ahmed@email.com"
```

Then provide the CSV + photos folder to Engineering for import via `/api/v1/discovery/candidates/{id}/import` or bulk CSV upload.

---

## Agency Data Package (different from individual owners)

When an agency confirms interest, they may want to send you a bulk list. Request:

1. A spreadsheet with each unit on a row (columns = same as above)
2. A shared folder (WhatsApp, Google Drive, or WeTransfer link) with photos — named by unit
3. A master authorization letter on company letterhead covering all units in the batch

This converts multiple units into a single import batch and saves time.
