"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Listing } from "@/components/listings/ListingCard";

interface SearchMapProps {
  listings: Listing[];
  onSelect: (unitId: string) => void;
  onBoundsChange?: (bounds: { sw_lat: string; sw_lng: string; ne_lat: string; ne_lng: string }) => void;
  className?: string;
  searchAreaLabel?: string;
  /** Listing to emphasize (e.g. hovered card in the split view). */
  highlightId?: string | null;
  /** Card hover → map callback so the list can clear the highlight. */
  onMarkerHover?: (unitId: string | null) => void;
}

const DEFAULT_CENTER: L.LatLngExpression = [30.0444, 31.2357];
const DEFAULT_ZOOM = 12;

/** Display-only: integer, locale-aware price. Data values are never mutated. */
export function formatMarkerPrice(price: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(price);
}

export const markerHtml = (price: number, currency: string, active: boolean, locale: string) =>
  `<div class="stayos-price-pill px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap shadow border ${
    active
      ? "bg-brand-900 text-white border-brand-900"
      : "bg-white text-brand-700 border-brand-200"
  }" style="display:inline-block;width:max-content;max-width:120px;overflow:hidden;text-overflow:ellipsis;transform:translate(-50%,-50%);">${formatMarkerPrice(price, locale)} ${currency}</div>`;

const makeIcon = (price: number, currency: string, active: boolean, locale: string) =>
  L.divIcon({
    className: "custom-search-marker",
    html: markerHtml(price, currency, active, locale),
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

// Candidate pixel offsets (rings) tried when a pill would overlap a placed one.
const OFFSET_CANDIDATES: [number, number][] = (() => {
  const c: [number, number][] = [[0, 0]];
  for (const r of [16, 30, 44, 58]) {
    for (const a of [0, 45, 90, 135, 180, 225, 270, 315]) {
      c.push([Math.round(r * Math.cos((a * Math.PI) / 180)), Math.round(r * Math.sin((a * Math.PI) / 180))]);
    }
  }
  return c;
})();

export function SearchMap({ listings, onSelect, onBoundsChange, className, searchAreaLabel, highlightId, onMarkerHover }: SearchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const offsetsRef = useRef<Map<string, [number, number]>>(new Map());
  const highlightRef = useRef<string | null>(null);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const locale = useLocale();

  // Greedy declutter + edge containment: shifts pill visuals only, never data.
  const layoutMarkers = () => {
    const map = mapRef.current;
    if (!map) return;
    const size = map.getSize();
    interface Item { id: string; x: number; y: number; w: number; h: number; el: HTMLElement }
    const items: Item[] = [];
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()?.querySelector<HTMLElement>(".stayos-price-pill");
      if (!el) return;
      const p = map.latLngToContainerPoint(marker.getLatLng());
      items.push({ id, x: p.x, y: p.y, w: el.offsetWidth || 64, h: el.offsetHeight || 24, el });
    });
    items.sort((a, b) => a.y - b.y || a.x - b.x);

    const clampX = (x: number, w: number) => Math.min(Math.max(x, 4), Math.max(4, size.x - w - 4));
    const clampY = (y: number, h: number) => Math.min(Math.max(y, 4), Math.max(4, size.y - h - 4));
    const overlaps = (
      a: { x: number; y: number; w: number; h: number },
      b: { x: number; y: number; w: number; h: number }
    ) => !(a.x + a.w <= b.x + 3 || b.x + b.w <= a.x + 3 || a.y + a.h <= b.y + 3 || b.y + b.h <= a.y + 3);

    const placed: { x: number; y: number; w: number; h: number }[] = [];
    items.forEach((it, idx) => {
      let best = { x: clampX(it.x - it.w / 2, it.w), y: clampY(it.y - it.h / 2, it.h) };
      for (const [dx, dy] of OFFSET_CANDIDATES) {
        const cand = { x: clampX(it.x + dx - it.w / 2, it.w), y: clampY(it.y + dy - it.h / 2, it.h) };
        if (!placed.some((p) => overlaps({ ...cand, w: it.w, h: it.h }, p))) {
          best = cand;
          break;
        }
      }
      placed.push({ ...best, w: it.w, h: it.h });
      const dx = Math.round(best.x + it.w / 2 - it.x);
      const dy = Math.round(best.y + it.h / 2 - it.y);
      offsetsRef.current.set(it.id, [dx, dy]);
      it.el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      // Earlier (higher) markers stack on top; an actively highlighted
      // marker always wins.
      const marker = markersRef.current.get(it.id);
      marker?.setZIndexOffset(it.id === highlightRef.current ? 2000 : 500 - idx);
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const initMap = () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current!, {
        scrollWheelZoom: true,
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      markersRef.current = new Map();
      offsetsRef.current = new Map();

      const validListings = listings.filter(
        (l): l is Listing & { lat: number; lng: number } =>
          typeof l.lat === "number" && typeof l.lng === "number"
      );

      validListings.forEach((listing) => {
        const marker = L.marker([listing.lat, listing.lng], {
          icon: makeIcon(listing.price, listing.currency, false, locale),
        })
          .addTo(map)
          .bindTooltip(listing.title, { direction: "top" });

        marker.on("click", () => {
          onSelect(listing.id);
        });
        if (onMarkerHover) {
          marker.on("mouseover", () => onMarkerHover(listing.id));
          marker.on("mouseout", () => onMarkerHover(null));
        }

        markersRef.current.set(listing.id, marker);
      });

      if (validListings.length > 0) {
        const group = L.featureGroup([...markersRef.current.values()]);
        map.fitBounds(group.getBounds(), { paddingTopLeft: [48, 24], paddingBottomRight: [48, 24] });
      } else {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      }

      requestAnimationFrame(layoutMarkers);
      map.on("zoomend", layoutMarkers);

      if (onBoundsChange) {
        map.on("moveend zoomend", () => {
          setShowSearchButton(true);
        });
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [listings, onSelect, onBoundsChange, onMarkerHover, locale]);

  // Highlight sync: restyle markers without re-initialising the map.
  useEffect(() => {
    highlightRef.current = highlightId ?? null;
    markersRef.current.forEach((marker, id) => {
      const listing = listings.find((l) => l.id === id);
      if (!listing) return;
      marker.setIcon(makeIcon(listing.price, listing.currency, id === highlightId, locale));
    });
    requestAnimationFrame(layoutMarkers);
  }, [highlightId, listings, locale]);

  const handleSearchArea = () => {
    if (!mapRef.current || !onBoundsChange) return;
    const bounds = mapRef.current.getBounds();
    onBoundsChange({
      sw_lat: bounds.getSouth().toFixed(6),
      sw_lng: bounds.getWest().toFixed(6),
      ne_lat: bounds.getNorth().toFixed(6),
      ne_lng: bounds.getEast().toFixed(6),
    });
    setShowSearchButton(false);
  };

  return (
    <div className="relative">
      {showSearchButton && onBoundsChange && (
        <div className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2">
          <button
            type="button"
            onClick={handleSearchArea}
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-700"
          >
            {searchAreaLabel ?? "Search this area"}
          </button>
        </div>
      )}
      <div ref={containerRef} className={className ?? "h-[60vh] w-full rounded-xl"} />
    </div>
  );
}
