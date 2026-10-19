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
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/${locale}/search`}
            className="group inline-flex items-center gap-1.5"
          >
            <h2 className="section-title">{t("featuredTitle")}</h2>
            <svg
              className="h-5 w-5 text-brand-900 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollRail("start")}
              aria-label={t("scrollBack")}
              className="icon-btn h-8 w-8 border border-neutral-300 bg-white shadow-card"
            >
              <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollRail("end")}
              aria-label={t("scrollForward")}
              className="icon-btn h-8 w-8 border border-neutral-300 bg-white shadow-card"
            >
              <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={railRef}
          className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 scrollbar-hide"
        >
          {isPending
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-64 flex-shrink-0 snap-start sm:w-72">
                  <ListingCardSkeleton />
                </div>
              ))
            : data?.listings.map((listing) => (
                <div key={listing.id} className="w-64 flex-shrink-0 snap-start sm:w-72">
                  <ListingCard listing={listing} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
