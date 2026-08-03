"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { useHostListings } from "@/lib/queries/hostListings";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-700",
  PENDING_VERIFICATION: "bg-warning-100 text-warning-700",
  LISTED: "bg-success-100 text-success-700",
  REJECTED: "bg-danger-100 text-danger-700",
  UNLISTED: "bg-neutral-100 text-neutral-700",
  ARCHIVED: "bg-neutral-100 text-neutral-500",
  SUSPENDED: "bg-danger-100 text-danger-700",
};

export default function HostListingsPage() {
  const t = useTranslations("hostListings");
  const tc = useTranslations("common");
  const { data: listings, isLoading, error } = useHostListings();

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">
              {t("title")}
            </h1>
            <Link
              href="/host/listings/new"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              {t("createNew")}
            </Link>
          </div>

          {isLoading && (
            <div className="rounded-xl bg-white p-8 text-center text-neutral-500 shadow-card">
              {tc("loading")}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-white p-8 text-center text-danger-600 shadow-card">
              {t("loadError")}
            </div>
          )}

          {listings && listings.length === 0 && (
            <div className="rounded-xl bg-white p-12 text-center shadow-card">
              <p className="text-neutral-500">{t("noListings")}</p>
              <Link
                href="/host/listings/new"
                className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                {t("createNew")}
              </Link>
            </div>
          )}

          {listings && listings.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/host/listings/${listing.id}/edit`}
                  className="group overflow-hidden rounded-xl bg-white shadow-card transition-shadow hover:shadow-lg"
                >
                  <div className="relative aspect-video bg-neutral-200">
                    {listing.cover_image ? (
                      <img
                        src={listing.cover_image}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-400">
                        <svg
                          className="h-12 w-12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"
                          />
                        </svg>
                      </div>
                    )}
                    <span
                      className={`absolute start-2 top-2 rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[listing.status] ?? "bg-neutral-100 text-neutral-700"}`}
                    >
                      {t(`status.${listing.status.toLowerCase()}`)}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-semibold text-neutral-900 group-hover:text-brand-600">
                      {listing.title}
                    </h3>
                    <p className="mt-1 truncate text-sm text-neutral-500">
                      {listing.city}, {listing.governorate}
                    </p>
                    <p className="mt-2 text-sm font-medium text-neutral-700">
                      {listing.base_price_egp.toLocaleString()} {t("egp")}
                      <span className="text-neutral-400"> / {t("night")}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </HostLayout>
    </ProtectedRoute>
  );
}
