"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { CancelBookingButton } from "@/components/bookings/CancelBookingButton";
import { LeaveReviewForm } from "@/components/bookings/LeaveReviewForm";
import {
  useCheckIn,
  useCheckOut,
  useStayInfo,
} from "@/lib/queries/bookings";
import { useBookingConversation } from "@/lib/queries/messages";
import { usePaymentByBooking } from "@/lib/queries/payments";
import { formatDate, formatMoney } from "@/lib/utils";

const CANCELLABLE_PHASES = new Set(["upcoming", "check_in_ready"]);
const PLACEHOLDER_IMAGE = "/placeholder.svg";

const PHASE_VARIANTS: Record<string, string> = {
  upcoming: "badge-info",
  check_in_ready: "badge-accent",
  checked_in: "badge-success",
  checkout_ready: "badge-success",
  checked_out: "badge-neutral",
  completed: "badge-neutral",
  cancelled: "badge-neutral",
  rejected: "badge-danger",
  no_show: "badge-neutral",
};

function PhaseBadge({ phase }: { phase: string }) {
  const t = useTranslations("trips");
  return (
    <span className={PHASE_VARIANTS[phase] || "badge-neutral"}>
      {t(`phase.${phase}`)}
    </span>
  );
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning-100 text-warning-800",
  proof_uploaded: "bg-accent-100 text-accent-800",
  verified: "bg-success-100 text-success-800",
  rejected: "bg-danger-100 text-danger-800",
  cancelled: "bg-neutral-100 text-neutral-700",
  refund_pending: "bg-warning-100 text-warning-800",
  refunded: "bg-success-100 text-success-800",
};

function paymentStatusLabel(
  status: string,
  t: (key: string) => string
): string {
  const key = `status${status
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("")}`;
  const translated = t(key);
  return translated === key ? status.toUpperCase() : translated;
}

