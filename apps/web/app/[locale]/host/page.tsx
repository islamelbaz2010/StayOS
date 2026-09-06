"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { useHostToday } from "@/lib/queries/hostToday";
import type { HostTodayItem } from "@/lib/queries/hostToday";
import { formatDate } from "@/lib/utils";

const ITEM_VARIANTS: Record<string, { border: string; bg: string; text: string }> = {
  check_in_today: {
    border: "border-s-success-500",
    bg: "bg-success-50",
    text: "text-success-700",
  },
  check_out_today: {
    border: "border-s-warning-500",
    bg: "bg-warning-50",
    text: "text-warning-700",
  },
  current_stay: {
    border: "border-s-accent-500",
    bg: "bg-accent-100",
    text: "text-accent-700",
  },
  pending_request: {
    border: "border-s-danger-500",
    bg: "bg-danger-50",
    text: "text-danger-700",
  },
  upcoming_arrival: {
    border: "border-s-info-500",
    bg: "bg-info-50",
    text: "text-info-700",
  },
  upcoming_departure: {
    border: "border-s-warning-500",
    bg: "bg-warning-50",
    text: "text-warning-700",
  },
  unread_message: {
    border: "border-s-info-500",
    bg: "bg-info-50",
    text: "text-info-700",
  },
  incomplete_listing: {
    border: "border-s-neutral-300",
    bg: "bg-neutral-50",
    text: "text-neutral-700",
  },
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
          <h1 className="mb-6 text-2xl font-bold text-brand-900 sm:text-3xl">
            {t("title")}
          </h1>

          {isLoading && (
            <div className="py-12 text-center text-neutral-600">
              {tc("loading")}
            </div>
          )}

          {isError && <ErrorState onRetry={() => refetch()} />}

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

              <div className="card p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-brand-900">
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
    <div className="card p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-900">{value}</p>
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
  const variant = ITEM_VARIANTS[item.item_type] ?? ITEM_VARIANTS.incomplete_listing;
  const dateLocale = locale === "ar" ? "ar-EG" : "en-GB";
  const href = actionHref(item, locale);

  return (
    <div
      className={`rounded-card border border-neutral-200 p-4 ${variant.border} ${variant.bg} border-s-4`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`font-semibold ${variant.text}`}>{item.title}</p>
          {item.subtitle && (
            <p className="text-sm text-neutral-600">{item.subtitle}</p>
          )}
          {(item.check_in || item.check_out) && (
            <p className="text-sm text-neutral-500">
              {item.check_in && (
                <>
                  {t("checkIn")}: {formatDate(new Date(item.check_in), dateLocale)}{" "}
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
            className="shrink-0 text-sm font-semibold text-accent-600 hover:text-accent-700"
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
