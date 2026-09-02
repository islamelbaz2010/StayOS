"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { BookingPanel } from "@/components/bookings/BookingPanel";
import { GuestLayout } from "@/components/layouts";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { Gallery } from "@/components/listings/Gallery";
import { ListingDetailSkeleton } from "@/components/listings/ListingDetailSkeleton";
import { ReviewsSection } from "@/components/listings/ReviewsSection";
import { TrustSection } from "@/components/listings/TrustSection";
import { VerifiedBadge } from "@/components/listings/VerifiedBadge";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { useListing, useListingPhotos } from "@/lib/queries/listings";
import { formatMoney } from "@/lib/utils";

const ListingMap = dynamic(
  () => import("@/components/listings/ListingMap").then((m) => m.ListingMap),
  { ssr: false, loading: () => (
    <div className="h-64 w-full animate-pulse rounded-xl bg-neutral-100" />
  ) }
);

const AMENITY_GROUPS: Record<string, string[]> = {
  ESSENTIALS: ["wifi", "ac", "air_conditioning", "heating", "towels", "bed_linens", "toiletries"],
  KITCHEN: ["kitchen", "fridge", "microwave", "stove", "oven", "coffee_machine"],
  ENTERTAINMENT: ["tv", "pool", "gym", "workspace"],
  OUTDOOR: ["balcony", "garden", "parking", "bbq"],
  SAFETY: ["fire_extinguisher", "smoke_detector", "first_aid_kit", "safe"],
};

const AMENITY_ICONS: Record<string, string> = {
  wifi: "📶",
  ac: "❄️",
  air_conditioning: "❄️",
  heating: "🔥",
  towels: "🧺",
  bed_linens: "🛏️",
  toiletries: "🧴",
  kitchen: "🍳",
  fridge: "🧊",
  microwave: "⚡",
  stove: "🔥",
  oven: "🍞",
  coffee_machine: "☕",
  tv: "📺",
  pool: "🏊",
  gym: "💪",
  workspace: "💻",
  balcony: "🌅",
  garden: "🌿",
  parking: "🚗",
  bbq: "🍖",
  fire_extinguisher: "🧯",
  smoke_detector: "🚨",
  first_aid_kit: "⚕️",
  safe: "🔒",
};

function getAmenityGroup(amenity: string): string {
  for (const [group, amenities] of Object.entries(AMENITY_GROUPS)) {
    if (amenities.includes(amenity)) return group;
  }
  return "OTHER";
}

