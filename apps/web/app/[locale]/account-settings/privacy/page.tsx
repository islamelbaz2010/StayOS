"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";
import {
  usePrivacySettings,
  useUpdatePrivacySettings,
  type PrivacySettingsUpdate,
} from "@/lib/queries/settings";

function Toggle({
  label,
  body,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  body: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-4 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        <p className="mt-1 text-sm text-neutral-600">{body}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-primary-700" : "bg-neutral-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function PrivacyPage() {
  const { locale = "ar" } = useParams<{ locale: string }>();
  const t = useTranslations("settings.privacyPage");
  const { logout } = useAuth();
  const router = useRouter();
  const { data: privacy, isLoading } = usePrivacySettings();
  const updatePrivacy = useUpdatePrivacySettings();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(payload: PrivacySettingsUpdate) {
    setError(null);
    updatePrivacy.mutate(payload, {
      onError: () => setError(t("saveError")),
    });
  }

  async function exportData() {
    setExporting(true);
    try {
      const { data } = await api.get("/auth/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "stayos-account-data.json";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function deactivate() {
    if (!window.confirm(t("deactivateConfirm"))) return;
    await api.delete("/auth/me");
    await logout();
    router.push(`/${locale}`);
  }

  return (
    <ProtectedRoute>
      <GuestLayout>
        <main className="container mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <Link
            href={`/${locale}/account-settings`}
            className="text-sm font-semibold text-accent-600 hover:text-accent-700"
          >
            ← {t("back")}
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-brand-900">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">{t("body")}</p>

          <div className="mt-6 space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-bold text-neutral-900">
                {t("controlsTitle")}
              </h2>
              {isLoading ? (
                <p className="mt-4 text-sm text-neutral-500">…</p>
              ) : (
                <div className="mt-2">
                  <Toggle
                    label={t("profilePublic")}
                    body={t("profilePublicBody")}
                    checked={privacy?.profile_public ?? true}
                    disabled={updatePrivacy.isPending}
                    onChange={(v) => update({ profile_public: v })}
                  />
                  <Toggle
                    label={t("readReceipts")}
                    body={t("readReceiptsBody")}
                    checked={privacy?.read_receipts ?? true}
                    disabled={updatePrivacy.isPending}
                    onChange={(v) => update({ read_receipts: v })}
                  />
                </div>
              )}
              {error && (
                <p className="mt-3 text-sm text-danger-600" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-bold text-neutral-900">
                {t("dataTitle")}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">{t("dataBody")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={exportData}
                  disabled={exporting}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  {exporting ? t("exporting") : t("export")}
                </button>
                <button
                  type="button"
                  onClick={deactivate}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-danger-600 hover:bg-danger-50"
                >
                  {t("deactivate")}
                </button>
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                {t("deactivateBody")}
              </p>
            </div>
          </div>
        </main>
      </GuestLayout>
    </ProtectedRoute>
  );
}
