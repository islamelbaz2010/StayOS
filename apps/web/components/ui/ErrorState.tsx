"use client";

import { useTranslations } from "next-intl";

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  const t = useTranslations();

  return (
    <div
      className="card mt-8 p-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <p className="font-medium text-danger-700">{t("common.error")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-primary mt-4"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}
