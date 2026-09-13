"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { RatingBadge } from "@/components/ui/RatingBadge";
import {
  useListingReviews,
  fetchMoreReviews,
  type Review,
  type Subratings,
  SUBRATING_KEYS,
} from "@/lib/queries/reviews";

const PAGE_SIZE = 10;

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "short",
  });
}

function SubratingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-xs text-neutral-600">{label}</span>
      <div className="flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-amber-400"
            style={{ width: `${(value / 5) * 100}%` }}
          />
        </div>
      </div>
      <span className="w-6 shrink-0 text-right text-xs font-medium text-neutral-700">
        {value}
      </span>
    </div>
  );
}

function ReviewCard({
  review,
  locale,
  t,
}: {
  review: Review;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const hasSubratings =
    review.subratings && Object.keys(review.subratings).length > 0;

  return (
    <div className="rounded-lg bg-neutral-50 p-4">
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

      {hasSubratings && (
        <div className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3">
          {SUBRATING_KEYS.map((key) => {
            const value = (review.subratings as Subratings)[key];
            if (value === undefined) return null;
            return (
              <SubratingBar
                key={key}
                label={t(`subrating_${key}`)}
                value={value}
              />
            );
          })}
        </div>
      )}

      {review.hostResponse && (
        <div className="mt-3 border-t border-neutral-200 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t("hostResponse")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-700">
            {review.hostResponse}
          </p>
        </div>
      )}
    </div>
  );
}

export function ReviewsSection({ unitId, locale }: { unitId: string; locale: string }) {
  const t = useTranslations("listing");
  const tc = useTranslations("common");
  const { data, isPending, isError, refetch } = useListingReviews(unitId);
  const [extraReviews, setExtraReviews] = useState<Review[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const allReviews = [...(data?.data ?? []), ...extraReviews];
  const totalReviewCount = data?.reviewCount ?? 0;
  const hasMore = allReviews.length < totalReviewCount;

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const more = await fetchMoreReviews(unitId, allReviews.length, PAGE_SIZE);
      setExtraReviews((prev) => [...prev, ...more]);
    } finally {
      setLoadingMore(false);
    }
  };

  if (isError) {
    return (
      <section className="rounded-xl bg-white p-4 shadow-card sm:p-6">
        <p className="text-sm text-danger-600">{tc("error")}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-sm font-semibold text-accent-600 hover:text-accent-700"
        >
          {tc("retry")}
        </button>
      </section>
    );
  }

  if (isPending) {
    return (
      <section className="rounded-xl bg-white p-4 shadow-card sm:p-6">
        <div className="h-5 w-32 animate-pulse rounded bg-neutral-100" />
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white p-4 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
          {t("reviews", { count: totalReviewCount })}
        </h2>
        <RatingBadge averageRating={data?.averageRating} reviewCount={totalReviewCount} />
      </div>

      {allReviews.length === 0 ? (
        <p className="text-sm text-neutral-500">{t("noReviews")}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {allReviews.map((review) => (
              <ReviewCard key={review.id} review={review} locale={locale} t={t} />
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mt-4 w-full rounded-lg border border-neutral-200 py-2.5 text-sm font-semibold text-brand-900 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              {loadingMore ? tc("loading") : t("showMoreReviews")}
            </button>
          )}
        </>
      )}
    </section>
  );
}
