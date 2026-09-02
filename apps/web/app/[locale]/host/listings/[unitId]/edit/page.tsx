"use client";

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
  const { data: listing, isLoading, error } = useHostListing(unitId);

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-neutral-900">
            {t("editTitle")}
          </h1>

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
