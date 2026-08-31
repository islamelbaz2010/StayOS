import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "./AuthContext";
import type {
  Booking,
  Listing,
  ListingDetail,
  LocationSuggestion,
  SearchResponse,
  User,
} from "./types";

export interface SearchParams {
  q?: string;
  city?: string;
  governorate?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  sw_lat?: number;
  sw_lng?: number;
  ne_lat?: number;
  ne_lng?: number;
  limit?: number;
  offset?: number;
}

export function useSearchListings(params: SearchParams, { enabled: externalEnabled = true }: { enabled?: boolean } = {}) {
  const hasSearchableParam = Object.entries(params).some(
    ([key, v]) => v !== undefined && v !== "" && key !== "limit"
  );
  return useQuery({
    queryKey: ["search", params],
    queryFn: async () => {
      const { data } = await api.get<SearchResponse>("/listings", { params });
      return data;
    },
    enabled: externalEnabled && hasSearchableParam,
  });
}

export function useListingDetail(unitId: string) {
  return useQuery({
    queryKey: ["listing", unitId],
    queryFn: async () => {
      const { data } = await api.get<ListingDetail>(`/listings/${unitId}`);
      return data;
    },
    enabled: Boolean(unitId),
  });
}

export function useListingPhotos(unitId: string) {
  return useQuery({
    queryKey: ["photos", unitId],
    queryFn: async () => {
      const { data } = await api.get<{ id: string; url: string; display_order: number; is_cover: boolean }[]>(
        `/listings/${unitId}/photos`
      );
      return data;
    },
    enabled: Boolean(unitId),
  });
}

export function useSimilarListings(unitId: string) {
  return useQuery({
    queryKey: ["similar", unitId],
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>[]>(
        `/listings/${unitId}/similar`,
        { params: { limit: 6 } }
      );
      return data as unknown as Listing[];
    },
    enabled: Boolean(unitId),
  });
}

export function useLocationAutocomplete(query: string) {
  return useQuery({
    queryKey: ["autocomplete", query],
    queryFn: async () => {
      const { data } = await api.get<{ suggestions: LocationSuggestion[] }>(
        "/locations/autocomplete",
        { params: { q: query, limit: 8 } }
      );
      return data.suggestions;
    },
    enabled: query.length >= 2,
  });
}

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Listing[]; total: number }>("/favorites");
      return data;
    },
    enabled: isAuthenticated,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unitId: string) => {
      const { data } = await api.post<{ unit_id: string; is_favorite: boolean }>(
        `/favorites/${unitId}`
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useGuestBookings(status?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["bookings", status],
    queryFn: async () => {
      const { data } = await api.get<Booking[]>("/bookings/guest", {
        params: status ? { status } : undefined,
      });
      return data;
    },
    enabled: isAuthenticated,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      unit_id: string;
      check_in: string;
      check_out: string;
      adults: number;
      children: number;
      infants: number;
    }) => {
      const { data } = await api.post<Booking>("/bookings", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useMe() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<User>("/auth/me");
      return data;
    },
    enabled: isAuthenticated,
    retry: false,
  });
}
