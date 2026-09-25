import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type Account = components["schemas"]["AccountResponse"];
export type AccountUpdate = components["schemas"]["AccountUpdate"];

export function useAccount() {
  return useQuery({
    queryKey: ["account"],
    queryFn: async () => {
      const { data } = await api.get<Account>("/auth/me/account");
      return data;
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AccountUpdate) => {
      const { data } = await api.patch<Account>("/auth/me/account", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
  });
}
