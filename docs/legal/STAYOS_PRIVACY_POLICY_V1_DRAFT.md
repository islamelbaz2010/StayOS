# StayOS — Privacy Policy (V1 Draft)

**Status:** DRAFT — NOT legal advice, NOT approved for publication. **Time-sensitive context (FACT, sourced):** Egypt's Personal Data Protection Law No. 151 of 2020 has Executive Regulations that entered into force 2 November 2025 (Ministerial Decree No. 816/2025), with a one-year compliance grace period ending **31 October 2026** and enforcement expected to begin **1 November 2026**. As of this draft's date (2026-08-24), StayOS is inside that grace period, with roughly two months remaining. [Sources: Al Tamimi & Co., "From Policy to Practice"; CMS Law, "Egypt's PDPL: Executive regulations issued"; Access Partnership.] **This makes Egyptian data-protection compliance a live, near-term item for this project, not a theoretical future one — see the Gap Register, item G-02.**

---

## 1. Data Inventory

Built only from data fields and flows that exist in the current codebase. No analytics provider, ad network, or third-party tracker was found anywhere in the inspected code — none is invented here.

| Data | Why collected | Source (code evidence) | Processing / use | Storage |
|---|---|---|---|---|
| Phone number | Account identity, OTP login | `auth.users.phone_number`; `src/app/auth/services.py` | Sent to Twilio Verify for OTP send/check | Postgres (`auth.users`) |
| Display name, locale | Account personalization, message language | `auth.users` | Shown in-app; used to pick Arabic/English notification templates | Postgres |
| Email (optional) | Alternate identity, Firebase auth | `auth.users.email` | Login via Firebase (Google/social) where used | Postgres |
| Firebase UID (optional) | Alternate login method | `auth.users.firebase_uid` | Verified against Firebase Admin SDK | Postgres |
| Role (guest/host/admin), KYC status | Access control, publishing eligibility | `auth.users.role`, `kyc_status` | Determines what the account can do | Postgres |
| Refresh token hash | Session management | `auth_repository.create_refresh_token` | Session/login persistence | Postgres + Redis (`refresh:{hash}` key) |
| Device token | Push notifications | `auth/router.py` `/device-token` | Deliver booking/payment notifications to the app | Postgres |
| KYC document type/number | Host identity verification | `kyc.kyc_documents` | Legally required before a host can publish (product policy) | Postgres (metadata) + S3 (images, see below) |
| KYC front/back ID images, selfie image | Identity verification (OCR + face match) | `src/app/kyc/services.py` — uploaded via presigned S3 PUT | Processed by **AWS Textract** (`analyze_id`, extracts name/DOB/ID number from the document) and **AWS Rekognition** (`compare_faces`, matches selfie to ID photo) | S3 (`S3_KYC_BUCKET`, private) |
| Extracted ID fields (name, etc., from Textract) | Result of automated ID verification | `_parse_textract_id_fields` | Stored on the KYC document record | Postgres |
| Face-match similarity score | Result of automated identity check | `_compare_faces` | Stored on the KYC document record | Postgres |
| Listing data (address/coordinates, price, amenities, description) | Marketplace function | `pms.units`, `pms.unit_listings` | Displayed publicly to guests browsing the marketplace | Postgres |
| Listing photos | Marketplace function | `unit_photos` | Displayed publicly; **stored in a bucket architected for public read access** (`S3_LISTINGS_BUCKET`) — see technical note below | S3 (public-read) |
| Booking details (dates, guest counts, status) | Core transaction | `bookings` table | Shared with the relevant Host and StayOS admin for booking fulfillment | Postgres |
| Payment reference, payment proof image/URL | Manual payment verification | `payments` table; `S3_LISTINGS_BUCKET` (same bucket as listing photos — see note) | Reviewed by StayOS admin to confirm a bank transfer/Vodafone Cash payment occurred | Postgres (metadata) + S3 (proof image, **same public-read bucket as listing photos** — flagged in Gap Register G-03) |
| Cancellation reason | Booking lifecycle record | `bookings.cancel_reason` | Recorded when a booking is cancelled | Postgres |
| Favorites | Guest personalization | `favorites` module | Lets a guest bookmark listings | Postgres |
| Google Places data (location search) | Location autocomplete for search | `src/app/discovery/adapters/google_places.py` | Guest-typed search queries are sent to the **Google Places API** to resolve locations | Not stored by StayOS beyond the search session; processed by Google per its own terms |
| Server logs / request metadata | Operations, debugging, security | Standard FastAPI/Sentry setup (`SENTRY_DSN` config exists) | Error tracking if Sentry is configured | Sentry (if `SENTRY_DSN` is set — not confirmed active in any environment inspected) |

