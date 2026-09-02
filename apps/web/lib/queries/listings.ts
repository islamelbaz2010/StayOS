import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import type { Listing } from "@/components/listings/ListingCard";

export interface SearchFilters {
  q?: string;
  checkin?: string;
  checkout?: string;
  guests?: string;
  property_type?: string;
  min_price?: string;
  max_price?: string;
  limit?: string;
  offset?: string;
}

type ApiSearchResponse = components["schemas"]["ListingSearchResponse"];
type ApiSearchResult = components["schemas"]["ListingSearchResult"];
type ApiListingResponse = components["schemas"]["ListingResponse"];

export interface ListingDetail extends Listing {
  description: string;
  amenities: string[];
  houseRules: string | null;
  checkInInstructions: string | null;
  policies: string | null;
  cancellationPolicy: string | null;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  minNights: number;
  maxNights: number;
  cleaningFee: number;
  hostDisplayName: string | null;
  hostKycStatus: string | null;
  hostJoinedAt: string | null;
  lat: number;
  lng: number;
  district: string | null;
  address: string | null;
}

function mapListingDetail(item: ApiListingResponse): ListingDetail {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    city: item.city,
    governorate: item.governorate,
    country: item.country,
    propertyType: item.property_type,
    price: item.price,
    currency: item.currency,
    maxGuests: item.max_guests,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    beds: item.beds,
    coverImage: item.cover_image ?? null,
    amenities: item.amenities,
    houseRules: item.house_rules,
    checkInInstructions: item.check_in_instructions,
    policies: item.policies,
    cancellationPolicy: item.cancellation_policy,
    minNights: item.min_nights,
    maxNights: item.max_nights,
    cleaningFee: item.cleaning_fee_egp,
    hostDisplayName: item.host_display_name ?? null,
    hostKycStatus: item.host_kyc_status ?? null,
    hostJoinedAt: item.host_joined_at ?? null,
    lat: item.lat,
    lng: item.lng,
    district: item.district,
    address: item.address,
    averageRating: item.average_rating ?? null,
    reviewCount: item.review_count ?? 0,
  };
}

function mapSearchResult(item: ApiSearchResult): Listing {
  return {
    id: item.id,
    title: item.title,
    city: item.city,
    governorate: item.governorate,
    country: item.country,
    propertyType: item.property_type,
    price: item.price,
    currency: item.currency,
    maxGuests: item.max_guests,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    coverImage: item.cover_image ?? null,
    hostKycStatus: item.host_kyc_status ?? null,
    amenities: item.amenities,
    averageRating: item.average_rating ?? null,
    reviewCount: item.review_count ?? 0,
  };
}

export function useListings(filters: SearchFilters) {
  const queryParams: Record<string, string> = {};

  if (filters.q) queryParams.q = filters.q;
  if (filters.checkin) queryParams.check_in = filters.checkin;
  if (filters.checkout) queryParams.check_out = filters.checkout;
  if (filters.guests) queryParams.guests = filters.guests;
  if (filters.property_type) queryParams.property_type = filters.property_type;
  if (filters.min_price) queryParams.min_price = filters.min_price;
  if (filters.max_price) queryParams.max_price = filters.max_price;
  queryParams.limit = filters.limit ?? "12";
  queryParams.offset = filters.offset ?? "0";

  return useQuery({
    queryKey: ["listings", queryParams],
    queryFn: async () => {
      const { data } = await api.get<ApiSearchResponse>("/listings", {
        params: queryParams,
      });

      return {
        listings: data.data.map(mapSearchResult),
        total: data.pagination.total_count,
        hasMore: data.pagination.has_more,
      };
    },
  });
}

export function useListing(unitId: string) {
  return useQuery({
    queryKey: ["listing", unitId],
    queryFn: async () => {
      const { data } = await api.get<ApiListingResponse>(`/listings/${unitId}`);
      return mapListingDetail(data);
    },
    enabled: Boolean(unitId),
  });
}

type ApiAvailabilityResponse =
  components["schemas"]["app__listings__schemas__AvailabilityResponse"];

export function useListingAvailability(unitId: string, checkIn: string, checkOut: string) {
  return useQuery({
    queryKey: ["listing-availability", unitId, checkIn, checkOut],
    queryFn: async () => {
      const { data } = await api.get<ApiAvailabilityResponse>(
        `/listings/${unitId}/availability`,
        { params: { check_in: checkIn, check_out: checkOut } }
      );
      return data;
    },
    enabled: Boolean(unitId && checkIn && checkOut && checkOut > checkIn),
    staleTime: 60_000,
  });
}

export interface ListingPhoto {
  id: string;
  unit_id: string;
  s3_key: string;
  url: string;
  display_order: number;
  is_cover: boolean;
  caption: string | null;
}

export function useListingPhotos(unitId: string) {
  return useQuery({
    queryKey: ["listing-photos", unitId],
    queryFn: async () => {
      const { data } = await api.get<ListingPhoto[]>(`/listings/${unitId}/photos`);
      return data;
    },
    enabled: Boolean(unitId),
  });
}