function TripContent({
  bookingId,
  locale,
}: {
  bookingId: string;
  locale: string;
}) {
  const t = useTranslations("trips");
  const tp = useTranslations("payment");
  const tc = useTranslations("common");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const [actionError, setActionError] = useState<string | null>(null);
  const { data: stay, isLoading, error, refetch } = useStayInfo(bookingId);
  const { data: payment } = usePaymentByBooking(bookingId);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const conversation = useBookingConversation(
    stay?.booking.status === "confirmed" ||
      stay?.booking.status === "accepted" ||
      stay?.booking.checked_in_at
      ? bookingId
      : null
  );

  if (isLoading) {
    return (
      <div className="card p-8 text-center text-neutral-500">
        {tc("loading")}
      </div>
    );
  }

  if (error || !stay) {
    return (
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
    );
  }

  const { booking, property, host, arrival, review_eligible: reviewEligible } = stay;
  const phase = booking.stay_phase;
  const terminalReason = booking.cancel_reason || booking.reject_reason;
  const isTerminal =
    phase === "cancelled" || phase === "rejected" || phase === "no_show";
  const canCheckIn = phase === "check_in_ready";
  const canCheckOut = phase === "checked_in" || phase === "checkout_ready";
  const showStayInfo =
    phase === "checked_in" ||
    phase === "checkout_ready" ||
    phase === "check_in_ready" ||
    phase === "upcoming";

  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-100">
          <Image
            src={property.cover_image || PLACEHOLDER_IMAGE}
            alt={property.title || t("title")}
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            priority
            className="object-cover"
          />
        </div>
        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            {property.title && (
              <h2 className="text-lg font-bold text-brand-900 sm:text-xl">
                {property.title}
              </h2>
            )}
            <p className="mt-1 text-sm text-neutral-600">
              {formatDate(new Date(booking.check_in), dateLocale)} →{" "}
              {formatDate(new Date(booking.check_out), dateLocale)}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {booking.adults} {t("adults")}
              {booking.children > 0 &&
                ` · ${booking.children} ${t("children")}`}
            </p>
          </div>
          <div className="shrink-0">
            <PhaseBadge phase={phase} />
          </div>
        </div>
      </div>

      {payment && (
        <div className="card p-5 sm:p-6">
          <h3 className="mb-3 text-lg font-bold text-brand-900">
            {tp("paymentStatus")}
          </h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span
              className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-medium ${
                PAYMENT_STATUS_COLORS[payment.status] ??
                "bg-neutral-100 text-neutral-700"
              }`}
            >
              {paymentStatusLabel(payment.status, tp)}
            </span>
            <p className="text-base font-semibold text-brand-900">
              {formatMoney(payment.amount_egp, "EGP", dateLocale)}
            </p>
          </div>
          {payment.reject_reason && (
            <p className="mt-3 text-sm text-danger-600">
              {tp("rejectReason")}: {payment.reject_reason}
            </p>
          )}
        </div>
      )}

      {isTerminal && terminalReason && (
        <div className="card border-s-4 border-s-danger-500 p-5 sm:p-6">
          <h3 className="mb-2 text-lg font-bold text-brand-900">
            {t("terminalReasonTitle")}
          </h3>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {booking.cancel_reason
              ? t("cancelReasonLabel")
              : t("rejectReasonLabel")}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
            {terminalReason}
          </p>
        </div>
      )}

      {!isTerminal && (
        <div className="card p-5 sm:p-6">
          <h3 className="mb-3 text-lg font-bold text-brand-900">
            {t("arrivalInfo")}
          </h3>
          {property.address && (
            <p className="mb-2 text-sm text-neutral-700">{property.address}</p>
          )}
          <p className="mb-3 text-sm text-neutral-500">
            {t("checkIn")}: {arrival.default_check_in_time} · {t("checkOut")}:{" "}
            {arrival.default_check_out_time}
          </p>
          {arrival.eligible ? (
            arrival.check_in_instructions && (
              <div className="rounded-md bg-neutral-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {t("checkInInstructions")}
                </p>
                <p className="whitespace-pre-wrap text-sm text-neutral-700">
                  {arrival.check_in_instructions}
                </p>
              </div>
            )
          ) : (
            <p className="text-sm italic text-neutral-400">
              {t("arrivalReleasesAt")}
            </p>
          )}
        </div>
      )}

      {showStayInfo && (
        <div className="card p-5 sm:p-6">
          <h3 className="mb-3 text-lg font-bold text-brand-900">
            {t("stayInfo")}
          </h3>
          {host.name && (
            <p className="font-medium text-brand-900">{host.name}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4">
            {host.phone && (
              <a
                href={`tel:${host.phone}`}
                className="text-sm font-semibold text-accent-600 hover:text-accent-700"
              >
                {t("callHost")}
              </a>
            )}
            {conversation.data && (
              <Link
                href={`/${locale}/messages/${conversation.data.id}`}
                className="text-sm font-semibold text-accent-600 hover:text-accent-700"
              >
                {t("messageHost")}
              </Link>
            )}
          </div>
          {property.house_rules && (
            <div className="mt-4 rounded-md bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t("houseRules")}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
                {property.house_rules}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {booking.status === "accepted" && (
          <Link
            href={`/${locale}/checkout/${booking.id}`}
            className="btn-primary w-full text-center"
          >
            {t("checkout")}
          </Link>
        )}

        {canCheckIn && (
          <button
            type="button"
            onClick={async () => {
              setActionError(null);
              try {
                await checkIn.mutateAsync(booking.id);
                refetch();
              } catch {
                setActionError(t("actionError"));
              }
            }}
            disabled={checkIn.isPending}
            className="btn-primary w-full"
          >
            {t("checkInAction")}
          </button>
        )}

        {canCheckOut && (
          <button
            type="button"
            onClick={async () => {
              setActionError(null);
              try {
                await checkOut.mutateAsync(booking.id);
                refetch();
              } catch {
                setActionError(t("actionError"));
              }
            }}
            disabled={checkOut.isPending}
            className="btn-primary w-full"
          >
            {t("checkOutAction")}
          </button>
        )}

        {actionError && (
          <p className="text-sm text-danger-600" role="alert">
            {actionError}
          </p>
        )}

        {reviewEligible && (
          <LeaveReviewForm
            bookingId={booking.id}
            unitId={booking.unit_id}
            onSubmitted={() => refetch()}
          />
        )}

        {CANCELLABLE_PHASES.has(phase) && (
          <CancelBookingButton booking={booking} onCancelled={() => refetch()} />
        )}
      </div>
    </div>
  );
}

export default function TripDetailPage() {
  const t = useTranslations("trips");
  const params = useParams<{ locale: string; bookingId: string }>();
  const locale = params?.locale ?? "ar";
  const bookingId = params?.bookingId ?? "";

  return (
    <ProtectedRoute allowedRoles={["guest"]}>
      <GuestLayout>
        <section className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href={`/${locale}/bookings`}
            className="mb-4 inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700"
          >
            <svg
              className="h-4 w-4 rtl:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            <span className="ms-2">{t("title")}</span>
          </Link>
          <TripContent bookingId={bookingId} locale={locale} />
        </section>
      </GuestLayout>
    </ProtectedRoute>
  );
}
