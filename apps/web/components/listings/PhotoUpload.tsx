"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import {
  useCreatePhoto,
  useDeletePhoto,
  usePhotos,
  usePresignPhoto,
  useSetCoverPhoto,
  type PhotoResponse,
} from "@/lib/queries/photos";

import { api } from "@/lib/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface UploadItem {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
  photoId?: string;
}

interface PhotoUploadProps {
  unitId: string;
}

export function PhotoUpload({ unitId }: PhotoUploadProps) {
  const t = useTranslations("photos");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<PhotoResponse | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragDrop, setIsDragDrop] = useState(false);

  const { data: photos = [], isLoading } = usePhotos(unitId);
  const presignMutation = usePresignPhoto();
  const createPhotoMutation = useCreatePhoto();
  const setCoverMutation = useSetCoverPhoto();
  const deleteMutation = useDeletePhoto();

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const reordered = [...photos];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    try {
      await api.patch(`/listings/${unitId}/photos/reorder`, {
        photo_orders: reordered.map((p, i) => ({ photo_id: p.id, display_order: i })),
      });
    } catch {
      // silently fail reorder — photos still work, order will revert on refresh
    }
  };

  const updateUpload = (index: number, patch: Partial<UploadItem>) => {
    setUploads((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const uploadFile = useCallback(
    async (file: File, index: number) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        updateUpload(index, {
          status: "error",
          error: t("invalidType"),
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        updateUpload(index, {
          status: "error",
          error: t("fileTooLarge"),
        });
        return;
      }

      try {
        updateUpload(index, { status: "uploading", progress: 0 });

        const presign = await presignMutation.mutateAsync({
          unitId,
          payload: { filename: file.name, content_type: file.type },
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              updateUpload(index, { progress: pct });
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          });
          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.open("PUT", presign.upload_url);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        updateUpload(index, { progress: 100 });

        const photo = await createPhotoMutation.mutateAsync({
          unitId,
          payload: {
            s3_key: presign.photo_key,
            url: presign.upload_url.split("?")[0],
            is_cover: photos.length === 0 && index === 0,
            display_order: photos.length + index,
          },
        });

        updateUpload(index, { status: "success", photoId: photo.id });
      } catch {
        updateUpload(index, {
          status: "error",
          error: t("uploadFailed"),
        });
      }
    },
    [unitId, photos.length, presignMutation, createPhotoMutation, t]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const newItems: UploadItem[] = files.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }));
    setUploads((prev) => [...prev, ...newItems]);

    const startIndex = uploads.length;
    files.forEach((file, i) => {
      void uploadFile(file, startIndex + i);
    });

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRetry = (index: number) => {
    void uploadFile(uploads[index].file, index);
  };

  const handleSetCover = (photoId: string) => {
    setCoverMutation.mutate({ unitId, photoId });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { unitId, photoId: deleteTarget.id },
      { onSettled: () => setDeleteTarget(null) }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">{t("title")}</h2>
        <p className="mt-1 text-sm text-neutral-600">{t("subtitle")}</p>
      </div>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center transition-colors hover:border-brand-400 hover:bg-brand-50"
        >
          <svg
            className="h-10 w-10 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <span className="mt-3 text-sm font-medium text-neutral-700">
            {t("selectPhotos")}
          </span>
          <span className="mt-1 text-xs text-neutral-500">
            {t("formatsHint")}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {uploads.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-700">
            {t("uploading")}
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {uploads.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="relative overflow-hidden rounded-lg border border-neutral-200 bg-white"
              >
                <div className="relative aspect-square bg-neutral-100">
                  <img
                    src={URL.createObjectURL(item.file)}
                    alt={item.file.name}
                    className="h-full w-full object-cover"
                  />
                  {item.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span className="mt-2 block text-xs font-medium text-white">
                          {item.progress}%
                        </span>
                      </div>
                    </div>
                  )}
                  {item.status === "error" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-danger-500/80 p-2">
                      <span className="text-xs font-medium text-white text-center">
                        {item.error}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRetry(index)}
                        className="mt-2 rounded-md bg-white px-3 py-1 text-xs font-medium text-danger-600 hover:bg-danger-50"
                      >
                        {t("retry")}
                      </button>
                    </div>
                  )}
                  {item.status === "success" && (
                    <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-success-500">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                {item.status === "uploading" && (
                  <div className="h-1 w-full bg-neutral-200">
                    <div
                      className="h-full bg-brand-500 transition-all duration-200"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-neutral-500">{t("loading")}</p>
      ) : photos.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-700">
            {t("gallery")}
          </h3>
          <p className="text-xs text-neutral-500">{t("dragHint")}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                draggable={isDragDrop}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(index);
                }}
                onDragEnd={() => {
                  if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
                    void handleReorder(dragIndex, dragOverIndex);
                  }
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDrop={(e) => e.preventDefault()}
                className={cn(
                  "relative overflow-hidden rounded-lg border-2 bg-white transition-all",
                  photo.is_cover
                    ? "border-brand-500 ring-1 ring-brand-500"
                    : "border-neutral-200",
                  dragIndex === index && "opacity-50",
                  dragOverIndex === index && dragIndex !== null && "border-brand-400 ring-2 ring-brand-300"
                )}
              >
                <div
                  className="relative aspect-square cursor-grab bg-neutral-100 active:cursor-grabbing"
                  onMouseDown={() => setIsDragDrop(true)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    className="h-full w-full object-cover"
                  />
                  {photo.is_cover && (
                    <span className="absolute start-2 top-2 rounded-md bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
                      {t("cover")}
                    </span>
                  )}
                  <span className="absolute end-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-xs font-medium text-white">
                    {index + 1}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 p-2">
                  {!photo.is_cover && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(photo.id)}
                      disabled={setCoverMutation.isPending}
                      className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50"
                    >
                      {t("setCover")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(photo)}
                    disabled={deleteMutation.isPending}
                    className="ms-auto rounded-md px-2 py-1 text-xs font-medium text-danger-600 hover:bg-danger-50 disabled:opacity-50"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : uploads.length === 0 ? (
        <p className="text-sm text-neutral-500">{t("noPhotos")}</p>
      ) : null}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-neutral-900">
              {t("confirmDelete")}
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              {t("confirmDeleteMessage")}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="rounded-md bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? t("deleting") : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
