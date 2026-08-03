"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  variant?: "host" | "property";
  className?: string;
}

export function VerifiedBadge({ variant = "host", className }: VerifiedBadgeProps) {
  const t = useTranslations("trust");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700",
        className
      )}
    >
      <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      {variant === "host" ? t("verifiedHost") : t("verifiedProperty")}
    </span>
  );
}
