"use client";

import { useEffect, useRef, useState } from "react";
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

const markerHtml = (price: number, currency: string, active: boolean) =>
  `<div class="px-2 py-1 rounded-lg text-sm font-semibold whitespace-nowrap shadow-md border ${
    active
      ? "bg-brand-900 text-white border-brand-900 scale-110"
      : "bg-white text-brand-700 border-brand-200"
  }">${price} ${currency}</div>`;

export function SearchMap({ listings, onSelect, onBoundsChange, className, searchAreaLabel, highlightId, onMarkerHover }: SearchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [showSearchButton, setShowSearchButton] = useState(false);

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

      const validListings = listings.filter(
        (l): l is Listing & { lat: number; lng: number } =>
          typeof l.lat === "number" && typeof l.lng === "number"
      );

      validListings.forEach((listing) => {
        const icon = L.divIcon({
          className: "custom-search-marker",
          html: markerHtml(listing.price, listing.currency, false),
          iconSize: [80, 30],
          iconAnchor: [40, 15],
        });

        const marker = L.marker([listing.lat, listing.lng], { icon })
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
        map.fitBounds(group.getBounds().pad(0.1));
      } else {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      }

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
  }, [listings, onSelect, onBoundsChange, onMarkerHover]);

  // Highlight sync: restyle markers without re-initialising the map.
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const listing = listings.find((l) => l.id === id);
      if (!listing) return;
      marker.setIcon(
        L.divIcon({
          className: "custom-search-marker",
          html: markerHtml(listing.price, listing.currency, id === highlightId),
          iconSize: [80, 30],
          iconAnchor: [40, 15],
        })
      );
      marker.setZIndexOffset(id === highlightId ? 1000 : 0);
    });
  }, [highlightId, listings]);

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
