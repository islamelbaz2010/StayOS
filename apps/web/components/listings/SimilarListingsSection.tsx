"use client";

import { useTranslations } from "next-intl";

import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/listings/ListingCardSkeleton";
import { useSimilarListings } from "@/lib/queries/listings";

interface SimilarListingsSectionProps {
  unitId: string;
}

export function SimilarListingsSection({ unitId }: SimilarListingsSectionProps) {
  const t = useTranslations("listing");
  const { data: listings, isPending, isError } = useSimilarListings(unitId);

  if (isError) return null;
  if (isPending) {
    return (
      <section className="mt-8 rounded-xl bg-white p-4 shadow-card sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 sm:text-xl">
          {t("similarListings")}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }
  if (!listings || listings.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl bg-white p-4 shadow-card sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900 sm:text-xl">
        {t("similarListings")}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
