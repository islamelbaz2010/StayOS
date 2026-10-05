import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { api, hasTokens, subscribeTokenChanges } from "./api";
import { useSyncExternalStore } from "react";
import type {
  Booking,
  BookingCancellationPreview,
  CalendarRuleCreatePayload,
  CalendarRuleResponse,
  Conversation,
  ConversationListItem,
  CoHost,
  HostCalendarResponse,
  HostEarningsSummary,
  HostListingDetail,
  HostOwnProfile,
  HostProfile,
  HostReservationDetail,
  HostReservationSummary,
  HostTodayResponse,
  KycInitiateResponse,
  KycStatusResponse,
  Listing,
  ListingCreatePayload,
  ListingDetail,
  ListingReadiness,
  ListingUpdatePayload,
  LocationSuggestion,
  Message,
  MessageTemplate,
  Payment,
  PaymentListItem,
  PaymentProofPresignResponse,
  PhotoCreatePayload,
  PhotoPresignResponse,
  PhotoResponse,
  SearchResponse,
  StayInfo,
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
  category?: string;
  cultural_tags?: string;
  amenities?: string;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  free_cancellation?: boolean;
  instant_book?: boolean;
  pets?: boolean;
  self_check_in?: boolean;
  accessibility?: string;
  host_language?: string;
  sort?: string;
  host_id?: string;
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

export function useSearchListings(params: SearchParams) {
  const limit = params.limit ?? 20;
  const enabled = Object.values(params).some((v) => v !== undefined && v !== "");

  return useInfiniteQuery<SearchResponse>({
    queryKey: ["search", params],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get<SearchResponse>("/listings", {
        params: { ...params, limit, offset: pageParam },
      });
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.pagination.has_more
        ? (lastPageParam as number) + limit
        : undefined,
    enabled,
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

export interface Review {
  id: string;
  unit_id: string;
  booking_id: string;
  guest_id: string;
  guest_display_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ReviewListResponse {
  data: Review[];
  average_rating: number | null;
  review_count: number;
  limit: number;
  offset: number;
}

export function useListingReviews(unitId: string, limit = 10) {
  return useQuery({
    queryKey: ["reviews", unitId],
    queryFn: async () => {
      const { data } = await api.get<ReviewListResponse>(`/listings/${unitId}/reviews`, {
        params: { limit },
      });
      return data;
    },
    enabled: Boolean(unitId),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
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
      const { data } = await api.post<Review>(`/bookings/${bookingId}/reviews`, {
        rating,
        comment,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["reviews", variables.unitId] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
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

export function usePopularLocations() {
  return useQuery({
    queryKey: ["locations", "popular"],
    queryFn: async () => {
      const { data } = await api.get<{ suggestions: LocationSuggestion[] }>(
        "/locations/popular",
        { params: { limit: 20 } }
      );
      return data.suggestions;
    },
  });
}

export interface AvailabilityDay {
  date: string;
  status: string;
  block_type: string | null;
  price_egp: number;
}

export function useListingAvailability(unitId: string, checkIn: string, checkOut: string) {
  return useQuery({
    queryKey: ["availability", unitId, checkIn, checkOut],
    queryFn: async () => {
      const { data } = await api.get<{ unit_id: string; days: AvailabilityDay[] }>(
        `/listings/${unitId}/availability`,
        { params: { check_in: checkIn, check_out: checkOut } }
      );
      return data;
    },
    enabled: Boolean(unitId && checkIn && checkOut),
    staleTime: 60_000,
  });
}

export function useHostProfile(hostId: string) {
  return useQuery({
    queryKey: ["host", hostId],
    queryFn: async () => {
      const { data } = await api.get<HostProfile>(`/listings/profiles/host/${hostId}`);
      return data;
    },
    enabled: Boolean(hostId),
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Listing[]; total: number }>("/favorites");
      return data;
    },
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
  return useQuery({
    queryKey: ["bookings", status],
    queryFn: async () => {
      const { data } = await api.get<Booking[]>("/bookings/guest", {
        params: status ? { status } : undefined,
      });
      return data;
    },
  });
}

export function useCreateBooking() {
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
  });
}

export function useCancellationPreview(bookingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["booking-cancellation-preview", bookingId],
    queryFn: async () => {
      const { data } = await api.get<BookingCancellationPreview>(
        `/bookings/${bookingId}/cancellation-preview`
      );
      return data;
    },
    enabled: enabled && Boolean(bookingId),
  });
}

export function useHostBookingUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
      rejectReason,
      cancelReason,
    }: {
      bookingId: string;
      status: string;
      rejectReason?: string;
      cancelReason?: string;
    }) => {
      const payload: Record<string, unknown> = { status };
      if (rejectReason) payload.reject_reason = rejectReason;
      if (cancelReason) payload.cancel_reason = cancelReason;
      const { data } = await api.patch<Booking>(`/bookings/${bookingId}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["host-reservation"] });
      qc.invalidateQueries({ queryKey: ["host-today"] });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const { data } = await api.post<Booking>(`/bookings/${bookingId}/cancel`, {
        reason: reason || undefined,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function usePaymentByBooking(bookingId: string) {
  return useQuery({
    queryKey: ["payment", "booking", bookingId],
    queryFn: async () => {
      const { data } = await api.get<Payment>(`/payments/booking/${bookingId}`);
      return data;
    },
    enabled: Boolean(bookingId),
    retry: (failureCount, error) => {
      // A 404 simply means the host has not accepted yet — no payment exists.
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useCheckoutSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data } = await api.post<Payment>(
        `/payments/${paymentId}/checkout-session`
      );
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["payment", "booking", data.booking_id] });
    },
  });
}

export function usePresignProof() {
  return useMutation({
    mutationFn: async ({
      paymentId,
      filename,
      contentType,
    }: {
      paymentId: string;
      filename: string;
      contentType: string;
    }) => {
      const { data } = await api.post<PaymentProofPresignResponse>(
        `/payments/${paymentId}/proof/presign`,
        { filename, content_type: contentType }
      );
      return data;
    },
  });
}

export function useUploadProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paymentId,
      s3Key,
      url,
    }: {
      paymentId: string;
      s3Key: string;
      url?: string;
    }) => {
      const { data } = await api.post<Payment>(`/payments/${paymentId}/proof`, {
        s3_key: s3Key,
        url,
      });
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["payment", "booking", data.booking_id] });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useStayInfo(bookingId: string) {
  return useQuery({
    queryKey: ["stay-info", bookingId],
    queryFn: async () => {
      const { data } = await api.get<StayInfo>(`/bookings/${bookingId}/stay`);
      return data;
    },
    enabled: Boolean(bookingId),
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.post<Booking>(`/bookings/${bookingId}/check-in`);
      return data;
    },
    onSuccess: (_data, bookingId) => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["stay-info", bookingId] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.post<Booking>(`/bookings/${bookingId}/check-out`);
      return data;
    },
    onSuccess: (_data, bookingId) => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["stay-info", bookingId] });
    },
  });
}

export function useKycStatus() {
  return useQuery({
    queryKey: ["kyc-status"],
    queryFn: async () => {
      const { data } = await api.get<KycStatusResponse>("/kyc/status");
      return data;
    },
  });
}

export function useInitiateKyc() {
  return useMutation({
    mutationFn: async (payload: {
      document_type: string;
      document_number?: string;
    }) => {
      const { data } = await api.post<KycInitiateResponse>("/kyc/initiate", payload);
      return data;
    },
  });
}

export function useSubmitKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      const { data } = await api.post<{ document_id: string; status: string }>(
        `/kyc/documents/${documentId}/submit`
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kyc-status"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["host", "profile"] });
    },
  });
}

export function useUpgradeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<User>("/auth/me/role", { role: "host" });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

/**
 * React-aware token state. `hasTokens()` alone is a snapshot evaluated at
 * render time — components never re-render when it changes. Subscribing at
 * the app root makes login/logout/session-expiry propagate immediately:
 * every `enabled: hasTokens()` site re-evaluates on the next render.
 */
export function useHasTokens(): boolean {
  return useSyncExternalStore(subscribeTokenChanges, hasTokens, hasTokens);
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<User>("/auth/me");
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data } = await api.get<PaymentListItem[]>("/payments");
      return data;
    },
    enabled: hasTokens(),
  });
}

export function useBookingQuote(unitId: string, checkIn: string, checkOut: string) {
  return useQuery({
    queryKey: ["booking-quote", unitId, checkIn, checkOut],
    queryFn: async () => {
      const { data } = await api.get<{
        unit_id: string;
        check_in: string;
        check_out: string;
        nights: number;
        nightly_rate_egp: number;
        // All-inclusive pricing: guests see the total only — no internal
        // fee breakdown is returned or rendered.
        total_egp: number;
      }>("/payments/quote", {
        params: { unit_id: unitId, check_in: checkIn, check_out: checkOut },
      });
      return data;
    },
    enabled: Boolean(unitId && checkIn && checkOut),
  });
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await api.get<ConversationListItem[]>("/messages/conversations");
      return data;
    },
    enabled: hasTokens(),
    refetchInterval: 15000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["conversations", "unread"],
    queryFn: async () => {
      const { data } = await api.get<{ total_unread: number }>(
        "/messages/conversations/unread"
      );
      return data;
    },
    enabled: hasTokens(),
    refetchInterval: 15000,
  });
}

export function useConversationForBooking(bookingId: string) {
  return useQuery({
    queryKey: ["conversation", "booking", bookingId],
    queryFn: async () => {
      const { data } = await api.get<Conversation>(`/messages/bookings/${bookingId}/conversation`);
      return data;
    },
    enabled: Boolean(bookingId),
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await api.get<Message[]>(`/messages/conversations/${conversationId}/messages`);
      return data;
    },
    enabled: Boolean(conversationId),
    refetchInterval: 10000,
  });
}

export function useSendMessage(conversationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<Message>(
        `/messages/conversations/${conversationId}/messages`,
        { content }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkRead(conversationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post(`/messages/conversations/${conversationId}/read`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMessageTemplates(locale: string = "ar") {
  return useQuery({
    queryKey: ["message-templates", locale],
    queryFn: async () => {
      const { data } = await api.get<MessageTemplate[]>("/messages/templates", {
        params: { locale },
      });
      return data;
    },
  });
}

// ============================================================
// Host Operating System hooks
// ============================================================

export function useHostToday() {
  return useQuery({
    queryKey: ["host", "today"],
    queryFn: async () => {
      const { data } = await api.get<HostTodayResponse>("/host/today");
      return data;
    },
    enabled: hasTokens(),
    refetchInterval: 60_000,
  });
}

export function useHostReservations(status?: string) {
  return useQuery({
    queryKey: ["host", "reservations", status],
    queryFn: async () => {
      const { data } = await api.get<HostReservationSummary[]>("/host/reservations", {
        params: status ? { status } : undefined,
      });
      return data;
    },
    enabled: hasTokens(),
  });
}

export function useHostReservationDetail(bookingId: string) {
  return useQuery({
    queryKey: ["host", "reservation", bookingId],
    queryFn: async () => {
      const { data } = await api.get<HostReservationDetail>(`/host/reservations/${bookingId}`);
      return data;
    },
    enabled: Boolean(bookingId) && hasTokens(),
  });
}

export function useHostEarnings() {
  return useQuery({
    queryKey: ["host", "earnings"],
    queryFn: async () => {
      const { data } = await api.get<HostEarningsSummary>("/host/earnings");
      return data;
    },
    enabled: hasTokens(),
  });
}

export function useHostCalendar(
  checkIn: string,
  checkOut: string,
  unitId?: string
) {
  return useQuery({
    queryKey: ["host", "calendar", unitId, checkIn, checkOut],
    queryFn: async () => {
      const { data } = await api.get<HostCalendarResponse>("/host/calendar", {
        params: { check_in: checkIn, check_out: checkOut, unit_id: unitId },
      });
      return data;
    },
    enabled: Boolean(checkIn && checkOut) && hasTokens(),
    staleTime: 60_000,
  });
}

export function useListingReadiness(unitId: string) {
  return useQuery({
    queryKey: ["host", "readiness", unitId],
    queryFn: async () => {
      const { data } = await api.get<ListingReadiness>(`/host/listings/${unitId}/readiness`);
      return data;
    },
    enabled: Boolean(unitId) && hasTokens(),
  });
}

export function useCoHosts(unitId: string) {
  return useQuery({
    queryKey: ["host", "co-hosts", unitId],
    queryFn: async () => {
      const { data } = await api.get<CoHost[]>(`/host/listings/${unitId}/co-hosts`);
      return data;
    },
    enabled: Boolean(unitId) && hasTokens(),
  });
}

export function useInviteCoHost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      coHostUserId,
      permissionScope,
    }: {
      unitId: string;
      coHostUserId: string;
      permissionScope: string;
    }) => {
      const { data } = await api.post<CoHost>(`/host/listings/${unitId}/co-hosts`, {
        co_host_user_id: coHostUserId,
        permission_scope: permissionScope,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["host", "co-hosts", variables.unitId] });
    },
  });
}

export function useUpdateCoHost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      coHostId,
      permissionScope,
      isActive,
    }: {
      unitId: string;
      coHostId: string;
      permissionScope?: string;
      isActive?: boolean;
    }) => {
      const { data } = await api.patch<CoHost>(
        `/host/listings/${unitId}/co-hosts/${coHostId}`,
        { permission_scope: permissionScope, is_active: isActive }
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["host", "co-hosts", variables.unitId] });
    },
  });
}

export function useRemoveCoHost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ unitId, coHostId }: { unitId: string; coHostId: string }) => {
      await api.delete(`/host/listings/${unitId}/co-hosts/${coHostId}`);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["host", "co-hosts", variables.unitId] });
    },
  });
}

export function useHostOwnProfile() {
  return useQuery({
    queryKey: ["host", "profile"],
    queryFn: async () => {
      const { data } = await api.get<HostOwnProfile>("/host/profile");
      return data;
    },
    enabled: hasTokens(),
  });
}

export function useUpdateHostProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      display_name?: string;
      email?: string;
      locale?: string;
    }) => {
      const { data } = await api.patch<HostOwnProfile>("/host/profile", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["host", "profile"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useHostListings() {
  return useQuery({
    queryKey: ["host", "listings"],
    queryFn: async () => {
      const { data } = await api.get<ListingDetail[]>("/listings/host/listings");
      return data;
    },
    enabled: hasTokens(),
  });
}

// ============================================================
// Host Listing Management hooks (Property + Unit + Listing operations)
// ============================================================

export function useHostListingDetail(unitId: string) {
  return useQuery({
    queryKey: ["host", "listing-detail", unitId],
    queryFn: async () => {
      const { data } = await api.get<HostListingDetail>(`/host/listings/${unitId}`);
      return data;
    },
    enabled: Boolean(unitId) && hasTokens(),
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ListingCreatePayload) => {
      const { data } = await api.post<ListingDetail>("/listings", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["host", "listings"] });
      qc.invalidateQueries({ queryKey: ["host", "today"] });
    },
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      payload,
    }: {
      unitId: string;
      payload: ListingUpdatePayload;
    }) => {
      const { data } = await api.patch<ListingDetail>(
        `/listings/${unitId}`,
        payload
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["host", "listing-detail", variables.unitId] });
      qc.invalidateQueries({ queryKey: ["host", "listings"] });
      qc.invalidateQueries({ queryKey: ["host", "readiness", variables.unitId] });
      qc.invalidateQueries({ queryKey: ["host", "today"] });
      qc.invalidateQueries({ queryKey: ["listing", variables.unitId] });
    },
  });
}

export function usePublishListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unitId: string) => {
      const { data } = await api.post<ListingDetail>(
        `/listings/${unitId}/publish`
      );
      return data;
    },
    onSuccess: (_data, unitId) => {
      qc.invalidateQueries({ queryKey: ["host", "listing-detail", unitId] });
      qc.invalidateQueries({ queryKey: ["host", "listings"] });
      qc.invalidateQueries({ queryKey: ["host", "today"] });
    },
  });
}

export function useUnpublishListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unitId: string) => {
      const { data } = await api.post<ListingDetail>(
        `/listings/${unitId}/unpublish`
      );
      return data;
    },
    onSuccess: (_data, unitId) => {
      qc.invalidateQueries({ queryKey: ["host", "listing-detail", unitId] });
      qc.invalidateQueries({ queryKey: ["host", "listings"] });
      qc.invalidateQueries({ queryKey: ["host", "today"] });
    },
  });
}

export function useSubmitForReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unitId: string) => {
      const { data } = await api.post<ListingDetail>(
        `/listings/${unitId}/submit`
      );
      return data;
    },
    onSuccess: (_data, unitId) => {
      qc.invalidateQueries({ queryKey: ["host", "listing-detail", unitId] });
      qc.invalidateQueries({ queryKey: ["host", "listings"] });
      qc.invalidateQueries({ queryKey: ["host", "today"] });
    },
  });
}

export function useArchiveListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unitId: string) => {
      const { data } = await api.post<ListingDetail>(
        `/listings/${unitId}/archive`
      );
      return data;
    },
    onSuccess: (_data, unitId) => {
      qc.invalidateQueries({ queryKey: ["host", "listing-detail", unitId] });
      qc.invalidateQueries({ queryKey: ["host", "listings"] });
      qc.invalidateQueries({ queryKey: ["host", "today"] });
    },
  });
}

// Photo management

export function usePresignPhoto() {
  return useMutation({
    mutationFn: async ({
      unitId,
      filename,
      contentType,
    }: {
      unitId: string;
      filename: string;
      contentType: string;
    }) => {
      const { data } = await api.post<PhotoPresignResponse>(
        `/listings/${unitId}/photos/presign`,
        { filename, content_type: contentType }
      );
      return data;
    },
  });
}

export function useCreatePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      payload,
    }: {
      unitId: string;
      payload: PhotoCreatePayload;
    }) => {
      const { data } = await api.post<PhotoResponse>(
        `/listings/${unitId}/photos`,
        payload
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["host", "listing-detail", variables.unitId] });
      qc.invalidateQueries({ queryKey: ["photos", variables.unitId] });
      qc.invalidateQueries({ queryKey: ["host", "readiness", variables.unitId] });
      qc.invalidateQueries({ queryKey: ["host", "today"] });
    },
  });
}

export function useSetCoverPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      photoId,
    }: {
      unitId: string;
      photoId: string;
    }) => {
      const { data } = await api.patch<PhotoResponse>(
        `/listings/${unitId}/photos/${photoId}/cover`
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["host", "listing-detail", variables.unitId] });
      qc.invalidateQueries({ queryKey: ["photos", variables.unitId] });
    },
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      photoId,
    }: {
      unitId: string;
      photoId: string;
    }) => {
      await api.delete(`/listings/${unitId}/photos/${photoId}`);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["host", "listing-detail", variables.unitId] });
      qc.invalidateQueries({ queryKey: ["photos", variables.unitId] });
      qc.invalidateQueries({ queryKey: ["host", "readiness", variables.unitId] });
      qc.invalidateQueries({ queryKey: ["host", "today"] });
    },
  });
}

// Calendar / Availability management

export function useCreateCalendarRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      payload,
    }: {
      unitId: string;
      payload: CalendarRuleCreatePayload;
    }) => {
      const { data } = await api.post<CalendarRuleResponse>(
        `/listings/${unitId}/calendar`,
        payload
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["host", "calendar"] });
      qc.invalidateQueries({ queryKey: ["availability", variables.unitId] });
    },
  });
}

export function useDeleteCalendarRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      ruleId,
    }: {
      unitId: string;
      ruleId: string;
    }) => {
      await api.delete(`/listings/${unitId}/calendar/${ruleId}`);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["host", "calendar"] });
      qc.invalidateQueries({ queryKey: ["availability", variables.unitId] });
    },
  });
}

// ============================================================
// Auth / account / settings
// ============================================================

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data } = await api.get<{ sessions: import("./types").SessionItem[] }>(
        "/auth/me/sessions"
      );
      return data.sessions;
    },
    enabled: hasTokens(),
  });
}

export function useLogoutAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ revoked: number }>("/auth/me/logout-all");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      display_name?: string;
      bio?: string | null;
      location?: string | null;
      interests?: string[] | null;
      languages?: string[] | null;
      locale?: string;
    }) => {
      const { data } = await api.patch<User>("/auth/me", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["host", "profile"] });
    },
  });
}

export function useAccountData() {
  return useQuery({
    queryKey: ["account"],
    queryFn: async () => {
      const { data } = await api.get<import("./types").AccountData>("/auth/me/account");
      return data;
    },
    enabled: hasTokens(),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<import("./types").AccountData>) => {
      const { data } = await api.patch<import("./types").AccountData>(
        "/auth/me/account",
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account"] });
    },
  });
}

export function usePrivacySettings() {
  return useQuery({
    queryKey: ["privacy"],
    queryFn: async () => {
      const { data } = await api.get<import("./types").PrivacySettings>("/auth/me/privacy");
      return data;
    },
    enabled: hasTokens(),
  });
}

export function useUpdatePrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<import("./types").PrivacySettings>) => {
      const { data } = await api.patch<import("./types").PrivacySettings>(
        "/auth/me/privacy",
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["privacy"] });
    },
  });
}

export function useNotificationPrefs() {
  return useQuery({
    queryKey: ["notification-prefs"],
    queryFn: async () => {
      const { data } = await api.get<import("./types").NotificationPreferences>(
        "/auth/me/notification-preferences"
      );
      return data;
    },
    enabled: hasTokens(),
  });
}

export function useUpdateNotificationPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { preferences: Record<string, boolean> }) => {
      const { data } = await api.put<import("./types").NotificationPreferences>(
        "/auth/me/notification-preferences",
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-prefs"] });
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await api.delete("/auth/me");
    },
  });
}

export function useSetPassword() {
  return useMutation({
    mutationFn: async (payload: { new_password: string; current_password?: string }) => {
      await api.post("/auth/password", payload);
    },
  });
}

export function usePresignAvatar() {
  return useMutation({
    mutationFn: async (payload: { filename: string; content_type: string }) => {
      const { data } = await api.post<{ upload_url: string; s3_key: string }>(
        "/auth/me/avatar/presign",
        payload
      );
      return data;
    },
  });
}

export function useConfirmAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { s3_key: string }) => {
      const { data } = await api.post<User>("/auth/me/avatar", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

// ============================================================
// In-app notifications
// ============================================================

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get<import("./types").NotificationList>(
        "/notifications",
        { params: { limit: 100 } }
      );
      return data;
    },
    enabled: hasTokens(),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.post(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/notifications/read-all");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ============================================================
// Support conversations (in-app)
// ============================================================

export function useCreateSupportConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      content: string;
      subject?: string | null;
      booking_id?: string | null;
    }) => {
      const { data } = await api.post<Conversation>("/messages/support", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ============================================================
// Disputes
// ============================================================

export function useDisputes() {
  return useQuery({
    queryKey: ["disputes"],
    queryFn: async () => {
      const { data } = await api.get<import("./types").DisputeList>("/disputes");
      return data;
    },
    enabled: hasTokens(),
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      booking_id: string;
      category: string;
      description: string;
    }) => {
      const { data } = await api.post<import("./types").Dispute>("/disputes", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

// ============================================================
// Booking offers (host proposes custom price in a conversation)
// ============================================================

export function useConversationOffers(conversationId: string | null) {
  return useQuery({
    queryKey: ["offers", conversationId],
    queryFn: async () => {
      const { data } = await api.get<import("./types").BookingOffer[]>(
        "/bookings/offers",
        { params: { conversation_id: conversationId } }
      );
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      ...payload
    }: {
      conversationId: string;
      check_in: string;
      check_out: string;
      total_price_egp: number;
      message?: string;
    }) => {
      const { data } = await api.post<import("./types").BookingOffer>(
        "/bookings/offers",
        payload,
        { params: { conversation_id: conversationId } }
      );
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["offers", v.conversationId] });
      qc.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useOfferAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ offerId, action }: { offerId: string; action: "accept" | "decline" }) => {
      const { data } = await api.post(`/bookings/offers/${offerId}/${action}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// ============================================================
// Host: bookings w/ filters, payments, performance
// ============================================================

export function useHostBookings(params: {
  status?: string;
  unit_id?: string;
  search?: string;
  area?: string;
  governorate?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["host", "bookings", params],
    queryFn: async () => {
      const { data } = await api.get<import("./types").PaginatedBookings>(
        "/host/bookings",
        { params }
      );
      return data;
    },
    enabled: hasTokens(),
    placeholderData: (prev) => prev,
  });
}

export function useHostPayments() {
  return useQuery({
    queryKey: ["host", "payments"],
    queryFn: async () => {
      const { data } = await api.get<PaymentListItem[]>("/payments/host");
      return data;
    },
    enabled: hasTokens(),
  });
}

export function useHostPerformance(days = 30) {
  return useQuery({
    queryKey: ["host", "performance", days],
    queryFn: async () => {
      const { data } = await api.get<import("./types").HostPerformance>(
        "/host/performance",
        { params: { days } }
      );
      return data;
    },
    enabled: hasTokens(),
  });
}

export function useBookingTimeline(bookingId: string | null) {
  return useQuery({
    queryKey: ["booking-timeline", bookingId],
    queryFn: async () => {
      const { data } = await api.get<import("./types").BookingTimeline>(
        `/bookings/admin/${bookingId}/timeline`
      );
      return data;
    },
    enabled: !!bookingId,
  });
}

export function useAdminContactParticipant() {
  return useMutation({
    mutationFn: async (payload: {
      booking_id: string;
      target: "guest" | "host";
      content: string;
    }) => {
      const { data } = await api.post("/messages/admin/conversations", payload);
      return data;
    },
  });
}

// ============================================================
// Staff / Admin operations
// ============================================================

export function useOpsDashboard() {
  return useQuery({
    queryKey: ["ops", "dashboard"],
    queryFn: async () => {
      const { data } = await api.get<import("./types").OpsDashboard>(
        "/operations/dashboard"
      );
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useOpsTask(taskId: string | null) {
  return useQuery({
    queryKey: ["ops", "task", taskId],
    queryFn: async () => {
      const { data } = await api.get<import("./types").OpsTask>(
        `/operations/tasks/${taskId}`
      );
      return data;
    },
    enabled: !!taskId && hasTokens(),
    retry: false,
  });
}

export function useMaintenanceRequests() {
  return useQuery({
    queryKey: ["ops", "maintenance"],
    queryFn: async () => {
      const { data } = await api.get<import("./types").MaintenanceRequest[]>(
        "/operations/maintenance"
      );
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useMaintenanceUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      payload,
    }: {
      requestId: string;
      payload: { status?: string; related_task_id?: string };
    }) => {
      const { data } = await api.patch(`/operations/maintenance/${requestId}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops"] });
    },
  });
}

export function usePropertyReadiness(unitId: string | null) {
  return useQuery({
    queryKey: ["ops", "readiness", unitId],
    queryFn: async () => {
      const { data } = await api.get<import("./types").PropertyReadiness>(
        `/operations/readiness/${unitId}`
      );
      return data;
    },
    enabled: !!unitId && hasTokens(),
    retry: false,
  });
}

export function useReadinessUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      payload,
    }: {
      unitId: string;
      payload: { status: string; blocked_until?: string; reason?: string };
    }) => {
      const { data } = await api.patch(`/operations/readiness/${unitId}`, payload);
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["ops", "readiness", v.unitId] });
    },
  });
}

export function useTaskAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      action,
      payload,
    }: {
      taskId: string;
      action: "assign" | "start" | "complete" | "notes" | "attachments";
      payload?: Record<string, unknown>;
    }) => {
      const { data } = await api.post(`/operations/tasks/${taskId}/${action}`, payload ?? {});
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops"] });
    },
  });
}

export function useKycQueue(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["ops", "kyc", params],
    queryFn: async () => {
      const { data } = await api.get<import("./types").KycPendingList>("/kyc/pending", {
        params,
      });
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useKycDocAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentId,
      action,
      payload,
    }: {
      documentId: string;
      action: "approve" | "reject" | "process";
      payload?: Record<string, unknown>;
    }) => {
      const { data } = await api.post(`/kyc/documents/${documentId}/${action}`, payload ?? {});
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops", "kyc"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useKycImages(documentId: string | null) {
  return useQuery({
    queryKey: ["ops", "kyc-images", documentId],
    queryFn: async () => {
      const { data } = await api.get<import("./types").KycImageDownload>(
        `/kyc/documents/${documentId}/images`
      );
      return data;
    },
    enabled: !!documentId,
    retry: false,
  });
}

export function usePaymentsQueue(status?: string) {
  return useQuery({
    queryKey: ["ops", "payments", status],
    queryFn: async () => {
      const { data } = await api.get<import("./types").AdminPaymentItem[]>(
        "/payments/admin/queue",
        { params: { status } }
      );
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function usePaymentQueueAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paymentId,
      action,
      payload,
    }: {
      paymentId: string;
      action: "verify" | "reject" | "refund";
      payload?: Record<string, unknown>;
    }) => {
      const { data } = await api.post(`/payments/${paymentId}/${action}`, payload ?? {});
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops", "payments"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useSupportQueue(status?: string) {
  return useQuery({
    queryKey: ["ops", "support", status],
    queryFn: async () => {
      const { data } = await api.get<ConversationListItem[]>(
        "/messages/support/queue",
        { params: { support_status: status } }
      );
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useSupportStatusUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      status,
    }: {
      conversationId: string;
      status: string;
    }) => {
      const { data } = await api.post(`/messages/support/${conversationId}/status`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops", "support"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useAdminDisputes(status?: string) {
  return useQuery({
    queryKey: ["ops", "disputes", status],
    queryFn: async () => {
      const { data } = await api.get<import("./types").DisputeList>(
        "/disputes/admin/all",
        { params: { status } }
      );
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useDisputeAdminUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      disputeId,
      ...payload
    }: {
      disputeId: string;
      status?: string;
      admin_notes?: string;
      reply?: string;
    }) => {
      const { data } = await api.patch(`/disputes/admin/${disputeId}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops", "disputes"] });
    },
  });
}

export function useReviewReports() {
  return useQuery({
    queryKey: ["ops", "review-reports"],
    queryFn: async () => {
      const { data } = await api.get<import("./types").ReviewReportList>(
        "/reviews/admin/reports"
      );
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useReviewReportUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportId,
      ...payload
    }: {
      reportId: string;
      status?: string;
      admin_notes?: string;
      hide_review?: boolean;
    }) => {
      const { data } = await api.patch(`/reviews/admin/reports/${reportId}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops", "review-reports"] });
    },
  });
}

export function usePendingListings() {
  return useQuery({
    queryKey: ["ops", "listings-pending"],
    queryFn: async () => {
      const { data } = await api.get<import("./types").AdminListing[]>(
        "/listings/admin/pending"
      );
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useListingModeration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      action,
      payload,
    }: {
      unitId: string;
      action: "approve" | "reject";
      payload?: { reason?: string };
    }) => {
      const { data } = await api.post(`/listings/admin/${unitId}/${action}`, payload ?? {});
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops", "listings-pending"] });
      qc.invalidateQueries({ queryKey: ["admin", "listings"] });
    },
  });
}

export function useAdminOverview() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const { data } = await api.get<import("./types").AdminOverview>("/admin/overview");
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useAdminUsers(params?: { role?: string; kyc_status?: string; search?: string }) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const { data } = await api.get<import("./types").AdminUser[]>("/admin/users", {
        params,
      });
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useAdminUserAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      action,
      payload,
    }: {
      userId: string;
      action: "suspend" | "reactivate" | "deactivate-hosting" | "restore-hosting";
      payload?: { reason?: string };
    }) => {
      const { data } = await api.post(`/admin/users/${userId}/${action}`, payload ?? {});
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminListings(params?: { status?: string; governorate?: string }) {
  return useQuery({
    queryKey: ["admin", "listings", params],
    queryFn: async () => {
      const { data } = await api.get<import("./types").AdminListing[]>("/admin/listings", {
        params,
      });
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useAdminStaff() {
  return useQuery({
    queryKey: ["admin", "staff"],
    queryFn: async () => {
      const { data } = await api.get<import("./types").StaffMember[]>("/admin/staff");
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useAdminStaffAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string;
      payload: { permissions?: string[]; is_active?: boolean; display_name?: string };
    }) => {
      const { data } = await api.patch(`/admin/staff/${userId}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "staff"] });
    },
  });
}

export function useAdminStaffPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      const { data } = await api.put(`/admin/staff/${userId}/permissions`, { permissions });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "staff"] });
    },
  });
}

