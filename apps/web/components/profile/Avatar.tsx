"use client";

import { useRef, useState } from "react";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { useUploadAvatar } from "@/lib/queries/avatar";
import { getApiErrorMessage } from "@/lib/utils";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

export function Avatar({
  url,
  name,
  editable = false,
}: {
  url: string | null | undefined;
  name: string | null | undefined;
  editable?: boolean;
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const upload = useUploadAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    upload.mutate(file, {
      onError: (err) => setError(getApiErrorMessage(err, t("avatarUploadError"), tc("serviceUnavailable"))),
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-100">
        {url ? (
          <Image
            src={url}
            alt={name || t("profilePhoto")}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xl font-bold text-brand-700">
            {(name || "?").charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      {editable && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium text-accent-600 hover:text-accent-700 hover:underline disabled:opacity-50"
          >
            {upload.isPending ? tc("loading") : t("changePhoto")}
          </button>
          {error && (
            <p className="text-xs text-danger-600" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
