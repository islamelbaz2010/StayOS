import type { HelpArticle } from "./catalog";

/**
 * Guest + shared Help Center articles. Every article describes real
 * StayOS capabilities only — verified against the product's actual
 * workflows, payment model, KYC, cancellation and messaging behaviour.
 */
export const GUEST_ARTICLES: HelpArticle[] = [
  /* ------------------------- Searching ------------------------- */
  {
    slug: "guest-how-search-works",
    roles: ["guest"],
    category: "searching",
    order: 1,
    title: { en: "How search works", ar: "كيف يعمل البحث" },
    summary: {
      en: "Find stays by destination, dates and guests.",
      ar: "ابحث عن الإقامات حسب الوجهة والتواريخ وعدد الضيوف.",
    },
    body: {
      en: [
        "Use Search on StayOS to browse published listings. Enter a destination, your dates, and the number of guests, and we will show stays that can host your group on those dates.",
        "Results only include listings that are published and available — unavailable or unapproved listings never appear in search.",
      ],
      ar: [
        "استخدم البحث في StayOS لتصفح الإعلانات المنشورة. أدخل الوجهة وتواريخك وعدد الضيوف، وسنعرض الإقامات التي تستوعب مجموعتك في تلك التواريخ.",
        "تتضمن النتائج فقط الإعلانات المنشورة والمتاحة — لن تظهر أبدًا الإعلانات غير المتاحة أو غير المعتمدة في البحث.",
      ],
    },
    keywords: ["search", "بحث", "destination", "وجهة", "find stay"],
    related: ["guest-search-filters", "guest-availability", "guest-favorites"],
  },
  {
    slug: "guest-search-filters",
    roles: ["guest"],
    category: "searching",
    order: 2,
    title: { en: "Dates, guests and filters", ar: "التواريخ والضيوف وعوامل التصفية" },
    summary: {
      en: "Narrow results by dates, guest count, price, property type and amenities.",
      ar: "ضيّق النتائج حسب التواريخ وعدد الضيوف والسعر ونوع العقار والمرافق.",
    },
    body: {
      en: [
        "Combine dates and guest count with filters such as price range, property type and amenities to narrow results. Filters apply together — a listing must match every active filter to appear.",
        "Clear filters any time to return to the full result set.",
      ],
      ar: [
        "ادمج التواريخ وعدد الضيوف مع عوامل التصفية مثل نطاق السعر ونوع العقار والمرافق لتضييق النتائج. تعمل عوامل التصفية معًا — يجب أن يطابق الإعلان كل عامل تصفية نشط ليظهر.",
        "امسح عوامل التصفية في أي وقت للعودة إلى مجموعة النتائج الكاملة.",
      ],
    },
    keywords: ["filter", "فلتر", "price", "amenities", "مرافق", "guests", "ضيوف"],
    related: ["guest-how-search-works", "guest-price-display"],
  },
  {
    slug: "guest-availability",
    roles: ["guest"],
    category: "searching",
    order: 3,
    title: { en: "Listing details and availability", ar: "تفاصيل الإعلان والتوفر" },
    summary: {
      en: "Read the listing page and check the calendar before booking.",
      ar: "اقرأ صفحة الإعلان وتحقق من التقويم قبل الحجز.",
    },
    body: {
      en: [
        "Each listing page shows photos, the full description, amenities, house rules, sleeping arrangements, the location area, reviews, and the cancellation policy.",
        "The calendar on the listing shows which nights are open or blocked. Dates you pick are validated against the host's calendar before a booking can be created.",
      ],
      ar: [
        "تعرض كل صفحة إعلان الصور والوصف الكامل والمرافق وقواعد المنزل وترتيبات النوم ومنطقة الموقع والتقييمات وسياسة الإلغاء.",
        "يعرض التقويم في الإعلان الليالي المتاحة أو المحظورة. يتم التحقق من التواريخ التي تختارها مقابل تقويم المضيف قبل إنشاء الحجز.",
      ],
    },
    keywords: ["availability", "التوفر", "calendar", "تقويم", "listing", "إعلان"],
    related: ["guest-how-search-works", "guest-booking-request"],
    route: "search",
  },
  {
    slug: "guest-favorites",
    roles: ["guest"],
    category: "searching",
    order: 4,
    title: { en: "Saving favorites", ar: "حفظ المفضلة" },
    summary: {
      en: "Keep a shortlist of stays you like.",
      ar: "احتفظ بقائمة مختصرة للإقامات التي تعجبك.",
    },
    body: {
      en: [
        "Tap the heart on any listing to save it to Favorites. Your favorites live under Account → Favorites so you can compare stays later.",
      ],
      ar: [
        "اضغط على القلب في أي إعلان لحفظه في المفضلة. توجد مفضلتك ضمن الحساب ← المفضلة حتى تتمكن من مقارنة الإقامات لاحقًا.",
      ],
    },
    keywords: ["favorite", "مفضلة", "save", "wishlist", "حفظ"],
    related: ["guest-how-search-works"],
    route: "favorites",
  },
  {
    slug: "guest-price-display",
    roles: ["guest"],
    category: "searching",
    order: 5,
    title: { en: "How prices are displayed", ar: "كيف تُعرض الأسعار" },
    summary: {
      en: "StayOS shows all-inclusive totals to guests.",
      ar: "يعرض StayOS إجماليات شاملة للضيوف.",
    },
    body: {
      en: [
        "The total you see at checkout is the full price of your stay: accommodation, cleaning fee and applicable taxes are already included. There are no surprise service fees added at the last step.",
        "Nightly prices in search results help you compare stays; the checkout total is always the final amount you pay.",
      ],
      ar: [
        "الإجمالي الذي تراه عند الدفع هو السعر الكامل لإقامتك: الإقامة ورسوم التنظيف والضرائب المطبقة مشمولة بالفعل. لا توجد رسوم خدمة مفاجئة تُضاف في الخطوة الأخيرة.",
        "تساعدك أسعار الليلة في نتائج البحث على مقارنة الإقامات؛ إجمالي الدفع هو دائمًا المبلغ النهائي الذي تدفعه.",
      ],
    },
    keywords: ["price", "سعر", "total", "إجمالي", "fees", "رسوم", "all-inclusive"],
    related: ["guest-all-inclusive-pricing"],
  },

  /* -------------------------- Booking --------------------------- */
  {
    slug: "guest-booking-request",
    roles: ["guest"],
    category: "booking",
    order: 1,
    title: { en: "Booking requests vs instant book", ar: "طلبات الحجز مقابل الحجز الفوري" },
    summary: {
      en: "Some stays confirm instantly; others need host approval.",
      ar: "بعض الإقامات تتأكد فورًا؛ والبعض الآخر يحتاج موافقة المضيف.",
    },
    body: {
      en: [
        "Listings marked Instant Book confirm your reservation as soon as payment succeeds. Other listings use booking requests: you submit your dates, the host reviews the request, and the booking is confirmed when they accept and your payment is verified.",
        "You can see a listing's booking mode on its page before you commit.",
      ],
      ar: [
        "الإعلانات المميزة بعلامة «حجز فوري» تؤكد حجزك فور نجاح الدفع. إعلانات أخرى تستخدم طلبات الحجز: ترسل تواريخك، ويراجع المضيف الطلب، ويتأكد الحجز عندما يقبل ويتم التحقق من دفعتك.",
        "يمكنك رؤية وضع الحجز للإعلان على صفحته قبل الالتزام.",
      ],
    },
    keywords: ["instant book", "حجز فوري", "request", "طلب", "booking", "حجز"],
    related: ["guest-reservation-status", "guest-payment-verification"],
    route: "search",
  },
  {
    slug: "guest-reservation-status",
    roles: ["guest", "host"],
    category: "booking",
    order: 2,
    title: { en: "What each reservation status means", ar: "ماذا تعني كل حالة حجز" },
    summary: {
      en: "Requested, accepted, confirmed, completed and more.",
      ar: "مطلوب ومقبول ومؤكد ومكتمل والمزيد.",
    },
    body: {
      en: [
        "Requested — your request was sent and is waiting for the host. Accepted — the host approved and payment can proceed. Confirmed — the stay is booked and payment is verified. Completed — the stay finished normally.",
        "Rejected means the host declined the request; cancelled means the reservation was cancelled under the cancellation policy; no-show is recorded when a guest never arrives.",
      ],
      ar: [
        "مطلوب — تم إرسال طلبك وهو في انتظار المضيف. مقبول — وافق المضيف ويمكن المتابعة بالدفع. مؤكد — الحجز مسجل وتم التحقق من الدفع. مكتمل — انتهت الإقامة بشكل طبيعي.",
        "مرفوض يعني أن المضيف رفض الطلب؛ ملغي يعني أن الحجز أُلغي بموجب سياسة الإلغاء؛ عدم الحضور يُسجَّل عندما لا يصل الضيف أبدًا.",
      ],
    },
    keywords: ["status", "حالة", "confirmed", "مؤكد", "requested", "accepted"],
    related: ["guest-booking-request", "guest-check-in"],
    route: "bookings",
  },
  {
    slug: "guest-guest-requirements",
    roles: ["guest"],
    category: "booking",
    order: 3,
    title: { en: "Guest requirements", ar: "متطلبات الضيف" },
    summary: {
      en: "What hosts and StayOS may require before you book.",
      ar: "ما قد يتطلبه المضيفون وStayOS قبل الحجز.",
    },
    body: {
      en: [
        "Listings may set guest requirements such as verified identity or house rules you must accept. Hosts can also state minimum age or other conditions in their policies.",
        "If a booking fails, check that your account verification is complete and your payment method worked — the most common causes are verification status and payment failure.",
      ],
      ar: [
        "قد تحدد الإعلانات متطلبات للضيوف مثل الهوية الموثقة أو قواعد المنزل التي يجب قبولها. يمكن للمضيفين أيضًا تحديد حد أدنى للعمر أو شروط أخرى في سياساتهم.",
        "إذا فشل الحجز، تحقق من اكتمال التحقق من حسابك ونجاح طريقة الدفع — الأسباب الأكثر شيوعًا هي حالة التحقق وفشل الدفع.",
      ],
    },
    keywords: ["requirements", "متطلبات", "rules", "قواعد", "fail", "فشل"],
    related: ["verification-why", "guest-payment-failed"],
  },

  /* --------------------------- Trips ---------------------------- */
  {
    slug: "guest-find-reservation",
    roles: ["guest"],
    category: "trips",
    order: 1,
    title: { en: "Find your reservation", ar: "ابحث عن حجزك" },
    summary: {
      en: "All your stays live under Trips.",
      ar: "كل إقاماتك موجودة ضمن الرحلات.",
    },
    body: {
      en: [
        "Open Trips from the account menu to see every reservation — upcoming, current and past. Tap any stay for full details: dates, guests, price, payment status and the listing.",
      ],
      ar: [
        "افتح الرحلات من قائمة الحساب لرؤية كل حجز — القادمة والحالية والسابقة. اضغط على أي إقامة للحصول على التفاصيل الكاملة: التواريخ والضيوف والسعر وحالة الدفع والإعلان.",
      ],
    },
    keywords: ["trips", "رحلات", "reservation", "حجز", "find"],
    related: ["guest-reservation-status", "guest-check-in"],
    route: "bookings",
  },
  {
    slug: "guest-check-in",
    roles: ["guest"],
    category: "trips",
    order: 2,
    title: { en: "Check-in and check-out", ar: "تسجيل الوصول والمغادرة" },
    summary: {
      en: "How to confirm your arrival and departure.",
      ar: "كيفية تأكيد وصولك ومغادرتك.",
    },
    body: {
      en: [
        "When your stay starts, open the booking from Trips and tap Check-in. The listing's check-in instructions (door codes, building access) are released to you shortly before arrival according to the host's release window.",
        "At the end of the stay, tap Check-out on the same booking screen. Confirming check-in also starts the short protection window before the host's payout becomes eligible — it is part of how stays are kept safe.",
      ],
      ar: [
        "عند بدء إقامتك، افتح الحجز من الرحلات واضغط تسجيل الوصول. تُرسَل إليك تعليمات تسجيل الوصول للإعلان (رموز الأبواب، الوصول إلى المبنى) قبل الوصول بوقت قصير حسب نافذة الإفصاح لدى المضيف.",
        "في نهاية الإقامة، اضغط تسجيل المغادرة في شاشة الحجز نفسها. تأكيد تسجيل الوصول يبدأ أيضًا نافذة الحماية القصيرة قبل أن تصبح مدفوعات المضيف مؤهلة — وهي جزء من كيفية الحفاظ على أمان الإقامات.",
      ],
    },
    keywords: ["check-in", "تسجيل الوصول", "check-out", "المغادرة", "arrival"],
    related: ["guest-find-reservation", "guest-contact-host"],
    route: "bookings",
    escalate: true,
  },
  {
    slug: "guest-contact-host",
    roles: ["guest"],
    category: "trips",
    order: 3,
    title: { en: "Contacting your host", ar: "التواصل مع المضيف" },
    summary: {
      en: "Message the host about your reservation.",
      ar: "راسل المضيف بشأن حجزك.",
    },
    body: {
      en: [
        "Every reservation has a private conversation with the host — open it from the booking detail or from Messages. Use it for arrival times, house questions and anything about the stay.",
        "You can also message a host before booking from the listing page.",
      ],
      ar: [
        "لكل حجز محادثة خاصة مع المضيف — افتحها من تفاصيل الحجز أو من الرسائل. استخدمها لأوقات الوصول وأسئلة المنزل وأي شيء يخص الإقامة.",
        "يمكنك أيضًا مراسلة المضيف قبل الحجز من صفحة الإعلان.",
      ],
    },
    keywords: ["message", "رسالة", "host", "مضيف", "contact", "تواصل"],
    related: ["messaging-safety", "guest-find-reservation"],
    route: "messages",
  },
  {
    slug: "guest-host-cancels",
    roles: ["guest"],
    category: "trips",
    order: 4,
    title: { en: "If something changes with your stay", ar: "إذا تغيّر شيء في إقامتك" },
    summary: {
      en: "What to do when plans shift before or during a stay.",
      ar: "ماذا تفعل عندما تتغير الخطط قبل الإقامة أو أثناءها.",
    },
    body: {
      en: [
        "Message your host first — most changes are easiest to resolve directly. If the reservation itself is affected (dates, cancellation), use the booking detail actions or contact StayOS Support from the booking.",
        "When a confirmed reservation can no longer happen, StayOS Support can help with the cancellation and refund process.",
      ],
      ar: [
        "راسل مضيفك أولًا — معظم التغييرات يتم حلها مباشرة بسهولة أكبر. إذا تأثر الحجز نفسه (التواريخ، الإلغاء)، استخدم إجراءات تفاصيل الحجز أو تواصل مع دعم StayOS من الحجز.",
        "عندما لا يمكن إتمام حجز مؤكد، يمكن لدعم StayOS المساعدة في عملية الإلغاء والاسترداد.",
      ],
    },
    keywords: ["change", "تغيير", "problem", "مشكلة", "help", "مساعدة"],
    related: ["guest-cancel-booking", "support-how-it-works"],
    escalate: true,
  },

  /* ---------------------- Payments & pricing --------------------- */
  {
    slug: "guest-paying",
    roles: ["guest"],
    category: "payments",
    order: 1,
    title: { en: "Paying for a reservation", ar: "الدفع مقابل الحجز" },
    summary: {
      en: "Complete payment through StayOS checkout.",
      ar: "أكمل الدفع من خلال صفحة الدفع في StayOS.",
    },
    body: {
      en: [
        "Pay for your booking through StayOS checkout using the payment methods offered at the payment step. Your payment is recorded on the booking and verified before the reservation is confirmed.",
        "Always pay inside StayOS — a genuine host will never ask you to pay outside the platform.",
      ],
      ar: [
        "ادفع مقابل حجزك من خلال صفحة الدفع في StayOS باستخدام طرق الدفع المعروضة في خطوة الدفع. يتم تسجيل دفعتك في الحجز والتحقق منها قبل تأكيد الحجز.",
        "ادفع دائمًا داخل StayOS — لن يطلب منك مضيف حقيقي الدفع خارج المنصة أبدًا.",
      ],
    },
    keywords: ["pay", "دفع", "paymob", "payment", "مدفوعات", "checkout"],
    related: ["guest-payment-verification", "safety-never-pay-outside"],
  },
  {
    slug: "guest-payment-verification",
    roles: ["guest"],
    category: "payments",
    order: 2,
    title: { en: "Payment verification", ar: "التحقق من الدفع" },
    summary: {
      en: "Some payments are verified before confirmation.",
      ar: "يتم التحقق من بعض المدفوعات قبل التأكيد.",
    },
    body: {
      en: [
        "Depending on the payment method, your payment may be verified automatically or may need a short review (for example when you upload a transfer proof). The booking shows the payment status: pending, proof uploaded, verified, or rejected.",
        "A reservation is confirmed once payment is verified — until then it stays in its requested/accepted state.",
      ],
      ar: [
        "حسب طريقة الدفع، قد يتم التحقق من دفعتك تلقائيًا أو قد تحتاج مراجعة قصيرة (على سبيل المثال عند رفع إثبات تحويل). يعرض الحجز حالة الدفع: قيد الانتظار، تم رفع الإثبات، تم التحقق، أو مرفوض.",
        "يتأكد الحجز بمجرد التحقق من الدفع — حتى ذلك الحين يبقى في حالة الطلب/القبول.",
      ],
    },
    keywords: ["verification", "تحقق", "proof", "إثبات", "pending", "verified"],
    related: ["guest-paying", "guest-reservation-status"],
  },
  {
    slug: "guest-payment-failed",
    roles: ["guest"],
    category: "payments",
    order: 3,
    title: { en: "If your payment fails or is rejected", ar: "إذا فشلت دفعتك أو رُفضت" },
    summary: {
      en: "Retry payment or upload clearer proof.",
      ar: "أعد محاولة الدفع أو ارفع إثباتًا أوضح.",
    },
    body: {
      en: [
        "If a payment fails or an uploaded proof is rejected, open the booking and pay again or upload a clearer proof. The booking is not lost — the payment step simply needs to succeed before the reservation can be confirmed.",
        "Repeated failures can be raised to StayOS Support from the booking page.",
      ],
      ar: [
        "إذا فشلت الدفعة أو رُفض الإثبات المرفوع، افتح الحجز وادفع مرة أخرى أو ارفع إثباتًا أوضح. الحجز لم يُفقد — تحتاج خطوة الدفع فقط للنجاح قبل أن يتأكد الحجز.",
        "يمكن رفع الإخفاقات المتكررة إلى دعم StayOS من صفحة الحجز.",
      ],
    },
    keywords: ["failed", "فشل", "rejected", "مرفوض", "retry", "إعادة"],
    related: ["guest-paying", "support-how-it-works"],
    escalate: true,
  },
  {
    slug: "guest-all-inclusive-pricing",
    roles: ["guest"],
    category: "payments",
    order: 4,
    title: { en: "All-inclusive pricing and VAT", ar: "التسعير الشامل وضريبة القيمة المضافة" },
    summary: {
      en: "Why the checkout total is the final price.",
      ar: "لماذا يُعد إجمالي الدفع هو السعر النهائي.",
    },
    body: {
      en: [
        "Your checkout total already includes accommodation, the cleaning fee and VAT where applicable — that is the final amount. Nothing is added after checkout.",
        "Your payment receipt on the booking detail shows the amount paid, the payment method, and the payment status.",
      ],
      ar: [
        "يتضمن إجمالي الدفع بالفعل الإقامة ورسوم التنظيف وضريبة القيمة المضافة حيثما ينطبق — هذا هو المبلغ النهائي. لا يُضاف شيء بعد الدفع.",
        "يعرض إيصال الدفع في تفاصيل الحجز المبلغ المدفوع وطريقة الدفع وحالة الدفع.",
      ],
    },
    keywords: ["vat", "ضريبة", "total", "إجمالي", "receipt", "إيصال", "inclusive"],
    related: ["guest-price-display", "guest-paying"],
  },

  /* ------------------- Cancellations & refunds ------------------- */
  {
    slug: "guest-cancel-booking",
    roles: ["guest", "host"],
    category: "cancellations",
    order: 1,
    title: { en: "How to cancel a booking", ar: "كيفية إلغاء حجز" },
    summary: {
      en: "Guests cancel from the booking detail page.",
      ar: "يلغي الضيوف من صفحة تفاصيل الحجز.",
    },
    body: {
      en: [
        "Cancellation is a guest action on StayOS: open the booking from Trips and choose Cancel when your reservation state allows it. Before you confirm, the page shows a cancellation preview — the refund you would receive under the listing's cancellation policy.",
        "Cancellation is final once submitted: the booking is marked cancelled, the payment is settled per the policy, and both sides are notified.",
      ],
      ar: [
        "الإلغاء إجراء للضيف في StayOS: افتح الحجز من الرحلات واختر إلغاء عندما تسمح حالة الحجز بذلك. قبل التأكيد، تعرض الصفحة معاينة الإلغاء — المبلغ الذي ستسترده بموجب سياسة الإلغاء للإعلان.",
        "الإلغاء نهائي بمجرد إرساله: يُسجَّل الحجز ملغيًا، وتُسوَّى الدفعة وفقًا للسياسة، ويُخطَر الطرفان.",
      ],
    },
    keywords: ["cancel", "إلغاء", "cancellation", "policy", "سياسة"],
    related: ["guest-refund-process", "guest-host-cancels"],
    route: "bookings",
    escalate: true,
  },
  {
    slug: "guest-refund-process",
    roles: ["guest", "host"],
    category: "cancellations",
    order: 2,
    title: { en: "Refunds: process and timing", ar: "الاستردادات: العملية والتوقيت" },
    summary: {
      en: "What happens to your money after cancellation.",
      ar: "ماذا يحدث لأموالك بعد الإلغاء.",
    },
    body: {
      en: [
        "When a booking is cancelled, the refund amount is calculated by the listing's cancellation policy and how much of the stay was paid. The booking shows the refund status: refund pending or refunded.",
        "Refunds return through the payment channel where the funds actually are — provider-confirmed refunds go back to the original payment method, and others are processed by the operations team. You will see the refund status update on the booking.",
      ],
      ar: [
        "عند إلغاء الحجز، يُحسب مبلغ الاسترداد حسب سياسة الإلغاء للإعلان ومقدار ما دُفع من الإقامة. يعرض الحجز حالة الاسترداد: استرداد قيد الانتظار أو تم الاسترداد.",
        "تعود المبالغ المستردة عبر قناة الدفع حيث توجد الأموال فعليًا — المبالغ المؤكدة من المزود تعود إلى طريقة الدفع الأصلية، وتُعالج الأخرى من قبل فريق العمليات. سترى تحديث حالة الاسترداد في الحجز.",
      ],
    },
    keywords: ["refund", "استرداد", "money back", "أموال", "timing"],
    related: ["guest-cancel-booking"],
  },

  /* ------------------------- Messaging -------------------------- */
  {
    slug: "messaging-safety",
    roles: ["guest", "host"],
    category: "messaging",
    order: 1,
    title: { en: "Message safely", ar: "راسل بأمان" },
    summary: {
      en: "Keep communication and payment inside StayOS.",
      ar: "حافظ على التواصل والدفع داخل StayOS.",
    },
    body: {
      en: [
        "All booking communication should stay inside StayOS messages — it keeps a record for both sides and for support if something goes wrong.",
        "Report inappropriate or suspicious messages to StayOS Support. Never share payment details or agree to pay outside the platform.",
      ],
      ar: [
        "يجب أن يبقى كل تواصل الحجز داخل رسائل StayOS — فهو يحتفظ بسجل للطرفين وللدعم إذا حدث خطأ ما.",
        "أبلغ دعم StayOS عن الرسائل غير اللائقة أو المشبوهة. لا تشارك أبدًا تفاصيل الدفع ولا توافق على الدفع خارج المنصة.",
      ],
    },
    keywords: ["message", "رسالة", "safe", "آمن", "report", "إبلاغ"],
    related: ["safety-never-pay-outside", "safety-report-issue"],
    route: "messages",
  },
  {
    slug: "messaging-notifications",
    roles: ["guest", "host"],
    category: "messaging",
    order: 2,
    title: { en: "Message notifications and unread counts", ar: "إشعارات الرسائل وعداد غير المقروء" },
    summary: {
      en: "How unread badges and notifications work.",
      ar: "كيف تعمل شارات غير المقروء والإشعارات.",
    },
    body: {
      en: [
        "New messages raise the unread counter on Messages and appear in your notifications. Opening the conversation marks it read and clears the counter.",
      ],
      ar: [
        "ترفع الرسائل الجديدة عداد غير المقروء في الرسائل وتظهر في إشعاراتك. فتح المحادثة يعلمها كمقروءة ويمسح العداد.",
      ],
    },
    keywords: ["unread", "غير مقروء", "notification", "إشعار", "badge"],
    related: ["messaging-safety"],
  },

  /* ------------------------ Verification ------------------------ */
  {
    slug: "verification-why",
    roles: ["guest", "host"],
    category: "verification",
    order: 1,
    title: { en: "Why StayOS verifies identity", ar: "لماذا يتحقق StayOS من الهوية" },
    summary: {
      en: "Verification keeps guests, hosts and payouts safe.",
      ar: "يحافظ التحقق على أمان الضيوف والمضيفين والمدفوعات.",
    },
    body: {
      en: [
        "Identity verification is required for key actions — hosting requires a verified identity, and guests may be asked to verify before booking or before funds move. It protects both sides of every reservation.",
      ],
      ar: [
        "التحقق من الهوية مطلوب للإجراءات الأساسية — الاستضافة تتطلب هوية موثقة، وقد يُطلب من الضيوف التحقق قبل الحجز أو قبل تحويل الأموال. إنه يحمي طرفي كل حجز.",
      ],
    },
    keywords: ["kyc", "verify", "تحقق", "identity", "هوية", "verification"],
    related: ["verification-documents", "verification-status"],
    route: "account-settings",
  },
  {
    slug: "verification-documents",
    roles: ["guest", "host"],
    category: "verification",
    order: 2,
    title: { en: "Supported documents and the process", ar: "المستندات المدعومة والعملية" },
    summary: {
      en: "Submit a supported ID and follow the verification steps.",
      ar: "قدّم مستند هوية مدعومًا واتبع خطوات التحقق.",
    },
    body: {
      en: [
        "Submit a supported identity document from your account's verification section and complete the steps shown — which can include a selfie or liveness check when enabled. Your document is reviewed, and the verification status on your account updates when a decision is made.",
        "If verification needs a retry or manual review, your status shows it and you can resubmit.",
      ],
      ar: [
        "قدّم مستند هوية مدعومًا من قسم التحقق في حسابك وأكمل الخطوات المعروضة — والتي قد تتضمن صورة سيلفي أو فحص حيوية عند تفعيله. تتم مراجعة مستندك، ويتم تحديث حالة التحقق في حسابك عند اتخاذ القرار.",
        "إذا احتاج التحقق إلى إعادة محاولة أو مراجعة يدوية، توضح حالتك ذلك ويمكنك إعادة التقديم.",
      ],
    },
    keywords: ["document", "مستند", "passport", "جواز", "selfie", "سيلفي", "national id"],
    related: ["verification-why", "verification-status"],
    route: "account-settings",
  },
  {
    slug: "verification-status",
    roles: ["guest", "host"],
    category: "verification",
    order: 3,
    title: { en: "Verification status meanings", ar: "معاني حالة التحقق" },
    summary: {
      en: "Pending, verified, rejected — and what to do next.",
      ar: "قيد الانتظار وموثق ومرفوض — وماذا تفعل بعد ذلك.",
    },
    body: {
      en: [
        "Your account shows your verification status. Pending means the review is in progress; verified means your identity is confirmed; rejected or needs-review means something in the submission must be corrected and resubmitted.",
      ],
      ar: [
        "يعرض حسابك حالة التحقق الخاصة بك. قيد الانتظار يعني أن المراجعة جارية؛ موثق يعني تأكيد هويتك؛ مرفوض أو يحتاج مراجعة يعني أن شيئًا في التقديم يجب تصحيحه وإعادة تقديمه.",
      ],
    },
    keywords: ["status", "حالة", "pending", "verified", "موثق", "review"],
    related: ["verification-why", "verification-documents"],
    escalate: true,
  },

  /* --------------------------- Reviews -------------------------- */
  {
    slug: "reviews-how-they-work",
    roles: ["guest", "host"],
    category: "reviews",
    order: 1,
    title: { en: "How reviews work", ar: "كيف تعمل التقييمات" },
    summary: {
      en: "Guests and hosts review each other after a stay.",
      ar: "يقيّم الضيوف والمضيفون بعضهم البعض بعد الإقامة.",
    },
    body: {
      en: [
        "After a stay completes, both the guest and the host can leave a review with a rating. Reviews build trust on both sides — they appear on listings and profiles.",
        "Write honest, relevant reviews. If a review breaks the rules, it can be reported for moderation.",
      ],
      ar: [
        "بعد اكتمال الإقامة، يمكن لكل من الضيف والمضيف ترك تقييم مع درجة. تبني التقييمات الثقة لدى الطرفين — تظهر على الإعلانات والملفات الشخصية.",
        "اكتب تقييمات صادقة وذات صلة. إذا خالف تقييم القواعد، يمكن الإبلاغ عنه للمراجعة.",
      ],
    },
    keywords: ["review", "تقييم", "rating", "درجة", "stars"],
    related: ["reviews-when"],
  },
  {
    slug: "reviews-when",
    roles: ["guest"],
    category: "reviews",
    order: 2,
    title: { en: "When you can review", ar: "متى يمكنك التقييم" },
    summary: {
      en: "Reviews open after your stay completes.",
      ar: "تُفتح التقييمات بعد اكتمال إقامتك.",
    },
    body: {
      en: [
        "You can review a stay after it completes — the review option appears on the booking once the reservation is in a completed state.",
      ],
      ar: [
        "يمكنك تقييم إقامة بعد اكتمالها — يظهر خيار التقييم في الحجز بمجرد وصول الحجز إلى حالة مكتملة.",
      ],
    },
    keywords: ["review", "تقييم", "when", "متى", "completed"],
    related: ["reviews-how-they-work"],
  },

  /* --------------------------- Safety --------------------------- */
  {
    slug: "safety-never-pay-outside",
    roles: ["guest", "host"],
    category: "safety",
    order: 1,
    title: { en: "Never pay outside StayOS", ar: "لا تدفع خارج StayOS أبدًا" },
    summary: {
      en: "Off-platform payments have no protection.",
      ar: "المدفوعات خارج المنصة ليس لها حماية.",
    },
    body: {
      en: [
        "Every legitimate StayOS payment happens inside checkout. If anyone — guest or host — asks you to pay by direct transfer, cash or another app, decline and report it. Money sent outside the platform cannot be recovered or protected.",
        "The same rule applies to hosts: never ask a guest to pay outside StayOS.",
      ],
      ar: [
        "تتم كل مدفوعات StayOS المشروعة داخل صفحة الدفع. إذا طلب منك أي شخص — ضيف أو مضيف — الدفع بتحويل مباشر أو نقدًا أو تطبيق آخر، ارفض وأبلغ عن ذلك. لا يمكن استرداد أو حماية الأموال المُرسلة خارج المنصة.",
        "تنطبق القاعدة نفسها على المضيفين: لا تطلب من الضيف الدفع خارج StayOS أبدًا.",
      ],
    },
    keywords: ["pay", "دفع", "scam", "احتيال", "outside", "خارج", "safe"],
    related: ["messaging-safety", "safety-report-issue"],
    escalate: true,
  },
  {
    slug: "safety-report-issue",
    roles: ["guest", "host"],
    category: "safety",
    order: 2,
    title: { en: "Report a problem or safety concern", ar: "الإبلاغ عن مشكلة أو مخاوف أمنية" },
    summary: {
      en: "How to reach StayOS Support with concerns.",
      ar: "كيفية الوصول إلى دعم StayOS بالمخاوف.",
    },
    body: {
      en: [
        "Use Support in your account menu or from the booking page to report problems: listing accuracy, payment issues, safety concerns, or behavior that breaks the rules. Support threads are private between you and StayOS Support.",
        "For emergencies, always contact local authorities first, then report to StayOS.",
      ],
      ar: [
        "استخدم الدعم في قائمة حسابك أو من صفحة الحجز للإبلاغ عن المشاكل: دقة الإعلان، مشاكل الدفع، المخاوف الأمنية، أو السلوك المخالف للقواعد. محادثات الدعم خاصة بينك وبين دعم StayOS.",
        "في حالات الطوارئ، اتصل دائمًا بالسلطات المحلية أولًا، ثم أبلغ StayOS.",
      ],
    },
    keywords: ["report", "إبلاغ", "safety", "أمان", "problem", "مشكلة", "emergency"],
    related: ["support-how-it-works", "messaging-safety"],
    escalate: true,
    route: "support",
  },
  {
    slug: "safety-privacy",
    roles: ["guest", "host"],
    category: "safety",
    order: 3,
    title: { en: "Your privacy on StayOS", ar: "خصوصيتك في StayOS" },
    summary: {
      en: "Control your data and privacy settings.",
      ar: "تحكم في بياناتك وإعدادات الخصوصية.",
    },
    body: {
      en: [
        "Your profile, verification documents and payment details are only used for running the platform. Account settings include privacy controls and a data export option.",
      ],
      ar: [
        "يُستخدم ملفك الشخصي ومستندات التحقق وتفاصيل الدفع فقط لتشغيل المنصة. تتضمن إعدادات الحساب عناصر تحكم في الخصوصية وخيار تصدير البيانات.",
      ],
    },
    keywords: ["privacy", "خصوصية", "data", "بيانات", "export", "تصدير"],
    related: ["account-settings-help"],
    route: "account-settings",
  },

  /* --------------------------- Account -------------------------- */
  {
    slug: "account-settings-help",
    roles: ["guest", "host"],
    category: "account",
    order: 1,
    title: { en: "Managing your account", ar: "إدارة حسابك" },
    summary: {
      en: "Profile, personal info, login and security.",
      ar: "الملف الشخصي والمعلومات الشخصية وتسجيل الدخول والأمان.",
    },
    body: {
      en: [
        "Account settings hold your profile, personal information, password, notification preferences, privacy controls and active sessions. Keep your contact details current so booking and payment updates reach you.",
      ],
      ar: [
        "تحتوي إعدادات الحساب على ملفك الشخصي ومعلوماتك الشخصية وكلمة المرور وتفضيلات الإشعارات وعناصر التحكم في الخصوصية وجلساتك النشطة. حافظ على تحديث بيانات التواصل حتى تصلك تحديثات الحجز والدفع.",
      ],
    },
    keywords: ["account", "حساب", "profile", "ملف", "settings", "إعدادات"],
    related: ["account-language", "safety-privacy"],
    route: "account-settings",
  },
  {
    slug: "account-language",
    roles: ["guest", "host"],
    category: "account",
    order: 2,
    title: { en: "Language and notifications", ar: "اللغة والإشعارات" },
    summary: {
      en: "Switch between English and Arabic.",
      ar: "التبديل بين الإنجليزية والعربية.",
    },
    body: {
      en: [
        "Use the language switcher in the header or Language & currency in account settings to switch between English and العربية — the whole interface, including right-to-left layout, follows your choice. Notification preferences are managed in account settings.",
      ],
      ar: [
        "استخدم مبدّل اللغة في الترويسة أو اللغة والعملة في إعدادات الحساب للتبديل بين English والعربية — تتبع الواجهة بأكملها، بما في ذلك التخطيط من اليمين إلى اليسار، اختيارك. تُدار تفضيلات الإشعارات في إعدادات الحساب.",
      ],
    },
    keywords: ["language", "لغة", "arabic", "عربي", "english", "notification", "إشعار"],
    related: ["account-settings-help"],
    route: "account-settings/language",
  },
  {
    slug: "account-security",
    roles: ["guest", "host"],
    category: "account",
    order: 3,
    title: { en: "Login and account security", ar: "تسجيل الدخول وأمان الحساب" },
    summary: {
      en: "Passwords, sessions and signing out everywhere.",
      ar: "كلمات المرور والجلسات وتسجيل الخروج من كل مكان.",
    },
    body: {
      en: [
        "Sign in with your phone number and verification code or your password. From account settings you can set or change your password, review active sessions, and sign out of all sessions at once if a device is lost.",
      ],
      ar: [
        "سجّل الدخول برقم هاتفك ورمز التحقق أو كلمة المرور. من إعدادات الحساب يمكنك تعيين كلمة مرورك أو تغييرها ومراجعة الجلسات النشطة وتسجيل الخروج من جميع الجلسات دفعة واحدة إذا فُقد جهاز.",
      ],
    },
    keywords: ["password", "كلمة مرور", "login", "دخول", "session", "جلسة", "security", "أمان"],
    related: ["account-settings-help", "safety-privacy"],
    route: "account-settings",
  },

  /* ------------------------ Accessibility ----------------------- */
  {
    slug: "accessibility-listings",
    roles: ["guest"],
    category: "accessibility",
    order: 1,
    title: { en: "Accessible listings", ar: "الإقامات المناسبة للوصول" },
    summary: {
      en: "Find stays that list accessibility features.",
      ar: "اعثر على إقامات تذكر ميزات الوصول.",
    },
    body: {
      en: [
        "Hosts can list accessibility features such as step-free access or wide doorways on their listings. Check the listing's accessibility section, and message the host before booking if you need to confirm a specific need.",
      ],
      ar: [
        "يمكن للمضيفين إدراج ميزات الوصول مثل الدخول بدون درجات أو المداخل الواسعة في إعلاناتهم. تحقق من قسم إمكانية الوصول في الإعلان، وراسل المضيف قبل الحجز إذا كنت بحاجة لتأكيد احتياج معين.",
      ],
    },
    keywords: ["accessibility", "وصول", "wheelchair", "كرسي", "step-free"],
    related: ["guest-contact-host", "guest-availability"],
  },

  /* --------------------------- Support -------------------------- */
  {
    slug: "support-how-it-works",
    roles: ["guest", "host", "staff"],
    category: "support",
    order: 1,
    title: { en: "How StayOS Support works", ar: "كيف يعمل دعم StayOS" },
    summary: {
      en: "Start a private support conversation from the Support page.",
      ar: "ابدأ محادثة دعم خاصة من صفحة الدعم.",
    },
    body: {
      en: [
        "Open Support from your account menu and start a conversation — your message goes straight to StayOS Support as a private thread. You can attach booking context when asking about a specific reservation.",
        "Track replies and the conversation status (open, waiting, resolved) in the same place. Replies appear in your messages and notifications.",
      ],
      ar: [
        "افتح الدعم من قائمة حسابك وابدأ محادثة — تصل رسالتك مباشرة إلى دعم StayOS كمحادثة خاصة. يمكنك إرفاق سياق الحجز عند السؤال عن حجز معين.",
        "تتبع الردود وحالة المحادثة (مفتوحة، بانتظار، محلولة) في المكان نفسه. تظهر الردود في رسائلك وإشعاراتك.",
      ],
    },
    keywords: ["support", "دعم", "help", "مساعدة", "contact", "تواصل"],
    related: ["safety-report-issue"],
    route: "support",
  },
];
