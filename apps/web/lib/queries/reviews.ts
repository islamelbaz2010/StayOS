import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

type ApiReviewListResponse = components["schemas"]["ReviewListResponse"];

export interface Review {
  id: string;
  unitId: string;
  bookingId: string;
  guestDisplayName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewList {
  data: Review[];
  averageRating: number | null;
  reviewCount: number;
}

function mapReview(item: ApiReviewListResponse["data"][number]): Review {
  return {
    id: item.id,
    unitId: item.unit_id,
    bookingId: item.booking_id,
    guestDisplayName: item.guest_display_name ?? null,
    rating: item.rating,
    comment: item.comment,
    createdAt: item.created_at,
  };
}

export function useListingReviews(unitId: string, limit = 10) {
  return useQuery({
    queryKey: ["listing-reviews", unitId],
    queryFn: async () => {
      const { data } = await api.get<ApiReviewListResponse>(`/listings/${unitId}/reviews`, {
        params: { limit },
      });
      const result: ReviewList = {
        data: data.data.map(mapReview),
        averageRating: data.average_rating,
        reviewCount: data.review_count,
      };
      return result;
    },
    enabled: Boolean(unitId),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      rating,
      comment,
    }: {
      bookingId: string;
      unitId: string;
      rating: number;
      comment?: string;
    }) => {
      const { data } = await api.post(`/bookings/${bookingId}/reviews`, {
        rating,
        comment,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["listing-reviews", variables.unitId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
