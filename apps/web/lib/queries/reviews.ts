import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

type ApiReviewListResponse = components["schemas"]["ReviewListResponse"];

/** Airbnb-style 6 subrating categories. */
export const SUBRATING_KEYS = [
  "cleanliness",
  "accuracy",
  "check_in",
  "communication",
  "location",
  "value",
] as const;

export type SubratingKey = (typeof SUBRATING_KEYS)[number];

export type Subratings = Partial<Record<SubratingKey, number>>;

export interface Review {
  id: string;
  unitId: string;
  bookingId: string;
  guestDisplayName: string | null;
  rating: number;
  comment: string | null;
  subratings: Subratings | null;
  published: boolean;
  hostResponse: string | null;
  hostResponseAt: string | null;
  createdAt: string;
}

export interface ReviewList {
  data: Review[];
  averageRating: number | null;
  reviewCount: number;
  subratingAverages: Partial<Record<SubratingKey, number>> | null;
  ratingDistribution: Record<number, number> | null;
}

function mapReview(item: ApiReviewListResponse["data"][number]): Review {
  return {
    id: item.id,
    unitId: item.unit_id,
    bookingId: item.booking_id,
    guestDisplayName: item.guest_display_name ?? null,
    rating: item.rating,
    comment: item.comment,
    subratings: (item.subratings as Subratings | null) ?? null,
    published: item.published ?? true,
    hostResponse: item.host_response ?? null,
    hostResponseAt: item.host_response_at ?? null,
    createdAt: item.created_at,
  };
}

export function useListingReviews(unitId: string, search = "", limit = 10) {
  return useQuery({
    queryKey: ["listing-reviews", unitId, search],
    queryFn: async () => {
      const { data } = await api.get<ApiReviewListResponse>(`/listings/${unitId}/reviews`, {
        params: { limit, q: search || undefined },
      });
      const result: ReviewList = {
        data: data.data.map(mapReview),
        averageRating: data.average_rating,
        reviewCount: data.review_count,
        subratingAverages: (data.subrating_averages as Partial<Record<SubratingKey, number>> | null) ?? null,
        ratingDistribution: (data.rating_distribution as Record<number, number> | null) ?? null,
      };
      return result;
    },
    enabled: Boolean(unitId),
  });
}

export async function fetchMoreReviews(
  unitId: string,
  offset: number,
  limit: number,
  search = ""
): Promise<Review[]> {
  const { data } = await api.get<ApiReviewListResponse>(`/listings/${unitId}/reviews`, {
    params: { limit, offset, q: search || undefined },
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
      subratings,
    }: {
      bookingId: string;
      unitId: string;
      rating: number;
      comment?: string;
      subratings?: Subratings;
    }) => {
      const { data } = await api.post(`/bookings/${bookingId}/reviews`, {
        rating,
        comment,
        subratings: subratings ?? undefined,
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

/** Host writes a public response to a guest review (Airbnb behavior). */
export function useCreateHostResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      unitId,
      response,
    }: {
      reviewId: string;
      unitId: string;
      response: string;
    }) => {
      const { data } = await api.post(`/reviews/${reviewId}/host-response`, { response });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["listing-reviews", variables.unitId] });
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
  published: boolean;
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
          published: boolean;
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
          published: item.published ?? true,
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
