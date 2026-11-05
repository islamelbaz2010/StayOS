"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { useAuth } from "@/lib/auth/useAuth";
import { useFavorites, useToggleFavorite } from "@/lib/queries/favorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  unitId: string;
  className?: string;
  size?: "sm" | "md";
}

export function FavoriteButton({ unitId, className, size = "sm" }: FavoriteButtonProps) {
  const t = useTranslations("listing");
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const { data } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const dimension = size === "md" ? "h-10 w-10" : "h-9 w-9";
  const iconSize = size === "md" ? "h-5 w-5" : "h-5 w-5";
  // Reference wishlist pattern: transparent circular hit-area, white heart
  // (drop-shadowed for photo legibility) that fills lime when saved.
  const buttonClass = cn(
    "flex items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95",
    dimension,
    className
  );
  const heartIcon = (
    <svg
      className={cn(iconSize, "fill-white/95 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]")}
      viewBox="0 0 24 24"
      stroke="rgba(0,0,0,0.55)"
      strokeWidth={1.2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );

  if (!isAuthenticated) {
    return (
      <Link
        href={`/${locale}/login`}
        className={buttonClass}
        aria-label={t("addToFavorites")}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {heartIcon}
      </Link>
    );
  }

  const isFavorite = data?.listings.some((listing) => listing.id === unitId) ?? false;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite.mutate(unitId);
      }}
      disabled={toggleFavorite.isPending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
      className={buttonClass}
    >
      <svg
        className={cn(iconSize, isFavorite ? "fill-accent-500 text-accent-500" : "fill-white/95 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]")}
        viewBox="0 0 24 24"
        stroke={isFavorite ? "#84CC16" : "rgba(0,0,0,0.55)"}
        strokeWidth={1.2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
