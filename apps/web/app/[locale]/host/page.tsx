"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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

const DISMISS_KEY = "stayos.host.today.dismissed";

/**
 * Signature of the current actionable set — dismissal is tied to this
 * exact set, so a *changed* workload re-surfaces the block instead of
 * staying hidden forever.
 */
function itemsSignature(items: HostTodayItem[]): string {
  return items
    .map((i) => `${i.item_type}:${i.booking_id ?? i.title ?? ""}`)
    .sort()
    .join("|");
}

export default function HostPage() {
  const t = useTranslations("hostToday");
  const tc = useTranslations("common");
  const { data, isLoading, isError, refetch } = useHostToday();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  const items = data?.items ?? [];
  const signature = items.length > 0 ? itemsSignature(items) : null;
  const [dismissedSig, setDismissedSig] = useState<string | null>(null);
  useEffect(() => {
    setDismissedSig(localStorage.getItem(DISMISS_KEY));
  }, []);
  const isDismissed = signature !== null && dismissedSig === signature;

  const dismiss = () => {
    if (!signature) return;
    localStorage.setItem(DISMISS_KEY, signature);
    setDismissedSig(signature);
  };
  const reopen = () => {
    localStorage.removeItem(DISMISS_KEY);
    setDismissedSig(null);
  };

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

              {items.length > 0 &&
                (isDismissed ? (
                  <button
                    type="button"
                    onClick={reopen}
                    className="flex w-full items-center justify-between rounded-card border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-card transition hover:bg-neutral-50"
                  >
                    <span>{t("attentionCollapsed", { count: items.length })}</span>
                    <span className="text-accent-600">{t("show")}</span>
                  </button>
                ) : (
                  <div className="card p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-brand-900">
                        {t("actionItems")}
                      </h2>
                      <button
                        type="button"
                        onClick={dismiss}
                        aria-label={t("dismiss")}
                        className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {items.map((item, idx) => (
                        <TodayItem key={idx} item={item} locale={locale} t={t} />
                      ))}
                    </div>
                  </div>
                ))}
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

  // The backend returns English-composed title/subtitle strings; localize
  // the title from item_type + guest_name and only render subtitles that
  // are unit titles (not English status sentences).
  const itemTitle =
    item.item_type === "unread_message"
      ? t("items.unread_message")
      : item.item_type === "incomplete_listing"
        ? t("items.incomplete_listing")
        : item.guest_name && t.has(`items.${item.item_type}`)
          ? t(`items.${item.item_type}`, { name: item.guest_name })
          : item.title;
  const itemSubtitle =
    item.item_type === "incomplete_listing"
      ? t("items.incompleteListingSubtitle")
      : item.subtitle;

  return (
    <div
      className={`rounded-card border border-neutral-200 p-4 ${variant.border} ${variant.bg} border-s-4`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`font-semibold ${variant.text}`}>{itemTitle}</p>
          {itemSubtitle && (
            <p className="text-sm text-neutral-600">{itemSubtitle}</p>
          )}
          {(item.check_in || item.check_out) && (
            <p className="text-sm text-neutral-500">
              {item.check_in && (
                <>
                  {t("checkIn")}: {formatDate(item.check_in, dateLocale)}{" "}
                </>
              )}
              {item.check_out && (
                <>
                  {t("checkOut")}: {formatDate(item.check_out, dateLocale)}
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
    return `/${locale}/host/bookings?bookingId=${item.booking_id}`;
  }
  return null;
}
