"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import type { BookingResponse } from "@/lib/queries/bookings";
import { usePaymentByBooking, type PaymentResponse } from "@/lib/queries/payments";
import { formatDate } from "@/lib/utils";

import { HostBookingActions } from "./HostBookingActions";

interface HostBookingDetailProps {
  booking: BookingResponse;
  onActionSuccess: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-warning-100 text-warning-700",
  accepted: "bg-accent-100 text-accent-700",
  confirmed: "bg-success-100 text-success-700",
  rejected: "bg-danger-100 text-danger-700",
  cancelled: "bg-neutral-100 text-neutral-700",
  no_show: "bg-neutral-100 text-neutral-700",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning-100 text-warning-700",
  proof_uploaded: "bg-accent-100 text-accent-700",
  verified: "bg-success-100 text-success-700",
  rejected: "bg-danger-100 text-danger-700",
  cancelled: "bg-neutral-100 text-neutral-700",
};

function nights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function paymentStatusLabel(
  status: string,
  t: (key: string) => string
): string {
  const key = `paymentStatuses.${status.toLowerCase()}`;
  const translated = t(key);
  // next-intl returns the key when a message is missing; fall back to the raw status.
  return translated === key ? status.toUpperCase() : translated;
}

export function HostBookingDetail({
  booking,
  onActionSuccess,
}: HostBookingDetailProps) {
  const t = useTranslations("hostBookings");
  const params = useParams<{ locale: string }>();
  const dateLocale = params?.locale === "ar" ? "ar-EG" : "en-EG";
  const { data: payment } = usePaymentByBooking(booking.id);

  return (
    <section className="card p-5 sm:p-6" aria-label={t("detailTitle")}>
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-lg font-semibold text-brand-900">
          {t("detailTitle")}
        </h2>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_COLORS[booking.status] || "bg-neutral-100 text-neutral-700"
          }`}
        >
          {t(`status.${booking.status}`)}
        </span>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-neutral-500">{t("checkIn")}</dt>
          <dd className="text-sm font-medium text-brand-900">
            {formatDate(new Date(booking.check_in), dateLocale)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">{t("checkOut")}</dt>
          <dd className="text-sm font-medium text-brand-900">
            {formatDate(new Date(booking.check_out), dateLocale)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">{t("nights")}</dt>
          <dd className="text-sm font-medium text-brand-900">
            {nights(booking.check_in, booking.check_out)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">{t("guests")}</dt>
          <dd className="text-sm font-medium text-brand-900">
            {booking.adults + booking.children + booking.infants}
            {t("guestsBreakdown", {
              adults: booking.adults,
              children: booking.children,
              infants: booking.infants,
            })}
          </dd>
        </div>
        {payment && (
          <div className="sm:col-span-2">
            <dt className="text-sm text-neutral-500">{t("payment")}</dt>
            <dd className="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  PAYMENT_STATUS_COLORS[payment.status.toLowerCase()] ||
                  "bg-neutral-100 text-neutral-700"
                }`}
              >
                {paymentStatusLabel(payment.status, t)}
              </span>
            </dd>
          </div>
        )}
      </dl>

      {(booking.reject_reason || booking.cancel_reason) && (
        <div className="mt-6 rounded-md bg-neutral-50 p-4">
          <h3 className="text-sm font-medium text-brand-900">
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
