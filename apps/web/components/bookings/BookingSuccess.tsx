"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface BookingSuccessProps {
  onClose: () => void;
}

export function BookingSuccess({ onClose }: BookingSuccessProps) {
  const t = useTranslations("booking");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  return (
    <section
      className="card bg-success-50 p-5 sm:p-6"
      aria-label={t("successTitle")}
      role="status"
    >
      <h2 className="text-lg font-semibold text-success-700">
        {t("successTitle")}
      </h2>

      <p className="mt-2 text-success-700">{t("successMessage")}</p>

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
