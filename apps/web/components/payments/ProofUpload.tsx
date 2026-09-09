"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { useAuth } from "@/lib/auth/useAuth";
import {
  usePresignProof,
  useUploadProof,
  type PaymentProofPresignResponse,
} from "@/lib/queries/payments";

interface ProofUploadProps {
  paymentId: string;
  disabled?: boolean;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function ProofUpload({ paymentId, disabled }: ProofUploadProps) {
  const t = useTranslations("payment");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { user } = useAuth();
  const isKycVerified = user?.kyc_status === "verified";
  const isDisabled = disabled || !isKycVerified;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const presignMutation = usePresignProof();
  const uploadMutation = useUploadProof();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(t("invalidType"));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(t("fileTooLarge"));
        return;
      }

      setIsUploading(true);
      try {
        const presignRes: PaymentProofPresignResponse =
          await presignMutation.mutateAsync({
            paymentId,
            payload: { filename: file.name, content_type: file.type },
          });

        const putResponse = await fetch(presignRes.upload_url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!putResponse.ok) {
          throw new Error(`S3 upload failed: ${putResponse.status}`);
        }

        await uploadMutation.mutateAsync({
          paymentId,
          payload: { s3_key: presignRes.proof_key },
        });
      } catch {
        setError(t("uploadFailed") ?? tc("error"));
      } finally {
        setIsUploading(false);
      }
    },
    [paymentId, presignMutation, uploadMutation, t, tc]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (isDisabled || isUploading) return;
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [isDisabled, isUploading, handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-3">
      {!isKycVerified && (
        <div className="mb-4 rounded-lg bg-warning-50 p-4">
          <p className="text-sm text-warning-800">{t("kycRequired")}</p>
          <Link
            href={`/${locale}/host/kyc`}
            className="mt-2 inline-block text-sm font-semibold text-accent-600 hover:text-accent-700"
          >
            {t("kycRequiredCta")}
          </Link>
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDisabled || isUploading
            ? "border-neutral-200 bg-neutral-50"
            : "border-neutral-300 bg-neutral-50 hover:border-accent-400 hover:bg-accent-100"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleChange}
          disabled={isDisabled || isUploading}
          className="sr-only"
          aria-label={t("selectProof")}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled || isUploading}
          className="text-sm font-medium text-accent-600 hover:text-accent-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
        >
          {isUploading ? t("uploading") : t("selectProof")}
        </button>
        <p className="mt-2 text-xs text-neutral-500">{t("formatsHint")}</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
