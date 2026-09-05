"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useCreateReview } from "@/lib/queries/reviews";

interface LeaveReviewFormProps {
  bookingId: string;
  unitId: string;
  onSubmitted: () => void;
}

export function LeaveReviewForm({ bookingId, unitId, onSubmitted }: LeaveReviewFormProps) {
  const t = useTranslations("trips");
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createReview = useCreateReview();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
      >
        {t("leaveReview")}
      </button>
    );
  }

  async function handleSubmit() {
    setError(null);
    try {
      await createReview.mutateAsync({
        bookingId,
        unitId,
        rating,
        comment: comment.trim() || undefined,
      });
      setOpen(false);
      onSubmitted();
    } catch {
      setError(t("reviewError"));
    }
  }

  return (
    <div className="mt-3 w-full rounded-lg border border-neutral-300 bg-neutral-50 p-4 sm:w-96">
      <p className="text-sm font-medium text-neutral-900">{t("reviewTitle")}</p>

      <div className="mt-3 flex gap-1" role="radiogroup" aria-label={t("reviewRating")}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value}`}
            className={`text-2xl ${
              value <= rating ? "text-amber-400" : "text-neutral-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <label htmlFor={`review-comment-${bookingId}`} className="mt-3 block text-xs text-neutral-500">
        {t("reviewCommentPlaceholder")}
      </label>
      <textarea
        id={`review-comment-${bookingId}`}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mt-1 w-full rounded-lg border border-neutral-300 p-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none"
        rows={3}
      />

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={createReview.isPending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:bg-neutral-400"
        >
          {createReview.isPending ? t("reviewSubmitting") : t("reviewSubmit")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-white"
        >
          {t("reviewCancel")}
        </button>
      </div>
    </div>
  );
}
