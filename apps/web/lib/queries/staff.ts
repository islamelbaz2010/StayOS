import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const STAFF_PERMISSIONS = [
  "listings",
  "kyc",
  "payments",
  "operations",
  "disputes",
  "discovery",
  "content",
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export interface StaffMember {
  id: string;
  phone_number: string | null;
  email: string | null;
  display_name: string | null;
  role: string;
  is_active: boolean;
  permissions: string[];
  has_password: boolean;
  created_at: string;
}

export function useStaffList() {
  return useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const { data } = await api.get<StaffMember[]>("/admin/staff");
      return data;
    },
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      phone_number: string;
      display_name: string;
      email?: string;
      permissions: string[];
    }) => {
      const { data } = await api.post<StaffMember>("/admin/staff", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      user_id: string;
      is_active?: boolean;
      display_name?: string;
    }) => {
      const { user_id, ...body } = payload;
      const { data } = await api.patch<StaffMember>(
        `/admin/staff/${user_id}`,
        body
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
  });
}

export function useSetStaffPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      user_id: string;
      permissions: string[];
    }) => {
      const { data } = await api.put<StaffMember>(
        `/admin/staff/${payload.user_id}/permissions`,
        { permissions: payload.permissions }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
  });
}
