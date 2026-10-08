"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useListings } from "@/lib/queries/listings";
import { usePopularLocations } from "@/lib/queries/locations";

// Reference destinations from the approved MAKAZOH mockup — shown first
// when the location exists in real data with a real cover image.
const REFERENCE_DESTINATIONS = [
  "cairo",
  "alexandria",
  "ain sokhna",
  "hurghada",
  "el gouna",
  "sharm el sheikh",
];

const MAX_CARDS = 6;

function referenceRank(name: string): number {
  const normalized = name.trim().toLowerCase();
  const idx = REFERENCE_DESTINATIONS.findIndex(
    (ref) => normalized === ref || normalized.includes(ref)
  );
  return idx === -1 ? REFERENCE_DESTINATIONS.length : idx;
}

export function PopularDestinations() {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();
  const { data, isLoading } = usePopularLocations();
  // Real listing covers power the destination imagery — no fabricated
  // visuals; destinations without a real cover stay reachable via
  // "View all" instead of showing an empty card.
  const { data: feed } = useListings({ limit: "40" });
  // Covers that fail to load (dead external URLs) fall back through the
  // place's other real covers, then to the branded pin tile.
  const [brokenCovers, setBrokenCovers] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  // All covers per place, in feed order — a card falls back through them
  // before being dropped entirely.
  const coversByPlace = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const l of feed?.listings ?? []) {
      if (!l.coverImage) continue;
      for (const key of [
        l.city ? `c:${l.city}` : null,
        l.governorate ? `g:${l.governorate}` : null,
      ]) {
        if (!key) continue;
        const list = map.get(key) ?? [];
        if (!list.includes(l.coverImage)) list.push(l.coverImage);
        map.set(key, list);
      }
    }
    return map;
  }, [feed]);

  const places = useMemo(
    () =>
      (data ?? [])
        .map((s) => {
          const candidates = (
            coversByPlace.get(`c:${s.city}`) ??
            coversByPlace.get(`g:${s.governorate}`) ??
            []
          ).filter((c) => !brokenCovers.has(c));
          return { place: s, cover: candidates[0] ?? null };
        })
        .sort(
          (a, b) =>
            referenceRank(a.place.canonical_name_en) -
            referenceRank(b.place.canonical_name_en)
        )
        .slice(0, MAX_CARDS),
    [data, coversByPlace, brokenCovers]
  );

  if (isLoading || places.length === 0) return null;

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
        {places.map(({ place: s, cover }, i) => {
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
              className="group relative h-40 overflow-hidden rounded-2xl bg-accent-100 text-start shadow-sm transition hover:shadow-md"
            >
              {cover ? (
                <Image
                  src={cover}
                  alt={name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                  onError={() =>
                    setBrokenCovers((prev) => {
                      if (prev.has(cover)) return prev;
                      const next = new Set(prev);
                      next.add(cover);
                      return next;
                    })
                  }
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-brand-900">
                  <svg
                    className="h-8 w-8 text-accent-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
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
