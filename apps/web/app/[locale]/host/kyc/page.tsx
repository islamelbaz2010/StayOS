"use client";

import { useTranslations } from "next-intl";

import { HostLayout } from "@/components/layouts";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { KycUpload } from "@/components/kyc/KycUpload";

export default function KycPage() {
  const t = useTranslations("kyc");

  return (
    <ProtectedRoute>
      <HostLayout>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-neutral-900">{t("pageTitle")}</h1>
          <p className="mt-2 text-sm text-neutral-600">{t("pageSubtitle")}</p>
          <div className="mt-6">
            <KycUpload />
          </div>
        </div>
      </HostLayout>
    </ProtectedRoute>
  );
}
