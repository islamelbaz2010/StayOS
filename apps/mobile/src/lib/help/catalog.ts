/**
 * StayOS Help Center — canonical content model.
 *
 * Static typed catalog (single source of truth, enforced EN/AR parity
 * via `Localized`). Every article declares the account roles it serves,
 * its topic (category) and optional subtopic, related articles, search
 * keywords, a contextual app route, and ordering. Content must describe
 * only real StayOS capabilities — never benchmark-only features.
 */

export type HelpRole = "guest" | "host" | "staff";

export interface Localized {
  en: string;
  ar: string;
}

export interface HelpCategory {
  key: string;
  /** Which roles see this topic. Shared topics list multiple roles. */
  roles: HelpRole[];
  order: number;
  title: Localized;
  blurb: Localized;
}

export interface HelpArticle {
  slug: string;
  roles: HelpRole[];
  category: string;
  subcategory?: string;
  order: number;
  title: Localized;
  summary: Localized;
  /** Short paragraphs — keep them factual and scannable. */
  body: { en: string[]; ar: string[] };
  /** Extra search terms in both languages. */
  keywords: string[];
  related: string[];
  /** In-app route this article relates to (contextual help). */
  route?: string;
  /** Show a "contact support" escalation at the end of the article. */
  escalate?: boolean;
}

/* ------------------------------------------------------------------ */
/* Topics — the browse-by-topic hierarchy                               */
/* ------------------------------------------------------------------ */

