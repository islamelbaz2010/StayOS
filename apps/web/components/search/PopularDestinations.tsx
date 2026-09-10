"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { usePopularLocations } from "@/lib/queries/locations";

export function PopularDestinations() {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();
  const { data, isLoading } = usePopularLocations();

  if (isLoading || !data || data.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-xl font-semibold text-neutral-900">
        {t("popularDestinations")}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {data.map((s, i) => {
          const name =
            locale === "ar" ? s.canonical_name_ar : s.canonical_name_en;
          return (
            <button
              key={`${s.canonical_name_en}:${s.city}:${i}`}
              type="button"
              onClick={() =>
                router.push(
                  `/${locale}/search?q=${encodeURIComponent(name)}`
                )
              }
              className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-start transition hover:border-accent-300 hover:shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-neutral-900 group-hover:text-accent-600">
                  {name}
                </span>
                <span className="text-xs text-neutral-500">
                  {s.governorate}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
