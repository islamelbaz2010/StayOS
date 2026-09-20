"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import {
  usePendingListings,
  useApproveListing,
  useRejectListing,
  type HostListing,
} from "@/lib/queries/hostListings";
import { useListingChangeHistory } from "@/lib/queries/listings";

/** Fields that can appear in a pending change-set, mapped to the
 *  HostListing attribute holding the currently-published value. */
const DIFFABLE_FIELDS = [
  "title_ar",
  "title_en",
  "description_ar",
  "description_en",
  "property_type",
  "category",
  "governorate",
  "city",
  "district",
  "address",
  "lat",
  "lng",
  "max_guests",
  "bedrooms",
  "beds",
  "bathrooms",
  "amenities",
  "cultural_tags",
  "accessibility_features",
  "self_check_in",
  "self_check_in_methods",
  "allows_pets",
  "base_price_egp",
  "cleaning_fee_egp",
  "weekend_mult",
  "peak_mult",
  "min_nights",
  "max_nights",
  "cancellation_policy",
  "instant_book",
  "house_rules",
  "policies",
  "check_in_time",
  "check_out_time",
  "sleeping_arrangements",
  "cover_photo_id",
];

function formatDiffValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "✓" : "✗";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ChangeHistory({ unitId }: { unitId: string }) {
  const t = useTranslations("adminListings");
  const { data: events, isLoading } = useListingChangeHistory(unitId);

  const eventLabel = (type: string) => {
    switch (type) {
      case "listing.edit_submitted":
        return t("eventSubmitted");
      case "listing.edit_approved":
        return t("eventApproved");
      case "listing.edit_rejected":
        return t("eventRejected");
      case "listing.submitted":
        return t("eventListingSubmitted");
      case "listing.approved":
        return t("eventListingApproved");
      case "listing.rejected":
        return t("eventListingRejected");
      default:
        return type;
    }
  };

  return (
    <div className="mt-4">
      <span className="font-medium text-neutral-700">
        {t("changeHistory")}
      </span>
      {isLoading ? (
        <p className="mt-1 text-xs text-neutral-400">…</p>
      ) : !events || events.length === 0 ? (
        <p className="mt-1 text-xs text-neutral-500">{t("noHistory")}</p>
      ) : (
        <ol className="mt-2 space-y-2 border-s-2 border-neutral-200 ps-3">
          {events.map((event) => (
            <li key={event.id} className="text-xs">
              <span className="font-semibold text-neutral-800">
                {eventLabel(event.event_type)}
              </span>
              <span className="ms-2 text-neutral-500">
                {new Date(event.created_at).toLocaleString()}
              </span>
              {event.actor_name && (
                <span className="ms-2 text-neutral-500">
                  · {event.actor_name}
                </span>
              )}
              {typeof event.payload.reason === "string" &&
                event.payload.reason && (
                  <p className="mt-0.5 text-neutral-600">
                    {event.payload.reason}
                  </p>
                )}
              {Array.isArray(event.payload.fields) &&
                event.payload.fields.length > 0 && (
                  <p className="mt-0.5 text-neutral-400" dir="ltr">
                    {(event.payload.fields as string[]).join(", ")}
                  </p>
                )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function AdminPendingListingsPage() {
  const t = useTranslations("adminListings");
  const tc = useTranslations("common");
  const tl = useTranslations("listing");
  const { locale = "ar" } = useParams<{ locale: string }>();
  const { data: listings, isLoading, error, refetch } = usePendingListings();
  const approveMutation = useApproveListing();
  const rejectMutation = useRejectListing();
  const [selected, setSelected] = useState<HostListing | null>(null);
  const [rejectTarget, setRejectTarget] = useState<HostListing | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
                {t("pendingTitle")}
              </h1>
              <div className="flex gap-2">
                <Link
                  href={`/${locale}/admin/discovery`}
                  className="btn-secondary text-sm"
                >
                  {t("discovery")}
                </Link>
                <Link
                  href={`/${locale}/admin/payments`}
                  className="btn-secondary text-sm"
                >
                  {t("paymentQueue")}
                </Link>
              </div>
            </div>

            {isLoading && (
              <div className="card p-8 text-center text-neutral-500">
                {tc("loading")}
              </div>
            )}

            {error && (
              <div className="card p-8 text-center">
                <p className="text-danger-600">{t("loadError")}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 text-sm font-semibold text-accent-600 hover:text-accent-700"
                >
                  {tc("retry")}
                </button>
              </div>
            )}

            {listings && listings.length === 0 && (
              <div className="card p-12 text-center">
                <p className="text-neutral-500">{t("noPending")}</p>
              </div>
            )}

            {listings && listings.length > 0 && (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="card overflow-hidden">
                    <div className="flex flex-col gap-4 p-4 sm:flex-row">
                      <div className="h-32 w-full shrink-0 overflow-hidden rounded-lg bg-neutral-200 sm:w-48">
                        {listing.cover_image ? (
                          <img
                            src={listing.cover_image}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-neutral-400">
                            <svg
                              className="h-10 w-10"
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
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-brand-900">
                            {listing.title}
                          </h3>
                          <span className="badge-warning shrink-0">
                            {listing.status === "LISTED" &&
                            listing.has_pending_changes
                              ? t("pendingEdit")
                              : t("pending")}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500">
                          {listing.city}, {listing.governorate}, {listing.country}
                        </p>
                        <p className="line-clamp-2 text-sm text-neutral-600">
                          {listing.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                          <span className="rounded bg-neutral-100 px-2 py-0.5">
                            {t("propertyType")}:{" "}
                            {tl(
                              `propertyTypeLabel.${listing.property_type.toLowerCase()}`,
                              { default: listing.property_type }
                            )}
                          </span>
                          <span className="rounded bg-neutral-100 px-2 py-0.5">
                            {t("guests")}: {listing.max_guests}
                          </span>
                          <span className="rounded bg-neutral-100 px-2 py-0.5">
                            {t("bedrooms")}: {listing.bedrooms}
                          </span>
                          <span className="rounded bg-neutral-100 px-2 py-0.5">
                            {t("bathrooms")}: {listing.bathrooms}
                          </span>
                          <span className="rounded bg-neutral-100 px-2 py-0.5">
                            {listing.base_price_egp.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} {t("egp")}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 sm:w-32">
                        <button
                          type="button"
                          onClick={() => setSelected(listing)}
                          className="btn-secondary px-3 py-2 text-sm"
                        >
                          {t("view")}
                        </button>
                        <button
                          type="button"
                          onClick={() => approveMutation.mutate(listing.id)}
                          disabled={approveMutation.isPending}
                          className="btn-primary px-3 py-2 text-sm disabled:opacity-50"
                        >
                          {approveMutation.isPending
                            ? tc("loading")
                            : t("approve")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectTarget(listing)}
                          disabled={rejectMutation.isPending}
                          className="btn-danger px-3 py-2 text-sm disabled:opacity-50"
                        >
                          {t("reject")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View modal */}
            {selected && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={() => setSelected(null)}
              >
                <div
                  className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-card bg-surface-card p-6 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-brand-900">
                      {selected.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {selected.cover_image && (
                    <img
                      src={selected.cover_image}
                      alt={selected.title}
                      className="mt-4 aspect-video w-full rounded-lg object-cover"
                    />
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-neutral-700">
                        {t("propertyType")}:
                      </span>{" "}
                      <span className="text-neutral-600">
                        {tl(
                          `propertyTypeLabel.${selected.property_type.toLowerCase()}`,
                          { default: selected.property_type }
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">
                        {t("category")}:
                      </span>{" "}
                      <span className="text-neutral-600">
                        {selected.category}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">
                        {t("guests")}:
                      </span>{" "}
                      <span className="text-neutral-600">
                        {selected.max_guests}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">
                        {t("bedrooms")}:
                      </span>{" "}
                      <span className="text-neutral-600">
                        {selected.bedrooms}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">
                        {t("beds")}:
                      </span>{" "}
                      <span className="text-neutral-600">{selected.beds}</span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">
                        {t("bathrooms")}:
                      </span>{" "}
                      <span className="text-neutral-600">
                        {selected.bathrooms}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">
                        {t("price")}:
                      </span>{" "}
                      <span className="text-neutral-600">
                        {selected.base_price_egp.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} {t("egp")}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">
                        {t("cleaningFee")}:
                      </span>{" "}
                      <span className="text-neutral-600">
                        {selected.cleaning_fee_egp.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} {t("egp")}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">
                        {t("cancellationPolicy")}:
                      </span>{" "}
                      <span className="text-neutral-600">
                        {tl(
                          `cancellation.${selected.cancellation_policy.toLowerCase()}`,
                          { default: selected.cancellation_policy }
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">
                        {t("location")}:
                      </span>{" "}
                      <span className="text-neutral-600">
                        {selected.address ??
                          `${selected.city}, ${selected.governorate}`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="font-medium text-neutral-700">
                      {t("description")}:
                    </span>
                    <p className="mt-1 text-sm text-neutral-600">
                      {selected.description}
                    </p>
                  </div>

                  {selected.amenities.length > 0 && (
                    <div className="mt-4">
                      <span className="font-medium text-neutral-700">
                        {t("amenities")}:
                      </span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selected.amenities.map((a) => (
                          <span
                            key={a}
                            className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
                          >
                            {tl(`amenityLabel.${a}`, {
                              default: a.replace(/_/g, " "),
                            })}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.house_rules && (
                    <div className="mt-4">
                      <span className="font-medium text-neutral-700">
                        {t("houseRules")}:
                      </span>
                      <p className="mt-1 text-sm text-neutral-600">
                        {selected.house_rules}
                      </p>
                    </div>
                  )}

                  {selected.pending_changes && (
                    <div className="mt-4 rounded-lg border border-warning-200 bg-warning-50 p-3">
                      <span className="font-medium text-warning-800">
                        {t("proposedChanges")}
                      </span>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-start text-xs text-neutral-500">
                              <th className="py-1 pe-3 text-start font-medium">
                                {t("field")}
                              </th>
                              <th className="py-1 pe-3 text-start font-medium">
                                {t("currentValue")}
                              </th>
                              <th className="py-1 text-start font-medium">
                                {t("proposedValue")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries({
                              ...(selected.pending_changes.unit ?? {}),
                              ...(selected.pending_changes.listing ?? {}),
                              ...(selected.pending_changes.lat != null
                                ? { lat: selected.pending_changes.lat }
                                : {}),
                              ...(selected.pending_changes.lng != null
                                ? { lng: selected.pending_changes.lng }
                                : {}),
                            }).map(([field, value]) => {
                              const current = (
                                selected as unknown as Record<string, unknown>
                              )[field];
                              const known = DIFFABLE_FIELDS.includes(field);
                              return (
                                <tr
                                  key={field}
                                  className="border-t border-warning-100"
                                >
                                  <td className="py-1.5 pe-3 font-medium text-neutral-700">
                                    {field}
                                    {!known && (
                                      <span className="ms-1 text-[10px] text-neutral-400">
                                        *
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-1.5 pe-3 text-neutral-500">
                                    {formatDiffValue(current)}
                                  </td>
                                  <td className="py-1.5 font-medium text-neutral-800">
                                    {formatDiffValue(value)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {selected.pending_changes.submitted_at && (
                        <p className="mt-2 text-xs text-neutral-500">
                          {new Date(
                            selected.pending_changes.submitted_at
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  <ChangeHistory unitId={selected.id} />

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setRejectTarget(selected)}
                      disabled={rejectMutation.isPending}
                      className="btn-danger text-sm disabled:opacity-50"
                    >
                      {t("reject")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        approveMutation.mutate(selected.id);
                        setSelected(null);
                      }}
                      disabled={approveMutation.isPending}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {t("approve")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reject confirmation modal */}
            {rejectTarget && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={() => setRejectTarget(null)}
              >
                <div
                  className="w-full max-w-sm rounded-card bg-surface-card p-6 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-bold text-brand-900">
                    {t("confirmReject")}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    {t("confirmRejectMessage")}
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t("rejectReasonPlaceholder")}
                    rows={3}
                    className="input mt-3 w-full text-sm"
                  />
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectTarget(null);
                        setRejectReason("");
                      }}
                      className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                    >
                      {tc("cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        rejectMutation.mutate({
                          unitId: rejectTarget.id,
                          reason: rejectReason || undefined,
                        });
                        setRejectTarget(null);
                        setRejectReason("");
                        setSelected(null);
                      }}
                      disabled={rejectMutation.isPending}
                      className="btn-danger text-sm disabled:opacity-50"
                    >
                      {rejectMutation.isPending ? tc("loading") : t("reject")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
