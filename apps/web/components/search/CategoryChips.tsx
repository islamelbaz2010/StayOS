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

export function CategoryChips({ locale }: { locale: string }) {
  const t = useTranslations("search");

  return (
    <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-xl font-bold text-brand-900">
        {t("browseByCategory")}
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/${locale}/search?property_type=${category}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-brand-400 hover:shadow-card"
          >
            <span className="text-3xl" aria-hidden="true">
              {CATEGORY_ICONS[category]}
            </span>
            <span className="text-sm font-medium text-neutral-700">
              {t(`types.${category}`)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
