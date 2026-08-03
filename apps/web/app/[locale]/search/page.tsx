"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { GuestLayout } from "@/components/layouts";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/listings/ListingCardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">
            {t("search.title")}
          </h1>
          {data && data.listings.length > 0 && (
            <span className="text-sm text-neutral-500">
              {t("search.resultsCount", { count: data.total })}
            </span>
          )}
        </div>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          </div>
        ) : data?.listings.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-neutral-700">
              {t("search.noResults")}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {t("search.noResultsHint")}
            </p>
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
