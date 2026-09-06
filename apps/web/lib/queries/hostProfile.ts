import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type HostProfile = components["schemas"]["app__host__schemas__HostProfileResponse"];
export type HostProfileUpdate = components["schemas"]["HostProfileUpdate"];

export async function getHostProfile(): Promise<HostProfile> {
  const { data } = await api.get<HostProfile>("/host/profile");
  return data;
}

export function useHostProfile() {
  return useQuery({
    queryKey: ["host-profile"],
    queryFn: getHostProfile,
  });
}

export function useUpdateHostProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HostProfileUpdate) => {
      const { data } = await api.patch<HostProfile>("/host/profile", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-profile"] });
    },
  });
}
