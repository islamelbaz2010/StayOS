import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export type DisputeCategory =
  | "booking"
  | "payment"
  | "property"
  | "host"
  | "guest"
  | "other";

export type DisputeStatus = "open" | "in_review" | "resolved" | "closed";

export interface Dispute {
  id: string;
  reporter_id: string;
  reporter_name: string | null;
  reporter_role: string | null;
  booking_id: string;
  category: string;
  description: string;
  status: string;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DisputeListResponse {
  data: Dispute[];
  total: number;
}

export function useMyDisputes() {
  return useQuery({
    queryKey: ["my-disputes"],
    queryFn: async () => {
      const { data } = await api.get<DisputeListResponse>("/disputes");
      return data;
    },
  });
}

export function useAdminDisputes(status?: string) {
  return useQuery({
    queryKey: ["admin-disputes", status ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<DisputeListResponse>(
        "/disputes/admin/all",
        { params: status ? { status } : undefined }
      );
      return data;
    },
  });
}

export function useCreateDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      booking_id: string;
      category: DisputeCategory;
      description: string;
    }) => {
      const { data } = await api.post<Dispute>("/disputes", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
    },
  });
}

export function useUpdateDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      dispute_id: string;
      status?: DisputeStatus;
      admin_notes?: string;
      reply?: string;
    }) => {
      const { dispute_id, ...body } = payload;
      const { data } = await api.patch<Dispute>(
        `/disputes/admin/${dispute_id}`,
        body
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["my-disputes"] });
    },
  });
}
