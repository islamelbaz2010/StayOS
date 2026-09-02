"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { RatingBadge } from "@/components/ui/RatingBadge";
import { cn, formatMoney } from "@/lib/utils";

export interface Listing {
  id: string;
  title: string;
  city: string;
  governorate: string;
  country: string;
  propertyType: string;
  price: number;
  currency: string;
  maxGuests: number;
  bedrooms?: number;
  bathrooms?: number;
  coverImage: string | null;
  hostKycStatus?: string | null;
  amenities?: string[];
  averageRating?: number | null;
  reviewCount?: number;
}

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

const PLACEHOLDER_IMAGE = "/placeholder.svg";

export function ListingCard({ listing, className }: ListingCardProps) {
  const t = useTranslations("listing");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  const imageUrl = listing.coverImage ?? PLACEHOLDER_IMAGE;
  const isVerified = listing.hostKycStatus === "verified";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-card bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2",
        className
      )}
    >
      <Link
        href={`/${locale}/listings/${listing.id}`}
        className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        aria-label={`${listing.title}, ${listing.city}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {isVerified && (
            <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-success-700 shadow-sm backdrop-blur-sm">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t("verified")}
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold text-neutral-900 line-clamp-1">
              {listing.title}
            </h2>
            <RatingBadge
              averageRating={listing.averageRating}
              reviewCount={listing.reviewCount}
              className="flex-shrink-0"
            />
          </div>

          <p className="mt-1 text-sm text-neutral-600 line-clamp-1">
            {listing.city}, {listing.governorate}, {listing.country || "Egypt"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              {listing.maxGuests} {t("guests")}
            </span>
            {listing.bedrooms != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69 6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 012.25 18v-2.25c0-.596.237-1.176.659-1.6m0 0L9 9.75m0 0l3 3m-3-3l-1.5-1.5M21 18.75V12A2.25 2.25 0 0018.75 9.75h-1.5a1.5 1.5 0 00-1.06.44l-2.12 2.12m4.74 4.74l-2.12-2.12a1.5 1.5 0 00-1.06-.44h-1.5A2.25 2.25 0 0011.25 18v2.25c0 .596-.237 1.176-.659 1.6m0 0L9 21" />
                </svg>
                {listing.bedrooms} {t("bedrooms")}
              </span>
            )}
            {listing.bathrooms != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75v6m0-6h.008v6H9V3.75zM9 3.75h3.75M9 3.75H5.25M9 9.75v3m0 0H6.75m2.25 0h3.75M21 12a8.4 8.4 0 01-.836 3.677 8.4 8.4 0 01-2.547 2.93A8.4 8.4 0 0115 19.748a8.4 8.4 0 01-3.677.836 8.4 8.4 0 01-3.677-.836 8.4 8.4 0 01-2.93-2.547A8.4 8.4 0 012.25 12c0-1.617.487-3.196 1.4-4.55A8.4 8.4 0 016.4 4.4 8.4 8.4 0 019 3.75" />
                </svg>
                {listing.bathrooms} {t("bathrooms")}
              </span>
            )}
          </div>

          <p className="mt-3 text-lg font-bold text-brand-600">
            {formatMoney(listing.price, listing.currency || "EGP")}{" "}
            <span className="text-sm font-normal text-neutral-600">
              {t("perNight")}
            </span>
          </p>
        </div>
      </Link>
    </article>
  );
}
