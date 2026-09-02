"use client";

import { useRef } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/listings/ListingCardSkeleton";
import { useListings } from "@/lib/queries/listings";

export function FeaturedListings() {
  const t = useTranslations("search");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const isRTL = locale === "ar";
  const railRef = useRef<HTMLDivElement>(null);

  const { data, isPending } = useListings({ limit: "10" });

  if (!isPending && (!data || data.listings.length === 0)) {
    return null;
  }

  function scrollRail(direction: "start" | "end") {
    const el = railRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.9;
    // In RTL layouts the browser's native scroll axis is mirrored, so an
    // "end" (forward) scroll needs a negative delta there.
    const sign = isRTL ? -1 : 1;
    el.scrollBy({ left: direction === "end" ? amount * sign : -amount * sign, behavior: "smooth" });
  }

  return (
    <section className="bg-neutral-50 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">
            {t("featuredTitle")}
          </h2>
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/search`}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {t("viewAll")}
            </Link>
            <div className="hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollRail("start")}
                aria-label="Scroll back"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-100"
              >
                <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollRail("end")}
                aria-label="Scroll forward"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-100"
              >
                <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div
          ref={railRef}
          className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 scrollbar-hide"
        >
          {isPending
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-72 flex-shrink-0 snap-start sm:w-80">
                  <ListingCardSkeleton />
                </div>
              ))
            : data?.listings.map((listing) => (
                <div key={listing.id} className="w-72 flex-shrink-0 snap-start sm:w-80">
                  <ListingCard listing={listing} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
