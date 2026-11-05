"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { cn, formatMoney } from "@/lib/utils";

export interface Listing {
  id: string;
  title: string;
  city: string;
  governorate: string;
  country: string;
  propertyType: string;
  category?: string;
  price: number;
  currency: string;
  maxGuests: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  coverImage: string | null;
  hostKycStatus?: string | null;
  amenities?: string[];
  averageRating?: number | null;
  reviewCount?: number;
  availableForDates?: boolean | null;
  instantBook?: boolean;
  lat?: number;
  lng?: number;
  nights?: number | null;
  totalEgp?: number | null;
  effectiveNightlyEgp?: number | null;
  discounted?: boolean;
}

interface ListingCardProps {
  listing: Listing;
  className?: string;
  checkin?: string;
  checkout?: string;
}

const PLACEHOLDER_IMAGE = "/placeholder.svg";

export function ListingCard({ listing, className, checkin, checkout }: ListingCardProps) {
  const t = useTranslations("listing");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl =
    listing.coverImage && !imgFailed ? listing.coverImage : PLACEHOLDER_IMAGE;
  const detailQuery =
    checkin && checkout
      ? `?checkin=${encodeURIComponent(checkin)}&checkout=${encodeURIComponent(checkout)}`
      : "";
  const detailHref = `/${locale}/listings/${listing.id}${detailQuery}`;
  const isVerified = listing.hostKycStatus === "verified";

  const metaParts = [
    `${listing.maxGuests} ${t("guests")}`,
    listing.bedrooms != null ? `${listing.bedrooms} ${t("bedrooms")}` : null,
    listing.beds != null && listing.beds > 0 ? `${listing.beds} ${t("beds")}` : null,
    listing.bathrooms != null ? `${listing.bathrooms} ${t("bathrooms")}` : null,
  ].filter(Boolean);

  return (
    <article
      className={cn(
        "group focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2",
        className
      )}
    >
      <Link
        href={detailHref}
        className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        aria-label={`${listing.title}, ${listing.city}`}
      >
        {/* Photo-first card: square image, 12px radius, no border, no
            shadow — separation comes from whitespace (reference pattern). */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-hairline">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setImgFailed(true)}
          />
          <FavoriteButton unitId={listing.id} className="absolute end-2.5 top-2.5" />
          {listing.instantBook && (
            <span className="absolute bottom-2.5 end-2.5 inline-flex items-center gap-1 rounded-full bg-brand-900/85 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t("instantBook")}
            </span>
          )}
          {listing.availableForDates && (
            <span className="absolute start-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-900 shadow-sm">
              <svg className="h-3.5 w-3.5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("availableForDates")}
            </span>
          )}
          {isVerified && (
            <span className={`absolute start-2.5 ${listing.availableForDates ? "top-11" : "top-2.5"} inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-900 shadow-sm`}>
              <svg className="h-3.5 w-3.5 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t("verified")}
            </span>
          )}
        </div>

        {/* Tight metadata under the image — 14/500 title, 14/400 muted
            meta lines, price in semibold. No padding chrome. */}
        <div className="pt-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-medium leading-snug text-neutral-900 line-clamp-1">
              {listing.title}
            </h2>
            <RatingBadge
              averageRating={listing.averageRating}
              reviewCount={listing.reviewCount}
              className="flex-shrink-0"
            />
          </div>

          <p className="mt-0.5 line-clamp-1 text-sm text-neutral-500">
            {listing.city}, {listing.governorate}
          </p>

          <p className="mt-0.5 line-clamp-1 text-sm text-neutral-500">
            {metaParts.join(" · ")}
          </p>

          <p className="mt-1.5 text-sm text-neutral-900">
            {listing.discounted && listing.effectiveNightlyEgp != null ? (
              <>
                <span className="me-1.5 text-neutral-400 line-through">
                  {formatMoney(listing.price, listing.currency || "EGP", locale === "ar" ? "ar-EG" : "en-EG")}
                </span>
                <span className="font-semibold">
                  {formatMoney(listing.effectiveNightlyEgp, listing.currency || "EGP", locale === "ar" ? "ar-EG" : "en-EG")}
                </span>
                <span className="ms-1.5 inline-flex items-center rounded-full bg-accent-100 px-2 py-0.5 align-middle text-xs font-semibold text-accent-700">
                  {t("offer")}
                </span>
              </>
            ) : (
              <span className="font-semibold">
                {formatMoney(listing.price, listing.currency || "EGP", locale === "ar" ? "ar-EG" : "en-EG")}
              </span>
            )}{" "}
            <span className="text-neutral-500">
              {t("perNight")}
            </span>
          </p>
          {listing.nights != null && listing.totalEgp != null && (
            <p className="mt-0.5 text-sm text-neutral-500">
              <span className="font-medium text-neutral-700">
                {formatMoney(listing.totalEgp, listing.currency || "EGP", locale === "ar" ? "ar-EG" : "en-EG")}
              </span>{" "}
              {t("total")} · {listing.nights} {t("nights")} · {t("includesAllFees")}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
