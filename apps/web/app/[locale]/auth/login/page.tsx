"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ConfirmationResult } from "firebase/auth";

import { AuthLayout } from "@/components/layouts";
import { useAuth } from "@/lib/auth/useAuth";
import { api } from "@/lib/api";

const DEV_USERS = [
  { id: "seed-admin-0000-0000-000000000001", label: "Admin" },
  { id: "seed-host-0000-0000-000000000002", label: "Host" },
  { id: "seed-guest-000-0000-000000000003", label: "Guest" },
];

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
  const [devLoading, setDevLoading] = useState<string | null>(null);

  async function handleDevLogin(userId: string) {
    setDevLoading(userId);
    setError(null);
    try {
      const { data } = await api.post<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
      }>("/auth/dev-token", { user_id: userId });
      const expiresAt = Date.now() + data.expires_in * 1000;
      const { setSession } = await import("@/lib/auth/storage");
      setSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      });
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dev login failed");
    } finally {
      setDevLoading(null);
    }
  }

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

      {!isFirebaseConfigured && (
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-neutral-500">
            Dev Login
          </p>
          <div className="flex flex-col gap-2">
            {DEV_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={devLoading !== null}
                onClick={() => handleDevLogin(u.id)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
              >
                {devLoading === u.id ? "Loading..." : `Login as ${u.label}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
