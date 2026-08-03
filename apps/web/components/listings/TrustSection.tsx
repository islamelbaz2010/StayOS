"use client";

import { useTranslations } from "next-intl";

import type { ListingDetail } from "@/lib/queries/listings";
import { formatDate } from "@/lib/utils";

import { VerifiedBadge } from "./VerifiedBadge";

interface TrustSectionProps {
  listing: ListingDetail;
}

export function TrustSection({ listing }: TrustSectionProps) {
  const t = useTranslations("trust");

  const isHostVerified = listing.hostKycStatus === "verified";
  const joinedDate = listing.hostJoinedAt
    ? formatDate(new Date(listing.hostJoinedAt))
    : null;

  return (
    <section
      className="rounded-xl bg-white p-6 shadow-card"
      aria-label={t("title")}
    >
      <h2 className="text-lg font-semibold text-neutral-900">{t("title")}</h2>

      <div className="mt-4 space-y-4">
        {isHostVerified && (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-success-50">
              <svg className="h-5 w-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {t("verifiedHostTitle")}
              </p>
              <p className="mt-0.5 text-sm text-neutral-600">
                {t("verifiedHostDesc")}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-50">
            <svg className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {t("escrowTitle")}
            </p>
            <p className="mt-0.5 text-sm text-neutral-600">
              {t("escrowDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100">
            <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c0 .621.504 1.125 1.125 1.125h2.25m0 0v4.5m0-4.5h2.25m-2.25 4.5v3.375c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.75M8.25 9.75h6.75" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {t("cancellationTitle")}
            </p>
            <p className="mt-0.5 text-sm text-neutral-600">
              {t("cancellationDesc")}
            </p>
          </div>
        </div>

        {listing.hostDisplayName && (
          <div className="border-t border-neutral-100 pt-4">
            <p className="text-sm font-medium text-neutral-900">
              {t("hostedBy", { name: listing.hostDisplayName })}
            </p>
            {joinedDate && (
              <p className="mt-0.5 text-sm text-neutral-500">
                {t("joinedIn", { date: joinedDate })}
              </p>
            )}
            {isHostVerified && (
              <div className="mt-2">
                <VerifiedBadge variant="host" />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
