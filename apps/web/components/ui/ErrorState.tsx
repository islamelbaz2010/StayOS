"use client";

import { useTranslations } from "next-intl";

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  const t = useTranslations();

  return (
    <div
      className="mt-8 rounded-xl bg-danger-50 p-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <p className="text-danger-700">{t("common.error")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}
