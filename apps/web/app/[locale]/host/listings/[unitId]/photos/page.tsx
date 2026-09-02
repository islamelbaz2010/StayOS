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
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">
              {t("pageTitle")}
            </h1>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-card">
            <PhotoUpload unitId={unitId} />
          </div>
        </div>
      </HostLayout>
    </ProtectedRoute>
  );
}
