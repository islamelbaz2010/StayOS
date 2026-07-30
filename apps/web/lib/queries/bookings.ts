import { useMutation } from "@tanstack/react-query";

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

export function useCreateBooking() {
  return useMutation({
    mutationFn: createBooking,
  });
}
