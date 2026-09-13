"use client";

import { useTranslations } from "next-intl";

import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/listings/ListingCardSkeleton";
import { useHostProfile } from "@/lib/queries/listings";

interface HostOtherListingsSectionProps {
  hostId: string;
  currentUnitId: string;
}

export function HostOtherListingsSection({
  hostId,
  currentUnitId,
}: HostOtherListingsSectionProps) {
  const t = useTranslations("listing");
  const { data: profile, isPending, isError } = useHostProfile(hostId);

  if (isError) return null;
  if (isPending) {
    return (
      <section className="mt-8 rounded-xl bg-white p-4 shadow-card sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 sm:text-xl">
          {t("otherListingsByHost")}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  const otherListings = (profile?.listings ?? []).filter(
    (listing) => listing.id !== currentUnitId
  );
  if (otherListings.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl bg-white p-4 shadow-card sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900 sm:text-xl">
        {t("otherListingsByHost")}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {otherListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
