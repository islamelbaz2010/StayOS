import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type AdminOverview = components["schemas"]["AdminOverviewResponse"];
export interface AdminUserListItem {
  id: string;
  display_name: string | null;
  email: string | null;
  phone_number: string | null;
  role: string;
  kyc_status: string;
  is_active: boolean;
  created_at: string;
}
export interface AdminListingListItem {
  id: string;
  title: string;
  host_id: string;
  status: string;
  governorate: string;
  city: string;
  has_pending_changes: boolean;
  created_at: string;
}
type ApiBookingFinancialContext =
  components["schemas"]["BookingFinancialContextResponse"];

export interface EscrowInfo {
  id: string;
  status: string;
  amount_egp: number;
  hold_until: string | null;
  released_at: string | null;
  refunded_at: string | null;
}

export interface LedgerEntryInfo {
  ledger_account: string;
  entry_type: string;
  amount_egp: number;
  balance_after: number;
  created_at: string | null;
}

export interface FinancialTransactionInfo {
  id: string;
  type: string;
  amount_egp: number;
  status: string;
  provider: string | null;
  provider_ref: string | null;
  created_at: string | null;
  ledger_entries: LedgerEntryInfo[];
}

export interface LinkedDisputeInfo {
  id: string;
  category: string;
  status: string;
  created_at: string | null;
}

/** Canonical booking economics emitted by the finance commercial engine. */
export interface BookingFinancials {
  guest_paid_egp: number | null;
  accommodation_egp: number | null;
  cleaning_fee_egp: number | null;
  platform_share_egp: number | null;
  taxable_amount_egp: number | null;
  vat_egp: number | null;
  host_side_share_egp: number | null;
  guest_side_share_egp: number | null;
  host_net_egp: number | null;
  provider: string | null;
  provider_ref: string | null;
  transaction_ref: string | null;
}

/** Funds/payout state derived from the booking's escrow lifecycle. */
export interface BookingPayoutState {
  funds_status: string;
  funds_held_egp: number | null;
  expected_payout_at: string | null;
  payout_status: string;
  paid_at: string | null;
}

/** BookingFinancialContext with the nested dicts narrowed to their
 *  server-emitted shapes. */
export type BookingFinancialContext = Omit<
  ApiBookingFinancialContext,
  "escrow" | "transactions" | "disputes" | "financials" | "payout"
> & {
  escrow: EscrowInfo | null;
  financials: BookingFinancials | null;
  payout: BookingPayoutState | null;
  transactions: FinancialTransactionInfo[];
  disputes: LinkedDisputeInfo[];
};

export interface DisputeContext {
  dispute: {
    id: string;
    booking_id: string;
    category: string;
    description: string;
    status: string;
    admin_notes: string | null;
    resolved_by: string | null;
    resolved_at: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  reporter: {
    id: string;
    display_name: string | null;
    phone_number: string | null;
    role: string;
  } | null;
  booking: BookingFinancialContext | null;
}

/** Marketplace operations snapshot for the admin console landing page. */
export function useAdminOverview() {
  return useQuery<AdminOverview>({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data } = await api.get<AdminOverview>("/admin/overview");
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useAdminUsers(role?: string, kycStatus?: string) {
  return useQuery<AdminUserListItem[]>({
    queryKey: ["admin-users", role, kycStatus],
    queryFn: async () => {
      const { data } = await api.get<AdminUserListItem[]>("/admin/users", {
        params: { role: role || undefined, kyc_status: kycStatus || undefined },
      });
      return data;
    },
  });
}

export function useAdminListings(status?: string, governorate?: string) {
  return useQuery<AdminListingListItem[]>({
    queryKey: ["admin-listings", status, governorate],
    queryFn: async () => {
      const { data } = await api.get<AdminListingListItem[]>("/admin/listings", {
        params: { status: status || undefined, governorate: governorate || undefined },
      });
      return data;
    },
  });
}

/** Booking-level financial investigation view (payments permission). */
export function useBookingFinancialContext(bookingId: string | undefined) {
  return useQuery<BookingFinancialContext>({
    queryKey: ["admin-booking-financial", bookingId],
    queryFn: async () => {
      const { data } = await api.get<BookingFinancialContext>(
        `/admin/bookings/${bookingId}/financial`
      );
      return data;
    },
    enabled: Boolean(bookingId),
    retry: false,
  });
}

/** Dispute investigation view: dispute + reporter + booking context. */
export function useDisputeContext(disputeId: string | undefined) {
  return useQuery<DisputeContext>({
    queryKey: ["admin-dispute-context", disputeId],
    queryFn: async () => {
      const { data } = await api.get<DisputeContext>(
        `/admin/disputes/${disputeId}/context`
      );
      return data;
    },
    enabled: Boolean(disputeId),
  });
}

export type Adjustment = components["schemas"]["AdjustmentResponse"];

export interface AdjustmentCreateInput {
  adjustment_type: string;
  category: string;
  amount_egp: number;
  reason: string;
  booking_id?: string | null;
  user_id?: string | null;
  listing_id?: string | null;
  requested_by_id?: string | null;
  internal_note?: string | null;
  customer_note?: string | null;
}

/** Explicit admin commercial adjustments (payments permission). */
export function useAdjustments(filters?: {
  status?: string;
  booking_id?: string;
}) {
  return useQuery<Adjustment[]>({
    queryKey: ["admin-adjustments", filters?.status, filters?.booking_id],
    queryFn: async () => {
      const { data } = await api.get<Adjustment[]>("/admin/adjustments", {
        params: {
          status: filters?.status || undefined,
          booking_id: filters?.booking_id || undefined,
        },
      });
      return data;
    },
  });
}

export function useCreateAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdjustmentCreateInput) => {
      const { data } = await api.post<Adjustment>(
        "/admin/adjustments",
        input
      );
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-adjustments"] }),
  });
}

export function useDecideAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; approve: boolean }) => {
      const { data } = await api.post<Adjustment>(
        `/admin/adjustments/${vars.id}/decide`,
        { approve: vars.approve }
      );
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-adjustments"] }),
  });
}

export function useApplyAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Adjustment>(
        `/admin/adjustments/${id}/apply`
      );
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-adjustments"] }),
  });
}

export function useCancelAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Adjustment>(
        `/admin/adjustments/${id}/cancel`
      );
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-adjustments"] }),
  });
}
