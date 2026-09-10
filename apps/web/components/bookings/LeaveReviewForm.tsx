"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useCreateReview } from "@/lib/queries/reviews";
import { getApiErrorMessage } from "@/lib/utils";

interface LeaveReviewFormProps {
  bookingId: string;
  unitId: string;
  onSubmitted: () => void;
}

export function LeaveReviewForm({
  bookingId,
  unitId,
  onSubmitted,
}: LeaveReviewFormProps) {
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
        className="rounded-lg border border-accent-600 px-4 py-2 text-sm font-medium text-accent-600 transition hover:bg-accent-100"
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
    } catch (err) {
      setError(getApiErrorMessage(err, t("reviewError")));
    }
  }

  return (
    <div className="mt-3 w-full rounded-card border border-neutral-200 bg-surface-page p-4 sm:w-96">
      <p className="text-sm font-medium text-brand-900">{t("reviewTitle")}</p>

      <div
        className="mt-3 flex gap-1"
        role="radiogroup"
        aria-label={t("reviewRating")}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value}`}
            className={`text-2xl transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
              value <= rating ? "text-warning-500" : "text-neutral-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <label
        htmlFor={`review-comment-${bookingId}`}
        className="mt-3 block text-xs font-medium text-neutral-500"
      >
        {t("reviewCommentPlaceholder")}
      </label>
      <textarea
        id={`review-comment-${bookingId}`}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="input mt-1 min-h-[5rem] text-sm"
        rows={3}
      />

      {error && (
        <p
          className="mt-2 rounded-md bg-danger-50 p-2 text-sm text-danger-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={createReview.isPending}
          className="btn-primary rounded-lg px-4 py-2 text-sm"
        >
          {createReview.isPending ? t("reviewSubmitting") : t("reviewSubmit")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-secondary rounded-lg px-4 py-2 text-sm"
        >
          {t("reviewCancel")}
        </button>
      </div>
    </div>
  );
}
