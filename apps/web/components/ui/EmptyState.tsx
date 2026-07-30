"use client";

import { useTranslations } from "next-intl";

interface EmptyStateProps {
  messageKey?: string;
}

export function EmptyState({ messageKey = "search.noResults" }: EmptyStateProps) {
  const t = useTranslations();

  return (
    <div className="mt-8 rounded-xl bg-neutral-100 p-8 text-center">
      <p className="text-lg text-neutral-700">{t(messageKey)}</p>
    </div>
  );
}
