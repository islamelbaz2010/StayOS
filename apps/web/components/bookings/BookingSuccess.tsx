"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import type { BookingResponse } from "@/lib/queries/bookings";

interface BookingSuccessProps {
  booking: BookingResponse;
  onClose: () => void;
}

const PLACEHOLDER_IMAGE = "/placeholder.svg";

export function BookingSuccess({ booking, onClose }: BookingSuccessProps) {
  const t = useTranslations("booking");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  return (
    <section
      className="card bg-success-50 p-5 sm:p-6"
      aria-label={t("successTitle")}
      role="status"
    >
      <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-100">
        <Image
          src={booking.unit_cover_image || PLACEHOLDER_IMAGE}
          alt={booking.unit_title || t("successTitle")}
          fill
          sizes="(max-width: 640px) 100vw, 600px"
          priority
          className="object-cover"
        />
      </div>

      <h2 className="text-lg font-semibold text-success-700">
        {t("successTitle")}
      </h2>

      <p className="mt-2 text-success-700">
        {booking.unit_title ? t("successForListing", { title: booking.unit_title }) : t("successMessage")}
      </p>

      <p className="mt-1 text-sm text-success-800">
        {t("statusLabel")}: <span className="font-medium capitalize">{booking.status}</span>
      </p>

      <div className="mt-4 flex gap-3">
        <Link
          href={`/${locale}/bookings`}
          className="btn-primary flex-1 text-center"
        >
          {t("viewTrips")}
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
        >
          {t("successClose")}
        </button>
      </div>
    </section>
  );
}
