"use client";

import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/api";
import type { BookingResponse } from "@/lib/queries/bookings";
import type { ConversationResponse } from "@/lib/queries/messages";
import {
  usePaymentByBooking,
  usePaymentProofDownloadUrl,
  type PaymentResponse,
} from "@/lib/queries/payments";
import { formatDate, formatMoney, getApiErrorMessage } from "@/lib/utils";

import { HostBookingActions } from "./HostBookingActions";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

interface HostBookingDetailProps {
  booking: BookingResponse;
  onActionSuccess: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-warning-100 text-warning-700",
  accepted: "bg-accent-100 text-accent-700",
  confirmed: "bg-success-100 text-success-700",
  completed: "bg-success-100 text-success-700",
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
  refund_pending: "bg-amber-100 text-amber-700",
  refunded: "bg-success-100 text-success-700",
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

function PaymentTimeline({
  payment,
  locale,
  t,
}: {
  payment: PaymentResponse;
  locale: string;
  t: (key: string) => string;
}) {
  const proofDownload = usePaymentProofDownloadUrl();

  function dateRow(
    value: string | null | undefined,
    labelKey: string
  ): React.ReactNode {
    if (!value) return null;
    return (
      <div>
        <dt className="text-sm text-neutral-500">{t(labelKey)}</dt>
        <dd className="text-sm font-medium text-brand-900">
          {new Date(value).toLocaleString(locale)}
        </dd>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2">
      <dt className="text-sm text-neutral-500">{t("paymentTimeline")}</dt>
      <dd className="mt-1 grid gap-3 sm:grid-cols-2">
        {dateRow(payment.payment_deadline_at, "paymentDeadline")}
        {dateRow(payment.proof_uploaded_at, "proofUploaded")}
        {dateRow(payment.verified_at, "verifiedAt")}
        {dateRow(payment.rejected_at, "rejectedAt")}
        {dateRow(payment.cancelled_at, "cancelledAt")}
        {dateRow(payment.refunded_at, "refundedAt")}
        {payment.reject_reason && (
          <div className="sm:col-span-2">
            <dt className="text-sm text-neutral-500">{t("paymentRejectReason")}</dt>
            <dd className="text-sm font-medium text-danger-600">
              {payment.reject_reason}
            </dd>
          </div>
        )}
        {payment.proof_s3_key && (
          <div className="sm:col-span-2">
            <button
              type="button"
              disabled={proofDownload.isPending}
              onClick={() =>
                proofDownload.mutate(payment.id, {
                  onSuccess: (url) =>
                    window.open(url, "_blank", "noopener,noreferrer"),
                })
              }
              className="text-sm font-medium text-accent-600 hover:text-accent-700 hover:underline disabled:opacity-50"
            >
              {proofDownload.isPending ? t("loading") : t("viewReceipt")}
            </button>
          </div>
        )}
      </dd>
    </div>
  );
}

export function HostBookingDetail({
  booking,
  onActionSuccess,
}: HostBookingDetailProps) {
  const t = useTranslations("hostBookings");
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const dateLocale = params?.locale === "ar" ? "ar-EG" : "en-EG";
  const [messageError, setMessageError] = useState<string | null>(null);
  const { data: payment } = usePaymentByBooking(booking.id);

  const canMessage =
    booking.permission_scope == null ||
    booking.permission_scope !== "calendar_only";

  const messageGuest = useMutation({
    mutationFn: async () => {
      const { data } = await api.get<ConversationResponse>(
        `/messages/bookings/${booking.id}/conversation`
      );
      return data;
    },
    onSuccess: (conversation) => {
      setMessageError(null);
      const locale = params?.locale ?? "en";
      router.push(`/${locale}/messages/${conversation.id}`);
    },
    onError: (error) => {
      setMessageError(getApiErrorMessage(error, t("messageGuestError")));
    },
  });

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

      <div className="mt-4 flex gap-4">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
          <Image
            src={booking.unit_cover_image || PLACEHOLDER_IMAGE}
            alt={booking.unit_title || t("listing")}
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-brand-900">
            {booking.unit_title || t("untitledListing")}
          </p>
        </div>
      </div>

      {(booking.guest_name || booking.guest_kyc_status) && (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="text-sm font-semibold text-brand-900">
            {t("guest")}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {booking.guest_name && (
              <p className="text-sm font-medium text-brand-900">
                {booking.guest_name}
              </p>
            )}
            {booking.guest_kyc_status === "verified" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success-700">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t("identityVerified")}
              </span>
            )}
            {booking.guest_kyc_status === "pending" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-700">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t("identityPending")}
              </span>
            )}
            {booking.guest_member_since && (
              <p className="text-xs text-neutral-500">
                {t("memberSince", {
                  date: new Intl.DateTimeFormat(dateLocale, {
                    year: "numeric",
                    month: "long",
                  }).format(new Date(booking.guest_member_since)),
                })}
              </p>
            )}
            {booking.guest_reviews_count != null &&
              booking.guest_reviews_count > 0 && (
                <p className="text-xs text-neutral-500">
                  {t("guestReviewsCount", { count: booking.guest_reviews_count })}
                </p>
              )}
          </div>
        </div>
      )}

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
          <>
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
            <div>
              <dt className="text-sm text-neutral-500">{t("paymentAmount")}</dt>
              <dd className="text-sm font-medium text-brand-900">
                {formatMoney(payment.amount_egp, "EGP", dateLocale)}
              </dd>
            </div>
            {payment.accommodation_amount_egp != null && (
              <div>
                <dt className="text-sm text-neutral-500">{t("accommodationAmount")}</dt>
                <dd className="text-sm font-medium text-brand-900">
                  {formatMoney(payment.accommodation_amount_egp, "EGP", dateLocale)}
                </dd>
              </div>
            )}
            {payment.guest_service_fee_egp != null && (
              <div>
                <dt className="text-sm text-neutral-500">{t("serviceFee")}</dt>
                <dd className="text-sm font-medium text-brand-900">
                  {formatMoney(payment.guest_service_fee_egp, "EGP", dateLocale)}
                </dd>
              </div>
            )}
            {(payment.status === "refund_pending" || payment.status === "refunded") &&
              payment.refund_amount_egp != null && (
                <div>
                  <dt className="text-sm text-neutral-500">{t("refundAmount")}</dt>
                  <dd className="text-sm font-medium text-brand-900">
                    {formatMoney(payment.refund_amount_egp, "EGP", dateLocale)}
                  </dd>
                </div>
              )}
            <PaymentTimeline payment={payment} locale={dateLocale} t={t} />
          </>
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

      {canMessage && (
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => messageGuest.mutate()}
            disabled={messageGuest.isPending}
            className="btn-secondary w-full sm:w-auto"
          >
            {messageGuest.isPending ? t("loading") : t("messageGuest")}
          </button>
          {messageError && (
            <p className="text-sm text-danger-600">{messageError}</p>
          )}
        </div>
      )}

      <HostBookingActions booking={booking} onSuccess={onActionSuccess} />
    </section>
  );
}