export function useAdminCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      phone_number: string;
      display_name: string;
      email?: string;
      permissions?: string[];
      role_group?: string;
    }) => {
      const { data } = await api.post("/admin/staff", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "staff"] });
    },
  });
}

export function useDiscoveryCandidates(params?: {
  status?: string;
  city?: string;
  governorate?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["admin", "discovery", params],
    queryFn: async () => {
      const { data } = await api.get<import("./types").DiscoveryCandidateList>(
        "/discovery/candidates",
        { params }
      );
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useDiscoveryStats() {
  return useQuery({
    queryKey: ["admin", "discovery-stats"],
    queryFn: async () => {
      const { data } = await api.get<import("./types").DiscoveryStats>("/discovery/stats");
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useDiscoveryStatusUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      candidateId,
      ...payload
    }: {
      candidateId: string;
      status: string;
      notes?: string;
    }) => {
      const { data } = await api.patch(`/discovery/candidates/${candidateId}/status`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "discovery"] });
      qc.invalidateQueries({ queryKey: ["admin", "discovery-stats"] });
    },
  });
}

export function useDiscoveryImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      candidateId,
      ...payload
    }: {
      candidateId: string;
      host_name?: string;
      host_phone?: string;
      host_email?: string;
      overrides?: Record<string, unknown>;
    }) => {
      const { data } = await api.post(`/discovery/candidates/${candidateId}/import`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "discovery"] });
      qc.invalidateQueries({ queryKey: ["admin", "discovery-stats"] });
      qc.invalidateQueries({ queryKey: ["admin", "listings"] });
    },
  });
}

