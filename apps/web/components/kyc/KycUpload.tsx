"use client";

import { useCallback, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useInitiateKyc, useKycStatus, useSubmitKyc, useUpgradeRole } from "@/lib/queries/kyc";
import { useAuth } from "@/lib/auth/useAuth";
import { getApiErrorMessage } from "@/lib/utils";
import { KycProviderFlow } from "@/components/kyc/KycProviderFlow";
import { SelfieCamera } from "@/components/kyc/SelfieCamera";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const DOCUMENT_TYPES = [
  "passport",
  "national_id",
  "driving_license",
  "residence_permit",
] as const;

type ImageSide = "front" | "back" | "selfie";

interface SideFile {
  file: File | null;
  preview: string | null;
}

export function KycUpload() {
  const t = useTranslations("kyc");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const { user, refreshUser } = useAuth();
  const { data: kycStatus, isLoading: statusLoading } = useKycStatus();
  const initiateMutation = useInitiateKyc();
  const submitMutation = useSubmitKyc();
  const upgradeMutation = useUpgradeRole();

  const [documentType, setDocumentType] = useState<string>("");
  const [files, setFiles] = useState<Record<ImageSide, SideFile>>({
    front: { file: null, preview: null },
    back: { file: null, preview: null },
    selfie: { file: null, preview: null },
  });
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const inputRefs: Record<ImageSide, React.RefObject<HTMLInputElement>> = {
    front: frontRef,
    back: backRef,
    selfie: selfieRef,
  };
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<ImageSide, number>>({
    front: 0,
    back: 0,
    selfie: 0,
  });
  // Manual upload fallback when the automated provider is unavailable.
  const [manualFallback, setManualFallback] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const currentStatus = kycStatus?.kyc_status ?? user?.kyc_status ?? "unverified";
  const automated =
    Boolean(kycStatus?.automated_available) &&
    kycStatus?.verification_mode !== "manual" &&
    !manualFallback;
  const latestDoc = kycStatus?.documents?.[0];
  // Host onboarding requires a document that completed review — a verified
  // flag without one (e.g. a seeded account) must still submit documents.
  const hasVerifiedDoc =
    kycStatus?.documents?.some((d) => d.status === "verified") ?? false;

  // Document-side requirements come from the backend contract
  // (kyc.required_sides), not a universal front/selfie assumption.
  const requiredSides: ImageSide[] =
    (kycStatus?.required_sides?.[documentType] as ImageSide[] | undefined) ??
    (documentType === "passport"
      ? ["front", "selfie"]
      : ["front", "back", "selfie"]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return t("invalidType");
    }
    if (file.size > MAX_FILE_SIZE) {
      return t("fileTooLarge");
    }
    return null;
  };

  const makeSelectHandler =
    (side: ImageSide) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setFiles((prev) => ({
        ...prev,
        [side]: { file, preview: URL.createObjectURL(file) },
      }));
    };

  // Camera capture feeds the same validation + state as a file pick —
  // only the user-confirmed "Use photo" frame reaches this point.
  const handleCameraCapture = (file: File) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFiles((prev) => ({
      ...prev,
      selfie: { file, preview: URL.createObjectURL(file) },
    }));
  };

  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDocumentType(e.target.value);
    setFiles({
      front: { file: null, preview: null },
      back: { file: null, preview: null },
      selfie: { file: null, preview: null },
    });
    setError(null);
  };

  const uploadToS3 = useCallback(
    async (url: string, file: File, side: ImageSide) => {
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
    if (!documentType) {
      setError(t("documentTypeRequired"));
      return;
    }
    if (requiredSides.some((side) => !files[side].file)) {
      setError(t("bothRequired"));
      return;
    }

    setError(null);
    setUploadProgress({ front: 0, back: 0, selfie: 0 });

    try {
      const initiate = await initiateMutation.mutateAsync({
        document_type: documentType,
        front_content_type: files.front.file?.type,
        back_content_type: files.back.file?.type,
        selfie_content_type: files.selfie.file?.type,
      });

      for (const side of requiredSides) {
        const file = files[side].file;
        if (file) {
          await uploadToS3(initiate.upload_urls[side], file, side);
        }
      }

      await submitMutation.mutateAsync(initiate.document_id);
    } catch (err) {
      setError(getApiErrorMessage(err, t("submitFailed"), tc("serviceUnavailable")));
    }
  };

  const handleBecomeHost = async () => {
    try {
      await upgradeMutation.mutateAsync();
      // Refresh the auth user so header/layouts reflect the new host
      // role immediately instead of waiting for a full reload.
      await refreshUser();
      router.push(`/${locale}/host`);
    } catch {
      setError(t("upgradeFailed"));
    }
  };

  const manualForm = (
    <>
      <KycUploadForm
      t={t}
      documentType={documentType}
      requiredSides={requiredSides}
      files={files}
      inputRefs={inputRefs}
      onDocumentTypeChange={handleDocumentTypeChange}
      onSelect={makeSelectHandler}
      error={error}
      onSubmit={handleSubmit}
      isSubmitting={initiateMutation.isPending || submitMutation.isPending}
      uploadProgress={uploadProgress}
      onOpenCamera={() => setCameraOpen(true)}
      />
      {cameraOpen && (
        <SelfieCamera
          onCapture={handleCameraCapture}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </>
  );

  if (statusLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-neutral-500">{t("loading")}</p>
      </div>
    );
  }

  if (
    currentStatus === "verified" &&
    (user?.role !== "guest" || hasVerifiedDoc)
  ) {
    return (
      <div className="rounded-xl bg-success-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
          <svg className="h-8 w-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-neutral-900">{t("verifiedTitle")}</h3>
        <p className="mt-2 text-sm text-neutral-600">{t("verifiedMessage")}</p>
        {error && (
          <p className="mt-3 text-sm text-danger-600" role="alert">
            {error}
          </p>
        )}
        {user?.role === "guest" && (
          <button
            type="button"
            onClick={handleBecomeHost}
            disabled={upgradeMutation.isPending}
            className="btn-primary text-sm"
          >
            {upgradeMutation.isPending ? t("upgrading") : t("becomeHost")}
          </button>
        )}
      </div>
    );
  }

  if (
    (currentStatus === "pending" && latestDoc?.status === "pending") ||
    currentStatus === "manual_review"
  ) {
    return (
      <div className="rounded-xl bg-warning-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning-100">
          <svg className="h-8 w-8 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-neutral-900">{t("pendingTitle")}</h3>
        <p className="mt-2 text-sm text-neutral-600">
          {currentStatus === "manual_review"
            ? t("manualReviewMessage")
            : t("pendingMessage")}
        </p>
      </div>
    );
  }

  // Recoverable provider rejection — the user may retry without admin
  // intervention. No fraud details are surfaced.
  if (currentStatus === "retry_required") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-warning-50 p-6">
          <h3 className="text-lg font-bold text-warning-700">{t("retryTitle")}</h3>
          <p className="mt-2 text-sm text-warning-700">{t("retryMessage")}</p>
        </div>
        {automated ? (
          <KycProviderFlow onManualFallback={() => setManualFallback(true)} />
        ) : (
          manualForm
        )}
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
        {automated ? (
          <KycProviderFlow onManualFallback={() => setManualFallback(true)} />
        ) : (
          manualForm
        )}
      </div>
    );
  }

  if (automated) {
    return <KycProviderFlow onManualFallback={() => setManualFallback(true)} />;
  }

  return manualForm;
}

