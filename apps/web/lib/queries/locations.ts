import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface LocationSuggestion {
  canonical_name_en: string;
  canonical_name_ar: string;
  city: string;
  governorate: string;
  lat: number | null;
  lng: number | null;
}

interface AutocompleteResponse {
  suggestions: LocationSuggestion[];
}

export function useLocationAutocomplete(query: string, enabled = true) {
  return useQuery({
    queryKey: ["location-autocomplete", query],
    queryFn: async () => {
      const { data } = await api.get<AutocompleteResponse>(
        "/locations/autocomplete",
        { params: { q: query, limit: 6 } }
      );
      return data.suggestions;
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 60_000,
  });
}

export function usePopularLocations() {
  return useQuery({
    queryKey: ["popular-locations"],
    queryFn: async () => {
      const { data } = await api.get<AutocompleteResponse>(
        "/locations/popular",
        { params: { limit: 12 } }
      );
      return data.suggestions;
    },
    staleTime: 5 * 60_000,
  });
}

export interface LocationArea {
  name_en: string;
  name_ar: string;
  lat: number | null;
  lng: number | null;
}

export interface LocationCity {
  name: string;
  areas: LocationArea[];
}

export interface LocationGovernorate {
  name: string;
  cities: LocationCity[];
}

interface LocationTreeResponse {
  governorates: LocationGovernorate[];
}

export function useLocationTree() {
  return useQuery({
    queryKey: ["location-tree"],
    queryFn: async () => {
      const { data } = await api.get<LocationTreeResponse>("/locations/tree");
      return data.governorates;
    },
    staleTime: 30 * 60_000,
  });
}
