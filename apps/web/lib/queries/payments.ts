import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface PaymentResponse {
  id: string;
  booking_id: string;
  guest_id: string;
  host_id: string;
  unit_id: string;
  status: string;
  method: string;
  amount_egp: number;
  nights: number;
  reference_number: string;
  proof_s3_key: string | null;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  reject_reason: string | null;
  cancelled_at: string | null;
  instructions: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentListItem {
  id: string;
  booking_id: string;
  guest_id: string;
  host_id: string;
  unit_id: string;
  status: string;
  method: string;
  amount_egp: number;
  reference_number: string;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentProofPresignRequest {
  filename: string;
  content_type: string;
}

export interface PaymentProofPresignResponse {
  upload_url: string;
  proof_key: string;
}

export interface PaymentProofUpload {
  s3_key: string;
  url: string;
}

export interface PaymentRejectRequest {
  reject_reason?: string | null;
}

export async function getPaymentByBooking(
  bookingId: string
): Promise<PaymentResponse> {
  const { data } = await api.get<PaymentResponse>(
    `/payments/booking/${bookingId}`
  );
  return data;
}

export async function getPayment(paymentId: string): Promise<PaymentResponse> {
  const { data } = await api.get<PaymentResponse>(`/payments/${paymentId}`);
  return data;
}

export async function getMyPayments(): Promise<PaymentListItem[]> {
  const { data } = await api.get<PaymentListItem[]>(`/payments`);
  return data;
}

export async function getPaymentQueue(
  status?: string
): Promise<PaymentListItem[]> {
  const { data } = await api.get<PaymentListItem[]>(`/payments/admin/queue`, {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function presignProof(
  paymentId: string,
  payload: PaymentProofPresignRequest
): Promise<PaymentProofPresignResponse> {
  const { data } = await api.post<PaymentProofPresignResponse>(
    `/payments/${paymentId}/proof/presign`,
    payload
  );
  return data;
}

export async function uploadProof(
  paymentId: string,
  payload: PaymentProofUpload
): Promise<PaymentResponse> {
  const { data } = await api.post<PaymentResponse>(
    `/payments/${paymentId}/proof`,
    payload
  );
  return data;
}

export async function verifyPayment(paymentId: string): Promise<PaymentResponse> {
  const { data } = await api.post<PaymentResponse>(
    `/payments/${paymentId}/verify`
  );
  return data;
}

export async function rejectPayment(
  paymentId: string,
  rejectReason: string
): Promise<PaymentResponse> {
  const { data } = await api.post<PaymentResponse>(
    `/payments/${paymentId}/reject`,
    { reject_reason: rejectReason }
  );
  return data;
}

export function usePaymentByBooking(bookingId: string) {
  return useQuery({
    queryKey: ["payment", "booking", bookingId],
    queryFn: () => getPaymentByBooking(bookingId),
    enabled: Boolean(bookingId),
  });
}

export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => getPayment(paymentId),
    enabled: Boolean(paymentId),
  });
}

export function useMyPayments() {
  return useQuery({
    queryKey: ["my-payments"],
    queryFn: getMyPayments,
  });
}

export function usePaymentQueue(status?: string) {
  return useQuery({
    queryKey: ["payment-queue", status],
    queryFn: () => getPaymentQueue(status),
  });
}

export function usePresignProof() {
  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: string;
      payload: PaymentProofPresignRequest;
    }) => presignProof(paymentId, payload),
  });
}

export function useUploadProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: string;
      payload: PaymentProofUpload;
    }) => uploadProof(paymentId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["payment", variables.paymentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["payment", "booking"],
      });
      queryClient.invalidateQueries({
        queryKey: ["payment-queue"],
      });
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => verifyPayment(paymentId),
    onSuccess: (_data, paymentId) => {
      queryClient.invalidateQueries({
        queryKey: ["payment", paymentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["payment-queue"],
      });
    },
  });
}

export function useRejectPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      rejectReason,
    }: {
      paymentId: string;
      rejectReason: string;
    }) => rejectPayment(paymentId, rejectReason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["payment", variables.paymentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["payment-queue"],
      });
    },
  });
}
