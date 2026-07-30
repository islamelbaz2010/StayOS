import { useMutation, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type AvailabilityDay = components["schemas"]["AvailabilityDay"];
export type AvailabilityResponse =
  components["schemas"]["app__availability__schemas__AvailabilityResponse"];
export type AvailabilityRule = components["schemas"]["AvailabilityRule"];
export type AvailabilityUpdateRequest = components["schemas"]["AvailabilityUpdateRequest"];

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
