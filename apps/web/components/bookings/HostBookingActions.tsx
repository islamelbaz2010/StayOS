"use client";

import Image from "next/image";
import { useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { useAuth } from "@/lib/auth/useAuth";
import {
  useCheckIn,
  useCheckOut,
  useCompleteBooking,
  useUpdateBooking,
} from "@/lib/queries/bookings";
import type { BookingResponse } from "@/lib/queries/bookings";
import { cn, formatDate } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

interface HostBookingActionsProps {
  booking: BookingResponse;
  onSuccess: () => void;
}

function PropertySummary({
  booking,
  dateLocale,
  t,
}: {
  booking: BookingResponse;
  dateLocale: string;
  t: (key: string) => string;
}) {
  return (
    <div className="mb-3 flex gap-3 rounded-lg border border-neutral-100 bg-white p-3">
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
      </div>
    </div>
  );
}

export function HostBookingActions({
  booking,
  onSuccess,
}: HostBookingActionsProps) {
  const t = useTranslations("hostBookings");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const { user } = useAuth();
  const updateBooking = useUpdateBooking();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const completeBooking = useCompleteBooking();

  const [rejectReason, setRejectReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [action, setAction] = useState<"accept" | "reject" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Accept/reject/cancel/check-in/check-out are restricted server-side to
  // owner/admin/full_access; hide them for limited co-host scopes.
  const canManageBookings =
    booking.permission_scope == null ||
    ["owner", "admin", "full_access"].includes(booking.permission_scope);

  if (!canManageBookings) {
    return (
      <p className="text-sm text-neutral-500">{t("readOnlyScope")}</p>
    );
  }

  const onActionError = (err: unknown) => {
    const axiosError = err as {
      response?: { data?: { error?: { message?: string } } };
    };
    setError(axiosError.response?.data?.error?.message || t("updateError"));
  };

  async function handleAction(
    newStatus: "accepted" | "rejected" | "cancelled"
  ) {
    setError(null);

    const payload: {
      status: typeof newStatus;
      reject_reason?: string;
      cancel_reason?: string;
    } = {
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
      const axiosError = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(axiosError.response?.data?.error?.message || t("updateError"));
    }
  }

  if (
    booking.status === "cancelled" ||
    booking.status === "rejected" ||
    booking.status === "no_show" ||
    booking.status === "completed"
  ) {
    return (
      <p className="text-sm text-neutral-500">
        {t("finalStatus", { status: booking.status })}
      </p>
    );
  }

  if (booking.status === "confirmed") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-success-700">
          {t("confirmedMessage")}
        </p>
        <div className="flex flex-wrap gap-3">
          {error && (
            <p
              className="rounded-md bg-danger-50 p-3 text-sm text-danger-700"
              role="alert"
            >
              {error}
            </p>
          )}
          {!booking.checked_in_at && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                checkIn.mutate(booking.id, {
                  onSuccess,
                  onError: onActionError,
                });
              }}
              disabled={checkIn.isPending}
              className={cn(
                "btn-primary text-sm",
                checkIn.isPending && "opacity-60"
              )}
            >
              {checkIn.isPending ? t("processing") : t("checkIn")}
            </button>
          )}
          {booking.checked_in_at && !booking.checked_out_at && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                checkOut.mutate(booking.id, {
                  onSuccess,
                  onError: onActionError,
                });
              }}
              disabled={checkOut.isPending}
              className={cn(
                "btn-primary text-sm",
                checkOut.isPending && "opacity-60"
              )}
            >
              {checkOut.isPending ? t("processing") : t("checkOut")}
            </button>
          )}
          {booking.checked_in_at && booking.checked_out_at && (
            user?.role === "admin" ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  completeBooking.mutate(booking.id, {
                    onSuccess,
                    onError: onActionError,
                  });
                }}
                disabled={completeBooking.isPending}
                className={cn(
                  "btn-primary text-sm",
                  completeBooking.isPending && "opacity-60"
                )}
              >
                {completeBooking.isPending ? t("processing") : t("complete")}
              </button>
            ) : (
              <p className="text-sm text-neutral-600">{t("stayCompleted")}</p>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {error && (
        <p
          className="rounded-md bg-danger-50 p-3 text-sm text-danger-700"
          role="alert"
        >
          {error}
        </p>
      )}

      {booking.status === "requested" && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleAction("accepted")}
            disabled={updateBooking.isPending}
            className="btn-primary text-sm"
          >
            {updateBooking.isPending ? t("processing") : t("accept")}
          </button>
          <button
            type="button"
            onClick={() => setAction("reject")}
            disabled={updateBooking.isPending || action === "reject"}
            className="btn-danger text-sm"
          >
            {t("reject")}
          </button>
          <button
            type="button"
            onClick={() => setAction("cancel")}
            disabled={updateBooking.isPending || action === "cancel"}
            className="btn-secondary text-sm"
          >
            {t("cancel")}
          </button>
        </div>
      )}

      {booking.status === "accepted" && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setAction("cancel")}
            disabled={updateBooking.isPending || action === "cancel"}
            className="btn-secondary text-sm"
          >
            {t("cancel")}
          </button>
        </div>
      )}

      {action === "reject" && (
        <div className="rounded-card border border-danger-200 bg-danger-50 p-4">
          <PropertySummary booking={booking} dateLocale={dateLocale} t={t} />
          <label
            htmlFor="reject-reason"
            className="block text-sm font-medium text-danger-900"
          >
            {t("rejectReason")}
          </label>
          <textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="input mt-2 min-h-[5rem] border-danger-300 focus:border-danger-500 focus:ring-danger-500"
            rows={3}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => handleAction("rejected")}
              disabled={updateBooking.isPending}
              className="btn-danger text-sm"
            >
              {t("confirmReject")}
            </button>
            <button
              type="button"
              onClick={() => {
                setAction(null);
                setRejectReason("");
              }}
              className="btn-secondary text-sm"
            >
              {t("back")}
            </button>
          </div>
        </div>
      )}

      {action === "cancel" && (
        <div className="rounded-card border border-neutral-200 bg-neutral-50 p-4">
          <PropertySummary booking={booking} dateLocale={dateLocale} t={t} />
          <label
            htmlFor="cancel-reason"
            className="block text-sm font-medium text-brand-900"
          >
            {t("cancelReason")}
          </label>
          <textarea
            id="cancel-reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="input mt-2 min-h-[5rem]"
            rows={3}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => handleAction("cancelled")}
              disabled={updateBooking.isPending}
              className="btn-primary text-sm"
            >
              {t("confirmCancel")}
            </button>
            <button
              type="button"
              onClick={() => {
                setAction(null);
                setCancelReason("");
              }}
              className="btn-secondary text-sm"
            >
              {t("back")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
