import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type HostTodayItem = components["schemas"]["HostTodayItem"];
export type HostTodayResponse = components["schemas"]["HostTodayResponse"];

export async function getHostToday(): Promise<HostTodayResponse> {
  const { data } = await api.get<HostTodayResponse>("/host/today");
  return data;
}

export function useHostToday() {
  return useQuery({
    queryKey: ["host-today"],
    queryFn: getHostToday,
  });
}