**No advertising, marketing-analytics, or general-purpose tracking SDK was found in the backend or either app.** If one is added later (e.g., a mobile crash/analytics SDK), this Privacy Policy must be updated before that addition ships — do not silently start collecting a new data category without a corresponding disclosure.

**Technical note carried over from the data inventory:** the code has no server-side mechanism to construct a display URL for listing photos or payment-proof images — the app trusts a client-supplied URL string. This only works in practice if the listings bucket has public-read access, and it means payment-proof images (which can contain bank account details visible in a screenshot) are stored in the same publicly-readable bucket as listing photos. This is a real privacy-architecture concern, not a policy-wording one — flagged in `LEGAL_GAP_REGISTER.md` (G-03) as a decision for the founder/engineering, not resolved by this document.

---

## 2. Purposes of Processing

- Operate guest and host accounts (registration, login, session management).
- Enable listing discovery, publication, and booking.
- Verify host identity before allowing publication (KYC).
- Verify guest payment before confirming a booking.
- Send booking/payment/account-related notifications.
- Respond to support requests and disputes.
- Security, fraud prevention, and legal compliance.

[FOUNDER DECISION REQUIRED — confirm no purpose beyond the above is intended for V1; do not add a marketing/analytics purpose here unless a mechanism for it actually exists.]

## 3. Legal Basis / Consent

[LEGAL COUNSEL REVIEW REQUIRED — under Law 151/2020, processing personal data generally requires the data subject's explicit consent as the default lawful basis, unless another basis specifically applies (e.g., necessity for contract performance). KYC document processing (ID images, biometric face-match data) is likely to fall within a **sensitive-data category** under the Law and its November 2025 Executive Regulations, which introduce licensing requirements for processing certain data categories (see § 8). **Whether StayOS's KYC flow requires a specific consent flow, a distinct license from the Personal Data Protection Center, or both, cannot be determined from this codebase and must be confirmed by Egyptian counsel before real KYC documents are processed at scale.**]

## 4. Data Sharing / Processors

External processors identified in the code, and only these:

