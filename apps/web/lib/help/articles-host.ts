import type { HelpArticle } from "./catalog";

/**
 * Host Help Center articles — MAKAZOH Model B economics, listing
 * readiness, availability, reservations, earnings and payouts only.
 */
export const HOST_ARTICLES: HelpArticle[] = [
  /* ----------------------- Getting started ---------------------- */
  {
    slug: "host-become-a-host",
    roles: ["host", "guest"],
    category: "hosting_started",
    order: 1,
    title: { en: "Become a host", ar: "كن مضيفًا" },
    summary: {
      en: "Start hosting on MAKAZOH — verification and your first listing.",
      ar: "ابدأ الاستضافة على MAKAZOH — التحقق من الهوية وأول إعلان.",
    },
    body: {
      en: [
        "Start from Become a Host. You will verify your identity, then create your first listing: title, description, photos, amenities, location, pricing and house rules.",
        "Every listing goes through a review before it can be published. The readiness checklist on each listing shows exactly what is still required.",
      ],
      ar: [
        "ابدأ من صفحة «كن مضيفًا». ستتحقق من هويتك ثم تنشئ إعلانك الأول: العنوان والوصف والصور والمرافق والموقع والتسعير وقواعد المنزل.",
        "يمر كل إعلان بمراجعة قبل نشره. تعرض قائمة الجاهزية في كل إعلان ما هو مطلوب بالضبط.",
      ],
    },
    keywords: ["host", "مضيف", "start", "بدء", "become"],
    related: ["host-listing-readiness", "verification-why"],
    route: "become-a-host",
  },
  {
    slug: "host-listing-readiness",
    roles: ["host"],
    category: "hosting_started",
    order: 2,
    title: { en: "Listing readiness and approval", ar: "جاهزية الإعلان والموافقة" },
    summary: {
      en: "What must be complete before a listing is reviewed.",
      ar: "ما يجب اكتماله قبل مراجعة الإعلان.",
    },
    body: {
      en: [
        "The readiness checklist tracks real prerequisites: complete details, photos, address, identity, availability and a payout preference. When every item is ready you can submit the listing for review.",
        "After approval the listing is published and appears in search. If changes are requested, the listing shows what to fix and you can resubmit.",
      ],
      ar: [
        "تتتبع قائمة الجاهزية المتطلبات الفعلية: التفاصيل الكاملة والصور والعنوان والهوية والتوفر وتفضيل الدفع. عندما يصبح كل عنصر جاهزًا يمكنك إرسال الإعلان للمراجعة.",
        "بعد الموافقة يُنشر الإعلان ويظهر في البحث. إذا طُلبت تعديلات، يوضح الإعلان ما يجب إصلاحه ويمكنك إعادة الإرسال.",
      ],
    },
    keywords: ["readiness", "جاهزية", "approval", "موافقة", "submit", "review", "مراجعة"],
    related: ["host-publish-listing", "host-listing-photos"],
    route: "host/listings",
  },
  {
    slug: "host-responsibilities",
    roles: ["host"],
    category: "hosting_started",
    order: 3,
    title: { en: "Host responsibilities", ar: "مسؤوليات المضيف" },
    summary: {
      en: "Accurate listings, reliable calendars and honest communication.",
      ar: "إعلانات دقيقة وتقويمات موثوقة وتواصل صادق.",
    },
    body: {
      en: [
        "Keep listing information accurate — photos, amenities, rules and location must match reality. Keep your calendar current so guests only book dates you can honour, and respond to reservation requests and messages in good time.",
        "Never request payment outside MAKAZOH and never misrepresent the stay. These are enforced platform standards.",
      ],
      ar: [
        "حافظ على دقة معلومات الإعلان — يجب أن تطابق الصور والمرافق والقواعد والموقع الواقع. حافظ على تحديث تقويمك حتى يحجز الضيوف فقط التواريخ التي يمكنك الوفاء بها، ورد على طلبات الحجز والرسائل في الوقت المناسب.",
        "لا تطلب الدفع خارج MAKAZOH أبدًا ولا تقدم الإقامة بشكل مضلل. هذه معايير منصة مطبَّقة.",
      ],
    },
    keywords: ["responsibility", "مسؤولية", "rules", "قواعد", "standards"],
    related: ["safety-never-pay-outside", "host-availability-accuracy"],
    route: "host/guide",
  },

  /* -------------------------- Listings -------------------------- */
  {
    slug: "host-create-listing",
    roles: ["host"],
    category: "listings",
    order: 1,
    title: { en: "Create and edit a listing", ar: "إنشاء إعلان وتعديله" },
    summary: {
      en: "The listing form and what each section means.",
      ar: "نموذج الإعلان ومعنى كل قسم.",
    },
    body: {
      en: [
        "Create listings from My listings. The form covers title, description, photos, property type, location, amenities, house rules, guest requirements, pricing and availability defaults.",
        "You can edit a published listing — significant changes go back through review before they are live.",
      ],
      ar: [
        "أنشئ الإعلانات من «إعلاناتي». يغطي النموذج العنوان والوصف والصور ونوع العقار والموقع والمرافق وقواعد المنزل ومتطلبات الضيوف والتسعير وإعدادات التوفر.",
        "يمكنك تعديل إعلان منشور — التغييرات الجوهرية تعود للمراجعة قبل أن تصبح سارية.",
      ],
    },
    keywords: ["create", "إنشاء", "edit", "تعديل", "listing", "إعلان", "title", "عنوان"],
    related: ["host-listing-photos", "host-listing-readiness"],
    route: "host/listings",
  },
  {
    slug: "host-listing-photos",
    roles: ["host"],
    category: "listings",
    order: 2,
    title: { en: "Photos and cover image", ar: "الصور وصورة الغلاف" },
    summary: {
      en: "Upload photos and choose the cover guests see first.",
      ar: "ارفع الصور واختر الغلاف الذي يراه الضيوف أولًا.",
    },
    body: {
      en: [
        "Upload clear photos on the listing's photos section and pick a cover image — it represents the listing in search, booking and earnings views. New photos may go through moderation before appearing publicly.",
      ],
      ar: [
        "ارفع صورًا واضحة في قسم صور الإعلان واختر صورة غلاف — فهي تمثل الإعلان في البحث والحجز وعرض الأرباح. قد تمر الصور الجديدة بمراجعة قبل ظهورها علنًا.",
      ],
    },
    keywords: ["photo", "صورة", "cover", "غلاف", "upload", "رفع"],
    related: ["host-create-listing"],
    route: "host/listings",
  },
  {
    slug: "host-publish-listing",
    roles: ["host"],
    category: "listings",
    order: 3,
    title: { en: "Publish, unpublish and archive", ar: "النشر وإلغاء النشر والأرشفة" },
    summary: {
      en: "Control whether your listing is live.",
      ar: "تحكم فيما إذا كان إعلانك منشورًا.",
    },
    body: {
      en: [
        "Publishing makes a listing bookable and visible in search once approved. Unpublishing hides it from search without deleting it. Archiving retires a listing you no longer offer.",
        "Existing reservations are unaffected — unpublishing stops new bookings, it does not cancel current ones.",
      ],
      ar: [
        "النشر يجعل الإعلان قابلًا للحجز وظاهرًا في البحث بعد الموافقة. إلغاء النشر يخفيه من البحث دون حذفه. الأرشفة تنهي إعلانًا لم تعد تقدمه.",
        "الحجوزات القائمة لا تتأثر — إلغاء النشر يوقف الحجوزات الجديدة ولا يلغي الحالية.",
      ],
    },
    keywords: ["publish", "نشر", "unpublish", "archive", "أرشيف", "status"],
    related: ["host-listing-readiness", "host-create-listing"],
    route: "host/listings",
  },

  /* --------------------------- Pricing -------------------------- */
  {
    slug: "host-pricing",
    roles: ["host"],
    category: "pricing",
    order: 1,
    title: { en: "Nightly pricing and cleaning fee", ar: "سعر الليلة ورسوم التنظيف" },
    summary: {
      en: "Set your gross nightly price and per-stay cleaning fee.",
      ar: "حدد سعر الليلة الإجمالي ورسوم التنظيف لكل إقامة.",
    },
    body: {
      en: [
        "You set a gross nightly price and an optional per-stay cleaning fee. MAKAZOH builds the guest-facing total on top — the guest always sees one all-inclusive price.",
      ],
      ar: [
        "تحدد سعر ليلة إجماليًا ورسوم تنظيف اختيارية لكل إقامة. يبني MAKAZOH الإجمالي للضيف فوق ذلك — يرى الضيف دائمًا سعرًا شاملًا واحدًا.",
      ],
    },
    keywords: ["price", "سعر", "nightly", "ليلة", "cleaning", "تنظيف"],
    related: ["host-earnings-model", "host-date-pricing"],
    route: "host/listings",
  },
  {
    slug: "host-date-pricing",
    roles: ["host"],
    category: "pricing",
    order: 2,
    title: { en: "Date-specific pricing and discounts", ar: "التسعير حسب التاريخ والخصومات" },
    summary: {
      en: "Adjust prices per date and offer stay-length discounts.",
      ar: "عدّل الأسعار حسب التاريخ وقدّم خصومات طول الإقامة.",
    },
    body: {
      en: [
        "Use the calendar to set prices for specific dates, and the listing's discount settings for weekly and monthly stays where supported.",
      ],
      ar: [
        "استخدم التقويم لتحديد أسعار لتواريخ محددة، وإعدادات الخصومات في الإعلان للإقامات الأسبوعية والشهرية حيثما تتوفر.",
      ],
    },
    keywords: ["price", "سعر", "discount", "خصم", "weekly", "monthly", "calendar"],
    related: ["host-pricing", "host-block-dates"],
    route: "host/calendar",
  },
  {
    slug: "host-earnings-model",
    roles: ["host"],
    category: "pricing",
    order: 3,
    title: { en: "How host earnings are calculated", ar: "كيف تُحسب أرباح المضيف" },
    summary: {
      en: "Your net = accommodation + cleaning − host service fee.",
      ar: "صافي أرباحك = الإقامة + التنظيف − رسوم خدمة المضيف.",
    },
    body: {
      en: [
        "MAKAZOH takes a host-side service fee of 6% of the accommodation amount only, deducted from your payout — never from cleaning. The guest pays a separate guest-side fee and VAT as part of the all-inclusive total; those do not come out of your share.",
        "Your host net for a stay is: accommodation + cleaning fee − 6% of accommodation. Earnings shows this math on every reservation.",
      ],
      ar: [
        "يأخذ MAKAZOH رسوم خدمة من جانب المضيف بنسبة 6% من مبلغ الإقامة فقط، تُخصم من مدفوعاتك — وليس من التنظيف أبدًا. يدفع الضيف رسومًا منفصلة من جانب الضيف وضريبة القيمة المضافة ضمن الإجمالي الشامل؛ هذه لا تُخصم من حصتك.",
        "صافي أرباح المضيف للإقامة هو: الإقامة + رسوم التنظيف − 6% من الإقامة. تعرض الأرباح هذه الحسبة في كل حجز.",
      ],
    },
    keywords: ["earnings", "أرباح", "commission", "عمولة", "6%", "fee", "net", "صافي"],
    related: ["host-funds-held", "host-refund-impact"],
    route: "host/earnings",
  },

  /* -------------------- Calendar & availability ------------------ */
  {
    slug: "host-block-dates",
    roles: ["host"],
    category: "calendar",
    order: 1,
    title: { en: "Block and open dates", ar: "حظر وفتح التواريخ" },
    summary: {
      en: "Manage availability from your calendar.",
      ar: "أدر التوفر من تقويمك.",
    },
    body: {
      en: [
        "Open the listing's calendar to block nights you cannot host (manual, cleaning or maintenance blocks) or reopen them. Saved changes apply to search and booking immediately.",
      ],
      ar: [
        "افتح تقويم الإعلان لحظر الليالي التي لا يمكنك استضافتها (حظر يدوي أو تنظيف أو صيانة) أو إعادة فتحها. تُطبَّق التغييرات المحفوظة على البحث والحجز فورًا.",
      ],
    },
    keywords: ["block", "حظر", "calendar", "تقويم", "available", "متاح", "dates"],
    related: ["host-availability-accuracy", "host-date-pricing"],
    route: "host/calendar",
  },
  {
    slug: "host-availability-accuracy",
    roles: ["host"],
    category: "calendar",
    order: 2,
    title: { en: "Keep availability accurate", ar: "حافظ على دقة التوفر" },
    summary: {
      en: "Booked nights close automatically; keep blocks honest.",
      ar: "تُغلق الليالي المحجوزة تلقائيًا؛ حافظ على صدق الحظر.",
    },
    body: {
      en: [
        "Confirmed reservations block their nights automatically. If your plans change, update the calendar promptly — guests can only book nights your calendar shows as open, and cancellations caused by stale availability hurt your reliability.",
      ],
      ar: [
        "تحظر الحجوزات المؤكدة لياليها تلقائيًا. إذا تغيرت خططك، حدّث التقويم فورًا — يمكن للضيوف حجز الليالي التي يعرضها تقويمك كمتاحة فقط، والإلغاءات الناتجة عن توفر قديم تضر بموثوقيتك.",
      ],
    },
    keywords: ["availability", "توفر", "conflict", "تعارض", "accurate"],
    related: ["host-block-dates", "host-responsibilities"],
    route: "host/calendar",
  },

  /* ------------------------- Reservations ------------------------ */
  {
    slug: "host-manage-reservations",
    roles: ["host"],
    category: "reservations",
    order: 1,
    title: { en: "Managing reservations", ar: "إدارة الحجوزات" },
    summary: {
      en: "Accept, decline and follow every reservation state.",
      ar: "اقبل وارفض وتابع كل حالة حجز.",
    },
    body: {
      en: [
        "Reservations lists every booking on your listings with its status — requested, accepted, confirmed, completed, rejected, cancelled and no-show. From a requested booking you can accept or decline; the guest's payment verification completes the confirmation.",
        "Cancellation is a guest action — guests cancel their own bookings under the listing's cancellation policy. Operational cancellations (for example by MAKAZOH staff) follow the operations process, not the host UI.",
      ],
      ar: [
        "تعرض الحجوزات كل حجز على إعلاناتك مع حالته — مطلوب ومقبول ومؤكد ومكتمل ومرفوض وملغي وعدم حضور. من الحجز المطلوب يمكنك القبول أو الرفض؛ يكمل التحقق من دفع الضيف التأكيد.",
        "الإلغاء إجراء للضيف — يلغي الضيوف حجوزاتهم بموجب سياسة الإلغاء للإعلان. الإلغاءات التشغيلية (مثلًا من قبل فريق MAKAZOH) تتبع عملية العمليات وليس واجهة المضيف.",
      ],
    },
    keywords: ["reservation", "حجز", "accept", "قبول", "decline", "cancel", "إلغاء"],
    related: ["host-reservation-filters", "host-guest-cancellation", "guest-reservation-status"],
    route: "host/bookings",
  },
  {
    slug: "host-reservation-filters",
    roles: ["host"],
    category: "reservations",
    order: 2,
    title: { en: "Filter by area, listing and status", ar: "التصفية حسب المنطقة والإعلان والحالة" },
    summary: {
      en: "Combine governorate, city, listing, status and search.",
      ar: "ادمج المحافظة والمدينة والإعلان والحالة والبحث.",
    },
    body: {
      en: [
        "The reservations page filters combine: choose a governorate to narrow areas, an area/city, a specific listing, a status tab, and a free-text search over guest names and booking references. Filters persist while you switch tabs, so the same listing stays selected across statuses.",
      ],
      ar: [
        "تُدمج عوامل تصفية صفحة الحجوزات: اختر محافظة لتضييق المناطق، ومنطقة/مدينة، وإعلانًا محددًا، وتبويب حالة، وبحثًا حرًا في أسماء الضيوف ومراجع الحجز. تستمر عوامل التصفية أثناء تبديل التبويبات، فيبقى الإعلان نفسه محددًا عبر الحالات.",
      ],
    },
    keywords: ["filter", "تصفية", "area", "منطقة", "governorate", "محافظة", "status"],
    related: ["host-manage-reservations"],
    route: "host/bookings",
  },
  {
    slug: "host-guest-cancellation",
    roles: ["host"],
    category: "reservations",
    order: 3,
    title: { en: "When a guest cancels", ar: "عندما يلغي الضيف" },
    summary: {
      en: "What happens to the reservation and your earnings.",
      ar: "ماذا يحدث للحجز وأرباحك.",
    },
    body: {
      en: [
        "When a guest cancels, you are notified with the listing name and the reservation is marked cancelled. Its nights reopen on your calendar, and the payout for that stay is adjusted by the cancellation policy — the refunded share does not reach your payable.",
      ],
      ar: [
        "عندما يلغي الضيف، يُخطَر باسم الإعلان ويُسجَّل الحجز ملغيًا. تُعاد فتح لياليه في تقويمك، وتُعدَّل مدفوعات تلك الإقامة وفقًا لسياسة الإلغاء — الحصة المستردة لا تصل إلى مستحقاتك.",
      ],
    },
    keywords: ["cancel", "إلغاء", "refund", "استرداد", "notification"],
    related: ["host-refund-impact", "host-manage-reservations"],
  },
  {
    slug: "host-checkin-checkout",
    roles: ["host"],
    category: "reservations",
    order: 4,
    title: { en: "Check-in and check-out", ar: "تسجيل الوصول والمغادرة" },
    summary: {
      en: "Guests self-report arrival; hosts record check-out.",
      ar: "يؤكد الضيوف الوصول؛ يسجل المضيفون المغادرة.",
    },
    body: {
      en: [
        "Guests confirm their own check-in from their booking — it is their stay, so it is their action. Check-out can be recorded by the guest or by you from the reservation.",
        "Confirmed check-in also starts the 24-hour protection window after which your payout becomes eligible.",
      ],
      ar: [
        "يؤكد الضيوف تسجيل وصولهم بأنفسهم من حجزهم — إنها إقامتهم، فهو إجراؤهم. يمكن للضيف أو لك تسجيل المغادرة من الحجز.",
        "يبدأ تسجيل الوصول المؤكد أيضًا نافذة الحماية لمدة 24 ساعة والتي تصبح بعدها مدفوعاتك مؤهلة.",
      ],
    },
    keywords: ["check-in", "وصول", "check-out", "مغادرة", "stay"],
    related: ["host-payout-timing", "host-manage-reservations"],
  },

  /* ---------------------- Guest communication -------------------- */
  {
    slug: "host-guest-communication",
    roles: ["host"],
    category: "communication",
    order: 1,
    title: { en: "Messaging guests", ar: "مراسلة الضيوف" },
    summary: {
      en: "Each reservation has a private guest thread.",
      ar: "لكل حجز محادثة خاصة مع الضيف.",
    },
    body: {
      en: [
        "Open the reservation conversation from the booking or from Messages. Keep arrival times, house questions and instructions there — the thread is the shared record for both of you.",
        "Check-in instructions set on the listing release to the guest automatically before arrival.",
      ],
      ar: [
        "افتح محادثة الحجز من الحجز أو من الرسائل. احتفظ بأوقات الوصول وأسئلة المنزل والتعليمات هناك — المحادثة هي السجل المشترك لكلاكما.",
        "تُرسَل تعليمات تسجيل الوصول المحددة في الإعلان إلى الضيف تلقائيًا قبل الوصول.",
      ],
    },
    keywords: ["message", "رسالة", "guest", "ضيف", "instructions", "تعليمات"],
    related: ["messaging-safety", "host-manage-reservations"],
    route: "messages",
  },

  /* --------------------------- Earnings -------------------------- */
  {
    slug: "host-funds-held",
    roles: ["host"],
    category: "earnings",
    order: 1,
    title: { en: "Funds held and release eligibility", ar: "الأموال المحتجزة وأهلية الإفراج" },
    summary: {
      en: "Host funds stay held until 24h after check-in.",
      ar: "تبقى أموال المضيف محتجزة حتى 24 ساعة بعد تسجيل الوصول.",
    },
    body: {
      en: [
        "When a guest's payment is verified, your host share is recorded as payable but stays held — it protects guests during the first part of the stay. The hold releases 24 hours after confirmed guest check-in, after which the amount becomes payout-eligible.",
        "Earnings separates: funds still held, amounts payout-ready, and amounts already paid out.",
      ],
      ar: [
        "عند التحقق من دفع الضيف، تُسجَّل حصتك كمستحقة لكنها تبقى محتجزة — فهي تحمي الضيوف خلال الجزء الأول من الإقامة. يُفرج عن الحجز بعد 24 ساعة من تأكيد تسجيل وصول الضيف، وبعدها يصبح المبلغ مؤهلًا للدفع.",
        "تفصل الأرباح: الأموال المحتجزة، والمبالغ المؤهلة للدفع، والمبالغ المدفوعة بالفعل.",
      ],
    },
    keywords: ["held", "محتجز", "escrow", "release", "إفراج", "24", "payout"],
    related: ["host-payout-timing", "host-earnings-model"],
    route: "host/earnings",
  },
  {
    slug: "host-refund-impact",
    roles: ["host"],
    category: "earnings",
    order: 2,
    title: { en: "How refunds and cancellations affect earnings", ar: "كيف تؤثر الاستردادات والإلغاءات على الأرباح" },
    summary: {
      en: "Cancelled stays adjust your payable by policy.",
      ar: "تُعدّل الإقامات الملغاة مستحقاتك حسب السياسة.",
    },
    body: {
      en: [
        "When a booking is cancelled, the listing's cancellation policy decides how much of the stay the guest is refunded. Your payable reflects the remaining amount — fully refunded stays leave nothing payable; partially refunded stays reduce it.",
      ],
      ar: [
        "عند إلغاء حجز، تحدد سياسة الإلغاء للإعلان مقدار ما يُسترد للضيف من الإقامة. تعكس مستحقاتك المبلغ المتبقي — الإقامات المستردة بالكامل لا تترك شيئًا مستحقًا؛ المستردة جزئيًا تقلله.",
      ],
    },
    keywords: ["refund", "استرداد", "cancel", "إلغاء", "earnings"],
    related: ["host-guest-cancellation", "host-funds-held"],
  },

  /* ---------------------------- Payouts -------------------------- */
  {
    slug: "host-payout-preference",
    roles: ["host"],
    category: "payouts",
    order: 1,
    title: { en: "Set your payout preference", ar: "حدد تفضيل الدفع الخاص بك" },
    summary: {
      en: "Choose bank transfer or mobile wallet in host profile.",
      ar: "اختر التحويل البنكي أو المحفظة الإلكترونية في ملف المضيف.",
    },
    body: {
      en: [
        "Set how you want to be paid in your host profile: a bank account (bank name, account number, account holder) or a mobile wallet number. This preference is required before a listing can be submitted for review.",
      ],
      ar: [
        "حدد كيف تريد أن تُدفع في ملف المضيف: حساب بنكي (اسم البنك ورقم الحساب واسم صاحب الحساب) أو رقم محفظة إلكترونية. هذا التفضيل مطلوب قبل إرسال الإعلان للمراجعة.",
      ],
    },
    keywords: ["payout", "دفع", "bank", "بنك", "wallet", "محفظة", "preference"],
    related: ["host-payout-timing", "host-funds-held"],
    route: "host/profile",
  },
  {
    slug: "host-payout-timing",
    roles: ["host"],
    category: "payouts",
    order: 2,
    title: { en: "Payout eligibility and timing", ar: "أهلية الدفع والتوقيت" },
    summary: {
      en: "Payouts become eligible after check-in + 24 hours.",
      ar: "تصبح المدفوعات مؤهلة بعد تسجيل الوصول + 24 ساعة.",
    },
    body: {
      en: [
        "A payout becomes eligible 24 hours after the guest's confirmed check-in, once the protection window passes with no open issue. Eligible amounts are then paid to your saved payout preference by the payouts process.",
        "The Earnings page separates held, payout-ready and paid amounts so you can always see where each booking's money stands.",
      ],
      ar: [
        "تصبح المدفوعات مؤهلة بعد 24 ساعة من تسجيل وصول الضيف المؤكد، بمجرد انقضاء نافذة الحماية دون مشكلة مفتوحة. ثم تُدفع المبالغ المؤهلة إلى تفضيل الدفع المحفوظ لديك من خلال عملية المدفوعات.",
        "تفصل صفحة الأرباح المبالغ المحتجزة والمؤهلة والمدفوعة حتى ترى دائمًا أين تقف أموال كل حجز.",
      ],
    },
    keywords: ["payout", "دفع", "timing", "توقيت", "eligible", "مؤهل", "pending"],
    related: ["host-funds-held", "host-payout-preference"],
    route: "host/earnings",
    escalate: true,
  },

  /* ---------------------- Host safety/account -------------------- */
  {
    slug: "host-safety-responsibilities",
    roles: ["host"],
    category: "safety",
    order: 10,
    title: { en: "Property and guest safety", ar: "سلامة العقار والضيف" },
    summary: {
      en: "Keep stays safe and report incidents properly.",
      ar: "حافظ على سلامة الإقامات وأبلغ عن الحوادث بشكل صحيح.",
    },
    body: {
      en: [
        "Keep the property honest and safe: accurate photos and amenities, working basics, and clear house rules. If an incident happens during a stay, document it and report it to MAKAZOH Support promptly.",
      ],
      ar: [
        "حافظ على صدق العقار وأمانه: صور ومرافق دقيقة، وأساسيات عاملة، وقواعد منزل واضحة. إذا حدثت حادثة أثناء الإقامة، وثّقها وأبلغ دعم MAKAZOH عنها فورًا.",
      ],
    },
    keywords: ["safety", "أمان", "incident", "حادثة", "property", "عقار"],
    related: ["safety-report-issue", "host-responsibilities"],
    escalate: true,
  },
];
