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
