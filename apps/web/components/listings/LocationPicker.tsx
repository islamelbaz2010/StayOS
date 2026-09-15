"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  lat: number;
  lng: number;
  address: string;
  city: string;
  governorate: string;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export function LocationPicker({
  lat,
  lng,
  address,
  city,
  governorate,
  onLocationChange,
  className,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Build a search query from address components
  const searchQuery = [address, city, governorate, "Egypt"]
    .filter(Boolean)
    .join(", ");

  // Geocode address → coordinates using Nominatim (free, no API key)
  const geocodeAddress = useCallback(
    async (query: string) => {
      if (!query || query.length < 5) return;
      setGeocoding(true);
      setGeocodeError(null);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=1&countrycodes=eg`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "en" },
        });
        if (!res.ok) throw new Error("Geocoding failed");
        const data: NominatimResult[] = await res.json();
        if (data.length > 0) {
          const newLat = parseFloat(data[0].lat);
          const newLng = parseFloat(data[0].lon);
          if (!isNaN(newLat) && !isNaN(newLng)) {
            onLocationChange(newLat, newLng);
          }
        }
      } catch {
        setGeocodeError("Could not geocode address. You can drag the marker manually.");
      } finally {
        setGeocoding(false);
      }
    },
    [onLocationChange]
  );

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 14,
        scrollWheelZoom: true,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);

      markerRef.current = L.marker([lat, lng], {
        icon: markerIcon,
        draggable: true,
      }).addTo(mapRef.current);

      markerRef.current.on("dragend", (e) => {
        const m = e.target as L.Marker;
        const pos = m.getLatLng();
        onLocationChange(pos.lat, pos.lng);
      });

      // Click to move marker
      mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
        markerRef.current?.setLatLng(e.latlng);
        onLocationChange(e.latlng.lat, e.latlng.lng);
      });
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position when lat/lng changes externally
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }
  }, [lat, lng]);

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          {geocoding
            ? "Locating address on map..."
            : "Drag the marker or click the map to adjust location"}
        </p>
        <button
          type="button"
          onClick={() => geocodeAddress(searchQuery)}
          disabled={geocoding || !searchQuery}
          className="text-sm font-medium text-accent-600 hover:text-accent-700 disabled:opacity-50"
        >
          {geocoding ? "..." : "Locate on map"}
        </button>
      </div>
      <div ref={containerRef} className="h-64 w-full overflow-hidden rounded-xl" />
      {geocodeError && (
        <p className="mt-1 text-xs text-warning-600">{geocodeError}</p>
      )}
    </div>
  );
}
