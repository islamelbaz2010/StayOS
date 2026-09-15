"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  useCreateDispute,
  type DisputeCategory,
} from "@/lib/queries/disputes";
import { useAuth } from "@/lib/auth/useAuth";

const CATEGORIES: DisputeCategory[] = [
  "booking",
  "payment",
  "property",
  "host",
  "guest",
  "other",
];

export function ReportProblem({ bookingId }: { bookingId: string }) {
  const t = useTranslations("disputes");
  const tc = useTranslations("common");
  const createMutation = useCreateDispute();
  const { user } = useAuth();

  // Only booking participants file disputes — ops accounts use the
  // admin dispute queue instead.
  const isOps =
    user?.role === "admin" ||
    user?.role === "staff" ||
    user?.role === "field_staff";

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<DisputeCategory>("booking");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    setError(null);
    try {
      await createMutation.mutateAsync({
        booking_id: bookingId,
        category,
        description: description.trim(),
      });
      setSubmitted(true);
      setOpen(false);
    } catch {
      setError(t("submitFailed"));
    }
  };

  if (isOps || submitted) {
    return submitted ? (
      <p className="rounded-lg bg-success-50 p-3 text-center text-sm text-success-700">
        {t("submitted")}
      </p>
    ) : null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        {t("reportProblem")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-card bg-surface-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-brand-900">
              {t("reportProblem")}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">{t("intro")}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={
                    category === c
                      ? "rounded-full bg-brand-900 px-3 py-1.5 text-xs font-medium text-white"
                      : "rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
                  }
                >
                  {t(`category.${c}`)}
                </button>
              ))}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
              className="input mt-4 w-full text-sm"
            />

            {error && (
              <p className="mt-2 text-sm text-danger-600" role="alert">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                disabled={
                  createMutation.isPending || description.trim().length < 10
                }
                onClick={submit}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {createMutation.isPending ? tc("loading") : t("submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
