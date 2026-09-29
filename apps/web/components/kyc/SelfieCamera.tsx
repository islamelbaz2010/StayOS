"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type CameraState = "starting" | "live" | "captured" | "denied" | "unavailable";

interface SelfieCameraProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

/**
 * Live camera capture for the manual-KYC selfie step.
 *
 * Frames are never stored automatically — the user reviews the captured
 * still and only "Use photo" hands a File to the existing upload pipeline.
 * Any failure (no getUserMedia, denied permission, init error) leaves the
 * "Upload from device" path available in the parent form.
 */
export function SelfieCamera({ onCapture, onClose }: SelfieCameraProps) {
  const t = useTranslations("kyc.camera");
  const tc = useTranslations("common");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("starting");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setState("unavailable");
      return;
    }
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("live");
    } catch (err) {
      stopStream();
      setState(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "denied"
          : "unavailable"
      );
    }
  }, [stopStream]);

  useEffect(() => {
    void startCamera();
    return () => stopStream();
  }, [startCamera, stopStream]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const captureFrame = () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setCapturedFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        setState("captured");
      },
      "image/jpeg",
      0.92
    );
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCapturedFile(null);
    setState("live");
  };

  const usePhoto = () => {
    if (!capturedFile) return;
    stopStream();
    onCapture(capturedFile);
    onClose();
  };

  const close = () => {
    stopStream();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">{t("title")}</h3>
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-neutral-500 hover:bg-neutral-100"
          >
            {tc("close")}
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-900">
          {/* Video stays mounted while captured so Retake resumes the live
              stream without re-requesting the camera. */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          {state === "captured" && previewUrl && (
            <img
              src={previewUrl}
              alt={t("title")}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          )}
          {state === "starting" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-white">{t("starting")}</p>
            </div>
          )}
        </div>

        {state === "live" && (
          <p className="mt-2 text-center text-xs text-neutral-500">
            {t("hint")}
          </p>
        )}
        {(state === "denied" || state === "unavailable") && (
          <p className="mt-3 rounded-lg bg-warning-50 p-3 text-sm text-warning-800" role="alert">
            {state === "denied" ? t("denied") : t("unavailable")}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          {state === "live" && (
            <button
              type="button"
              onClick={captureFrame}
              className="btn-primary text-sm"
            >
              {t("capture")}
            </button>
          )}
          {state === "captured" && (
            <>
              <button
                type="button"
                onClick={retake}
                className="btn-secondary text-sm"
              >
                {t("retake")}
              </button>
              <button
                type="button"
                onClick={usePhoto}
                className="btn-primary text-sm"
              >
                {t("usePhoto")}
              </button>
            </>
          )}
          {(state === "denied" || state === "unavailable") && (
            <button
              type="button"
              onClick={close}
              className="btn-secondary text-sm"
            >
              {t("uploadInstead")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
