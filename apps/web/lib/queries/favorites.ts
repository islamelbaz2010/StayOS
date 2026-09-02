import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";
import type { Listing } from "@/components/listings/ListingCard";

interface FavoriteListingRow {
  id: string;
  title: string;
  title_en?: string | null;
  title_ar?: string | null;
  city: string;
  governorate: string;
  price: number;
  currency: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  cover_image: string | null;
  amenities: string[];
  average_rating?: number | null;
  review_count?: number;
}

interface FavoriteListResponse {
  data: FavoriteListingRow[];
  total: number;
}

function mapFavorite(item: FavoriteListingRow): Listing {
  return {
    id: item.id,
    title: item.title,
    city: item.city,
    governorate: item.governorate,
    country: "Egypt",
    propertyType: "",
    price: item.price,
    currency: item.currency,
    maxGuests: item.max_guests,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    coverImage: item.cover_image ?? null,
    amenities: item.amenities,
    averageRating: item.average_rating ?? null,
    reviewCount: item.review_count ?? 0,
  };
}

export function useFavorites() {
  const { isAuthenticated, isGuest } = useAuth();

  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data } = await api.get<FavoriteListResponse>("/favorites");
      return { listings: data.data.map(mapFavorite), total: data.total };
    },
    enabled: isAuthenticated && isGuest,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unitId: string) => {
      const { data } = await api.post<{ unit_id: string; is_favorite: boolean }>(
        `/favorites/${unitId}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}
