"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useArchiveListing,
  useHostListings,
  usePublishListing,
  useSubmitForReview,
  useUnpublishListing,
} from "@/lib/queries/hostListings";
import type { HostListing } from "@/lib/queries/hostListings";

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
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const { data: listings, isLoading, error, refetch } = useHostListings();

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("title")}
            </h1>
            <Link
              href={`/${locale}/host/listings/new`}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              {t("createNew")}
            </Link>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <Skeleton className="aspect-video w-full rounded-none" />
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <ErrorState onRetry={() => refetch()} />}

          {listings && listings.length === 0 && (
            <div className="card p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <svg
                  className="h-8 w-8 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-neutral-700">
                {t("noListings")}
              </p>
              <p className="mt-1 text-sm text-neutral-500">{t("noListingsHint")}</p>
              <Link
                href={`/${locale}/host/listings/new`}
                className="btn-primary mt-6 inline-flex items-center gap-2 text-sm"
              >
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                {t("createNew")}
              </Link>
            </div>
          )}

          {listings && listings.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}

function ListingCard({ listing }: { listing: HostListing }) {
  const t = useTranslations("hostListings");
  const { locale = "ar" } = useParams<{ locale: string }>();
  const submit = useSubmitForReview();
  const publish = usePublishListing();
  const unpublish = useUnpublishListing();
  const archive = useArchiveListing();

  const status = listing.status;
  const isDraft = status === "DRAFT";
  const isRejected = status === "REJECTED";
  const isListed = status === "LISTED";
  const isUnlisted = status === "UNLISTED";
  const isArchived = status === "ARCHIVED";
  const canSubmit = isDraft || isRejected;
  const canPublish = isUnlisted;
  const canUnpublish = isListed;
  const canArchive = !isArchived;

  const anyLoading =
    submit.isPending ||
    publish.isPending ||
    unpublish.isPending ||
    archive.isPending;

  async function handleAction(
    mutate: (unitId: string) => Promise<unknown>,
    confirmKey: string,
    unitId: string
  ) {
    if (!window.confirm(t(confirmKey))) return;
    try {
      await mutate(unitId);
    } catch {
      window.alert(t("actionError"));
    }
  }

  return (
    <div className="card group overflow-hidden hover:shadow-card-hover">
      <Link
        href={`/${locale}/host/listings/${listing.id}/edit`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
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
      </Link>
      <div className="p-4">
        <Link
          href={`/${locale}/host/listings/${listing.id}/edit`}
          className="block truncate font-semibold text-brand-900 hover:text-accent-600"
        >
          {listing.title}
        </Link>
        <p className="mt-1 truncate text-sm text-neutral-500">
          {listing.city}, {listing.governorate}
        </p>
        <p className="mt-2 text-sm font-medium text-neutral-700">
          {listing.base_price_egp.toLocaleString()} {t("egp")}
          <span className="text-neutral-400"> / {t("night")}</span>
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {canSubmit && (
            <ActionButton
              label={t("submitForReview")}
              onClick={() =>
                handleAction(submit.mutateAsync, "submitConfirm", listing.id)
              }
              loading={submit.isPending}
              disabled={anyLoading}
              variant="primary"
            />
          )}
          {canPublish && (
            <ActionButton
              label={t("publish")}
              onClick={() =>
                handleAction(publish.mutateAsync, "publishConfirm", listing.id)
              }
              loading={publish.isPending}
              disabled={anyLoading}
              variant="primary"
            />
          )}
          {canUnpublish && (
            <ActionButton
              label={t("unpublish")}
              onClick={() =>
                handleAction(unpublish.mutateAsync, "unpublishConfirm", listing.id)
              }
              loading={unpublish.isPending}
              disabled={anyLoading}
              variant="secondary"
            />
          )}
          {canArchive && (
            <ActionButton
              label={t("archive")}
              onClick={() =>
                handleAction(archive.mutateAsync, "archiveConfirm", listing.id)
              }
              loading={archive.isPending}
              disabled={anyLoading}
              variant="danger"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  loading,
  disabled,
  variant,
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  variant: "primary" | "secondary" | "danger";
}) {
  const base =
    variant === "primary"
      ? "btn-primary px-3 py-1.5 text-xs"
      : variant === "danger"
        ? "btn-danger px-3 py-1.5 text-xs"
        : "btn-secondary px-3 py-1.5 text-xs";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={base}>
      {loading ? "..." : label}
    </button>
  );
}
