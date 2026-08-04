import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface KycUploadUrls {
  front: string;
  back: string;
  selfie: string;
}

export interface KycInitiateResponse {
  document_id: string;
  upload_urls: KycUploadUrls;
  expires_at: string;
}

export interface KycDocument {
  id: string;
  user_id: string;
  account_id: string | null;
  document_type: string;
  document_number: string | null;
  status: string;
  legal_name: string | null;
  front_image_key: string | null;
  back_image_key: string | null;
  selfie_image_key: string | null;
  verified_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface KycStatusResponse {
  user_id: string;
  kyc_status: string;
  documents: KycDocument[];
}

export interface KycPendingListResponse {
  data: KycDocument[];
  total: number;
}

export function useKycStatus() {
  return useQuery({
    queryKey: ["kyc-status"],
    queryFn: async () => {
      const { data } = await api.get<KycStatusResponse>("/kyc/status");
      return data;
    },
  });
}

export function useInitiateKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      document_type: string;
      document_number?: string;
    }) => {
      const { data } = await api.post<KycInitiateResponse>("/kyc/initiate", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
    },
  });
}

export function useSubmitKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      const { data } = await api.post<{ document_id: string; status: string }>(
        `/kyc/documents/${documentId}/submit`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
    },
  });
}

export function usePendingKyc() {
  return useQuery({
    queryKey: ["kyc-pending"],
    queryFn: async () => {
      const { data } = await api.get<KycPendingListResponse>("/kyc/pending");
      return data;
    },
  });
}

export function useApproveKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      documentId: string;
      legal_name?: string;
    }) => {
      const { data } = await api.post<KycDocument>(
        `/kyc/documents/${payload.documentId}/approve`,
        { legal_name: payload.legal_name }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-pending"] });
    },
  });
}

export function useRejectKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { documentId: string; reason: string }) => {
      const { data } = await api.post<KycDocument>(
        `/kyc/documents/${payload.documentId}/reject`,
        { reason: payload.reason }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-pending"] });
    },
  });
}

export function useUpgradeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch("/auth/me/role", { role: "host" });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
    },
  });
}
