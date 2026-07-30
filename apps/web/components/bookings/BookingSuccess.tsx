"use client";

import { useTranslations } from "next-intl";

interface BookingSuccessProps {
  onClose: () => void;
}

export function BookingSuccess({ onClose }: BookingSuccessProps) {
  const t = useTranslations("booking");

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

      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        {t("successClose")}
      </button>
    </section>
  );
}