export default function ListingDetailPage() {
  const t = useTranslations("listing");
  const params = useParams<{ locale: string; unitId: string }>();
  const unitId = params?.unitId ?? "";

  const { data: listing, isPending, isError, refetch } = useListing(unitId);
  const { data: photos } = useListingPhotos(unitId);

  const galleryImages = photos && photos.length > 0
    ? photos.sort((a, b) => a.display_order - b.display_order).map((p) => p.url)
    : listing?.coverImage
      ? [listing.coverImage]
      : [];

  return (
    <GuestLayout>
      <section className="container mx-auto px-0 py-0 sm:px-6 sm:py-8 lg:px-8">
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <ListingDetailSkeleton />
        ) : (
          <article className="mx-auto max-w-5xl">
            {/* Gallery — first on mobile for visual impact */}
            <div className="sm:mb-6 sm:px-0">
              <Gallery
                images={galleryImages}
                alt={listing.title}
              />
            </div>

            {/* Title & badges */}
            <header className="mb-4 px-4 pt-4 sm:mb-6 sm:px-0">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl lg:text-3xl">
                  {listing.title}
                </h1>
                <FavoriteButton unitId={listing.id} size="md" className="flex-shrink-0 border border-neutral-200" />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-600 sm:gap-3 sm:text-sm">
                <RatingBadge averageRating={listing.averageRating} reviewCount={listing.reviewCount} />
                <span className="text-neutral-300">•</span>
                <span>
                  {listing.city}, {listing.governorate}, {listing.country || "Egypt"}
                </span>
                <span className="text-neutral-300">•</span>
                <span>{t(`propertyTypeLabel.${listing.propertyType.toLowerCase()}`, { default: listing.propertyType })}</span>
                <span className="text-neutral-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.maxGuests} {t("maxGuests")}
                </span>
                {listing.hostKycStatus === "verified" && (
                  <VerifiedBadge variant="host" />
                )}
              </div>
            </header>

            {/* Main content + sticky booking */}
            <div className="grid gap-4 px-4 pb-24 sm:gap-6 sm:px-0 sm:pb-0 lg:grid-cols-3 lg:gap-8 lg:pb-0">
              <div className="space-y-4 sm:space-y-6 lg:col-span-2">
                {/* Property highlights */}
                <section className="rounded-xl bg-white p-4 shadow-card sm:p-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                        <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69 6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 012.25 18v-2.25c0-.596.237-1.176.659-1.6m0 0L9 9.75m0 0l3 3m-3-3l-1.5-1.5M21 18.75V12A2.25 2.25 0 0018.75 9.75h-1.5a1.5 1.5 0 00-1.06.44l-2.12 2.12" />
                        </svg>
                      </div>
                      <p className="mt-2 text-sm font-medium text-neutral-900">{listing.bedrooms}</p>
                      <p className="text-xs text-neutral-500">{t("bedrooms")}</p>
                    </div>
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                        <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75v6m0-6h3.75M9 3.75H5.25M9 9.75v3m0 0H6.75m2.25 0h3.75" />
                        </svg>
                      </div>
                      <p className="mt-2 text-sm font-medium text-neutral-900">{listing.bathrooms}</p>
                      <p className="text-xs text-neutral-500">{t("bathrooms")}</p>
                    </div>
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                        <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772" />
                        </svg>
                      </div>
                      <p className="mt-2 text-sm font-medium text-neutral-900">{listing.maxGuests}</p>
                      <p className="text-xs text-neutral-500">{t("maxGuests")}</p>
                    </div>
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                        <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="mt-2 text-sm font-medium text-neutral-900">
                        {formatMoney(listing.price, listing.currency)}
                      </p>
                      <p className="text-xs text-neutral-500">{t("perNight")}</p>
                    </div>
                  </div>
                </section>

                {/* Description */}
                <section className="rounded-xl bg-white p-4 shadow-card sm:p-6">
                  <h2 className="mb-2 text-base font-semibold text-neutral-900 sm:mb-3 sm:text-lg">
                    {t("description")}
                  </h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                    {listing.description}
                  </p>
                </section>

                {/* Amenities */}
                {listing.amenities.length > 0 && (
                  <section className="rounded-xl bg-white p-4 shadow-card sm:p-6">
                    <h2 className="mb-3 text-base font-semibold text-neutral-900 sm:mb-4 sm:text-lg">
                      {t("amenities")}
                    </h2>
                    {(() => {
                      const grouped = listing.amenities.reduce<Record<string, string[]>>(
                        (acc, amenity) => {
                          const group = getAmenityGroup(amenity);
                          if (!acc[group]) acc[group] = [];
                          acc[group].push(amenity);
                          return acc;
                        },
                        {}
                      );
                      return (
                        <div className="space-y-6">
                          {Object.entries(grouped).map(([group, amenities]) => (
                            <div key={group}>
                              <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
                                {t(`amenityGroup.${group}`)}
                              </h3>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {amenities.map((amenity) => (
                                  <div
                                    key={amenity}
                                    className="flex items-center gap-2 text-sm text-neutral-700"
                                  >
                                    <span className="text-lg">
                                      {AMENITY_ICONS[amenity] ?? "✓"}
                                    </span>
                                    <span>{t(`amenityLabel.${amenity}`, { default: amenity.replace(/_/g, " ") })}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </section>
                )}

                {/* Reviews */}
                <ReviewsSection unitId={unitId} locale={params?.locale ?? "ar"} />

                {/* Location */}
                <section className="rounded-xl bg-white p-4 shadow-card sm:p-6">
                  <h2 className="mb-2 text-base font-semibold text-neutral-900 sm:mb-3 sm:text-lg">
                    {t("location")}
                  </h2>
                  <p className="mb-3 text-sm text-neutral-600 sm:mb-4">
                    {listing.district ? `${listing.district}, ` : ""}
                    {listing.city}, {listing.governorate}, {listing.country}
                  </p>
                  <ListingMap
                    lat={listing.lat}
                    lng={listing.lng}
                    label={listing.title}
                    className="h-64 w-full overflow-hidden rounded-xl"
                  />
                </section>

                {/* House rules */}
                {listing.houseRules && (
                  <section className="rounded-xl bg-white p-4 shadow-card sm:p-6">
                    <h2 className="mb-2 text-base font-semibold text-neutral-900 sm:mb-3 sm:text-lg">
                      {t("houseRules")}
                    </h2>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                      {listing.houseRules}
                    </p>
                  </section>
                )}

                {/* Cancellation policy */}
                {listing.cancellationPolicy && (
                  <section className="rounded-xl bg-white p-4 shadow-card sm:p-6">
                    <h2 className="mb-2 text-base font-semibold text-neutral-900 sm:mb-3 sm:text-lg">
                      {t("cancellationPolicy")}
                    </h2>
                    <p className="text-sm text-neutral-700">
                      {t(`cancellation.${listing.cancellationPolicy.toLowerCase()}`, {
                        default: listing.cancellationPolicy,
                      })}
                    </p>
                  </section>
                )}

                {/* Trust section */}
                <TrustSection listing={listing} />
              </div>

              {/* Sticky booking card — desktop sidebar */}
              <aside className="hidden lg:col-span-1 lg:block">
                <div className="lg:sticky lg:top-24">
                  <BookingPanel listing={listing} />
                </div>
              </aside>
            </div>

            {/* Sticky mobile booking bar */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white px-4 py-3 shadow-lg lg:hidden">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-neutral-900">
                    {formatMoney(listing.price, listing.currency)}
                    <span className="text-sm font-normal text-neutral-500"> / {t("perNight")}</span>
                  </p>
                </div>
                <Link
                  href={`#booking`}
                  className="inline-flex flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  {t("book")}
                </Link>
              </div>
            </div>

            {/* Mobile booking panel — inline, anchored */}
            <div id="booking" className="px-4 pb-8 pt-4 lg:hidden">
              <BookingPanel listing={listing} />
            </div>
          </article>
        )}
      </section>
    </GuestLayout>
  );
}
