"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useListings } from "@/lib/queries/listings";
import { usePopularLocations } from "@/lib/queries/locations";

export function PopularDestinations() {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();
  const { data, isLoading } = usePopularLocations();
  // Real listing covers power the destination imagery — no fabricated
  // visuals; a place with no cover falls back to the branded pin tile.
  const { data: feed } = useListings({ limit: "40" });

  const coverByPlace = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of feed?.listings ?? []) {
      if (!l.coverImage) continue;
      if (l.city && !map.has(`c:${l.city}`)) map.set(`c:${l.city}`, l.coverImage);
      if (l.governorate && !map.has(`g:${l.governorate}`)) {
        map.set(`g:${l.governorate}`, l.coverImage);
      }
    }
    return map;
  }, [feed]);

  if (isLoading || !data || data.length === 0) return null;

  return (
    <section
      id="popular-destinations"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">
          {t("popularDestinations")}
        </h2>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/search`)}
          className="text-sm font-semibold text-accent-600 hover:text-accent-700"
        >
          {t("viewAll")} →
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {data.map((s, i) => {
          const name =
            locale === "ar" ? s.canonical_name_ar : s.canonical_name_en;
          const cover =
            coverByPlace.get(`c:${s.city}`) ??
            coverByPlace.get(`g:${s.governorate}`);
          return (
            <button
              key={`${s.canonical_name_en}:${s.city}:${i}`}
              type="button"
              onClick={() =>
                router.push(
                  `/${locale}/search?q=${encodeURIComponent(name)}`
                )
              }
              className="group relative h-40 overflow-hidden rounded-2xl bg-accent-100 text-start shadow-sm transition hover:shadow-md"
            >
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={name}
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-accent-600">
                  <svg
                    className="h-8 w-8"
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
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <span className="absolute bottom-0 start-0 p-3">
                <span className="block text-sm font-bold text-white drop-shadow">
                  {name}
                </span>
                <span className="block text-xs font-medium text-white/85 drop-shadow">
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
