"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import { useKycVerificationSession } from "@/lib/queries/kyc";

const CONTAINER_ID = "kyc-verification-sdk";

interface KycProviderFlowProps {
  /** Called when the provider reports no session — manual upload UI. */
  onManualFallback: () => void;
}

/**
 * Embedded automated identity verification. The provider SDK owns document
 * capture, quality checks, liveness and face match; StayOS only mints the
 * session and observes the server-authoritative result via /kyc/status.
 * The flow only launches on explicit user action so camera permission is
 * requested in context, not on page load.
 */
export function KycProviderFlow({ onManualFallback }: KycProviderFlowProps) {
  const t = useTranslations("kyc");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale === "en" ? "en" : "ar";
  const queryClient = useQueryClient();
  const sessionMutation = useKycVerificationSession();
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const refreshToken = useCallback(async (): Promise<string> => {
    const fresh = await sessionMutation.mutateAsync();
    if (!fresh.access_token) {
      throw new Error("verification session expired");
    }
    return fresh.access_token;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const launch = useCallback(async () => {
    setError(null);
    try {
      const session = await sessionMutation.mutateAsync();
      if (session.mode === "manual") {
        onManualFallback();
        return;
      }
      if (!session.access_token) {
        setError(t("submitFailed"));
        return;
      }

      const { default: snsWebSdk } = await import("@sumsub/websdk");
      const instance = snsWebSdk
        .init(session.access_token, refreshToken)
        .withConf({ lang: locale })
        .on("idCheck.onApplicantStatusChanged", () => {
          queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
        })
        .on("idCheck.onError", () => {
          setError(t("submitFailed"));
        })
        .build();
      instance.launch(`#${CONTAINER_ID}`);
    } catch {
      setError(t("submitFailed"));
    }
  }, [locale, onManualFallback, queryClient, refreshToken, sessionMutation, t]);

  const handleStart = () => {
    setStarted(true);
    void launch();
  };

  if (!started) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-neutral-50 p-4">
          <h3 className="text-sm font-semibold text-neutral-700">
            {t("autoVerifyTitle")}
          </h3>
          <p className="mt-1 text-sm text-neutral-600">{t("autoVerifyHint")}</p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <button
            type="button"
            onClick={handleStart}
            disabled={sessionMutation.isPending}
            className="btn-primary text-sm"
          >
            {sessionMutation.isPending ? t("loading") : t("startVerification")}
          </button>
          <button
            type="button"
            onClick={onManualFallback}
            className="text-sm text-neutral-500 underline-offset-2 hover:underline"
          >
            {t("manualInstead")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-neutral-50 p-4">
        <h3 className="text-sm font-semibold text-neutral-700">
          {t("autoVerifyTitle")}
        </h3>
        <p className="mt-1 text-sm text-neutral-600">{t("autoVerifyHint")}</p>
      </div>
      <div id={CONTAINER_ID} className="min-h-[400px] rounded-xl bg-white" />
      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-danger-600">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void launch()}
            className="btn-primary text-sm"
          >
            {t("retry")}
          </button>
        </div>
      )}
    </div>
  );
}
