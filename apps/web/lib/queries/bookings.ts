import { useMutation, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type BookingCreate = components["schemas"]["BookingCreate"];
export type BookingResponse = components["schemas"]["BookingResponse"];
export type BookingUpdate = components["schemas"]["BookingUpdate"];
export type BookingCancelRequest = components["schemas"]["BookingCancelRequest"];
export type BookingCancellationPreview = components["schemas"]["BookingCancellationPreview"];

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
  return useMutation({
    mutationFn: createBooking,
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