interface KycUploadFormProps {
  t: (key: string) => string;
  documentType: string;
  requiredSides: ImageSide[];
  files: Record<ImageSide, SideFile>;
  inputRefs: Record<ImageSide, React.RefObject<HTMLInputElement>>;
  onDocumentTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSelect: (side: ImageSide) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  onSubmit: () => void;
  isSubmitting: boolean;
  uploadProgress: Record<ImageSide, number>;
  onOpenCamera: () => void;
}

function KycUploadForm({
  t,
  documentType,
  requiredSides,
  files,
  inputRefs,
  onDocumentTypeChange,
  onSelect,
  error,
  onSubmit,
  isSubmitting,
  uploadProgress,
  onOpenCamera,
}: KycUploadFormProps) {
  // Side label: passports capture the photo page rather than a "front".
  const sideLabel = (side: ImageSide): string =>
    side === "front" && documentType === "passport"
      ? t("passportPhotoPage")
      : side === "selfie"
        ? t("selfie")
        : t(side === "front" ? "documentFront" : "documentBack");

  const sideHint = (side: ImageSide): string =>
    side === "selfie" ? t("selfieHint") : t("documentImageHint");

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

      <div>
        <label
          htmlFor="kyc-document-type"
          className="block text-sm font-semibold text-neutral-700"
        >
          {t("documentType")}
        </label>
        <select
          id="kyc-document-type"
          value={documentType}
          onChange={onDocumentTypeChange}
          className="input mt-2 w-full"
        >
          <option value="" disabled>
            {t("documentTypePlaceholder")}
          </option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`docTypes.${type}`)}
            </option>
          ))}
        </select>
      </div>

      {documentType && (
        <div className={`grid gap-6 ${requiredSides.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {requiredSides.map((side) => (
            <UploadSlot
              key={side}
              label={sideLabel(side)}
              hint={sideHint(side)}
              preview={files[side].preview}
              inputRef={inputRefs[side]}
              onSelect={onSelect(side)}
              progress={uploadProgress[side]}
              onOpenCamera={side === "selfie" ? onOpenCamera : undefined}
              cameraLabel={t("camera.takeSelfie")}
              uploadLabel={t("camera.uploadFromDevice")}
            />
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !documentType}
          className="btn-primary text-sm"
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
  onOpenCamera?: () => void;
  cameraLabel?: string;
  uploadLabel?: string;
}

function UploadSlot({ label, hint, preview, inputRef, onSelect, progress, onOpenCamera, cameraLabel, uploadLabel }: UploadSlotProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-neutral-700">{label}</label>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      {onOpenCamera && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onOpenCamera}
            className="btn-primary flex-1 text-sm"
          >
            {cameraLabel}
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-secondary flex-1 text-sm"
          >
            {uploadLabel}
          </button>
        </div>
      )}
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
