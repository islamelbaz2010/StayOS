"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import Image from "next/image";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { CancelBookingButton } from "@/components/bookings/CancelBookingButton";
import { MessageHostButton } from "@/components/bookings/MessageHostButton";
import { useGuestBookings } from "@/lib/queries/bookings";
import { formatDate } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const CANCELLABLE_STATUSES = new Set(["requested", "accepted", "confirmed"]);

const STATUS_VARIANTS: Record<string, string> = {
  requested: "badge-warning",
  accepted: "badge-accent",
  confirmed: "badge-success",
  rejected: "badge-danger",
  cancelled: "badge-neutral",
  no_show: "badge-neutral",
};

type TripFilter = "upcoming" | "past" | "cancelled" | "all";

const ACTIVE_STATUSES = new Set(["requested", "accepted", "confirmed"]);
const TERMINAL_STATUSES = new Set(["completed", "rejected", "no_show"]);

export default function MyTripsPage() {
  const t = useTranslations("trips");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const [filter, setFilter] = useState<TripFilter>("upcoming");
  const { data: bookings, isLoading, error, refetch } = useGuestBookings();

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filteredBookings = (bookings ?? []).filter((booking) => {
    const checkOut = new Date(booking.check_out);
    const isCancelled = booking.status === "cancelled";
    const isPast =
      TERMINAL_STATUSES.has(booking.status) ||
      (ACTIVE_STATUSES.has(booking.status) && checkOut < now);
    const isUpcoming = !isCancelled && !isPast;

    switch (filter) {
      case "upcoming":
        return isUpcoming;
      case "past":
        return isPast;
      case "cancelled":
        return isCancelled;
      case "all":
        return true;
    }
  });

  const FILTER_TABS: { key: TripFilter; label: string }[] = [
    { key: "upcoming", label: t("filterUpcoming") },
    { key: "past", label: t("filterPast") },
    { key: "cancelled", label: t("filterCancelled") },
    { key: "all", label: t("filterAll") },
  ];

  return (
    <ProtectedRoute allowedRoles={["guest"]}>
      <GuestLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-brand-900">
            {t("title")}
          </h1>

          <div className="mb-6 flex gap-2 overflow-x-auto border-b border-neutral-200 pb-px">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? "border-accent-600 text-accent-600"
                    : "border-transparent text-neutral-500 hover:text-brand-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="py-12 text-center text-neutral-600">
              {tc("loading")}
            </div>
          )}

          {error && (
            <div className="card p-8 text-center">
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

          {bookings && filteredBookings.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-neutral-500">
                {filter === "upcoming"
                  ? t("noUpcoming")
                  : filter === "past"
                    ? t("noPast")
                    : filter === "cancelled"
                      ? t("noCancelled")
                      : t("noBookings")}
              </p>
              {filter === "upcoming" && (
                <Link
                  href={`/${locale}/search`}
                  className="btn-primary mt-4 inline-flex"
                >
                  {t("searchCta")}
                </Link>
              )}
            </div>
          )}

          {filteredBookings.length > 0 && (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="card p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        <Image
                        src={booking.unit_cover_image || PLACEHOLDER_IMAGE}
                          alt={booking.unit_title || t("listing")}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h2 className="text-base font-semibold text-brand-900 line-clamp-1">
                          {booking.unit_title || t("untitledListing")}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={STATUS_VARIANTS[booking.status] || "badge-neutral"}>
                            {t(`status.${booking.status}`)}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {formatDate(
                              new Date(booking.requested_at),
                              locale === "ar" ? "ar-EG" : "en-EG"
                            )}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm text-neutral-600">
                          <div>
                            <span className="text-neutral-400">
                              {t("checkIn")}:{" "}
                            </span>
                            <span className="font-medium text-brand-900">
                              {formatDate(
                                new Date(booking.check_in),
                                locale === "ar" ? "ar-EG" : "en-EG"
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-400">
                              {t("checkOut")}:{" "}
                            </span>
                            <span className="font-medium text-brand-900">
                              {formatDate(
                                new Date(booking.check_out),
                                locale === "ar" ? "ar-EG" : "en-EG"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Link
                        href={`/${locale}/bookings/${booking.id}`}
                        className="btn-secondary"
                      >
                        {t("viewTrip")}
                      </Link>
                      <MessageHostButton bookingId={booking.id} />
                      {booking.status === "accepted" && (
                        <Link
                          href={`/${locale}/checkout/${booking.id}`}
                          className="btn-primary"
                        >
                          {t("checkout")}
                        </Link>
                      )}
                      {CANCELLABLE_STATUSES.has(booking.status) &&
                        !booking.checked_in_at &&
                        !booking.checked_out_at && (
                          <CancelBookingButton
                            booking={booking}
                            onCancelled={() => refetch()}
                          />
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </GuestLayout>
    </ProtectedRoute>
  );
}
