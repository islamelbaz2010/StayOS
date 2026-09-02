# 06 — FOUNDER DAILY OPERATIONS

**Board:** Executive Project Director, COO  
**Date:** 2026-08-03  
**Purpose:** Define exactly what the founder does every day during Closed Alpha

---

## 1. Founder's Role During Closed Alpha

The founder is the CEO, COO, Head of Operations, Head of Supply, Head of Customer Support, and Head of Trust & Safety. Engineering builds the platform. The founder runs the marketplace.

**Time allocation:**
- 50% supply acquisition (host recruitment, onboarding)
- 25% operations (KYC review, listing verification, payment, payouts)
- 15% guest acquisition and support
- 10% engineering coordination and platform monitoring

---

## 2. Daily Schedule

### Morning Block (8:00 – 12:00)

| Time | Activity | Category |
|------|----------|----------|
| 8:00 | **Platform health check.** Open the website. Verify search works. Verify login works. Check error logs if accessible. | Platform monitoring |
| 8:15 | **KYC review queue.** Open admin KYC page. Review all pending submissions. Approve or reject each with a reason. Target: clear all pending within 30 minutes. | Operations |
| 8:45 | **Listing verification queue.** Open admin listing page. Review all pending listings. Check: photos present? Title and description adequate? Price reasonable? Location accurate? Approve or reject each with a reason. Target: clear all pending within 30 minutes. | Operations |
| 9:15 | **WhatsApp responses.** Read and respond to all messages from hosts and guests. Prioritize: booking issues > payment issues > onboarding questions > general questions. | Support |
| 9:45 | **Host outreach — calls.** Call 5 potential hosts from the contact list. Pitch: "StayOS is a new Egyptian platform. 10% commission. EGP payment. I'm personally onboarding the first 50 hosts." Goal: schedule 1–2 onboarding sessions. | Supply acquisition |
| 10:30 | **Host onboarding session.** Guide 1–2 new hosts through: signup → KYC upload → listing creation → photo upload → pricing → submit for review. Use WhatsApp screen-share if needed. | Supply acquisition |
| 11:30 | **Listing creation for non-technical hosts.** For hosts who can't use the web form: collect property details and photos via WhatsApp. Create listing manually via admin or CSV. Upload photos. | Supply acquisition |

### Afternoon Block (13:00 – 17:30)

| Time | Activity | Category |
|------|----------|----------|
| 13:00 | **Guest acquisition.** Contact 2–3 warm contacts. Pitch: "I'm launching a rental platform in Cairo. Can you book a stay this month? I'll personally help you find the right place." Send links to 3 relevant listings. | Demand generation |
| 13:30 | **Payment processing.** Check for any pending payment confirmations. If Paymob callback worked, verify reservation is confirmed. If not, manually confirm payment via admin endpoint. | Operations |
| 14:00 | **Payout processing.** For any completed stays (checked out): calculate host payout (90% of booking value). Initiate manual bank transfer. Record payout in system. Notify host via WhatsApp. | Operations |
| 14:30 | **Photo uploads.** For CSV-imported listings that need photos: upload photos received from hosts/agencies via WhatsApp. Set cover photos. | Supply acquisition |
| 15:00 | **Agency follow-up.** Follow up with agencies from Week 2+. Send performance data. Request more listings if agency is performing. | Supply acquisition |
| 15:30 | **Guest support.** Respond to any guest questions about bookings, check-in, property details. Personally match guests to listings if they can't find what they want. | Support |
| 16:00 | **Operations playbook update.** Document what worked, what didn't, what needs fixing. Add new patterns discovered today. | Operations |
| 16:30 | **Engineering sync.** Send WhatsApp message to engineering team: list of bugs, feature requests, priority order. Confirm status of in-progress fixes. | Engineering coordination |
| 17:00 | **Daily metrics check.** Count: new signups, new listings, pending reviews, live listings, bookings today, searches today. Write in daily log. | Monitoring |
| 17:15 | **End-of-day platform check.** Verify platform is still up. Quick test of search and booking flow. | Platform monitoring |

---

## 3. Weekly Activities

### Every Sunday

| Time | Activity |
|------|----------|
| 10:00 | **Weekly metrics review.** Compile: total live listings, total verified hosts, bookings this week, bookings cumulative, revenue this week, payouts processed, host NPS, guest NPS. |
| 10:30 | **Board status report.** Send 1-page summary to board: metrics, progress vs. target, top risks, asks. |
| 11:00 | **Host newsletter.** Send WhatsApp broadcast to host group: new listings this week, booking activity, tip of the week, thank you. |
| 11:30 | **Operations playbook review.** Review the week's playbook entries. Identify patterns. Update standard operating procedures. |
| 12:00 | **Next week planning.** Set targets for the week. Prioritize outreach list. Schedule agency meetings. |

### Every Monday

