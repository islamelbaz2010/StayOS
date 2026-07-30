import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
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

interface ApiSearchResponse {
  data: Array<{
    id: string;
    title: string;
    description: string;
    city: string;
    governorate: string;
    country: string;
    property_type: string;
    price: number;
    currency: string;
    max_guests: number;
    cover_image: string | null;
  }>;
  pagination: {
    total_count: number;
    has_more: boolean;
    next_cursor: string | null;
  };
}

function mapSearchResult(item: ApiSearchResponse["data"][0]): Listing {
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
    coverImage: item.cover_image,
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
