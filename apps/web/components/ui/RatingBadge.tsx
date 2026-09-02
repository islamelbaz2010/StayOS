"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface RatingBadgeProps {
  averageRating?: number | null;
  reviewCount?: number;
  className?: string;
}

export function RatingBadge({ averageRating, reviewCount = 0, className }: RatingBadgeProps) {
  const t = useTranslations("listing");

  if (!averageRating || reviewCount === 0) {
    return (
      <span className={cn("text-xs font-medium text-neutral-500", className)}>
        {t("noReviews")}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold text-neutral-900", className)}>
      <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.287 3.959c.3.92-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.959a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" />
      </svg>
      {averageRating.toFixed(2)}
      <span className="font-normal text-neutral-500">
        · {t("reviews", { count: reviewCount })}
      </span>
    </span>
  );
}