| Time | Activity |
|------|----------|
| 9:00 | **Engineering sync.** 30-minute call with engineering lead. Review bugs from last week. Agree on priorities for this week. Confirm any blocking issues. |

### Every Wednesday

| Time | Activity |
|------|----------|
| 14:00 | **Mid-week metrics check.** Are we on track for weekly targets? If not, what intervention is needed? |

### Every Friday

| Time | Activity |
|------|----------|
| 16:00 | **Host check-in calls.** Call 3–5 hosts who were onboarded this week. Ask: "How was the experience? Any issues? Any bookings?" Collect feedback. |

---

## 4. Approval Workflows

### KYC Approval

```
Host uploads KYC documents
    ↓
Document appears in admin KYC queue
    ↓
Founder reviews: Is ID clear? Is selfie matching ID? Is ID genuine?
    ↓
APPROVE → Host kyc_status set to VERIFIED. SMS sent to host.
REJECT → Host kyc_status set to REJECTED. Reason saved. SMS sent with reason.
    ↓
If rejected, host can resubmit with better photos.
```

**Target response time:** < 24 hours from submission.  
**During active onboarding:** < 4 hours.

### Listing Approval

```
Host submits listing for review
    ↓
Listing appears in admin verification queue
    ↓
Founder reviews: Are photos real? Is title appropriate? Is description adequate? Is price reasonable? Is location accurate?
    ↓
APPROVE → Listing status set to LISTED. SMS sent to host.
REJECT → Listing status set to UNLISTED. Reason saved. SMS sent with reason.
    ↓
If rejected, host can edit and resubmit.
```

**Target response time:** < 24 hours from submission.  
**During active onboarding:** < 4 hours.

### Payment Confirmation

```
Guest completes booking and pays via Paymob
    ↓
Paymob callback confirms payment (if working)
    ↓
If Paymob callback fails or Paymob not ready:
    Founder checks bank statement or Paymob dashboard
    Founder manually confirms payment via admin endpoint
    ↓
Reservation status set to CONFIRMED
    ↓
Host notified via SMS/WhatsApp
```

**Target response time:** < 1 hour for manual confirmation.

### Payout Approval

```
Guest checks out
    ↓
Founder verifies: Did the guest actually stay? Any complaints?
    ↓
Founder calculates payout: booking_value × 90% - cleaning_fee_to_host
    ↓
Founder initiates manual bank transfer to host's Egyptian bank account
    ↓
Founder records payout in system (if endpoint available) or in spreadsheet
    ↓
Founder notifies host via WhatsApp: "Payout of X EGP sent to your account. Should arrive in 1–2 business days."
```

**Target response time:** < 48 hours from checkout.

### Refund Approval

```
Guest requests refund (cancellation, issue with property)
    ↓
Founder reviews: Is the request valid? Per cancellation policy?
    ↓
If approved: Founder processes refund via Paymob or manual bank transfer back to guest
    ↓
Founder updates reservation status to CANCELLED with refund amount
    ↓
Founder notifies host and guest
```

**Target response time:** < 24 hours.

---

## 5. Manual Tasks

### Creating a Listing on Behalf of a Host

**When:** Host cannot or will not use the web form. Common during alpha with less tech-savvy hosts.

**Process:**
1. Founder sends WhatsApp message to host: "Send me: property title, description, address, number of bedrooms/bathrooms, max guests, price per night, and 5+ photos."
2. Host sends details and photos via WhatsApp.
3. Founder creates listing via admin endpoint or CSV with host's account.
4. Founder uploads photos manually.
5. Founder sets pricing and availability.
6. Founder submits listing for review.
7. Founder approves listing.
8. Founder notifies host: "Your listing is live! Here's the link."

**Time:** 20–30 minutes per listing.

### Collecting Property Data for CSV Import

**When:** Agency provides property data but not in CSV format.

**Process:**
1. Agency sends Excel file or WhatsApp messages with property details.
2. Founder formats data into StayOS CSV schema (title, description, property_type, governorate, city, district, address, lat, lng, max_guests, bedrooms, bathrooms, base_price_egp, min_nights, amenities).
3. Founder saves as .csv file.
4. Founder uploads via admin CSV import endpoint.
5. Founder reviews import results (success/failure per row).
6. Founder requests photos from agency for each successfully imported listing.
7. Founder uploads photos manually for each listing.

**Time:** 2–4 hours per agency batch (10–15 listings).

### Manually Confirming a Payment

**When:** Paymob callback fails or Paymob is not yet integrated.

**Process:**
1. Founder receives notification that a booking was initiated.
2. Founder checks Paymob dashboard (or bank statement) for the payment.
3. If payment received: Founder opens admin endpoint and confirms payment manually.
4. Reservation status changes to CONFIRMED.
5. Host is notified.

**Time:** 5 minutes per confirmation.

### Processing a Manual Payout

**When:** Host has completed a stay and needs to be paid.

