"use client";

import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { ListingForm } from "@/components/listings/ListingForm";

export default function NewListingPage() {
  const t = useTranslations("listingForm");

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-neutral-900">
            {t("createTitle")}
          </h1>
          <ListingForm />
        </div>
      </HostLayout>
    </ProtectedRoute>
  );
}
