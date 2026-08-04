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
      className="rounded-xl bg-brand-50 p-6 shadow-card"
      aria-label={t("successTitle")}
      role="status"
    >
      <h2 className="text-lg font-semibold text-brand-800">
        {t("successTitle")}
      </h2>

      <p className="mt-2 text-brand-700">{t("successMessage")}</p>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/${locale}/bookings`}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          {t("viewTrips")}
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          {t("successClose")}
        </button>
      </div>
    </section>
  );
}