export const HELP_CATEGORIES: HelpCategory[] = [
  // --- Guest-first topics ---
  {
    key: "searching",
    roles: ["guest"],
    order: 1,
    title: { en: "Searching & finding a stay", ar: "البحث عن إقامة وإيجادها" },
    blurb: {
      en: "Search, filters, listing details, availability and favorites.",
      ar: "البحث وعوامل التصفية وتفاصيل الإعلان والتوفر والمفضلة.",
    },
  },
  {
    key: "booking",
    roles: ["guest"],
    order: 2,
    title: { en: "Booking", ar: "الحجز" },
    blurb: {
      en: "How to book, instant book, requests and confirmations.",
      ar: "كيفية الحجز والحجز الفوري والطلبات والتأكيدات.",
    },
  },
  {
    key: "trips",
    roles: ["guest"],
    order: 3,
    title: { en: "Your trips", ar: "رحلاتك" },
    blurb: {
      en: "Reservations, check-in, check-out and contacting your host.",
      ar: "الحجوزات وتسجيل الوصول والمغادرة والتواصل مع المضيف.",
    },
  },
  {
    key: "payments",
    roles: ["guest"],
    order: 4,
    title: { en: "Payments & pricing", ar: "المدفوعات والأسعار" },
    blurb: {
      en: "Paying, verification, all-inclusive pricing and receipts.",
      ar: "الدفع والتحقق والتسعير الشامل والإيصالات.",
    },
  },
  {
    key: "cancellations",
    roles: ["guest", "host"],
    order: 5,
    title: { en: "Cancellations & refunds", ar: "الإلغاءات والاستردادات" },
    blurb: {
      en: "How cancellation works and when refunds arrive.",
      ar: "كيف يعمل الإلغاء ومتى تصل المبالغ المستردة.",
    },
  },
  {
    key: "messaging",
    roles: ["guest", "host"],
    order: 6,
    title: { en: "Messaging", ar: "المراسلة" },
    blurb: {
      en: "Message your host or guest and stay safe.",
      ar: "مراسلة المضيف أو الضيف بأمان.",
    },
  },
  {
    key: "verification",
    roles: ["guest", "host"],
    order: 7,
    title: { en: "Identity verification", ar: "التحقق من الهوية" },
    blurb: {
      en: "Why we verify and how the process works.",
      ar: "لماذا نتحقق من الهوية وكيف تعمل العملية.",
    },
  },
  {
    key: "reviews",
    roles: ["guest", "host"],
    order: 8,
    title: { en: "Reviews", ar: "التقييمات" },
    blurb: {
      en: "How reviews and ratings work for everyone.",
      ar: "كيف تعمل التقييمات والمراجعات للجميع.",
    },
  },
  {
    key: "safety",
    roles: ["guest", "host"],
    order: 9,
    title: { en: "Safety", ar: "الأمان" },
    blurb: {
      en: "Safe booking, payments and reporting concerns.",
      ar: "حجز ودفع آمن والإبلاغ عن المخاوف.",
    },
  },
  {
    key: "account",
    roles: ["guest", "host"],
    order: 10,
    title: { en: "Account", ar: "الحساب" },
    blurb: {
      en: "Profile, security, notifications, language and privacy.",
      ar: "الملف الشخصي والأمان والإشعارات واللغة والخصوصية.",
    },
  },
  {
    key: "accessibility",
    roles: ["guest"],
    order: 11,
    title: { en: "Accessibility & inclusion", ar: "إمكانية الوصول والشمول" },
    blurb: {
      en: "Accessible stays and asking hosts about access needs.",
      ar: "الإقامات المناسبة وسؤال المضيفين عن احتياجات الوصول.",
    },
  },
  // --- Host-first topics ---
  {
    key: "hosting_started",
    roles: ["host"],
    order: 1,
    title: { en: "Getting started", ar: "البدء" },
    blurb: {
      en: "Become a host, verification and your first listing.",
      ar: "كن مضيفًا والتحقق من الهوية وأول إعلان لك.",
    },
  },
  {
    key: "listings",
    roles: ["host"],
    order: 2,
    title: { en: "Listings", ar: "الإعلانات" },
    blurb: {
      en: "Create, edit, publish and manage your listings.",
      ar: "إنشاء إعلاناتك وتعديلها ونشرها وإدارتها.",
    },
  },
  {
    key: "pricing",
    roles: ["host"],
    order: 3,
    title: { en: "Pricing", ar: "التسعير" },
    blurb: {
      en: "Nightly prices, discounts, cleaning fee and earnings.",
      ar: "أسعار الليلة والخصومات ورسوم التنظيف والأرباح.",
    },
  },
  {
    key: "calendar",
    roles: ["host"],
    order: 4,
    title: { en: "Calendar & availability", ar: "التقويم والتوفر" },
    blurb: {
      en: "Open and block dates and keep availability accurate.",
      ar: "فتح وحظر التواريخ والحفاظ على دقة التوفر.",
    },
  },
  {
    key: "reservations",
    roles: ["host"],
    order: 5,
    title: { en: "Reservations", ar: "الحجوزات" },
    blurb: {
      en: "Requests, statuses, filters and guest information.",
      ar: "الطلبات والحالات وعوامل التصفية ومعلومات الضيوف.",
    },
  },
  {
    key: "communication",
    roles: ["host"],
    order: 6,
    title: { en: "Guest communication", ar: "التواصل مع الضيوف" },
    blurb: {
      en: "Messaging guests and check-in instructions.",
      ar: "مراسلة الضيوف وتعليمات تسجيل الوصول.",
    },
  },
  {
    key: "earnings",
    roles: ["host"],
    order: 7,
    title: { en: "Earnings", ar: "الأرباح" },
    blurb: {
      en: "How earnings, funds held and host payable work.",
      ar: "كيف تعمل الأرباح والأموال المحتجزة والمستحق للمضيف.",
    },
  },
  {
    key: "payouts",
    roles: ["host"],
    order: 8,
    title: { en: "Payouts", ar: "المدفوعات للمضيف" },
    blurb: {
      en: "Payout preferences, eligibility and timing.",
      ar: "تفضيلات الدفع والأهلية والتوقيت.",
    },
  },
  {
    key: "support",
    roles: ["guest", "host", "staff"],
    order: 99,
    title: { en: "Contact support", ar: "التواصل مع الدعم" },
    blurb: {
      en: "Reach StayOS Support about anything unresolved.",
      ar: "تواصل مع دعم StayOS بشأن أي شيء لم يُحل.",
    },
  },
];

/* ------------------------------------------------------------------ */
/* Role resolution                                                     */
/* ------------------------------------------------------------------ */

