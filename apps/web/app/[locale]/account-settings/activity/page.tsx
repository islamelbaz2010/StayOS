"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { useNotifications } from "@/lib/queries/notifications";
import { formatDate } from "@/lib/utils";

const CATEGORIES = [
  "account_policies",
  "reservations",
  "reminders",
  "messages",
  "host_activity",
  "offers",
] as const;

export default function AccountActivityPage() {
  const { locale = "ar" } = useParams<{ locale: string }>();
  const t = useTranslations("settings.activityPage");
  const tc = useTranslations("common");
  const { data, isLoading, error, refetch } = useNotifications();
  const [filter, setFilter] = useState<string>("all");

  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const items = useMemo(() => {
    const all = data?.items ?? [];
    return filter === "all" ? all : all.filter((i) => i.category === filter);
  }, [data, filter]);

  const presentCategories = useMemo(() => {
    const seen = new Set((data?.items ?? []).map((i) => i.category));
    return CATEGORIES.filter((c) => seen.has(c));
  }, [data]);

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

          {isLoading && (
            <p className="mt-6 text-sm text-neutral-500">{tc("loading")}</p>
          )}

          {error && (
            <div className="mt-6 rounded-xl bg-white p-8 text-center shadow-card">
              <p className="text-danger-600">{t("loadError")}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm font-semibold text-accent-600 hover:text-accent-700"
              >
                {tc("retry")}
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  aria-pressed={filter === "all"}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                    filter === "all"
                      ? "border-primary-700 bg-primary-700 text-white"
                      : "border-neutral-300 text-neutral-700"
                  }`}
                >
                  {t("all")}
                </button>
                {presentCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFilter(category)}
                    aria-pressed={filter === category}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                      filter === category
                        ? "border-primary-700 bg-primary-700 text-white"
                        : "border-neutral-300 text-neutral-700"
                    }`}
                  >
                    {t(`categories.${category}`)}
                  </button>
                ))}
              </div>

              {items.length === 0 ? (
                <div className="mt-6 rounded-xl bg-white p-8 text-center shadow-card">
                  <p className="text-neutral-600">{t("empty")}</p>
                </div>
              ) : (
                <ul className="mt-6 space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl bg-white p-5 shadow-card"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                          {t(`categories.${item.category}`)}
                        </span>
                        <time className="text-xs text-neutral-400">
                          {formatDate(item.created_at, dateLocale)}
                        </time>
                      </div>
                      {item.subject && (
                        <p className="mt-2 text-sm font-semibold text-neutral-900">
                          {item.subject}
                        </p>
                      )}
                      <p className="mt-1 whitespace-pre-line text-sm text-neutral-600">
                        {item.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                <h2 className="text-sm font-semibold text-neutral-900">
                  {t("policiesTitle")}
                </h2>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <Link
                    href={`/${locale}/for-guests`}
                    className="font-medium text-accent-600 hover:text-accent-700"
                  >
                    {t("forGuests")}
                  </Link>
                  <Link
                    href={`/${locale}/host-standards`}
                    className="font-medium text-accent-600 hover:text-accent-700"
                  >
                    {t("hostStandards")}
                  </Link>
                  <Link
                    href={`/${locale}/support`}
                    className="font-medium text-accent-600 hover:text-accent-700"
                  >
                    {t("contactSupport")}
                  </Link>
                </div>
              </div>
            </>
          )}
        </main>
      </GuestLayout>
    </ProtectedRoute>
  );
}