export function useReportCatalog() {
  return useQuery({
    queryKey: ["admin", "report-catalog"],
    queryFn: async () => {
      const { data } = await api.get<{ reports: import("./types").ReportCatalogEntry[] }>(
        "/admin/reports/catalog"
      );
      return data.reports;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useAdminReport(reportKey: string | null, params?: Record<string, string>) {
  return useQuery({
    queryKey: ["admin", "report", reportKey, params],
    queryFn: async () => {
      const { data } = await api.get<import("./types").ReportResult>(
        `/admin/reports/${reportKey}`,
        { params }
      );
      return data;
    },
    enabled: !!reportKey && hasTokens(),
    retry: false,
  });
}

export function useAdjustments(params?: { status?: string; booking_id?: string }) {
  return useQuery({
    queryKey: ["admin", "adjustments", params],
    queryFn: async () => {
      const { data } = await api.get<import("./types").Adjustment[]>(
        "/admin/adjustments",
        { params }
      );
      return data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useAdjustmentAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      adjustmentId,
      action,
      payload,
    }: {
      adjustmentId: string;
      action: "decide" | "apply" | "cancel";
      payload?: Record<string, unknown>;
    }) => {
      const { data } = await api.post(
        `/admin/adjustments/${adjustmentId}/${action}`,
        payload ?? {}
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "adjustments"] });
    },
  });
}

export function useCreateAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      adjustment_type: string;
      category: string;
      amount_egp: number;
      reason: string;
      booking_id?: string;
      user_id?: string;
      listing_id?: string;
      internal_note?: string;
      customer_note?: string;
    }) => {
      const { data } = await api.post("/admin/adjustments", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "adjustments"] });
    },
  });
}

