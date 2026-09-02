import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, hasTokens } from "./api";
import type {
  Booking,
  BookingCancellationPreview,
  CalendarRuleCreatePayload,
  CalendarRuleResponse,
  Conversation,
  CoHost,
  HostCalendarResponse,
  HostEarningsSummary,
  HostListingDetail,
  HostOwnProfile,
  HostProfile,
  HostReservationDetail,
  HostReservationSummary,
  HostTodayResponse,
  Listing,
  ListingCreatePayload,
  ListingDetail,
  ListingReadiness,
  ListingUpdatePayload,
  LocationSuggestion,
  Message,
  MessageTemplate,
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
  return useQuery({
    queryKey: ["search", params],
    queryFn: async () => {
      const { data } = await api.get<SearchResponse>("/listings", { params });
      return data;
    },
    enabled: Object.values(params).some((v) => v !== undefined && v !== ""),
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
    },
  });
}

export function useMarkRead(conversationId: string | null) {
  return useMutation({
    mutationFn: async () => {
      await api.post(`/messages/conversations/${conversationId}/read`, {});
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
