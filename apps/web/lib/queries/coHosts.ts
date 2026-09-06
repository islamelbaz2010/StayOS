import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type CoHost = components["schemas"]["CoHostResponse"];
export type CoHostInvite = components["schemas"]["CoHostInvite"];
export type CoHostUpdate = components["schemas"]["CoHostUpdate"];

export async function getCoHosts(unitId: string): Promise<CoHost[]> {
  const { data } = await api.get<CoHost[]>(`/host/listings/${unitId}/co-hosts`);
  return data;
}

export function useCoHosts(unitId: string) {
  return useQuery({
    queryKey: ["host-co-hosts", unitId],
    queryFn: () => getCoHosts(unitId),
    enabled: Boolean(unitId),
  });
}

export function useInviteCoHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ unitId, payload }: { unitId: string; payload: CoHostInvite }) => {
      const { data } = await api.post<CoHost>(`/host/listings/${unitId}/co-hosts`, payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["host-co-hosts", variables.unitId] });
    },
  });
}

export function useUpdateCoHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      coHostId,
      payload,
    }: {
      unitId: string;
      coHostId: string;
      payload: CoHostUpdate;
    }) => {
      const { data } = await api.patch<CoHost>(
        `/host/listings/${unitId}/co-hosts/${coHostId}`,
        payload
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["host-co-hosts", variables.unitId] });
    },
  });
}

export function useRemoveCoHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ unitId, coHostId }: { unitId: string; coHostId: string }) => {
      await api.delete(`/host/listings/${unitId}/co-hosts/${coHostId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["host-co-hosts", variables.unitId] });
    },
  });
}
