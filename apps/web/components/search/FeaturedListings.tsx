"use client";

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

  const { data, isPending } = useListings({ limit: "6" });

  if (!isPending && (!data || data.listings.length === 0)) {
    return null;
  }

  return (
    <section className="bg-neutral-50 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">
            {t("featuredTitle")}
          </h2>
          <Link
            href={`/${locale}/search`}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {t("viewAll")}
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isPending
            ? Array.from({ length: 6 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))
            : data?.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
        </div>
      </div>
    </section>
  );
}