- **Twilio** (OTP SMS delivery) — phone number is shared to send/verify the OTP. [FACT — confirmed live in the prior P0 investigation that Twilio credentials are not currently active in production; this entry describes the code's design, not current live behavior.]
- **AWS** (S3 storage, Textract, Rekognition) — KYC document images, listing photos, and payment-proof images are stored on AWS; KYC images are additionally processed by AWS Textract and Rekognition.
- **Firebase (Google)** — used for an alternate login path (`verify_firebase_id_token`); email/phone/name from the Firebase-verified token may be used to create an account.
- **Google Places API** — location search queries are sent to Google to resolve place autocomplete results.

No other third-party data processor was found in the code. [FOUNDER DECISION REQUIRED — if Paymob/Stripe payment processing is activated in the future, or if the currently-inactive `finance`/`reservations` Stripe path is ever enabled, this section must be updated before that happens; it currently correctly omits them because they are not live processors of guest data today.]

## 5. International Data Transfers

AWS, Twilio, Google, and Firebase are global services; personal data processed through them may be transferred outside Egypt. [LEGAL COUNSEL REVIEW REQUIRED — Law 151/2020's Executive Regulations introduce licensing requirements specifically for cross-border data transfers. Confirm whether StayOS's use of AWS/Twilio/Google/Firebase (none of which are confirmed Egypt-region-only from the code) triggers this requirement, and which AWS/service region is actually configured — not determinable from application code alone.]

## 6. Retention

**No retention period is defined anywhere in the codebase or in any repository document.** [FOUNDER DECISION REQUIRED — set retention periods for: KYC documents (front/back ID, selfie) after verification or rejection; payment-proof images after verification; account data after account closure/inactivity; server logs. Do not publish a retention period this document did not verify — a stated period that isn't actually enforced by the product is itself a compliance risk.]

## 7. Security

Passwords are not stored (OTP/Firebase-based auth, no password field found). Refresh tokens are stored hashed (SHA-256), not in plaintext. KYC documents are stored in a private (non-public) bucket per the code's bucket-separation design. [LEGAL REVIEW REQUIRED — Law 151/2020's Executive Regulations include a 72-hour data-breach notification requirement to the Personal Data Protection Center, and a 3-business-day notification requirement to affected individuals. StayOS should have a breach-response procedure before accepting real user data at scale; none was found in this repository.]

## 8. Regulatory Licensing Question

[LEGAL COUNSEL REVIEW REQUIRED — this is the single most consequential open item in this Privacy Policy. Law 151/2020's Executive Regulations (in force since 2 November 2025) require controllers and processors to obtain licenses/permits from the Personal Data Protection Center for certain processing categories — including, per public summaries, sensitive data, cross-border transfers, and biometric-adjacent processing. **StayOS's KYC flow processes ID documents and a selfie-to-ID face-match (biometric comparison).** Whether this specific flow requires a PDPC license, and whether StayOS must appoint a registered Data Protection Officer, cannot be determined from application code and requires Egyptian data-protection counsel — ideally resolved before the 31 October 2026 grace-period deadline, not after.]

## 9. User Rights

[LEGAL COUNSEL REVIEW REQUIRED — Law 151/2020 grants data subjects rights including access, correction, and (per its general data-protection framing) objection/deletion in certain circumstances. The current product has no self-service data-export or data-deletion feature in the code inspected. Until counsel confirms the exact rights framework, describe rights as request-based via support contact rather than promising automated self-service the product cannot currently deliver.]

## 10. Account Closure / Deletion

[FOUNDER DECISION REQUIRED — no account-deletion endpoint was found in the code (`auth/router.py` has no DELETE `/me` or equivalent). Define the actual process (manual request to support, or a future in-app feature) before publishing a promise here.]

## 11. Complaints

[FOUNDER DECISION REQUIRED / LEGAL REVIEW REQUIRED — provide a StayOS contact channel, and confirm whether/how to reference the Personal Data Protection Center as the statutory complaints body once its public complaint channel is operational (its portal is reported to be expected live by May 2026).]

## 12. Contact Information

[FOUNDER DECISION REQUIRED — legal entity name, registered address, privacy contact email.]

## 13. Changes to This Policy

StayOS may update this Privacy Policy. [FOUNDER DECISION REQUIRED — define notice mechanism.]

---

## § النسخة العربية — سياسة الخصوصية (مسودة النسخة الأولى)

**ملاحظة زمنية مهمة (حقيقة موثّقة):** بدأ نفاذ اللائحة التنفيذية لقانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020 في 2 نوفمبر 2025، مع فترة سماح للامتثال تنتهي في **31 أكتوبر 2026** وبدء تفعيل التطبيق الفعلي في 1 نوفمبر 2026. بتاريخ إعداد هذه المسودة (2026-08-24)، ما زال أمام StayOS نحو شهرين ضمن فترة السماح. هذا يجعل الامتثال لقانون حماية البيانات المصري أولوية قريبة، وليست بندًا نظريًا مؤجلاً.

### 1. جرد البيانات
يشمل: رقم الهاتف، الاسم المعروض واللغة، البريد الإلكتروني (اختياري)، الدور وحالة KYC، بيانات الجلسة، مستندات الهوية وصورة السيلفي (تُعالَج عبر AWS Textract وRekognition)، بيانات الإعلانات وصورها (تُخزَّن في مساحة تخزين قابلة للوصول العام)، تفاصيل الحجز، مرجع الدفع وإثبات الدفع (**ملاحظة: يُخزَّن حاليًا في نفس المساحة العامة الخاصة بصور الإعلانات** — راجع سجل الفجوات القانونية، البند G-03)، سبب الإلغاء، المفضلات، واستعلامات البحث عبر Google Places API. لم يُعثر على أي أداة تتبع تسويقي أو تحليلات إعلانية في الكود المفحوص.

### 2. أغراض المعالجة
تشغيل الحسابات، تمكين اكتشاف الإعلانات ونشرها وحجزها، التحقق من هوية المضيف، التحقق من دفع الضيف، إرسال الإشعارات المتعلقة بالحجز والدفع والحساب، الرد على طلبات الدعم، الأمان ومنع الاحتيال والامتثال القانوني. [قرار مطلوب من المؤسس — تأكيد عدم وجود غرض تسويقي إضافي.]

### 3. الأساس القانوني / الموافقة
[مطلوب مراجعة قانونية — بموجب القانون 151/2020 تتطلب معالجة البيانات الشخصية عمومًا موافقة صريحة من صاحب البيانات كأساس افتراضي. من المرجّح أن تندرج مستندات KYC (صور الهوية ومطابقة الوجه) ضمن فئات بيانات حساسة تستلزم ترخيصًا خاصًا من مركز حماية البيانات الشخصية وفق اللائحة التنفيذية. لا يمكن تحديد ذلك من الكود البرمجي وحده ويتطلب استشارة قانونية مصرية متخصصة.]

### 4. مشاركة البيانات / الجهات المعالجة
Twilio (إرسال OTP)، AWS (تخزين S3، وTextract، وRekognition)، Firebase/Google (تسجيل الدخول البديل)، Google Places API (البحث عن المواقع). لا توجد أي جهة معالجة أخرى في الكود المفحوص.

### 5. النقل الدولي للبيانات
[مطلوب مراجعة قانونية — تفرض اللائحة التنفيذية للقانون 151/2020 متطلبات ترخيص خاصة بالنقل عبر الحدود؛ يجب تأكيد ما إذا كان استخدام StayOS لـ AWS/Twilio/Google/Firebase يستوجب هذا الترخيص.]

### 6. الاحتفاظ بالبيانات
**لا توجد أي فترة احتفاظ محددة في الكود أو في أي مستند بالمستودع.** [قرار مطلوب من المؤسس.]

### 7. الأمان
لا تُخزَّن كلمات مرور؛ تُخزَّن رموز التحديث (refresh tokens) بصيغة مُجزّأة (SHA-256) وليست نصًا صريحًا؛ تُخزَّن مستندات KYC في مساحة تخزين خاصة غير عامة. [مطلوب مراجعة قانونية — تفرض اللائحة التنفيذية إخطار مركز حماية البيانات خلال 72 ساعة من اكتشاف أي اختراق، وإخطار الأشخاص المتأثرين خلال 3 أيام عمل؛ لا توجد إجراءات استجابة موثقة لهذا في المستودع.]

### 8. سؤال الترخيص التنظيمي
[مطلوب مراجعة قانونية — أهم بند مفتوح في هذه السياسة. هل يتطلب مسار KYC الخاص بـ StayOS (معالجة مستندات هوية ومطابقة بيومترية للوجه) ترخيصًا من مركز حماية البيانات الشخصية، وهل يلزم تعيين مسؤول حماية بيانات مُعتمد؟ يجب حسم هذا قبل الموعد النهائي في 31 أكتوبر 2026.]

### 9–13
حقوق المستخدم، إغلاق الحساب/الحذف، الشكاوى، معلومات التواصل، والتعديلات على السياسة — **[مطلوب مراجعة قانونية / قرار مطلوب من المؤسس]** لكل بند، بنفس المضمون والتحفظات الواردة في النسخة الإنجليزية أعلاه.
