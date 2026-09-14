"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { BookingPanel } from "@/components/bookings/BookingPanel";
import { GuestLayout } from "@/components/layouts";
import { AmenitiesSection } from "@/components/listings/AmenitiesSection";
import { ContactHostButton } from "@/components/listings/ContactHostButton";
import { CollapsibleText } from "@/components/listings/CollapsibleText";
import { DescriptionSection } from "@/components/listings/DescriptionSection";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { Gallery } from "@/components/listings/Gallery";
import { HostOtherListingsSection } from "@/components/listings/HostOtherListingsSection";
import { ListingDetailSkeleton } from "@/components/listings/ListingDetailSkeleton";
import { ReviewsSection } from "@/components/listings/ReviewsSection";
import { SimilarListingsSection } from "@/components/listings/SimilarListingsSection";
import { TrustSection } from "@/components/listings/TrustSection";
import { VerifiedBadge } from "@/components/listings/VerifiedBadge";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { useListing, useListingPhotos } from "@/lib/queries/listings";
import { pushRecentlyViewed } from "@/components/search/RecentlyViewed";
import { formatMoney, formatDate } from "@/lib/utils";

const ListingMap = dynamic(
  () => import("@/components/listings/ListingMap").then((m) => m.ListingMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-xl bg-neutral-100" />
    ),
  }
);

function HighlightItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-brand-900">
        {icon}
      </div>
      <p className="mt-2 text-sm font-semibold text-brand-900">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

