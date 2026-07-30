"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { GuestLayout } from "@/components/layouts";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/listings/ListingCardSkeleton";
import { useListings } from "@/lib/queries/listings";

export default function SearchPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => ({
      q: searchParams.get("q") || undefined,
      checkin: searchParams.get("checkin") || undefined,
      checkout: searchParams.get("checkout") || undefined,
      guests: searchParams.get("guests") || undefined,
      property_type: searchParams.get("property_type") || undefined,
      min_price: searchParams.get("min_price") || undefined,
      max_price: searchParams.get("max_price") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    }),
    [searchParams]
  );

  const { data, isPending, isError, refetch } = useListings(filters);

  return (
    <GuestLayout>
      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">
          {t("search.title")}
        </h1>

        {isError ? (
          <div className="mt-8 rounded-xl bg-danger-50 p-6 text-center">
            <p className="text-danger-700">{t("common.error")}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              {t("common.retry")}
            </button>
          </div>
        ) : isPending ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          </div>
        ) : data?.listings.length === 0 ? (
          <div className="mt-8 rounded-xl bg-neutral-100 p-8 text-center">
            <p className="text-lg text-neutral-700">{t("search.noResults")}</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </GuestLayout>
  );
}
