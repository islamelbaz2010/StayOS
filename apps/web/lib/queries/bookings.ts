import { useMutation, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface BookingCreate {
  unit_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  infants: number;
}

export interface BookingResponse {
  id: string;
  unit_id: string;
  guest_id: string;
  host_id: string | null;
  status: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  infants: number;
  requested_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  reject_reason: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
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

export async function getBooking(bookingId: string): Promise<BookingResponse> {
  const { data } = await api.get<BookingResponse>(`/bookings/${bookingId}`);
  return data;
}

export interface BookingUpdate {
  status: "accepted" | "rejected" | "cancelled";
  reject_reason?: string;
  cancel_reason?: string;
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