**Process:**
1. Founder reviews completed stays (reservations with status=CHECKED_OUT).
2. Founder calculates payout amount: booking_total × 0.90.
3. Founder opens banking app and transfers funds to host's bank account.
4. Founder records the payout (in spreadsheet or system if endpoint available).
5. Founder sends WhatsApp to host: "I've sent X EGP to your account. Reference: [transfer ref]. Should arrive in 1–2 days."

**Time:** 10 minutes per payout.

---

## 6. Customer Communication Templates

### WhatsApp Templates (Arabic)

**KYC Approved:**
> "مباركة! تم التحقق من هويتك. يمكنك الآن إنشاء إعلانك الأول على StayOS."
> (Congratulations! Your identity has been verified. You can now create your first listing on StayOS.)

**KYC Rejected:**
> "نعتذر، لم نتمكن من التحقق من هويتك. السبب: [reason]. يرجى إعادة إرسال مستندات أوضح."
> (We apologize, we couldn't verify your identity. Reason: [reason]. Please resubmit clearer documents.)

**Listing Approved:**
> "إعلانك '[title]' أصبح الآن مباشر على StayOS! يمكنك مشاركة هذا الرابط: [url]"
> (Your listing '[title]' is now live on StayOS! You can share this link: [url])

**Listing Rejected:**
> "نعتذر، لم يتم قبول إعلانك '[title]'. السبب: [reason]. يمكنك تعديل الإعلان وإعادة إرساله."
> (We apologize, your listing '[title]' was not accepted. Reason: [reason]. You can edit and resubmit.)

**New Booking Notification to Host:**
> "لديك حجز جديد! الضيف: [guest_name]. التواريخ: [check_in] إلى [check_out]. المبلغ: [amount] EGP."
> (You have a new booking! Guest: [name]. Dates: [check_in] to [check_out]. Amount: [amount] EGP.)

**Payout Notification:**
> "تم تحويل [amount] EGP إلى حسابك البنكي. يجب أن تصل خلال 1-2 يوم عمل."
> ([amount] EGP has been transferred to your bank account. Should arrive in 1–2 business days.)

**Weekly Host Newsletter:**
> "أهلاً شباب! تحديث الأسبوع: [X] إعلان جديد، [Y] حجز. نصيحة الأسبوع: [tip]. شكراً لكم!"
> (Hi everyone! Weekly update: [X] new listings, [Y] bookings. Tip of the week: [tip]. Thank you!)

---

## 7. Escalation Flow

### Guest Complaint

```
Guest sends WhatsApp message with complaint
    ↓
Founder acknowledges within 1 hour
    ↓
Founder assesses severity:
    - LOW (minor issue): Resolve with host directly. Follow up with guest.
    - MEDIUM (property not as described): Contact host. Negotiate partial refund if needed.
    - HIGH (safety/security): Immediately contact host. If unresolved, cancel booking and refund guest. Suspend listing if fraudulent.
    ↓
Founder documents resolution in operations playbook
    ↓
If HIGH: Founder reviews listing and host for potential fraud
```

### Host Payout Issue

```
Host reports payout not received
    ↓
Founder checks bank transfer status
    ↓
If transfer failed: Founder re-initiates transfer. Checks bank details with host.
If transfer succeeded but host didn't see it: Founder provides transfer reference number.
    ↓
Founder follows up with host to confirm receipt
```

### Fraud Suspicion

```
Founder notices suspicious activity (fake photos, suspicious KYC, unusual booking pattern)
    ↓
IMMEDIATE ACTION: Suspend listing or account
    ↓
Founder investigates: reverse image search on photos, verify ID authenticity, check address on Google Maps
    ↓
If fraud confirmed: Permanently ban account. Report to board. Document incident.
If false alarm: Reinstate listing/account. Apologize to host.
    ↓
Founder documents incident in operations playbook
```

### Technical Incident

```
Founder detects platform is down or broken
    ↓
Founder sends WhatsApp to engineering: "Platform is down. [Description of issue]. Please fix ASAP."
    ↓
Founder checks every 30 minutes until resolved
    ↓
If downtime > 2 hours: Founder notifies board. Posts status in host WhatsApp group: "نعتذر عن المشكلة الفنية. نحن نعمل على إصلاحها."
    ↓
After resolution: Founder tests full flow. Documents incident.
```

---

## 8. Founder's Daily Log

The founder maintains a simple daily log (spreadsheet or notebook):

| Date | New Signups | New Listings | Pending KYC | Pending Listings | Live Listings | Bookings Today | Searches Today | Issues | Hours on Manual Work |
|------|-------------|--------------|-------------|-----------------|---------------|----------------|----------------|--------|---------------------|
| Day 1 | | | | | 5 | 1 (test) | | | |
| Day 2 | | | | | | | | | |
| ... | | | | | | | | | |

This log is the source of truth for the weekly board report and the operations playbook.