export default function ListingDetailPage() {
  const t = useTranslations("listing");
  const params = useParams<{ locale: string; unitId: string }>();
  const searchParams = useSearchParams();
  const unitId = params?.unitId ?? "";
  const locale = params?.locale ?? "ar";
  const initialCheckIn = searchParams?.get("checkin") ?? undefined;
  const initialCheckOut = searchParams?.get("checkout") ?? undefined;
  const moneyLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const [copied, setCopied] = useState(false);

  const { data: listing, isPending, isError, refetch } = useListing(unitId);
  const { data: photos } = useListingPhotos(unitId);

  useEffect(() => {
    if (listing) {
      pushRecentlyViewed({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        currency: listing.currency,
        coverImage: listing.coverImage,
        city: listing.city ?? null,
      });
    }
  }, [listing]);

  const galleryImages =
    photos && photos.length > 0
      ? photos.sort((a, b) => a.display_order - b.display_order).map((p) => p.url)
      : listing?.coverImage
        ? [listing.coverImage]
        : [];

  return (
    <GuestLayout>
      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <ListingDetailSkeleton />
        ) : listing ? (
          <article className="mx-auto max-w-5xl pb-24 lg:pb-0">
            <div className="mb-6 sm:mb-8">
              <Gallery images={galleryImages} alt={listing.title} />
            </div>

            <header className="mb-6 sm:mb-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-sm font-medium text-neutral-500">
                    {t(`categoryLabel.${listing.category.toLowerCase()}`, {
                      default: listing.category.replace(/_/g, " ").toLowerCase(),
                    })}
                  </p>
                  <h1 className="break-words text-balance text-2xl font-bold text-brand-900 sm:text-3xl lg:text-4xl">
                    {listing.title}
                  </h1>
                  {listing.instantBook && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {t("instantBookBadge")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                    aria-label={t("share")}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                    <span className="hidden sm:inline">
                      {copied ? t("linkCopied") : t("share")}
                    </span>
                  </button>
                  <FavoriteButton
                    unitId={listing.id}
                    size="md"
                    className="flex-shrink-0 border border-neutral-200"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-neutral-600">
                <RatingBadge
                  averageRating={listing.averageRating}
                  reviewCount={listing.reviewCount}
                />
                <span className="text-neutral-300" aria-hidden="true">
                  &bull;
                </span>
                <span>
                  {listing.city}, {listing.governorate},{" "}
                  {listing.country || "Egypt"}
                </span>
                <span className="text-neutral-300" aria-hidden="true">
                  &bull;
                </span>
                <span>
                  {t(`propertyTypeLabel.${listing.propertyType.toLowerCase()}`, {
                    default: listing.propertyType,
                  })}
                </span>
                <span className="text-neutral-300" aria-hidden="true">
                  &bull;
                </span>
                <span className="inline-flex items-center gap-1">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {listing.maxGuests} {t("maxGuests")}
                </span>
                {listing.hostKycStatus === "verified" && (
                  <VerifiedBadge variant="host" />
                )}
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-3 lg:gap-10">
              <div className="space-y-6 lg:col-span-2">
                <section className="card p-5 sm:p-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <HighlightItem
                      icon={
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69 6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 012.25 18v-2.25c0-.596.237-1.176.659-1.6m0 0L9 9.75m0 0l3 3m-3-3l-1.5-1.5M21 18.75V12A2.25 2.25 0 0018.75 9.75h-1.5a1.5 1.5 0 00-1.06.44l-2.12 2.12" />
                        </svg>
                      }
                      value={listing.bedrooms}
                      label={t("bedrooms")}
                    />
                    <HighlightItem
                      icon={
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69 6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 012.25 18v-2.25c0-.596.237-1.176.659-1.6m0 0L9 9.75m0 0l3 3m-3-3l-1.5-1.5M21 18.75V12A2.25 2.25 0 0018.75 9.75h-1.5a1.5 1.5 0 00-1.06.44l-2.12 2.12" />
                        </svg>
                      }
                      value={listing.beds}
                      label={t("beds")}
                    />
                    <HighlightItem
                      icon={
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75v6m0-6h3.75M9 3.75H5.25M9 9.75v3m0 0H6.75m2.25 0h3.75" />
                        </svg>
                      }
                      value={listing.bathrooms}
                      label={t("bathrooms")}
                    />
                    <HighlightItem
                      icon={
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772" />
                        </svg>
                      }
                      value={listing.maxGuests}
                      label={t("maxGuests")}
                    />
                    <HighlightItem
                      icon={
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                      value={formatMoney(listing.price, listing.currency, moneyLocale)}
                      label={t("perNight")}
                    />
                  </div>
                </section>

                {listing.sleepingArrangements && listing.sleepingArrangements.length > 0 && (
                  <section className="card p-5 sm:p-6">
                    <h2 className="mb-3 text-lg font-semibold text-brand-900">
                      {t("sleepingArrangements")}
                    </h2>
                    <div className="space-y-3">
                      {listing.sleepingArrangements.map((room, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="mt-0.5 text-sm font-medium text-neutral-500">
                            {t("bedroomLabel", { number: idx + 1 })}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {room.beds.map((bed, bidx) => (
                              <span
                                key={bidx}
                                className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                              >
                                {bed.count} {t(`bedType.${bed.type.toLowerCase()}`, { count: bed.count })}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <DescriptionSection description={listing.description} />

                {listing.hostDisplayName && (
                  <section className="card p-5 sm:p-6">
                    <h2 className="mb-4 text-lg font-semibold text-brand-900">
                      {t("hostedby")}
                    </h2>
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/${locale}/hosts/${listing.hostId}`}
                        className="flex items-center gap-4 hover:opacity-80"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                          {listing.hostDisplayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-900">
                            {listing.hostDisplayName}
                          </p>
                          {listing.hostJoinedAt && (
                            <p className="text-sm text-neutral-500">
                              {t("hostJoined", {
                                date: formatDate(
                                  new Date(listing.hostJoinedAt),
                                  moneyLocale
                                ),
                              })}
                            </p>
                          )}
                        </div>
                      </Link>
                      {listing.hostKycStatus === "verified" && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success-50 px-3 py-1 text-sm font-medium text-success-700">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {t("hostVerified")}
                        </span>
                      )}
                    </div>
                    {listing.hostBio && (
                      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                        {listing.hostBio}
                      </p>
                    )}
                    <div className="mt-4">
                      <ContactHostButton unitId={unitId} locale={locale} />
                    </div>
                  </section>
                )}

                {listing.amenities.length > 0 && (
                  <AmenitiesSection amenities={listing.amenities} />
                )}

                {(listing.allowsPets || listing.selfCheckIn || listing.accessibilityFeatures.length > 0 || listing.culturalTags.length > 0) && (
                  <section className="card p-5 sm:p-6">
                    <h2 className="mb-3 text-lg font-semibold text-brand-900">
                      {t("discovery")}
                    </h2>
                    <div className="space-y-3 text-sm text-neutral-700">
                      {listing.culturalTags.length > 0 && (
                        <div>
                          <p className="mb-2 font-medium text-brand-900">
                            {t("culturalTags")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {listing.culturalTags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs"
                              >
                                {t(`culturalTag.${tag.toLowerCase()}`, {
                                  default: tag.replace(/_/g, " ").toLowerCase(),
                                })}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {listing.allowsPets && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🐾</span>
                          <span>{t("petsAllowed")}</span>
                        </div>
                      )}
                      {listing.selfCheckIn && (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🔑</span>
                            <span>{t("selfCheckIn")}</span>
                          </div>
                          {listing.selfCheckInMethods.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1.5 pl-7">
                              {listing.selfCheckInMethods.map((method) => (
                                <span
                                  key={method}
                                  className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs"
                                >
                                  {t(`selfCheckInMethods.${method.toLowerCase()}`, {
                                    default: method.replace(/_/g, " ").toLowerCase(),
                                  })}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {listing.accessibilityFeatures.length > 0 && (
                        <div>
                          <p className="mb-2 font-medium text-brand-900">
                            {t("accessibilityFeatures")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {listing.accessibilityFeatures.map((feature) => (
                              <span
                                key={feature}
                                className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs"
                              >
                                {t(`accessibilityFeatures.${feature.toLowerCase()}`, {
                                  default: feature.replace(/_/g, " ").toLowerCase(),
                                })}
                                {listing.accessibilityPhotoFeatures.includes(feature) && (
                                  <span className="inline-flex items-center gap-0.5 text-success-600">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                                    </svg>
                                    {t("photoProvided")}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {listing.hostLanguages.length > 0 && (
                  <section className="card p-5 sm:p-6">
                    <h2 className="mb-3 text-lg font-semibold text-brand-900">
                      {t("hostLanguages")}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {listing.hostLanguages.map((lang) => (
                        <span
                          key={lang}
                          className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700"
                        >
                          {t(`languages.${lang}`, { default: lang })}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <ReviewsSection unitId={unitId} locale={params?.locale ?? "ar"} />

                <section className="card p-5 sm:p-6">
                  <h2 className="mb-3 text-lg font-semibold text-brand-900">
                    {t("location")}
                  </h2>
                  <p className="mb-4 text-neutral-600">
                    {listing.district ? `${listing.district}, ` : ""}
                    {listing.city}, {listing.governorate}, {listing.country}
                  </p>
                  <ListingMap
                    lat={listing.lat}
                    lng={listing.lng}
                    label={listing.title}
                    className="h-64 w-full overflow-hidden rounded-xl"
                  />
                  <a
                    href={`https://www.google.com/maps?q=${listing.lat},${listing.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-600 hover:text-accent-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {t("getDirections")}
                  </a>
                </section>

                {listing.houseRules && (
                  <section className="card p-5 sm:p-6">
                    <h2 className="mb-3 text-lg font-semibold text-brand-900">
                      {t("houseRules")}
                    </h2>
                    <CollapsibleText text={listing.houseRules} />
                  </section>
                )}

                {listing.policies && (
                  <section className="card p-5 sm:p-6">
                    <h2 className="mb-3 text-lg font-semibold text-brand-900">
                      {t("policies")}
                    </h2>
                    <CollapsibleText text={listing.policies} />
                  </section>
                )}

                {listing.cancellationPolicy && (
                  <section className="card p-5 sm:p-6">
                    <h2 className="mb-3 text-lg font-semibold text-brand-900">
                      {t("cancellationPolicy")}
                    </h2>
                    <p className="text-neutral-700">
                      {t(`cancellation.${listing.cancellationPolicy.toLowerCase()}`, {
                        default: listing.cancellationPolicy,
                      })}
                    </p>
                  </section>
                )}

                {(listing.checkInTime || listing.checkOutTime) && (
                  <section className="card p-5 sm:p-6">
                    <h2 className="mb-3 text-lg font-semibold text-brand-900">
                      {t("checkInOutTimes")}
                    </h2>
                    <div className="flex flex-wrap gap-6 text-sm text-neutral-700">
                      {listing.checkInTime && (
                        <div>
                          <span className="font-medium text-brand-900">
                            {t("checkInLabel")}
                          </span>
                          <p className="mt-0.5">{listing.checkInTime}</p>
                        </div>
                      )}
                      {listing.checkOutTime && (
                        <div>
                          <span className="font-medium text-brand-900">
                            {t("checkOutLabel")}
                          </span>
                          <p className="mt-0.5">{listing.checkOutTime}</p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <TrustSection listing={listing} />
              </div>

              <aside className="hidden lg:col-span-1 lg:block">
                <div className="lg:sticky lg:top-24">
                  <BookingPanel
                    listing={listing}
                    initialCheckIn={initialCheckIn}
                    initialCheckOut={initialCheckOut}
                  />
                </div>
              </aside>
            </div>

            <SimilarListingsSection unitId={unitId} />

            {listing.hostId && (
              <HostOtherListingsSection
                hostId={listing.hostId}
                currentUnitId={unitId}
              />
            )}

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-surface-card px-4 py-3 shadow-lg lg:hidden">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-brand-900">
                    {formatMoney(listing.price, listing.currency, moneyLocale)}
                    <span className="text-sm font-normal text-neutral-500">
                      {" "}
                      / {t("perNight")}
                    </span>
                  </p>
                </div>
                <Link
                  href="#booking"
                  className="btn-primary flex-shrink-0 py-3"
                >
                  {t("book")}
                </Link>
              </div>
            </div>

            <div id="booking" className="px-0 pb-24 pt-6 lg:hidden">
              <BookingPanel
                listing={listing}
                initialCheckIn={initialCheckIn}
                initialCheckOut={initialCheckOut}
              />
            </div>
          </article>
        ) : null}
      </section>
    </GuestLayout>
  );
}
