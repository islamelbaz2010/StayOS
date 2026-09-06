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
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("pageTitle")}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              {t("pageSubtitle")}
            </p>
            <div className="card mt-6 p-5 sm:p-6">
              <KycUpload />
            </div>
          </div>
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}
