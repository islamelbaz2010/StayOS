"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { GuestLayout } from "@/components/layouts";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/listings/ListingCardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { VerifiedBadge } from "@/components/listings/VerifiedBadge";
import { useHostProfile } from "@/lib/queries/listings";
import { formatDate } from "@/lib/utils";

function HostProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl bg-white p-8 shadow-card">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 animate-pulse rounded-full bg-neutral-200" />
            <div className="space-y-2">
              <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HostProfilePage() {
  const t = useTranslations("publicHost");
  const tc = useTranslations("common");
  const tl = useTranslations("listing");
  const params = useParams<{ locale: string; hostId: string }>();
  const hostId = params?.hostId ?? "";

  const { data: host, isPending, isError, refetch } = useHostProfile(hostId);

  return (
    <GuestLayout>
      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isPending || !host ? (
            <HostProfileSkeleton />
          ) : (
            <>
              <div className="rounded-xl bg-white p-6 shadow-card sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-brand-100 sm:h-20 sm:w-20">
                    {host.avatarUrl ? (
                      <Image
                        src={host.avatarUrl}
                        alt={host.displayName || t("title")}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand-700">
                        {(host.displayName || "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
                      {host.displayName || t("title")}
                    </h1>
                    {host.kycStatus === "verified" && (
                      <div className="mt-1">
                        <VerifiedBadge variant="host" />
                      </div>
                    )}
                    {host.joinedAt && (
                      <p className="mt-1 text-sm text-neutral-500">
                        {t("joinedIn", {
                          date: formatDate(
                            new Date(host.joinedAt),
                            params?.locale === "ar" ? "ar-EG" : "en-EG"
                          ),
                        })}
                      </p>
                    )}
                  </div>
                </div>
                {host.bio && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                    {host.bio}
                  </p>
                )}
                {host.languages.length > 0 && (
                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    <p className="mb-2 text-sm font-semibold text-neutral-900">
                      {tl("hostLanguages")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {host.languages.map((lang) => (
                        <span
                          key={lang}
                          className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700"
                        >
                          {tl(`languages.${lang}`, { default: lang })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(host.responseRate != null || host.responseTimeHours != null) && (
                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    <div className="flex flex-wrap gap-6">
                      {host.responseRate != null && (
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {t("responseRate")}
                          </p>
                          <p className="mt-0.5 text-sm text-neutral-600">
                            {host.responseRate}%
                          </p>
                        </div>
                      )}
                      {host.responseTimeHours != null && (
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {t("responseTime")}
                          </p>
                          <p className="mt-0.5 text-sm text-neutral-600">
                            {host.responseTimeHours <= 1
                              ? t("responseWithinHour")
                              : t("responseWithinHours", {
                                  hours: Math.round(host.responseTimeHours),
                                })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h2 className="mb-4 text-lg font-semibold text-neutral-900 sm:text-xl">
                  {t("listings", { name: host.displayName || t("title") })}
                </h2>
                {host.listings.length === 0 ? (
                  <div className="rounded-xl bg-white p-12 text-center shadow-card">
                    <p className="text-neutral-500">{t("noListings")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {host.listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </GuestLayout>
  );
}
