"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const CATEGORIES = [
  "APARTMENT",
  "VILLA",
  "CHALET",
  "STUDIO",
  "HOTEL_ROOM",
  "RESORT_UNIT",
];

/** Restrained 24px line icons — the reference's category treatment. */
function CategoryIcon({ category }: { category: string }) {
  const cls = "h-6 w-6";
  const props = {
    className: cls,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.5,
    "aria-hidden": true as const,
  };
  switch (category) {
    case "APARTMENT":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M8.25 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      );
    case "VILLA":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
        </svg>
      );
    case "CHALET":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M12 3.75l8.25 8.25M12 3.75L3.75 12m14.25-4.5v13.5H6v-13.5M9.75 21v-6h4.5v6" />
        </svg>
      );
    case "STUDIO":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75v-10.5A2.25 2.25 0 014.5 6h15a2.25 2.25 0 012.25 2.25V18.75M2.25 18.75h19.5M2.25 18.75V21m19.5-2.25V21M6 10.5h4.5M13.5 10.5H18" />
        </svg>
      );
    case "HOTEL_ROOM":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V5.25A2.25 2.25 0 015.25 3h8.5A2.25 2.25 0 0116 5.25V21m0 0V9.75h4.25c.621 0 1.125.504 1.125 1.125V21M3 21h18M6.75 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3.75-6h1.5m-1.5 3h1.5m-1.5 3h1.5" />
        </svg>
      );
    case "RESORT_UNIT":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.485 0 4.5 2.015 4.5 4.5 0 .828-.224 1.604-.614 2.268M12 3C9.515 3 7.5 5.015 7.5 7.5c0 .828.224 1.604.614 2.268M12 3v0c-1.656 0-3 1.79-3 4 0 .621.151 1.206.42 1.72M12 3c1.656 0 3 1.79 3 4 0 .621-.151 1.206-.42 1.72M12 7.5V21m0-13.5c-3.728 0-6.75 3.022-6.75 6.75m6.75-6.75c3.728 0 6.75 3.022 6.75 6.75M5.25 21h13.5" />
        </svg>
      );
    default:
      return null;
  }
}

// Reference category-icon pattern: restrained outlined icon above a small
// muted label, no borders or card chrome — the strip sits on the canvas.
export function CategoryChips({ locale }: { locale: string }) {
  const t = useTranslations("search");

  return (
    <section className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
      <div className="flex gap-8 overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-6 sm:gap-3">
        {CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/${locale}/search?property_type=${category}`}
            className="group flex min-w-[72px] flex-col items-center gap-2 pb-1 pt-2"
          >
            <span
              className="text-neutral-400 transition-colors group-hover:text-brand-900"
              aria-hidden="true"
            >
              <CategoryIcon category={category} />
            </span>
            <span className="whitespace-nowrap border-b-2 border-transparent pb-1 text-xs text-neutral-500 transition group-hover:border-brand-900 group-hover:text-brand-900">
              {t(`types.${category}`)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
