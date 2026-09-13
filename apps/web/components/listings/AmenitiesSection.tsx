"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const AMENITY_GROUPS: Record<string, string[]> = {
  ESSENTIALS: ["wifi", "ac", "air_conditioning", "heating", "towels", "bed_linens", "toiletries"],
  KITCHEN: ["kitchen", "fridge", "microwave", "stove", "oven", "coffee_machine"],
  ENTERTAINMENT: ["tv", "pool", "gym", "workspace"],
  OUTDOOR: ["balcony", "garden", "parking", "bbq"],
  SAFETY: ["fire_extinguisher", "smoke_detector", "first_aid_kit", "safe"],
};

const AMENITY_ICONS: Record<string, string> = {
  wifi: "📶",
  ac: "❄️",
  air_conditioning: "❄️",
  heating: "🔥",
  towels: "🧺",
  bed_linens: "🛏️",
  toiletries: "🧴",
  kitchen: "🍳",
  fridge: "🧊",
  microwave: "⚡",
  stove: "🔥",
  oven: "🍞",
  coffee_machine: "☕",
  tv: "📺",
  pool: "🏊",
  gym: "💪",
  workspace: "💻",
  balcony: "🌅",
  garden: "🌿",
  parking: "🚗",
  bbq: "🍖",
  fire_extinguisher: "🧯",
  smoke_detector: "🚨",
  first_aid_kit: "⚕️",
  safe: "🔒",
};

function getAmenityGroup(amenity: string): string {
  for (const [group, amenities] of Object.entries(AMENITY_GROUPS)) {
    if (amenities.includes(amenity)) return group;
  }
  return "OTHER";
}

const PREVIEW_LIMIT = 8;

interface AmenitiesSectionProps {
  amenities: string[];
}

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  const t = useTranslations("listing");
  const [showAll, setShowAll] = useState(false);

  if (amenities.length === 0) return null;

  const grouped = amenities.reduce<Record<string, string[]>>((acc, amenity) => {
    const group = getAmenityGroup(amenity);
    if (!acc[group]) acc[group] = [];
    acc[group].push(amenity);
    return acc;
  }, {});

  const preview = amenities.slice(0, PREVIEW_LIMIT);
  const hasMore = amenities.length > PREVIEW_LIMIT;

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-brand-900">
        {t("amenities")}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {preview.map((amenity) => (
          <div
            key={amenity}
            className="flex items-center gap-3 text-sm text-neutral-700"
          >
            <span className="text-lg">
              {AMENITY_ICONS[amenity] ?? "✓"}
            </span>
            <span>
              {t(`amenityLabel.${amenity}`, { default: amenity.replace(/_/g, " ") })}
            </span>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="btn-secondary mt-5 text-sm"
        >
          {t("showAllAmenities", { count: amenities.length })}
        </button>
      )}

      {showAll && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAll(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-900">
                {t("amenities")}
              </h2>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                aria-label={t("showLess")}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              {Object.entries(grouped).map(([group, groupAmenities]) => (
                <div key={group}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {t(`amenityGroup.${group}`)}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {groupAmenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center gap-3 text-sm text-neutral-700"
                      >
                        <span className="text-lg">
                          {AMENITY_ICONS[amenity] ?? "✓"}
                        </span>
                        <span>
                          {t(`amenityLabel.${amenity}`, { default: amenity.replace(/_/g, " ") })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
