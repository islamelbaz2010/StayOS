"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

interface GalleryProps {
  images: string[];
  alt: string;
}

export function Gallery({ images, alt }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFullscreen = useCallback((index: number) => {
    setActiveIndex(index);
    setIsFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const nextImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveIndex((prev) => (prev + 1) % images.length);
    },
    [images.length]
  );

  const prevImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
      if (e.key === "ArrowRight") setActiveIndex((p) => (p + 1) % images.length);
      if (e.key === "ArrowLeft")
        setActiveIndex((p) => (p - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen, images.length, closeFullscreen]);

  if (images.length === 0) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-100">
        <div className="flex h-full items-center justify-center text-neutral-400">
          <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
          </svg>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => openFullscreen(0)}
          className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          aria-label={alt}
        >
          <Image
            src={images[0]}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            priority
            className="object-cover"
          />
        </button>
        {isFullscreen && (
          <FullscreenGallery
            images={images}
            alt={alt}
            activeIndex={activeIndex}
            onClose={closeFullscreen}
            onPrev={prevImage}
            onNext={nextImage}
            onSelect={setActiveIndex}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
        <button
          type="button"
          onClick={() => openFullscreen(0)}
          className="relative col-span-1 aspect-[16/10] w-full overflow-hidden bg-neutral-100 sm:col-span-2 sm:row-span-2 sm:aspect-auto focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          aria-label={`${alt} - 1`}
        >
          <Image
            src={images[0]}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </button>
        {images.slice(1, 5).map((img, i) => (
          <button
            key={i + 1}
            type="button"
            onClick={() => openFullscreen(i + 1)}
            className={cn(
              "relative hidden aspect-square w-full overflow-hidden bg-neutral-100 sm:block focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
              i === 3 && images.length > 5
            )}
            aria-label={`${alt} - ${i + 2}`}
          >
            <Image
              src={img}
              alt={`${alt} - ${i + 2}`}
              fill
              sizes="25vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
            {i === 3 && images.length > 5 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-sm font-medium text-white">
                  +{images.length - 5}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {isFullscreen && (
        <FullscreenGallery
          images={images}
          alt={alt}
          activeIndex={activeIndex}
          onClose={closeFullscreen}
          onPrev={prevImage}
          onNext={nextImage}
          onSelect={setActiveIndex}
        />
      )}
    </>
  );
}

interface FullscreenGalleryProps {
  images: string[];
  alt: string;
  activeIndex: number;
  onClose: () => void;
  onPrev: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onSelect: (index: number) => void;
}

function FullscreenGallery({
  images,
  alt,
  activeIndex,
  onClose,
  onPrev,
  onNext,
  onSelect,
}: FullscreenGalleryProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Gallery"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4">
        <span className="text-sm font-medium text-white">
          {activeIndex + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close gallery"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4">
        <button
          type="button"
          onClick={onPrev}
          className="absolute start-2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Previous image"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div
          className="relative h-full max-h-[70vh] w-full max-w-4xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={images[activeIndex]}
            alt={`${alt} - ${activeIndex + 1}`}
            fill
            sizes="100vw"
            className="object-contain"
          />
        </div>

        <button
          type="button"
          onClick={onNext}
          className="absolute end-2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Next image"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto p-4">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(i);
              }}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition",
                i === activeIndex
                  ? "border-brand-500"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={img} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
