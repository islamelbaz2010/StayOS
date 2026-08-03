"use client";

import { useEffect, useRef } from "react";

interface ListingMapProps {
  lat: number;
  lng: number;
  label?: string;
  zoom?: number;
  className?: string;
}

let mapsLoaded = false;
let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (mapsLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const callbackName = `_gmaps_init_${Date.now()}`;
    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      mapsLoaded = true;
      resolve();
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=${callbackName}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function ListingMap({
  lat,
  lng,
  label,
  zoom = 14,
  className,
}: ListingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return;

    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const position = { lat, lng };

        mapRef.current = new google.maps.Map(containerRef.current, {
          center: position,
          zoom,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });

        new google.maps.Marker({
          position,
          map: mapRef.current,
          title: label,
        });
      })
      .catch(() => {
        // silently fail — map is supplementary
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, zoom, label]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 ${className ?? "h-64"}`}
      >
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      </div>
    );
  }

  return <div ref={containerRef} className={className ?? "h-64"} />;
}
