"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { useUpdateBooking } from "@/lib/queries/bookings";
import type { BookingResponse } from "@/lib/queries/bookings";
import { cn } from "@/lib/utils";

interface HostBookingActionsProps {
  booking: BookingResponse;
  onSuccess: () => void;
}

export function HostBookingActions({ booking, onSuccess }: HostBookingActionsProps) {
  const t = useTranslations("hostBookings");
  const updateBooking = useUpdateBooking();

  const [rejectReason, setRejectReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [action, setAction] = useState<"accept" | "reject" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(newStatus: "accepted" | "rejected" | "cancelled") {
    setError(null);

    const payload: { status: typeof newStatus; reject_reason?: string; cancel_reason?: string } = {
      status: newStatus,
    };

    if (newStatus === "rejected" && rejectReason) {
      payload.reject_reason = rejectReason;
    }
    if (newStatus === "cancelled" && cancelReason) {
      payload.cancel_reason = cancelReason;
    }

    try {
      await updateBooking.mutateAsync({ bookingId: booking.id, payload });
      setAction(null);
      setRejectReason("");
      setCancelReason("");
      onSuccess();
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosError.response?.data?.error?.message || t("updateError"));
    }
  }

  if (booking.status === "cancelled" || booking.status === "rejected") {
    return (
      <p className="text-sm text-neutral-500">{t("finalStatus", { status: booking.status })}</p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {booking.status === "requested" && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleAction("accepted")}
            disabled={updateBooking.isPending}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold text-white transition",
              updateBooking.isPending ? "bg-neutral-400" : "bg-green-600 hover:bg-green-700"
            )}
          >
            {updateBooking.isPending ? t("processing") : t("accept")}
          </button>
          <button
            type="button"
            onClick={() => setAction("reject")}
            disabled={updateBooking.isPending || action === "reject"}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-neutral-400"
          >
            {t("reject")}
          </button>
          <button
            type="button"
            onClick={() => setAction("cancel")}
            disabled={updateBooking.isPending || action === "cancel"}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:text-neutral-400"
          >
            {t("cancel")}
          </button>
        </div>
      )}

      {booking.status === "accepted" && (
        <button
          type="button"
          onClick={() => setAction("cancel")}
          disabled={updateBooking.isPending || action === "cancel"}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:text-neutral-400"
        >
          {t("cancel")}
        </button>
      )}

      {action === "reject" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <label htmlFor="reject-reason" className="block text-sm font-medium text-red-900">
            {t("rejectReason")}
          </label>
          <textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="mt-2 w-full rounded-lg border border-red-300 p-2 text-sm text-neutral-900 focus:border-red-500 focus:outline-none"
            rows={3}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => handleAction("rejected")}
              disabled={updateBooking.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              {t("confirmReject")}
            </button>
            <button
              type="button"
              onClick={() => { setAction(null); setRejectReason(""); }}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100"
            >
              {t("back")}
            </button>
          </div>
        </div>
      )}

      {action === "cancel" && (
        <div className="rounded-lg border border-neutral-300 bg-neutral-50 p-4">
          <label htmlFor="cancel-reason" className="block text-sm font-medium text-neutral-900">
            {t("cancelReason")}
          </label>
          <textarea
            id="cancel-reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="mt-2 w-full rounded-lg border border-neutral-300 p-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none"
            rows={3}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => handleAction("cancelled")}
              disabled={updateBooking.isPending}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              {t("confirmCancel")}
            </button>
            <button
              type="button"
              onClick={() => { setAction(null); setCancelReason(""); }}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-white"
            >
              {t("back")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
