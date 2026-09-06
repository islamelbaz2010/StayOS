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
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("createTitle")}
            </h1>
            <ListingForm />
          </div>
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}
