"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useInitiateKyc, useKycStatus, useSubmitKyc, useUpgradeRole } from "@/lib/queries/kyc";
import { useAuth } from "@/lib/auth/useAuth";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type Step = "select" | "uploading" | "submitted" | "verified" | "rejected";

export function KycUpload() {
  const t = useTranslations("kyc");
  const router = useRouter();
  const { user } = useAuth();
  const { data: kycStatus, isLoading: statusLoading } = useKycStatus();
  const initiateMutation = useInitiateKyc();
  const submitMutation = useSubmitKyc();
  const upgradeMutation = useUpgradeRole();

  const frontRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ front: number; selfie: number }>({
    front: 0,
    selfie: 0,
  });

  const currentStatus = kycStatus?.kyc_status ?? user?.kyc_status ?? "unverified";
  const latestDoc = kycStatus?.documents?.[0];

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return t("invalidType");
    }
    if (file.size > MAX_FILE_SIZE) {
      return t("fileTooLarge");
    }
    return null;
  };

  const handleFrontSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFrontFile(file);
    setFrontPreview(URL.createObjectURL(file));
  };

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  };

  const uploadToS3 = useCallback(
    async (url: string, file: File, side: "front" | "selfie") => {
      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadProgress((prev) => ({ ...prev, [side]: pct }));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
    },
    []
  );

  const handleSubmit = async () => {
    if (!frontFile || !selfieFile) {
      setError(t("bothRequired"));
      return;
    }

    setError(null);
    setUploadProgress({ front: 0, selfie: 0 });

    try {
      const initiate = await initiateMutation.mutateAsync({
        document_type: "national_id",
      });

      await uploadToS3(initiate.upload_urls.front, frontFile, "front");
      await uploadToS3(initiate.upload_urls.selfie, selfieFile, "selfie");

      await submitMutation.mutateAsync(initiate.document_id);
    } catch {
      setError(t("submitFailed"));
    }
  };

  const handleBecomeHost = async () => {
    try {
      await upgradeMutation.mutateAsync();
      router.push("/host");
    } catch {
      setError(t("upgradeFailed"));
    }
  };

  if (statusLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-neutral-500">{t("loading")}</p>
      </div>
    );
  }

  if (currentStatus === "verified") {
    return (
      <div className="rounded-xl bg-success-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
          <svg className="h-8 w-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-neutral-900">{t("verifiedTitle")}</h3>
        <p className="mt-2 text-sm text-neutral-600">{t("verifiedMessage")}</p>
        {user?.role === "guest" && (
          <button
            type="button"
            onClick={handleBecomeHost}
            disabled={upgradeMutation.isPending}
            className="mt-6 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {upgradeMutation.isPending ? t("upgrading") : t("becomeHost")}
          </button>
        )}
      </div>
    );
  }

  if (currentStatus === "pending" && latestDoc?.status === "pending") {
    return (
      <div className="rounded-xl bg-warning-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning-100">
          <svg className="h-8 w-8 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-neutral-900">{t("pendingTitle")}</h3>
        <p className="mt-2 text-sm text-neutral-600">{t("pendingMessage")}</p>
      </div>
    );
  }

  if (currentStatus === "rejected" && latestDoc) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-danger-50 p-6">
          <h3 className="text-lg font-bold text-danger-700">{t("rejectedTitle")}</h3>
          <p className="mt-2 text-sm text-danger-600">
            {t("rejectedMessage")}
          </p>
          {latestDoc.rejection_reason && (
            <p className="mt-3 rounded-lg bg-white p-3 text-sm text-neutral-700">
              {latestDoc.rejection_reason}
            </p>
          )}
        </div>
        <KycUploadForm
          t={t}
          frontRef={frontRef}
          selfieRef={selfieRef}
          frontPreview={frontPreview}
          selfiePreview={selfiePreview}
          onFrontSelect={handleFrontSelect}
          onSelfieSelect={handleSelfieSelect}
          error={error}
          onSubmit={handleSubmit}
          isSubmitting={initiateMutation.isPending || submitMutation.isPending}
          uploadProgress={uploadProgress}
        />
      </div>
    );
  }

  return (
    <KycUploadForm
      t={t}
      frontRef={frontRef}
      selfieRef={selfieRef}
      frontPreview={frontPreview}
      selfiePreview={selfiePreview}
      onFrontSelect={handleFrontSelect}
      onSelfieSelect={handleSelfieSelect}
      error={error}
      onSubmit={handleSubmit}
      isSubmitting={initiateMutation.isPending || submitMutation.isPending}
      uploadProgress={uploadProgress}
    />
  );
}

interface KycUploadFormProps {
  t: (key: string) => string;
  frontRef: React.RefObject<HTMLInputElement>;
  selfieRef: React.RefObject<HTMLInputElement>;
  frontPreview: string | null;
  selfiePreview: string | null;
  onFrontSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelfieSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  onSubmit: () => void;
  isSubmitting: boolean;
  uploadProgress: { front: number; selfie: number };
}

function KycUploadForm({
  t,
  frontRef,
  selfieRef,
  frontPreview,
  selfiePreview,
  onFrontSelect,
  onSelfieSelect,
  error,
  onSubmit,
  isSubmitting,
  uploadProgress,
}: KycUploadFormProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-neutral-50 p-4">
        <h3 className="text-sm font-semibold text-neutral-700">{t("instructions")}</h3>
        <ul className="mt-2 space-y-1 text-sm text-neutral-600">
          <li>{t("step1")}</li>
          <li>{t("step2")}</li>
          <li>{t("step3")}</li>
        </ul>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <UploadSlot
          label={t("frontId")}
          hint={t("frontIdHint")}
          preview={frontPreview}
          inputRef={frontRef}
          onSelect={onFrontSelect}
          progress={uploadProgress.front}
        />
        <UploadSlot
          label={t("selfie")}
          hint={t("selfieHint")}
          preview={selfiePreview}
          inputRef={selfieRef}
          onSelect={onSelfieSelect}
          progress={uploadProgress.selfie}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </button>
      </div>
    </div>
  );
}

interface UploadSlotProps {
  label: string;
  hint: string;
  preview: string | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  progress: number;
}

function UploadSlot({ label, hint, preview, inputRef, onSelect, progress }: UploadSlotProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-neutral-700">{label}</label>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      <div className="mt-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 transition-colors hover:border-brand-400 hover:bg-brand-50"
        >
          {preview ? (
            <img src={preview} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="text-center">
              <svg className="mx-auto h-10 w-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="mt-2 block text-sm text-neutral-500">{label}</span>
            </div>
          )}
          {progress > 0 && progress < 100 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-sm font-medium text-white">{progress}%</span>
            </div>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onSelect}
        />
      </div>
    </div>
  );
}
