import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type HostEarningsSummary = components["schemas"]["HostEarningsSummary"];

export async function getHostEarnings(): Promise<HostEarningsSummary> {
  const { data } = await api.get<HostEarningsSummary>("/host/earnings");
  return data;
}

export function useHostEarnings() {
  return useQuery({
    queryKey: ["host-earnings"],
    queryFn: getHostEarnings,
  });
}
