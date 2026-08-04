"use client";

import { useTranslations } from "next-intl";

import type { BookingResponse } from "@/lib/queries/bookings";
import { cn, formatDate } from "@/lib/utils";

interface HostBookingListProps {
  bookings: BookingResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-neutral-200 text-neutral-700",
};

function nights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export function HostBookingList({ bookings, selectedId, onSelect }: HostBookingListProps) {
  const t = useTranslations("hostBookings");

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-neutral-600 shadow-card">
        {t("noBookings")}
      </div>
    );
  }

  return (
    <ul className="space-y-3" role="list" aria-label={t("title")}>
      {bookings.map((booking) => (
        <li key={booking.id}>
          <button
            type="button"
            onClick={() => onSelect(booking.id)}
            className={cn(
              "w-full rounded-xl border p-4 text-start shadow-card transition",
              selectedId === booking.id
                ? "border-brand-500 ring-1 ring-brand-500"
                : "border-transparent bg-white hover:bg-neutral-50"
            )}
            aria-current={selectedId === booking.id ? "true" : undefined}
          >
            <div className="flex items-center justify-between">
              <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", STATUS_COLORS[booking.status] || "bg-neutral-100")}>
                {t(`status.${booking.status}`)}
              </span>
              <span className="text-sm text-neutral-500">
                {nights(booking.check_in, booking.check_out)} {t("nights")}
              </span>
            </div>

            <p className="mt-2 text-sm text-neutral-700">
              {formatDate(new Date(booking.check_in), "en-EG")} — {formatDate(new Date(booking.check_out), "en-EG")}
            </p>

            <p className="mt-1 text-sm text-neutral-500">
              {t("guests")}: {booking.adults + booking.children + booking.infants}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
