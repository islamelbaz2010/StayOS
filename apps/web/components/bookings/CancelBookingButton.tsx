"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { useCancelBooking, useCancellationPreview } from "@/lib/queries/bookings";
import type { BookingResponse } from "@/lib/queries/bookings";

interface CancelBookingButtonProps {
  booking: BookingResponse;
  onCancelled: () => void;
}

/** Guest-facing cancel action: shows the refund consequence before the guest
 * confirms, then cancels through the real cancellation lifecycle (refund
 * calculation, payment settlement, host notification) — never a bare status
 * flip. */
export function CancelBookingButton({ booking, onCancelled }: CancelBookingButtonProps) {
  const t = useTranslations("trips");
  const tc = useTranslations("common");
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
    } catch {
      setError(t("cancelError"));
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        {t("cancelBooking")}
      </button>
    );
  }

  return (
    <div className="mt-3 w-full rounded-lg border border-neutral-300 bg-neutral-50 p-4 sm:w-96">
      <p className="text-sm font-medium text-neutral-900">{t("cancelModalTitle")}</p>

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

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <label htmlFor={`cancel-reason-${booking.id}`} className="mt-3 block text-xs text-neutral-500">
        {t("cancelReasonPlaceholder")}
      </label>
      <textarea
        id={`cancel-reason-${booking.id}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mt-1 w-full rounded-lg border border-neutral-300 p-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none"
        rows={2}
      />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={cancelBooking.isPending || preview.isLoading}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:bg-neutral-400"
        >
          {cancelBooking.isPending ? t("cancelSubmitting") : tc("confirm")}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-white"
        >
          {tc("back")}
        </button>
      </div>
    </div>
  );
}
