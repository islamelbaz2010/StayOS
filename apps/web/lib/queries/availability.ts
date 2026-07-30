import { useMutation, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface AvailabilityDay {
  date: string;
  status: string;
  block_type: string | null;
}

export interface AvailabilityResponse {
  unit_id: string;
  check_in: string;
  check_out: string;
  days: AvailabilityDay[];
}

export interface AvailabilityRule {
  date_from: string;
  date_to: string;
  status: "available" | "blocked";
}

export interface AvailabilityUpdateRequest {
  rules: AvailabilityRule[];
}

export async function getAvailability(
  unitId: string,
  checkIn: string,
  checkOut: string
): Promise<AvailabilityResponse> {
  const { data } = await api.get<AvailabilityResponse>(`/availability/${unitId}`, {
    params: { check_in: checkIn, check_out: checkOut },
  });
  return data;
}

export async function updateAvailability(
  unitId: string,
  payload: AvailabilityUpdateRequest
): Promise<AvailabilityResponse> {
  const { data } = await api.patch<AvailabilityResponse>(
    `/availability/${unitId}`,
    payload
  );
  return data;
}

export function useAvailability(
  unitId: string,
  checkIn: string,
  checkOut: string
) {
  return useQuery({
    queryKey: ["availability", unitId, checkIn, checkOut],
    queryFn: () => getAvailability(unitId, checkIn, checkOut),
    enabled: Boolean(unitId && checkIn && checkOut),
  });
}

export function useUpdateAvailability() {
  return useMutation({
    mutationFn: ({
      unitId,
      payload,
    }: {
      unitId: string;
      payload: AvailabilityUpdateRequest;
    }) => updateAvailability(unitId, payload),
  });
}
