"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import type { BookingResponse } from "@/lib/queries/bookings";
import { cn, formatDate } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

interface HostBookingListProps {
  bookings: BookingResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showPhase?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-warning-100 text-warning-700",
  accepted: "bg-accent-100 text-accent-700",
  confirmed: "bg-success-100 text-success-700",
  rejected: "bg-danger-100 text-danger-700",
  cancelled: "bg-neutral-100 text-neutral-700",
  no_show: "bg-neutral-100 text-neutral-700",
};

function nights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function HostBookingList({
  bookings,
  selectedId,
  onSelect,
  showPhase,
}: HostBookingListProps) {
  const t = useTranslations("hostBookings");
  const params = useParams<{ locale: string }>();
  const dateLocale = params?.locale === "ar" ? "ar-EG" : "en-EG";

  if (bookings.length === 0) {
    return (
      <div className="card p-6 text-center text-neutral-600">
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
              "w-full rounded-card border p-4 text-start shadow-card transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2",
              selectedId === booking.id
                ? "border-accent-500 ring-1 ring-accent-500 bg-surface-card"
                : "border-transparent bg-surface-card hover:bg-neutral-50"
            )}
            aria-current={selectedId === booking.id ? "true" : undefined}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  STATUS_COLORS[booking.status] || "bg-neutral-100 text-neutral-700"
                )}
              >
                {t(`status.${booking.status}`)}
              </span>
              <span className="text-sm text-neutral-500">
                {nights(booking.check_in, booking.check_out)} {t("nights")}
              </span>
            </div>

            {showPhase && booking.stay_phase && (
              <p className="mt-1 text-xs font-medium text-accent-700">
                {t(`phase.${booking.stay_phase}`)}
              </p>
            )}

            <div className="mt-3 flex gap-3">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                <Image
                  src={booking.unit_cover_image || PLACEHOLDER_IMAGE}
                  alt={booking.unit_title || t("listing")}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-brand-900">
                  {booking.unit_title || t("untitledListing")}
                </p>
              </div>
            </div>

            <p className="mt-2 text-sm text-neutral-700">
              {formatDate(new Date(booking.check_in), dateLocale)} —{" "}
              {formatDate(new Date(booking.check_out), dateLocale)}
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
