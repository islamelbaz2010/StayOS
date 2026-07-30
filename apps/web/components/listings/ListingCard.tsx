"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

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
  coverImage: string | null;
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
        </div>

        <div className="p-4">
          <h2 className="text-lg font-semibold text-neutral-900 line-clamp-1">
            {listing.title}
          </h2>

          <p className="mt-1 text-sm text-neutral-600 line-clamp-1">
            {listing.city}, {listing.governorate}, {listing.country || "Egypt"}
          </p>

          <p className="mt-2 text-sm text-neutral-700">
            <span className="font-medium text-neutral-900">
              {t("propertyType")}:
            </span>{" "}
            {listing.propertyType}
          </p>

          <p className="mt-3 text-lg font-bold text-brand-600">
            {formatMoney(listing.price, listing.currency || "EGP")}{" "}
            <span className="text-sm font-normal text-neutral-600">
              {t("perNight")}
            </span>
          </p>

          <p className="mt-2 text-sm text-neutral-700">
            <span className="font-medium text-neutral-900">{t("maxGuests")}:</span>{" "}
            {listing.maxGuests}
          </p>
        </div>
      </Link>
    </article>
  );
}