export function useBookingFinancial(bookingId: string | null) {
  return useQuery({
    queryKey: ["admin", "booking-financial", bookingId],
    queryFn: async () => {
      const { data } = await api.get<import("./types").BookingFinancialContext>(
        `/admin/bookings/${bookingId}/financial`
      );
      return data;
    },
    enabled: !!bookingId && hasTokens(),
    retry: false,
  });
}

export function useFinanceEscrow(status?: string) {
  return useQuery({
    queryKey: ["admin", "escrow", status],
    queryFn: async () => {
      const { data } = await api.get<{ data: import("./types").EscrowRecord[] }>(
        "/finance/escrow",
        { params: { status } }
      );
      return data.data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useFinancePayouts(status?: string) {
  return useQuery({
    queryKey: ["admin", "payouts", status],
    queryFn: async () => {
      const { data } = await api.get<{ data: import("./types").PayoutRecord[] }>(
        "/finance/payouts",
        { params: { status } }
      );
      return data.data;
    },
    enabled: hasTokens(),
    retry: false,
  });
}

export function useFinanceLedger(ledgerAccount?: string) {
  return useQuery({
    queryKey: ["admin", "ledger", ledgerAccount],
    queryFn: async () => {
      const { data } = await api.get<{ data: import("./types").LedgerRecord[] }>(
        "/finance/ledger",
        { params: ledgerAccount ? { ledger_account: ledgerAccount } : {} }
      );
      return data.data;
    },
    enabled: hasTokens() && !!ledgerAccount,
    retry: false,
  });
}
