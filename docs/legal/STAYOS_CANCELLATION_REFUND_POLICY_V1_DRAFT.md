# StayOS — Cancellation & Refund Policy (V1, FINAL for V1 business rules)

**Status:** DRAFT legal wording — NOT legal advice, NOT approved for publication. **The business rules in this document are now DECIDED** (Legal & Commercial Decision Gate, 2026-08-24) and are the canonical source, together with `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md`, which they must exactly match. `[LEGAL REVIEW REQUIRED]` markers remain only where actual legal wording/enforceability is at issue, not where a number was previously missing.

**Implementation note carried forward:** the three cancellation tiers below are already shown to guests today in the live web app (`apps/web/messages/{en,ar}.json`, `trust.cancellation.*`). This document adopts that existing copy as the official V1 policy (Decision Gate § "Cancellation Policy," default-keep principle) and defines the parts the UI copy didn't cover (service-fee treatment, host-side failures, no-show, duplicate payment, timing). **No backend code currently computes or enforces any of this** — see Engineering Actions in the reconciliation report. That gap is now precisely scoped (a refund-calculation function matching § 1's rules), not open-ended.

---

## 1. Booking Request & Payment Deadline

1.1 A booking request (`requested`) does not obligate the Host to accept it, and requires no payment yet.

1.2 Once the Host accepts, the Guest has **24 hours** to submit payment reference and proof. If proof is not submitted within 24 hours, the booking may be cancelled by the Host or an admin. [Engineering note: no automatic expiry timer exists in the code; this is enforced manually for V1 — see P1 Engineering Action.]

## 2. Payment Verification & Proof Resubmission

2.1 Payment proof is reviewed by a StayOS administrator. Approval confirms the booking (§ 3); rejection returns the payment to `pending`.

2.2 The Guest may resubmit proof **up to 3 times within 48 hours of the first rejection**. If proof is not successfully verified within that window, the booking is cancelled and the Guest may submit a new booking request.

## 3. Cancellation by Guest

The three tiers already shown in-product are the official V1 policy. **In every tier, the guest service fee (4% of the accommodation subtotal) is non-refundable once paid — it compensates StayOS for the booking and verification service already performed, regardless of the accommodation refund outcome.** This is stated as a general rule so it isn't repeated per tier below.

| Tier | Full accommodation refund if cancelled... | After that cutoff |
|---|---|---|
| **Flexible** | ≥24 hours before check-in | No refund of the accommodation amount |
| **Moderate** | ≥5 days before check-in | No refund of the accommodation amount |
| **Strict** | 50% refund if ≥1 week before check-in | No refund of the accommodation amount |

A Guest may always cancel a `requested` or `accepted` (not-yet-paid) booking with no financial consequence, since no payment has been verified yet.

## 4. Cancellation by Host (of a confirmed, paid booking)