/** Which catalog roles a platform user may browse. */
export function rolesForUser(role: string | null | undefined): HelpRole[] {
  switch (role) {
    case "host":
      return ["host", "guest"]; // hosts also book stays as guests
    case "admin":
    case "staff":
      return ["staff", "host", "guest"];
    case "guest":
    default:
      return ["guest"];
  }
}

export function categoriesForRoles(roles: HelpRole[]): HelpCategory[] {
  return HELP_CATEGORIES.filter((c) => c.roles.some((r) => roles.includes(r)))
    .sort((a, b) => a.order - b.order);
}

export function articlesForRoles(
  articles: HelpArticle[],
  roles: HelpRole[]
): HelpArticle[] {
  return articles
    .filter((a) => a.roles.some((r) => roles.includes(r)))
    .sort((a, b) => a.order - b.order);
}

export function articlesInCategory(
  articles: HelpArticle[],
  category: string,
  roles: HelpRole[]
): HelpArticle[] {
  return articlesForRoles(articles, roles).filter(
    (a) => a.category === category
  );
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

const normalize = (s: string) => s.trim().toLowerCase();

/**
 * Lightweight deterministic ranking: title > keywords > summary > body.
 * Works for both Latin and Arabic text (simple substring matching —
 * Arabic tokenization is intentionally avoided for partial matches).
 */
export function searchArticles(
  articles: HelpArticle[],
  roles: HelpRole[],
  query: string,
  locale: "en" | "ar"
): HelpArticle[] {
  const q = normalize(query);
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const visible = articlesForRoles(articles, roles);

  const scored = visible
    .map((a) => {
      const title = normalize(a.title[locale]);
      const otherTitle = normalize(a.title[locale === "en" ? "ar" : "en"]);
      const summary = normalize(a.summary[locale]);
      const body = normalize(a.body[locale].join(" "));
      const keywords = a.keywords.map(normalize);
      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) score += 10;
        if (otherTitle.includes(term)) score += 6;
        if (keywords.some((k) => k.includes(term) || term.includes(k)))
          score += 8;
        if (summary.includes(term)) score += 4;
        if (body.includes(term)) score += 2;
      }
      return { a, score };
    })
    .filter((r) => r.score > 0);

  return scored.sort((x, y) => y.score - x.score).map((r) => r.a);
}

/* ------------------------------------------------------------------ */
/* Contextual recommendations (deterministic, not AI)                  */
/* ------------------------------------------------------------------ */

const CONTEXT_MAP: Record<string, string[]> = {
  booking: ["guest-cancel-booking", "guest-check-in", "guest-contact-host", "guest-reservation-status"],
  trips: ["guest-find-reservation", "guest-check-in", "guest-contact-host", "guest-cancel-booking"],
  payment: ["guest-payment-verification", "guest-all-inclusive-pricing", "guest-payment-failed"],
  verification: ["verification-why", "verification-status", "verification-documents"],
  "host-bookings": ["host-manage-reservations", "host-reservation-filters", "host-guest-cancellation"],
  "host-earnings": ["host-funds-held", "host-payout-timing", "host-earnings-model", "host-refund-impact"],
  "host-listings": ["host-listing-readiness", "host-publish-listing", "host-listing-photos"],
  "host-calendar": ["host-block-dates", "host-availability-accuracy"],
  messages: ["messaging-safety", "guest-contact-host"],
  support: ["support-how-it-works", "safety-report-issue"],
};

export function recommendedFor(
  articles: HelpArticle[],
  roles: HelpRole[],
  context: string | null | undefined,
  limit = 4
): HelpArticle[] {
  const slugs: string[] = context ? CONTEXT_MAP[context] ?? [] : [];
  const visible = articlesForRoles(articles, roles);
  const picked = slugs
    .map((s) => visible.find((a) => a.slug === s))
    .filter((a): a is HelpArticle => !!a);
  if (picked.length >= limit) return picked.slice(0, limit);
  // Fill with the most-read categories for this role when context is thin.
  const fallback = visible
    .filter((a) => !picked.includes(a))
    .slice(0, limit - picked.length);
  return [...picked, ...fallback];
}
