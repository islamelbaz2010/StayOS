"use client";

import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { PhotoUpload } from "@/components/listings/PhotoUpload";

export default function PhotosPage({
  params,
}: {
  params: { unitId: string };
}) {
  const { unitId } = params;
  const t = useTranslations("photos");

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
                {t("pageTitle")}
              </h1>
            </div>
            <div className="card p-5 sm:p-6">
              <PhotoUpload unitId={unitId} />
            </div>
          </div>
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}