**Decided:** the Guest receives a **100% refund of everything** — the full accommodation amount *and* the guest service fee (the exception to § 3's general non-refundability rule, since the Guest did not choose to cancel). StayOS charges the Host **no commission** on the cancelled booking. There is no additional monetary penalty on the Host beyond the forfeited commission. **A Host who cancels 2 or more confirmed bookings during the alpha phase triggers a manual admin review of their listing(s)** — an operational consequence using the existing admin-suspension capability, not a new punitive fee.

## 5. Cancellation by StayOS

StayOS may cancel a booking if payment proof is never successfully verified (§ 2.2), if fraud is suspected, or if a listing is found to violate the Terms of Service or Host Agreement after a booking was made. **Decided:** the Guest is refunded in full (accommodation + service fee) in every case where the Guest was not at fault (i.e., every case except an unverified/fraudulent payment attempt by the Guest themself, which has nothing to refund).

## 6. Property Unavailable / Host Failure (double-booking, materially misleading listing, property inaccessible on arrival)

**Decided — Guest-first policy:** treated identically to Host cancellation (§ 4) — **100% refund of everything.** The listing is flagged for manual review. StayOS operations assists the Guest in finding an alternative where practical; this is a manual, ops-level courtesy, not a contractual product feature.

## 7. No-Show

7.1 **Guest no-show** (Guest does not arrive and did not cancel): declared by the Host and confirmed by StayOS admin via the support contact. **No refund** of the accommodation amount or the service fee — the property was held for the Guest and the Host bore the opportunity cost.

7.2 **Host no-show / property inaccessible**: treated as Host Failure (§ 6) — 100% Guest refund.

## 8. Duplicate Payment

If a Guest submits two payments for the same booking (e.g., transfers twice by mistake), StayOS admin identifies the duplicate during proof review — matching reference numbers/amounts against the same booking — and refunds the extra amount to the original payer within the standard refund timing (§ 10). No new detection mechanism is required beyond the admin's existing manual proof review; this is a documented process, not a code feature, for V1.

## 9. Failed / Rejected Payment Proof

Governed by § 2.2 above (3 attempts, 48-hour window, then cancellation).

## 10. Refund Mechanism & Timing

10.1 Because the Guest pays into a StayOS-controlled account and StayOS only forwards the Host's net share after verification (`STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 3), most refunds (§§ 3–7) are StayOS returning money it is already holding — no claw-back from a Host is required in the ordinary case.

10.2 **Decided: refunds are processed within 5 business days of approval.** This is the value for the `{{refund_days}}` placeholder already present in `src/app/notifications/templates.py` — it must be populated with `5` before this notification is used on a real cancellation (Engineering Action, P0).

## 11. Service Fee Refundability — Restated as the General Rule

**Decided (Option C — refundable only under certain circumstances):** the 4% guest service fee is refunded in full **only** when the cancellation is not the Guest's choice (Host cancellation § 4, StayOS cancellation § 5, property unavailable/Host failure § 6). It is **not refunded** when the Guest initiates the cancellation, even within a tier's 100%-accommodation-refund window (§ 3). This favors clarity (one consistent rule, not tier-by-tier exceptions) and customer trust (Guests are protected in full whenever something goes wrong that isn't their doing, and clearly informed up front that the service fee itself is what they're paying for the booking service, separate from the refundable accommodation cost).

## 12. Host Payout Treatment on Cancellation

**Decided:** because Host payout happens only *after* the Guest's payment is verified and the applicable cancellation window has passed uneventfully (i.e., StayOS does not pay out a Host until it is confident the booking is going ahead), the ordinary case requires no claw-back. **If a Host cancellation or Host-failure refund (§§ 4, 6) occurs after a payout has already been sent** (an edge case, since payout timing is 3 business days post-verification and most cancellations will be flagged before then), StayOS will seek repayment from the Host directly; this is not expected to be common at 1–10-transaction alpha scale and is handled case-by-case rather than through an automated claw-back mechanism for V1.

---

## § النسخة العربية — سياسة الإلغاء والاسترداد (نهائية للقواعد التجارية في الإصدار الأول)

**القواعد التجارية في هذا المستند أصبحت محسومة** (بوابة القرار القانوني والتجاري، 24 أغسطس 2026)، وهي المرجع النهائي مع وثيقة سياسة الدفع والعمولة.

### 1. طلب الحجز ومهلة الدفع
بعد قبول المضيف، أمام الضيف **24 ساعة** لتقديم مرجع الدفع وإثباته. إن لم يُقدَّم الإثبات خلال هذه المهلة، يجوز للمضيف أو المشرف إلغاء الحجز.

### 2. التحقق من الدفع وإعادة تقديم الإثبات
يمكن للضيف إعادة تقديم الإثبات **حتى 3 مرات خلال 48 ساعة** من أول رفض؛ وإلا يُلغى الحجز.

### 3. الإلغاء من قِبل الضيف
التصنيفات الثلاثة المعروضة بالفعل في التطبيق هي السياسة الرسمية: **مرن** (استرداد كامل حتى 24 ساعة قبل الوصول)، **متوسط** (استرداد كامل حتى 5 أيام قبل الوصول)، **صارم** (استرداد 50% حتى أسبوع قبل الوصول). **رسوم خدمة الضيف (4%) غير قابلة للاسترداد في كل الحالات** عند إلغاء الضيف نفسه، بغض النظر عن التصنيف.

### 4. الإلغاء من قِبل المضيف
يحصل الضيف على **استرداد كامل 100%** (المبلغ الكامل + رسوم الخدمة). لا تتقاضى StayOS أي عمولة على الحجز الملغى. لا توجد غرامة مالية إضافية على المضيف بخلاف العمولة المفقودة؛ **إلغاء المضيف لحجزين مؤكدين أو أكثر خلال مرحلة الإصدار التجريبي يُفعّل مراجعة إدارية يدوية** لإعلاناته.

### 5. الإلغاء من قِبل StayOS
استرداد كامل للضيف في كل حالة لا يكون فيها الضيف هو المتسبب.

### 6. عدم توفر العقار / فشل المضيف
معاملة مطابقة للإلغاء من قِبل المضيف — **استرداد كامل 100%**، مع مراجعة الإعلان ومساعدة الضيف عمليًا في إيجاد بديل حيثما أمكن.

### 7. عدم الحضور
7.1 **عدم حضور الضيف:** يُعلنه المضيف ويؤكده مشرف StayOS؛ **لا يوجد استرداد** للمبلغ أو الرسوم.
7.2 **عدم حضور المضيف / تعذّر الوصول للعقار:** يُعامَل كفشل من المضيف — استرداد كامل 100%.

### 8. الدفع المكرر
يحدد المشرف الدفعة المكررة أثناء مراجعة الإثبات (تطابق رقم المرجع/المبلغ) ويرد المبلغ الزائد للدافع الأصلي خلال مهلة الاسترداد المعتادة.

### 9. إثبات دفع فاشل/مرفوض
يحكمه البند 2.2 أعلاه.

### 10. آلية وتوقيت الاسترداد
**قرار: تتم معالجة الاسترداد خلال 5 أيام عمل** من الموافقة — هذه هي القيمة النهائية لمتغير `{{refund_days}}` في قالب الإشعار، ويجب إدخالها قبل استخدام هذا الإشعار في أي إلغاء حقيقي.

### 11. قابلية استرداد رسوم الخدمة
**قرار (الخيار ج):** تُسترد رسوم خدمة الضيف (4%) بالكامل فقط عندما لا يكون الإلغاء بمبادرة الضيف (إلغاء المضيف، إلغاء StayOS، عدم توفر العقار). **لا تُسترد عند إلغاء الضيف نفسه**، حتى ضمن نافذة الاسترداد الكامل لمبلغ الإقامة.

### 12. معاملة سداد المضيف عند الإلغاء
لا تُصرف مستحقات المضيف إلا بعد التحقق من دفع الضيف ومرور نافذة الإلغاء دون أحداث، لذا لا يُحتاج عادة لاسترجاع أي مبلغ من المضيف. في الحالة النادرة لحدوث إلغاء بعد صرف المستحقات، تسعى StayOS لاسترداد المبلغ من المضيف مباشرة، بشكل فردي لكل حالة.
