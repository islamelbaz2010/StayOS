import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type BookingCreate = components["schemas"]["BookingCreate"];
export type BookingResponse = components["schemas"]["BookingResponse"];
export type BookingUpdate = components["schemas"]["BookingUpdate"];
export type BookingCancelRequest = components["schemas"]["BookingCancelRequest"];
export type BookingCancellationPreview = components["schemas"]["BookingCancellationPreview"];
export type BookingQuote = components["schemas"]["BookingQuote"];

export function useBookingQuote(unitId: string, checkIn: string, checkOut: string) {
  return useQuery({
    queryKey: ["booking-quote", unitId, checkIn, checkOut],
    queryFn: async () => {
      const { data } = await api.get<BookingQuote>("/payments/quote", {
        params: { unit_id: unitId, check_in: checkIn, check_out: checkOut },
      });
      return data;
    },
    enabled: Boolean(unitId && checkIn && checkOut),
  });
}

export async function createBooking(payload: BookingCreate): Promise<BookingResponse> {
  const { data } = await api.post<BookingResponse>("/bookings", payload);
  return data;
}

export async function getHostBookings(
  status: string | null = null
): Promise<BookingResponse[]> {
  const { data } = await api.get<BookingResponse[]>("/bookings", {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function getGuestBookings(
  status: string | null = null
): Promise<BookingResponse[]> {
  const { data } = await api.get<BookingResponse[]>("/bookings/guest", {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function getBooking(bookingId: string): Promise<BookingResponse> {
  const { data } = await api.get<BookingResponse>(`/bookings/${bookingId}`);
  return data;
}

export async function updateBooking(
  bookingId: string,
  payload: BookingUpdate
): Promise<BookingResponse> {
  const { data } = await api.patch<BookingResponse>(`/bookings/${bookingId}`, payload);
  return data;
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ["guest-bookings"] });
      queryClient.invalidateQueries({
        queryKey: ["booking-quote", booking.unit_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["listing-availability", booking.unit_id],
      });
    },
  });
}

export function useHostBookings(status: string | null = null) {
  return useQuery({
    queryKey: ["host-bookings", status],
    queryFn: () => getHostBookings(status),
  });
}

export function useGuestBookings(status: string | null = null) {
  return useQuery({
    queryKey: ["guest-bookings", status],
    queryFn: () => getGuestBookings(status),
  });
}

export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBooking(bookingId),
    enabled: Boolean(bookingId),
  });
}

export function useUpdateBooking() {
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload: BookingUpdate }) =>
      updateBooking(bookingId, payload),
  });
}

export async function getCancellationPreview(
  bookingId: string
): Promise<BookingCancellationPreview> {
  const { data } = await api.get<BookingCancellationPreview>(
    `/bookings/${bookingId}/cancellation-preview`
  );
  return data;
}

export async function cancelBooking(
  bookingId: string,
  payload: BookingCancelRequest = {}
): Promise<BookingResponse> {
  const { data } = await api.post<BookingResponse>(`/bookings/${bookingId}/cancel`, payload);
  return data;
}

export function useCancellationPreview(bookingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["booking-cancellation-preview", bookingId],
    queryFn: () => getCancellationPreview(bookingId),
    enabled: enabled && Boolean(bookingId),
  });
}

export function useCancelBooking() {
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload?: BookingCancelRequest }) =>
      cancelBooking(bookingId, payload),
  });
}

export type StayInfoResponse = components["schemas"]["StayInfoResponse"];

export function useStayInfo(bookingId: string) {
  return useQuery({
    queryKey: ["stay-info", bookingId],
    queryFn: async () => {
      const { data } = await api.get<StayInfoResponse>(
        `/bookings/${bookingId}/stay`
      );
      return data;
    },
    enabled: Boolean(bookingId),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.post<BookingResponse>(
        `/bookings/${bookingId}/check-in`
      );
      return data;
    },
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ["stay-info", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["guest-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.post<BookingResponse>(
        `/bookings/${bookingId}/check-out`
      );
      return data;
    },
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ["stay-info", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["guest-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
    },
  });
}
