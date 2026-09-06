"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Listing } from "@/components/listings/ListingCard";

interface SearchMapProps {
  listings: Listing[];
  onSelect: (unitId: string) => void;
  className?: string;
}

const DEFAULT_CENTER: L.LatLngExpression = [30.0444, 31.2357];
const DEFAULT_ZOOM = 12;

export function SearchMap({ listings, onSelect, className }: SearchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

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

      markersRef.current = [];

      const validListings = listings.filter(
        (l): l is Listing & { lat: number; lng: number } =>
          typeof l.lat === "number" && typeof l.lng === "number"
      );

      validListings.forEach((listing) => {
        const icon = L.divIcon({
          className: "custom-search-marker",
          html: `<div class="px-2 py-1 rounded-lg bg-white shadow-md border border-brand-200 text-brand-700 text-sm font-semibold whitespace-nowrap">${listing.price} ${listing.currency}</div>`,
          iconSize: [80, 30],
          iconAnchor: [40, 15],
        });

        const marker = L.marker([listing.lat, listing.lng], { icon })
          .addTo(map)
          .bindTooltip(listing.title, { direction: "top" });

        marker.on("click", () => {
          onSelect(listing.id);
        });

        markersRef.current.push(marker);
      });

      if (validListings.length > 0) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.1));
      } else {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [listings, onSelect]);

  return <div ref={containerRef} className={className ?? "h-[60vh] w-full rounded-xl"} />;
}
