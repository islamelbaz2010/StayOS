"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ConfirmationResult } from "firebase/auth";

import { AuthLayout } from "@/components/layouts";
import { useAuth } from "@/lib/auth/useAuth";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    sendOtp,
    confirmOtp,
    isLoading,
    isFirebaseConfigured,
    sendOtpViaBackend,
    verifyOtpViaBackend,
    login,
  } = useAuth();

  const locale = params?.locale ?? "ar";
  const redirect = searchParams.get("redirect") || `/${locale}`;

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleEmailRegister(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
      }>("/auth/register", {
        email,
        password,
        display_name: name || undefined,
        locale,
      });
      await login(data);
      router.push(redirect);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 409
          ? t("emailExists")
          : err instanceof Error
            ? err.message
            : t("registerFailed")
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isFirebaseConfigured) {
        const result = await sendOtp(phone, "recaptcha-container");
        setConfirmation(result);
      } else {
        await sendOtpViaBackend(phone);
      }
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("otpSendFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isFirebaseConfigured && confirmation) {
        await confirmOtp(confirmation, code);
      } else {
        await verifyOtpViaBackend(phone, code);
      }
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
      <h1 className="text-2xl font-bold text-neutral-900">{t("signUp")}</h1>
      <p className="mt-2 text-sm text-neutral-600">{t("registerSubtitle")}</p>

      <div className="mt-4 flex rounded-lg bg-neutral-100 p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={method === "phone"}
          onClick={() => {
            setMethod("phone");
            setError(null);
          }}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            method === "phone"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          {t("phone")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={method === "email"}
          onClick={() => {
            setMethod("email");
            setError(null);
          }}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            method === "email"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          {t("email")}
        </button>
      </div>

      {method === "email" ? (
        <form onSubmit={handleEmailRegister} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="register-name"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              {t("displayName")}
            </label>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label
              htmlFor="register-email"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              {t("email")}
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label
              htmlFor="register-password"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              {t("password")}
            </label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <p className="mt-1 text-xs text-neutral-500">{t("passwordHint")}</p>
          </div>
          <div>
            <label
              htmlFor="register-confirm"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              {t("confirmPassword")}
            </label>
            <input
              id="register-confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? t("signingIn") : t("createAccount")}
          </button>
        </form>
      ) : step === "phone" ? (
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
          {isFirebaseConfigured && <div id="recaptcha-container"></div>}
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

      <p className="mt-6 text-center text-sm text-neutral-600">
        {t("haveAccount")}{" "}
        <Link
          href={`/${locale}/auth/login${redirect !== `/${locale}` ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          {t("signIn")}
        </Link>
      </p>
    </AuthLayout>
  );
}
