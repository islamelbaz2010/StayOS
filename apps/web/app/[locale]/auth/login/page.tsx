"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ConfirmationResult } from "firebase/auth";

import { AuthLayout } from "@/components/layouts";
import { useAuth } from "@/lib/auth/useAuth";

export default function LoginPage() {
  const t = useTranslations("auth");
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sendOtp, confirmOtp, isLoading, isFirebaseConfigured } = useAuth();

  const locale = params?.locale ?? "ar";
  const redirect = searchParams.get("redirect") || `/${locale}`;

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!isFirebaseConfigured) {
      setError(t("otpSendFailed"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await sendOtp(phone, "recaptcha-container");
      setConfirmation(result);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("otpSendFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    if (!confirmation) return;
    setSubmitting(true);
    setError(null);
    try {
      await confirmOtp(confirmation, code);
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("invalidOtp"));
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <AuthLayout>
        <p className="text-center text-neutral-600">{t("signingIn")}</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-neutral-900">{t("signIn")}</h1>
      <p className="mt-2 text-sm text-neutral-600">{t("loginSubtitle")}</p>

      {!isFirebaseConfigured && (
        <p className="mt-4 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
          {t("otpSendFailed")}
        </p>
      )}

      {step === "phone" ? (
        <form onSubmit={handleSend} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="phone"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              {t("phone")}
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              required
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <button
            id="sign-in-button"
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? t("signingIn") : t("sendOtp")}
          </button>
          <div id="recaptcha-container"></div>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <p className="text-sm text-neutral-600">
            {t("otpSent", { phone })}
          </p>
          <div>
            <label
              htmlFor="code"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              {t("code")}
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? t("signingIn") : t("verifyOtp")}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setConfirmation(null);
              setError(null);
            }}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-center font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            {t("resend")}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 text-center text-sm text-danger-600">{error}</p>
      )}
    </AuthLayout>
  );
}
