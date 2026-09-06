"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { ListingForm } from "@/components/listings/ListingForm";
import { PhotoUpload } from "@/components/listings/PhotoUpload";
import { useHostListing } from "@/lib/queries/hostListings";

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
  const { data: listing, isLoading, error } = useHostListing(unitId);

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">
              {t("editTitle")}
            </h1>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${locale}/host/listings/${unitId}/availability`}
                className="rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
              >
                {th("availabilityTitle")}
              </Link>
              <Link
                href={`/${locale}/host/listings/${unitId}/co-hosts`}
                className="rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
              >
                {th("coHostsTitle")}
              </Link>
            </div>
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

          {listing && (
            <>
              <ListingForm
                existingListing={listing}
                unitId={unitId}
              />
              <div className="rounded-xl bg-white p-6 shadow-card">
                <PhotoUpload unitId={unitId} />
              </div>
            </>
          )}
        </div>
      </HostLayout>
    </ProtectedRoute>
  );
}
