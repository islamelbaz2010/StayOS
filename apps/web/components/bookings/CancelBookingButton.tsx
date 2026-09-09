"use client";

import Image from "next/image";
import { useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import {
  useCancelBooking,
  useCancellationPreview,
} from "@/lib/queries/bookings";
import type { BookingResponse } from "@/lib/queries/bookings";
import { getApiErrorMessage } from "@/lib/utils";
import { formatDate, formatMoney } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

interface CancelBookingButtonProps {
  booking: BookingResponse;
  onCancelled: () => void;
}

/** Guest-facing cancel action: shows the refund consequence before the guest
 * confirms, then cancels through the real cancellation lifecycle (refund
 * calculation, payment settlement, host notification) — never a bare status
 * flip. */
export function CancelBookingButton({
  booking,
  onCancelled,
}: CancelBookingButtonProps) {
  const t = useTranslations("trips");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const preview = useCancellationPreview(booking.id, open);
  const cancelBooking = useCancelBooking();

  async function handleConfirm() {
    setError(null);
    try {
      await cancelBooking.mutateAsync({
        bookingId: booking.id,
        payload: reason ? { reason } : {},
      });
      setOpen(false);
      setReason("");
      onCancelled();
    } catch (err) {
      setError(getApiErrorMessage(err, t("cancelError")));
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-danger-300 hover:bg-danger-50 hover:text-danger-700"
      >
        {t("cancelBooking")}
      </button>
    );
  }

  return (
    <div className="mt-3 w-full rounded-card border border-neutral-200 bg-surface-page p-4 sm:w-96">
      <p className="text-sm font-medium text-brand-900">{t("cancelModalTitle")}</p>

      <div className="mt-3 flex gap-3 rounded-lg border border-neutral-100 bg-white p-3">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100">
          <Image
            src={booking.unit_cover_image || PLACEHOLDER_IMAGE}
            alt={booking.unit_title || t("untitledListing")}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-900">
            {booking.unit_title ?? t("untitledListing")}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {formatDate(new Date(booking.check_in), dateLocale)} →{" "}
            {formatDate(new Date(booking.check_out), dateLocale)}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {t(`status.${booking.status}`)}
          </p>
          {preview.data && preview.data.total_paid_egp > 0 && (
            <p className="mt-0.5 text-xs font-medium text-brand-900">
              {formatMoney(preview.data.total_paid_egp, "EGP", dateLocale)}
            </p>
          )}
        </div>
      </div>

      {preview.isLoading && (
        <p className="mt-2 text-sm text-neutral-500">{tc("loading")}</p>
      )}

      {preview.data && (
        <p className="mt-2 text-sm text-neutral-700">
          {preview.data.total_paid_egp === 0
            ? t("cancelNoPayment")
            : preview.data.refund_amount_egp === preview.data.total_paid_egp
              ? t("cancelRefundFull", { amount: preview.data.refund_amount_egp })
              : preview.data.refund_amount_egp === 0
                ? t("cancelRefundNone")
                : t("cancelRefundPartial", {
                    amount: preview.data.refund_amount_egp,
                    total: preview.data.total_paid_egp,
                  })}
        </p>
      )}

      {preview.data &&
        preview.data.cancelled_by === "guest" &&
        (preview.data.service_fee_retained_egp ?? 0) > 0 && (
          <div className="mt-2 text-sm text-neutral-600">
            {preview.data.cancellation_policy && (
              <p>
                {t("cancelPolicyLabel", {
                  policy: t(
                    `policy.${preview.data.cancellation_policy.toLowerCase()}`
                  ),
                })}
              </p>
            )}
            <p>
              {t("cancelServiceFeeRetained", {
                amount: preview.data.service_fee_retained_egp ?? 0,
              })}
            </p>
          </div>
        )}

      {error && (
        <p
          className="mt-2 rounded-md bg-danger-50 p-2 text-sm text-danger-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <label
        htmlFor={`cancel-reason-${booking.id}`}
        className="mt-3 block text-xs font-medium text-neutral-500"
      >
        {t("cancelReasonPlaceholder")}
      </label>
      <textarea
        id={`cancel-reason-${booking.id}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="input mt-1 min-h-[4rem] text-sm"
        rows={2}
      />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={cancelBooking.isPending || preview.isLoading}
          className="btn-danger rounded-lg px-4 py-2 text-sm"
        >
          {cancelBooking.isPending ? t("cancelSubmitting") : tc("confirm")}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="btn-secondary rounded-lg px-4 py-2 text-sm"
        >
          {tc("back")}
        </button>
      </div>
    </div>
  );
}
