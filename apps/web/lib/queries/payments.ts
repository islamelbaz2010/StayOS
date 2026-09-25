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
  provider: string | null;
  checkout_url: string | null;
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
  refund_amount_egp: number | null;
  refunded_at: string | null;
  instructions: string;
  accommodation_amount_egp: number | null;
  guest_service_fee_egp: number | null;
  cleaning_fee_egp: number | null;
  vat_egp: number | null;
  payment_deadline_at: string | null;
  proof_rejection_count: number;
  unit_title: string | null;
  unit_cover_image: string | null;
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
  proof_s3_key: string | null;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  reject_reason: string | null;
  accommodation_amount_egp: number | null;
  guest_service_fee_egp: number | null;
  payment_deadline_at: string | null;
  refund_amount_egp: number | null;
  refunded_at: string | null;
  proof_rejection_count: number;
  unit_title: string | null;
  unit_cover_image: string | null;
  check_in: string | null;
  check_out: string | null;
  booking_status: string | null;
  // Host-facing earnings fields — only populated on /payments/host.
  host_net_egp?: number | null;
  platform_fee_egp?: number | null;
  platform_share_waived?: boolean | null;
  funds_status?: string | null;
  funds_held_egp?: number | null;
  expected_payout_at?: string | null;
  payout_status?: string | null;
  paid_at?: string | null;
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
  url?: string;
}

export interface PaymentRejectRequest {
  reject_reason?: string | null;
}

export interface PaymentProofDownloadResponse {
  download_url: string;
  expires_in: number;
}

export async function getPaymentProofDownloadUrl(
  paymentId: string
): Promise<string> {
  const { data } = await api.get<PaymentProofDownloadResponse>(
    `/payments/${paymentId}/proof/download`
  );
  return data.download_url;
}

export async function getPaymentByBooking(
  bookingId: string
): Promise<PaymentResponse | null> {
  try {
    const { data } = await api.get<PaymentResponse>(
      `/payments/booking/${bookingId}`
    );
    return data;
  } catch (error) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getPayment(paymentId: string): Promise<PaymentResponse> {
  const { data } = await api.get<PaymentResponse>(`/payments/${paymentId}`);
  return data;
}

export async function getMyPayments(): Promise<PaymentListItem[]> {
  const { data } = await api.get<PaymentListItem[]>(`/payments`);
  return data;
}

export async function getHostPayments(
  status?: string
): Promise<PaymentListItem[]> {
  const { data } = await api.get<PaymentListItem[]>(`/payments/host`, {
    params: status ? { status } : undefined,
  });
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

export async function refundPayment(paymentId: string): Promise<PaymentResponse> {
  const { data } = await api.post<PaymentResponse>(`/payments/${paymentId}/refund`);
  return data;
}

export async function createCheckoutSession(
  paymentId: string
): Promise<PaymentResponse> {
  const { data } = await api.post<PaymentResponse>(
    `/payments/${paymentId}/checkout-session`
  );
  return data;
}

export interface PaymentReturnStatus {
  booking_id: string;
  payment_id: string;
  payment_status: string;
  booking_status: string;
  amount_egp: number;
  reference_number: string;
  verified_at: string | null;
}

export async function getPaymentReturnStatus(
  bookingId: string,
  token: string
): Promise<PaymentReturnStatus> {
  const { data } = await api.get<PaymentReturnStatus>(
    `/payments/return-status`,
    { params: { booking_id: bookingId, t: token } }
  );
  return data;
}

export function usePaymentReturnStatus(
  bookingId: string,
  token: string,
  options: {
    refetchInterval?:
      | number
      | false
      | ((status: PaymentReturnStatus | undefined) => number | false);
  } = {}
) {
  const interval = options.refetchInterval;
  return useQuery({
    queryKey: ["payment-return-status", bookingId, token],
    queryFn: () => getPaymentReturnStatus(bookingId, token),
    enabled: Boolean(bookingId) && Boolean(token),
    retry: false,
    refetchInterval:
      typeof interval === "function"
        ? (query) =>
            interval(query.state.data as PaymentReturnStatus | undefined)
        : interval,
  });
}

export function usePaymentByBooking(
  bookingId: string,
  options: {
    refetchInterval?:
      | number
      | false
      | ((payment: PaymentResponse | null | undefined) => number | false);
  } = {}
) {
  const interval = options.refetchInterval;
  return useQuery({
    queryKey: ["payment", "booking", bookingId],
    queryFn: () => getPaymentByBooking(bookingId),
    enabled: Boolean(bookingId),
    refetchInterval:
      typeof interval === "function"
        ? (query) =>
            interval(query.state.data as PaymentResponse | null | undefined)
        : interval,
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
    refetchInterval: 30_000,
  });
}

export function useHostPayments(
  status?: string,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ["host-payments", status],
    queryFn: () => getHostPayments(status),
    refetchInterval: 30_000,
    enabled: options.enabled ?? true,
  });
}

export function usePaymentQueue(
  status?: string,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ["payment-queue", status],
    queryFn: () => getPaymentQueue(status),
    refetchInterval: 30_000,
    enabled: options.enabled ?? true,
  });
}

export interface EscrowRecord {
  id: string;
  reservation_id: string;
  host_id: string;
  amount_egp: number;
  status: string;
  hold_until: string | null;
  released_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutRecord {
  id: string;
  wallet_id: string;
  host_id: string;
  amount_egp: number;
  status: string;
  provider: string | null;
  provider_ref: string | null;
  processed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerRecord {
  id: string;
  transaction_id: string;
  wallet_id: string | null;
  escrow_id: string | null;
  ledger_account: string;
  account_type: string;
  entry_type: string;
  amount_egp: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

async function getEscrows(status?: string): Promise<EscrowRecord[]> {
  const { data } = await api.get<{ data: EscrowRecord[] }>("/finance/escrow", {
    params: status ? { status } : {},
  });
  return data.data;
}

async function getPayouts(status?: string): Promise<PayoutRecord[]> {
  const { data } = await api.get<{ data: PayoutRecord[] }>("/finance/payouts", {
    params: status ? { status } : {},
  });
  return data.data;
}

async function getPlatformLedger(account?: string): Promise<LedgerRecord[]> {
  const { data } = await api.get<{ data: LedgerRecord[] }>("/finance/ledger", {
    params: account ? { ledger_account: account } : {},
  });
  return data.data;
}

export function useEscrows(
  status?: string,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ["escrows", status],
    queryFn: () => getEscrows(status),
    refetchInterval: 30_000,
    enabled: options.enabled ?? true,
  });
}

export function usePayouts(
  status?: string,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ["payouts", status],
    queryFn: () => getPayouts(status),
    refetchInterval: 30_000,
    enabled: options.enabled ?? true,
  });
}

export function usePlatformLedger(account?: string) {
  return useQuery({
    queryKey: ["platform-ledger", account],
    queryFn: () => getPlatformLedger(account),
    refetchInterval: 30_000,
    enabled: Boolean(account),
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

export function useRefundPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refundPayment,
    onSuccess: (_data, paymentId) => {
      queryClient.invalidateQueries({
        queryKey: ["payment", paymentId],
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

export function useCheckoutSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (_data, paymentId) => {
      queryClient.invalidateQueries({
        queryKey: ["payment", paymentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["payment", "booking"],
      });
    },
  });
}

export function usePaymentProofDownloadUrl() {
  return useMutation({
    mutationFn: getPaymentProofDownloadUrl,
  });
}
