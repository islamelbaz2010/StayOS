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

const CATEGORY_ICONS: Record<string, string> = {
  APARTMENT: "🏠",
  VILLA: "🏡",
  CHALET: "🏖️",
  STUDIO: "🛏️",
  HOTEL_ROOM: "🏨",
  RESORT_UNIT: "🌴",
};

// Reference category-icon pattern: outlined icon above a small muted
// label, no borders or card chrome — the strip sits directly on canvas.
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
              className="text-2xl text-neutral-500 transition-colors group-hover:text-brand-900"
              aria-hidden="true"
            >
              {CATEGORY_ICONS[category]}
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
