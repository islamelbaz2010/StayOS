"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const COLLAPSE_THRESHOLD = 280;

interface CollapsibleTextProps {
  text: string;
  showMoreKey?: string;
  showLessKey?: string;
}

export function CollapsibleText({
  text,
  showMoreKey = "showMore",
  showLessKey = "showLess",
}: CollapsibleTextProps) {
  const t = useTranslations("listing");
  const [expanded, setExpanded] = useState(false);

  const isLong = text.length > COLLAPSE_THRESHOLD;
  const visible = isLong && !expanded
    ? `${text.slice(0, COLLAPSE_THRESHOLD).trimEnd()}…`
    : text;

  return (
    <div>
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
          {expanded ? t(showLessKey) : t(showMoreKey)}
        </button>
      )}
    </div>
  );
}
