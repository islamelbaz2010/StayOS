"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { useHostToday } from "@/lib/queries/hostToday";
import type { HostTodayItem } from "@/lib/queries/hostToday";
import { formatDate } from "@/lib/utils";

const ITEM_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  check_in_today: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800" },
  check_out_today: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800" },
  current_stay: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800" },
  pending_request: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800" },
  upcoming_arrival: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800" },
  upcoming_departure: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800" },
  unread_message: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800" },
  incomplete_listing: { bg: "bg-neutral-50", border: "border-neutral-200", text: "text-neutral-700" },
};

const SUMMARY_KEYS = [
  "check_ins_today",
  "check_outs_today",
  "current_stays",
  "pending_requests",
  "unread_messages",
  "incomplete_listings",
] as const;

export default function HostPage() {
  const t = useTranslations("hostToday");
  const tc = useTranslations("common");
  const { data, isLoading, isError, refetch } = useHostToday();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  const summary = data?.summary ?? {};

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-neutral-900">
            {t("title")}
          </h1>

          {isLoading && (
            <div className="py-12 text-center text-neutral-600">
              {tc("loading")}
            </div>
          )}

          {isError && (
            <div className="rounded-xl bg-white p-8 text-center text-danger-600 shadow-card">
              {t("loadError")}
              <button
                type="button"
                onClick={() => refetch()}
                className="ml-2 font-medium text-brand-600 hover:underline"
              >
                {tc("retry")}
              </button>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SUMMARY_KEYS.map((key) => (
                  <SummaryCard
                    key={key}
                    label={t(`summary.${key}`)}
                    value={summary[key] ?? 0}
                  />
                ))}
              </div>

              <div className="rounded-xl bg-white p-6 shadow-card">
                <h2 className="mb-4 text-lg font-semibold text-neutral-900">
                  {t("actionItems")}
                </h2>

                {data?.items && data.items.length > 0 ? (
                  <div className="space-y-3">
                    {data.items.map((item, idx) => (
                      <TodayItem key={idx} item={item} locale={locale} t={t} />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-neutral-500">
                    {t("empty")}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-card">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}

function TodayItem({
  item,
  locale,
}: {
  item: HostTodayItem;
  locale: string;
  t: (key: string) => string;
}) {
  const t = useTranslations("hostToday");
  const style = ITEM_STYLES[item.item_type] ?? ITEM_STYLES.incomplete_listing;
  const dateLocale = locale === "ar" ? "ar-EG" : "en-GB";
  const href = actionHref(item, locale);

  return (
    <div
      className={`rounded-lg border p-4 ${style.bg} ${style.border}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`font-semibold ${style.text}`}>{item.title}</p>
          {item.subtitle && (
            <p className="text-sm text-neutral-600">{item.subtitle}</p>
          )}
          {(item.check_in || item.check_out) && (
            <p className="text-sm text-neutral-500">
              {item.check_in && (
                <>
                  {t("checkIn")}: {formatDate(new Date(item.check_in), dateLocale)} {" "}
                </>
              )}
              {item.check_out && (
                <>
                  {t("checkOut")}: {formatDate(new Date(item.check_out), dateLocale)}
                </>
              )}
            </p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="shrink-0 text-sm font-medium text-brand-600 hover:underline"
          >
            {t("view")}
          </Link>
        )}
      </div>
    </div>
  );
}

function actionHref(item: HostTodayItem, locale: string): string | null {
  if (item.item_type === "incomplete_listing") {
    return `/${locale}/host/listings`;
  }
  if (item.item_type === "unread_message") {
    return `/${locale}/messages`;
  }
  if (item.booking_id) {
    return `/${locale}/host/bookings`;
  }
  return null;
}
