"use client";

import { useTranslations } from "next-intl";

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
  const { isAuthenticated, isGuest } = useAuth();
  const { data } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  if (!isAuthenticated || !isGuest) return null;

  const isFavorite = data?.listings.some((listing) => listing.id === unitId) ?? false;
  const dimension = size === "md" ? "h-10 w-10" : "h-8 w-8";
  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";

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
      className={cn(
        "flex items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white",
        dimension,
        className
      )}
    >
      <svg
        className={cn(iconSize, isFavorite ? "fill-brand-600 text-brand-600" : "fill-none text-neutral-700")}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
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
