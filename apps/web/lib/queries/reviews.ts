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

export async function fetchMoreReviews(
  unitId: string,
  offset: number,
  limit: number
): Promise<Review[]> {
  const { data } = await api.get<ApiReviewListResponse>(`/listings/${unitId}/reviews`, {
    params: { limit, offset },
  });
  return data.data.map(mapReview);
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
      queryClient.invalidateQueries({ queryKey: ["listing", variables.unitId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCreateHostReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      rating,
      comment,
    }: {
      bookingId: string;
      guestId: string;
      rating: number;
      comment?: string;
    }) => {
      const { data } = await api.post(`/bookings/${bookingId}/host-reviews`, {
        rating,
        comment,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["guest-reviews", variables.guestId] });
      queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
    },
  });
}

export interface HostReview {
  id: string;
  bookingId: string;
  guestId: string;
  reviewerId: string;
  reviewerDisplayName: string | null;
  guestDisplayName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface GuestReviewList {
  data: HostReview[];
  averageRating: number | null;
  reviewCount: number;
}

export function useGuestReviews(guestId: string | null, limit = 10) {
  return useQuery({
    queryKey: ["guest-reviews", guestId],
    queryFn: async () => {
      const { data } = await api.get<{
        data: Array<{
          id: string;
          booking_id: string;
          guest_id: string;
          reviewer_id: string;
          reviewer_display_name: string | null;
          guest_display_name: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
        }>;
        average_rating: number | null;
        review_count: number;
        limit: number;
        offset: number;
      }>(`/guests/${guestId}/reviews`, { params: { limit } });
      const result: GuestReviewList = {
        data: data.data.map((item) => ({
          id: item.id,
          bookingId: item.booking_id,
          guestId: item.guest_id,
          reviewerId: item.reviewer_id,
          reviewerDisplayName: item.reviewer_display_name,
          guestDisplayName: item.guest_display_name,
          rating: item.rating,
          comment: item.comment,
          createdAt: item.created_at,
        })),
        averageRating: data.average_rating,
        reviewCount: data.review_count,
      };
      return result;
    },
    enabled: Boolean(guestId),
  });
}
