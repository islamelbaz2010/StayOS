"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/lib/queries/settings";

// Mirrors LOCKED/TOGGLEABLE_NOTIFICATION_CATEGORIES in
// src/app/notifications/constants.py — locked categories are rendered as
// always-on informational rows, not fake toggles.
const LOCKED = ["account_policies", "reservations", "reminders"] as const;
const TOGGLEABLE = ["messages", "host_activity", "offers"] as const;

export default function NotificationPreferencesPage() {
  const { locale = "ar" } = useParams<{ locale: string }>();
  const t = useTranslations("settings.notifPage");
  const { data, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  const [error, setError] = useState<string | null>(null);

  const prefs = data?.preferences ?? {};

  function toggle(category: string, value: boolean) {
    setError(null);
    update.mutate(
      { preferences: { [category]: value } },
      { onError: () => setError(t("saveError")) }
    );
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

          {isLoading ? (
            <p className="mt-6 text-sm text-neutral-500">…</p>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-neutral-900">
                  {t("requiredTitle")}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {t("requiredBody")}
                </p>
                <ul className="mt-4 space-y-4">
                  {LOCKED.map((category) => (
                    <li
                      key={category}
                      className="flex items-start justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {t(`categories.${category}.title`)}
                        </p>
                        <p className="mt-0.5 text-sm text-neutral-600">
                          {t(`categories.${category}.body`)}
                        </p>
                      </div>
                      <span className="mt-0.5 shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                        {t("alwaysOn")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-neutral-900">
                  {t("optionalTitle")}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {t("optionalBody")}
                </p>
                <ul className="mt-4 space-y-4">
                  {TOGGLEABLE.map((category) => {
                    const checked = prefs[category] ?? true;
                    return (
                      <li
                        key={category}
                        className="flex items-start justify-between gap-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {t(`categories.${category}.title`)}
                          </p>
                          <p className="mt-0.5 text-sm text-neutral-600">
                            {t(`categories.${category}.body`)}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={checked}
                          aria-label={t(`categories.${category}.title`)}
                          disabled={update.isPending}
                          onClick={() => toggle(category, !checked)}
                          className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                            checked ? "bg-primary-700" : "bg-neutral-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              checked
                                ? "translate-x-6 rtl:-translate-x-6"
                                : "translate-x-1 rtl:-translate-x-1"
                            }`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {error && (
                  <p className="mt-3 text-sm text-danger-600" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <Link
                href={`/${locale}/notifications`}
                className="inline-block text-sm font-semibold text-accent-600 hover:text-accent-700"
              >
                {t("inboxLink")} →
              </Link>
            </div>
          )}
        </main>
      </GuestLayout>
    </ProtectedRoute>
  );
}
