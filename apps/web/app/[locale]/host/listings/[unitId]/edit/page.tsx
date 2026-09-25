"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListingForm } from "@/components/listings/ListingForm";
import { PhotoUpload } from "@/components/listings/PhotoUpload";
import {
  useHostListing,
  useHostListingDetail,
} from "@/lib/queries/hostListings";
import type { HostListing } from "@/lib/queries/hostListings";

const EDIT_SCOPES = new Set(["owner", "admin", "full_access"]);

export default function EditListingPage({
  params,
}: {
  params: { unitId: string };
}) {
  const { unitId } = params;
  const t = useTranslations("listingForm");
  const tc = useTranslations("common");
  const th = useTranslations("hostListings");
  const routeParams = useParams<{ locale: string }>();
  const locale = routeParams?.locale ?? "ar";
  const { data: listing, isLoading, error, refetch } = useHostListing(unitId);
  const { data: detail } = useHostListingDetail(unitId);

  const scope = detail?.permission_scope;
  const canEdit = scope == null || EDIT_SCOPES.has(scope);
  const missingItems = detail?.readiness?.missing_item_labels
    ? Object.values(detail.readiness.missing_item_labels)
    : [];

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
                {t("editTitle")}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/${locale}/host/listings/${unitId}/availability`}
                  className="btn-secondary text-sm"
                >
                  {th("availabilityTitle")}
                </Link>
                <Link
                  href={`/${locale}/host/listings/${unitId}/co-hosts`}
                  className="btn-secondary text-sm"
                >
                  {th("coHostsTitle")}
                </Link>
              </div>
            </div>

            {isLoading && (
              <div className="card p-8 text-center text-neutral-500">
                {tc("loading")}
              </div>
            )}

            {error && <ErrorState onRetry={() => refetch()} />}

            {listing && !canEdit && (
              <div className="card border-s-4 border-s-warning-500 p-5">
                <p className="text-sm text-neutral-700">
                  {th("readOnlyScope")}
                </p>
              </div>
            )}

            {listing && detail?.rejection_reason && !listing.has_pending_changes && (
              <div className="card border-s-4 border-s-danger-500 p-5">
                <p className="text-sm text-neutral-700">
                  <span className="font-semibold text-danger-700">
                    {listing.status === "REJECTED"
                      ? th("rejectionReason")
                      : th("changesRejected")}
                    :
                  </span>{" "}
                  {detail.rejection_reason}
                </p>
              </div>
            )}

            {listing && canEdit && (
              <>
                {listing.has_pending_changes && listing.pending_changes && (
                  <PendingChangesCard listing={listing} />
                )}
                {missingItems.length > 0 && (
                  <div className="card border-s-4 border-s-warning-500 p-5">
                    <h2 className="text-sm font-semibold text-brand-900">
                      {th("readinessTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-600">
                      {th("readinessMissing", {
                        items: missingItems.join(", "),
                      })}
                    </p>
                  </div>
                )}
                <ListingForm existingListing={listing} unitId={unitId} />
                <div className="card p-5 sm:p-6">
                  <PhotoUpload unitId={unitId} />
                </div>
              </>
            )}
          </div>
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}

const PENDING_FIELD_LABELS: Record<string, string> = {
  base_price_egp: "basePrice",
  cleaning_fee_egp: "cleaningFee",
  listing_discount_pct: "listingDiscount",
  weekly_discount_pct: "weeklyDiscount",
  monthly_discount_pct: "monthlyDiscount",
  weekend_mult: "weekendMult",
  peak_mult: "peakMult",
  min_nights: "minNights",
  max_nights: "maxNights",
  instant_book: "instantBook",
  title_ar: "titleAr",
  title_en: "titleEn",
  description_ar: "descriptionAr",
  description_en: "descriptionEn",
  cancellation_policy: "cancellationPolicy",
  max_guests: "maxGuests",
  bedrooms: "bedrooms",
  beds: "beds",
  bathrooms: "bathrooms",
};

function PendingChangesCard({ listing }: { listing: HostListing }) {
  const th = useTranslations("hostListings");
  const { locale = "ar" } = useParams<{ locale: string }>();
  const pending = listing.pending_changes ?? {};
  const changes = {
    ...(pending.unit ?? {}),
    ...(pending.listing ?? {}),
  } as Record<string, unknown>;
  const current = listing as unknown as Record<string, unknown>;
  const entries = Object.entries(changes).filter(
    ([key]) => key !== "submitted_by" && key !== "submitted_at"
  );
  const submittedAt = pending.submitted_at
    ? new Date(pending.submitted_at).toLocaleString(
        locale === "ar" ? "ar-EG" : "en-EG",
        { dateStyle: "medium", timeStyle: "short" }
      )
    : null;

  return (
    <div className="card border-s-4 border-s-warning-500 p-5">
      <h2 className="text-sm font-semibold text-brand-900">
        {th("pendingChangesTitle")}
      </h2>
      {submittedAt && (
        <p className="mt-1 text-xs text-neutral-500">
          {th("pendingSubmittedAt", { date: submittedAt })}
        </p>
      )}
      <dl className="mt-3 space-y-1.5">
        {entries.map(([key, requested]) => {
          const labelKey = PENDING_FIELD_LABELS[key] ?? key;
          const label = PENDING_FIELD_LABELS[key]
            ? th(`pendingFields.${labelKey}`)
            : key;
          const currentValue = current[key];
          return (
            <div key={key} className="flex flex-wrap items-baseline gap-2 text-sm">
              <dt className="font-medium text-neutral-700">{label}:</dt>
              <dd className="text-neutral-500 line-through">
                {String(currentValue ?? "—")}
              </dd>
              <dd className="font-semibold text-warning-700">
                → {String(requested ?? "—")}
              </dd>
            </div>
          );
        })}
        {(pending.lat || pending.lng) && (
          <div className="flex flex-wrap items-baseline gap-2 text-sm">
            <dt className="font-medium text-neutral-700">
              {th("pendingFields.location")}:
            </dt>
            <dd className="font-semibold text-warning-700">
              → {String(pending.lat ?? current.lat ?? "—")},{" "}
              {String(pending.lng ?? current.lng ?? "—")}
            </dd>
          </div>
        )}
      </dl>
      <p className="mt-3 text-xs text-neutral-600">{th("pendingNextAction")}</p>
    </div>
  );
}
