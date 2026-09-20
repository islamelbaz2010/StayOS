"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "stayos_fees_notice_v1";

/**
 * One-time informational popup explaining that displayed trip prices
 * include all applicable fees. Shown on first entry; dismissal is
 * remembered in localStorage (no account/consent backend required).
 */
export function FeesIncludedPopup() {
  const t = useTranslations("fees");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (private mode) — skip the popup.
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // best-effort persistence
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fees-popup-title"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-md rounded-card bg-surface-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-100">
          <svg
            className="h-6 w-6 text-accent-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2
          id="fees-popup-title"
          className="mt-4 text-lg font-bold text-neutral-900"
        >
          {t("popupTitle")}
        </h2>
        <p className="mt-2 text-sm text-neutral-600">{t("popupBody")}</p>
        <button
          type="button"
          onClick={dismiss}
          className="btn-primary mt-5 w-full text-sm"
          autoFocus
        >
          {t("popupCta")}
        </button>
      </div>
    </div>
  );
}

/**
 * Persistent browsing reminder shown alongside search/browse results:
 * "Prices include all fees".
 */
export function FeesIncludedLine({ className }: { className?: string }) {
  const t = useTranslations("fees");
  return (
    <p
      className={`inline-flex items-center gap-1.5 text-xs text-neutral-500 ${
        className ?? ""
      }`}
    >
      <svg
        className="h-3.5 w-3.5 text-accent-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {t("line")}
    </p>
  );
}
