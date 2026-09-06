"use client";

import { useTranslations } from "next-intl";

interface EmptyStateProps {
  messageKey?: string;
}

export function EmptyState({ messageKey = "search.noResults" }: EmptyStateProps) {
  const t = useTranslations();

  return (
    <div className="card mt-8 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
        <svg
          className="h-6 w-6 text-neutral-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>
      <p className="text-lg font-medium text-brand-900">{t(messageKey)}</p>
    </div>
  );
}
