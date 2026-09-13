"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const COLLAPSE_THRESHOLD = 280;

interface DescriptionSectionProps {
  description: string;
}

export function DescriptionSection({ description }: DescriptionSectionProps) {
  const t = useTranslations("listing");
  const [expanded, setExpanded] = useState(false);

  const isLong = description.length > COLLAPSE_THRESHOLD;
  const visible = isLong && !expanded
    ? `${description.slice(0, COLLAPSE_THRESHOLD).trimEnd()}…`
    : description;

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-3 text-lg font-semibold text-brand-900">
        {t("description")}
      </h2>
      <p className="whitespace-pre-line leading-relaxed text-neutral-700">
        {visible}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-sm font-semibold text-brand-900 underline underline-offset-2 hover:text-brand-700"
          aria-expanded={expanded}
        >
          {expanded ? t("showLess") : t("showMore")}
        </button>
      )}
    </section>
  );
}
