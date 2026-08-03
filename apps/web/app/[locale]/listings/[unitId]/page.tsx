"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { BookingPanel } from "@/components/bookings/BookingPanel";
import { GuestLayout } from "@/components/layouts";
import { Gallery } from "@/components/listings/Gallery";
import { ListingDetailSkeleton } from "@/components/listings/ListingDetailSkeleton";
import { ListingMap } from "@/components/listings/ListingMap";
import { TrustSection } from "@/components/listings/TrustSection";
import { VerifiedBadge } from "@/components/listings/VerifiedBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { useListing } from "@/lib/queries/listings";
import { formatMoney } from "@/lib/utils";

const AMENITY_GROUPS: Record<string, string[]> = {
  ESSENTIALS: ["WIFI", "AC", "HEATING", "TOWELS", "BED_LINENS", "TOILETRIES"],
  KITCHEN: ["KITCHEN", "FRIDGE", "MICROWAVE", "STOVE", "OVEN", "COFFEE_MACHINE"],
  ENTERTAINMENT: ["TV", "POOL", "GYM", "WORKSPACE"],
  OUTDOOR: ["BALCONY", "GARDEN", "PARKING", "BBQ"],
  SAFETY: ["FIRE_EXTINGUISHER", "SMOKE_DETECTOR", "FIRST_AID_KIT", "SAFE"],
};

const AMENITY_ICONS: Record<string, string> = {
  WIFI: "📶",
  AC: "❄️",
  HEATING: "🔥",
  TOWELS: "🧺",
  BED_LINENS: "🛏️",
  TOILETRIES: "🧴",
  KITCHEN: "🍳",
  FRIDGE: "🧊",
  MICROWAVE: "⚡",
  STOVE: "🔥",
  OVEN: "🍞",
  COFFEE_MACHINE: "☕",
  TV: "📺",
  POOL: "🏊",
  GYM: "💪",
  WORKSPACE: "💻",
  BALCONY: "🌅",
  GARDEN: "🌿",
  PARKING: "🚗",
  BBQ: "🍖",
  FIRE_EXTINGUISHER: "🧯",
  SMOKE_DETECTOR: "🚨",
  FIRST_AID_KIT: "⚕️",
  SAFE: "🔒",
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

  return (
    <GuestLayout>
      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <ListingDetailSkeleton />
        ) : (
          <article className="mx-auto max-w-5xl">
            {/* Title & badges */}
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
                {listing.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                <span>
                  {listing.city}, {listing.governorate}, {listing.country || "Egypt"}
                </span>
                <span className="text-neutral-300">•</span>
                <span>{listing.propertyType}</span>
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

            {/* Gallery */}
            <Gallery
              images={listing.coverImage ? [listing.coverImage] : []}
              alt={listing.title}
            />

            {/* Main content + sticky booking */}
            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <div className="space-y-8 lg:col-span-2">
                {/* Property highlights */}
                <section className="rounded-xl bg-white p-6 shadow-card">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
                <section className="rounded-xl bg-white p-6 shadow-card">
                  <h2 className="mb-3 text-lg font-semibold text-neutral-900">
                    {t("description")}
                  </h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                    {listing.description}
                  </p>
                </section>

                {/* Amenities */}
                {listing.amenities.length > 0 && (
                  <section className="rounded-xl bg-white p-6 shadow-card">
                    <h2 className="mb-4 text-lg font-semibold text-neutral-900">
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
                                    <span>{amenity}</span>
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

                {/* Location */}
                <section className="rounded-xl bg-white p-6 shadow-card">
                  <h2 className="mb-3 text-lg font-semibold text-neutral-900">
                    {t("location")}
                  </h2>
                  <p className="mb-4 text-sm text-neutral-600">
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
                  <section className="rounded-xl bg-white p-6 shadow-card">
                    <h2 className="mb-3 text-lg font-semibold text-neutral-900">
                      {t("houseRules")}
                    </h2>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                      {listing.houseRules}
                    </p>
                  </section>
                )}

                {/* Cancellation policy */}
                {listing.cancellationPolicy && (
                  <section className="rounded-xl bg-white p-6 shadow-card">
                    <h2 className="mb-3 text-lg font-semibold text-neutral-900">
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

              {/* Sticky booking card */}
              <aside className="lg:col-span-1">
                <div className="lg:sticky lg:top-24">
                  <BookingPanel listing={listing} />
                </div>
              </aside>
            </div>
          </article>
        )}
      </section>
    </GuestLayout>
  );
}
