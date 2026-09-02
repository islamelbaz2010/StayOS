"use client";

import { useTranslations } from "next-intl";

import { RatingBadge } from "@/components/ui/RatingBadge";
import { useListingReviews } from "@/lib/queries/reviews";

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "short",
  });
}

export function ReviewsSection({ unitId, locale }: { unitId: string; locale: string }) {
  const t = useTranslations("listing");
  const { data, isPending } = useListingReviews(unitId);

  if (isPending) {
    return (
      <section className="rounded-xl bg-white p-4 shadow-card sm:p-6">
        <div className="h-5 w-32 animate-pulse rounded bg-neutral-100" />
      </section>
    );
  }

  const reviews = data?.data ?? [];

  return (
    <section className="rounded-xl bg-white p-4 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
          {t("reviews", { count: data?.reviewCount ?? 0 })}
        </h2>
        <RatingBadge averageRating={data?.averageRating} reviewCount={data?.reviewCount} />
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-neutral-500">{t("noReviews")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-900">
                  {review.guestDisplayName || t("guest")}
                </p>
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`h-3.5 w-3.5 ${i < review.rating ? "" : "text-neutral-200"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.287 3.959c.3.92-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.959a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                {formatDate(review.createdAt, locale)}
              </p>
              {review.comment && (
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
