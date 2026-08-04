"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import type { BookingResponse } from "@/lib/queries/bookings";
import { formatDate } from "@/lib/utils";

import { HostBookingActions } from "./HostBookingActions";

interface HostBookingDetailProps {
  booking: BookingResponse;
  onActionSuccess: () => void;
}

function nights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export function HostBookingDetail({ booking, onActionSuccess }: HostBookingDetailProps) {
  const t = useTranslations("hostBookings");
  const params = useParams<{ locale: string }>();
  const dateLocale = params?.locale === "ar" ? "ar-EG" : "en-EG";

  return (
    <section
      className="rounded-xl bg-white p-6 shadow-card"
      aria-label={t("detailTitle")}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t("detailTitle")}
        </h2>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
          {t(`status.${booking.status}`)}
        </span>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-neutral-500">{t("checkIn")}</dt>
          <dd className="text-sm font-medium text-neutral-900">
            {formatDate(new Date(booking.check_in), dateLocale)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">{t("checkOut")}</dt>
          <dd className="text-sm font-medium text-neutral-900">
            {formatDate(new Date(booking.check_out), dateLocale)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">{t("nights")}</dt>
          <dd className="text-sm font-medium text-neutral-900">
            {nights(booking.check_in, booking.check_out)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">{t("guests")}</dt>
          <dd className="text-sm font-medium text-neutral-900">
            {booking.adults + booking.children + booking.infants}
            {t("guestsBreakdown", {
              adults: booking.adults,
              children: booking.children,
              infants: booking.infants,
            })}
          </dd>
        </div>
      </dl>

      {(booking.reject_reason || booking.cancel_reason) && (
        <div className="mt-6 rounded-lg bg-neutral-50 p-4">
          <h3 className="text-sm font-medium text-neutral-900">
            {booking.reject_reason ? t("rejectReason") : t("cancelReason")}
          </h3>
          <p className="mt-1 text-sm text-neutral-700">
            {booking.reject_reason || booking.cancel_reason}
          </p>
        </div>
      )}

      <HostBookingActions booking={booking} onSuccess={onActionSuccess} />
    </section>
  );
}
