"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";

export function PasswordSection({
  hasPassword,
  onSaved,
}: {
  hasPassword: boolean;
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    if (next !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/password", {
        new_password: next,
        ...(hasPassword ? { current_password: current } : {}),
      });
      await onSaved();
      setSaved(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 401 ? t("invalidCredentials") : t("registerFailed")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <h2 className="text-lg font-bold text-neutral-900">
        {hasPassword ? t("changePassword") : t("setPassword")}
      </h2>
      {!hasPassword && (
        <p className="mt-1 text-sm text-neutral-600">{t("passwordSetHint")}</p>
      )}
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {hasPassword && (
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-neutral-700">
              {t("currentPassword")}
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className="input mt-1 w-full text-sm"
            />
          </div>
        )}
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-neutral-700">
            {t("newPassword")}
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            className="input mt-1 w-full text-sm"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-neutral-700">
            {t("confirmPassword")}
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="input mt-1 w-full text-sm"
          />
        </div>
        {error && (
          <p className="text-sm text-danger-600" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="text-sm text-success-700" role="status">
            {t("passwordUpdated")}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {submitting ? tc("loading") : tc("save")}
        </button>
      </form>
    </div>
  );
}
