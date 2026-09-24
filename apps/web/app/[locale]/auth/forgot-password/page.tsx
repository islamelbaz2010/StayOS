"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { AuthLayout } from "@/components/layouts";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const locale = params?.locale ?? "ar";
  const redirect = searchParams?.get("redirect") || `/${locale}`;

  const [step, setStep] = useState<"identify" | "reset" | "done">("identify");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRequest(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/auth/password/forgot", { identifier });
      setStep("reset");
    } catch (err) {
      setError(getApiErrorMessage(err, t("resetRequestFailed")));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/auth/password/reset", {
        identifier,
        code,
        new_password: newPassword,
      });
      setStep("done");
    } catch (err) {
      setError(getApiErrorMessage(err, t("resetFailed")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-neutral-900">
        {t("forgotPasswordTitle")}
      </h1>

      {step === "identify" && (
        <>
          <p className="mt-2 text-sm text-neutral-600">
            {t("forgotPasswordHint")}
          </p>
          <form onSubmit={handleRequest} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="identifier"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                {t("identifierLabel")}
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? t("sending") : t("sendCode")}
            </button>
          </form>
        </>
      )}

      {step === "reset" && (
        <>
          <p className="mt-2 text-sm text-neutral-600">
            {t("resetCodeSentHint")}
          </p>
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="code"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                {t("codeLabel")}
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                minLength={6}
                maxLength={6}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label
                htmlFor="new-password"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                {t("newPassword")}
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                {t("confirmPassword")}
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? t("resetting") : t("resetPassword")}
            </button>
          </form>
        </>
      )}

      {step === "done" && (
        <div className="mt-6 rounded-lg bg-success-50 p-4 text-center">
          <p className="text-sm font-medium text-success-800">
            {t("resetSuccess")}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-danger-600" role="alert">
          {error}
        </p>
      )}

      <p className="mt-6 text-center">
        <Link
          href={`/${locale}/auth/login?redirect=${encodeURIComponent(redirect)}`}
          className="text-sm font-medium text-accent-600 hover:text-accent-700 hover:underline"
        >
          {t("backToSignIn")}
        </Link>
      </p>
    </AuthLayout>
  );
}
