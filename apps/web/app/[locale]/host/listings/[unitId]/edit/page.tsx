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

            {listing && listing.status === "REJECTED" && detail?.rejection_reason && (
              <div className="card border-s-4 border-s-danger-500 p-5">
                <p className="text-sm text-neutral-700">
                  <span className="font-semibold text-danger-700">
                    {th("rejectionReason")}:
                  </span>{" "}
                  {detail.rejection_reason}
                </p>
              </div>
            )}

            {listing && canEdit && (
              <>
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
