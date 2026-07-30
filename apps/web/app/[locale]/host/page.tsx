"use client";

import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { useAuth } from "@/lib/auth/useAuth";

export default function HostPage() {
  const t = useTranslations("host");
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <div className="rounded-xl bg-white p-8 shadow-card">
          <h1 className="text-2xl font-bold text-neutral-900">
            {t("title")}
          </h1>
          <p className="mt-2 text-neutral-600">{t("comingSoon")}</p>
          <p className="mt-4 text-sm text-neutral-500">
            {user?.display_name || user?.phone_number || user?.email}
          </p>
        </div>
      </HostLayout>
    </ProtectedRoute>
  );
}
