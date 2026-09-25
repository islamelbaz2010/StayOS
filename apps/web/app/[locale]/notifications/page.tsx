"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/queries/notifications";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const { data, isLoading, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const unread = data?.unread_count ?? 0;

  return (
    <ProtectedRoute>
      <GuestLayout>
        <section className="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">
              {t("title")}
            </h1>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="text-sm font-semibold text-accent-600 hover:text-accent-700"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          {isLoading && (
            <div className="py-12 text-center text-neutral-600">
              {tc("loading")}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-white p-8 text-center shadow-card">
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

          {!isLoading && !error && items.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow-card">
              <p className="text-neutral-600">{t("empty")}</p>
            </div>
          )}

          <ul className="space-y-3">
            {items.map((item) => {
              const isUnread = item.read_at === null;
              return (
                <li
                  key={item.id}
                  className={`rounded-xl p-5 shadow-card ${
                    isUnread ? "bg-white ring-1 ring-accent-200" : "bg-neutral-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {item.subject && (
                        <p
                          className={`text-sm ${
                            isUnread
                              ? "font-semibold text-neutral-900"
                              : "font-medium text-neutral-700"
                          }`}
                        >
                          {item.subject}
                        </p>
                      )}
                      <p className="mt-1 whitespace-pre-line text-sm text-neutral-600">
                        {item.body}
                      </p>
                      <p className="mt-2 text-xs text-neutral-400">
                        {formatDate(item.created_at, dateLocale)}
                      </p>
                    </div>
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => markRead.mutate(item.id)}
                        className="shrink-0 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 hover:bg-accent-100"
                      >
                        {t("markRead")}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </GuestLayout>
    </ProtectedRoute>
  );
}
