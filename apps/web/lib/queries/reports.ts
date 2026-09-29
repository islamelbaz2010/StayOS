import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface ReportCatalogEntry {
  key: string;
  category: string;
  columns: string[];
  date_basis: string;
  filters: string[];
  sortable: string[];
  money_columns: string[];
  implemented: boolean;
  unavailable_reason: string | null;
  note: string | null;
  total_labels: Record<string, string>;
}

export interface ReportResult {
  key: string;
  category: string;
  date_basis: string;
  columns: string[];
  rows: Record<string, string | number | boolean | null>[];
  total: number;
  page: number;
  page_size: number;
  totals: Record<string, number>;
  total_labels: Record<string, string>;
  note: string | null;
  generated_at: string;
  filters_applied: Record<string, string>;
}

export function useReportCatalog(enabled = true) {
  return useQuery<ReportCatalogEntry[]>({
    queryKey: ["admin-reports-catalog"],
    queryFn: async () => {
      const { data } = await api.get<{ reports: ReportCatalogEntry[] }>(
        "/admin/reports/catalog"
      );
      return data.reports;
    },
    enabled,
    retry: false,
  });
}

export interface ReportQueryParams {
  [key: string]: string | number | undefined;
}

export function useReport(
  reportKey: string,
  params: ReportQueryParams,
  enabled = true
) {
  return useQuery<ReportResult>({
    queryKey: ["admin-report", reportKey, params],
    queryFn: async () => {
      const { data } = await api.get<ReportResult>(
        `/admin/reports/${reportKey}`,
        { params }
      );
      return data;
    },
    enabled,
    retry: false,
  });
}

/** Download the current report view as CSV/XLSX — same filters, same
 * permission gate server-side. The Authorization header travels with
 * axios, so exports can't be fetched by an unauthenticated client. */
export interface ManagementReport {
  generated_at: string;
  period: { date_from: string | null; date_to: string | null };
  filters_applied: Record<string, string>;
  kpis: {
    collected_egp: number;
    stayos_revenue_egp: number;
    vat_payable_egp: number;
    host_payable_egp: number;
    funds_held_egp: number;
    refunded_egp: number;
    payouts_pending_egp: number;
    payouts_paid_egp: number;
    refund_pending_egp: number;
  };
  revenue: {
    gross_credits_egp: number;
    debits_egp: number;
    net_egp: number;
    pending_in_escrow_egp: number;
    by_month: { month: string; amount_egp: number }[];
  };
  vat: {
    calculated_egp: number;
    recognised_egp: number;
    held_egp: number;
    reversed_egp: number;
    payable_egp: number;
  };
  bookings: {
    total: number;
    by_status: Record<string, number>;
    by_governorate: { governorate: string; count: number }[];
  };
  settlement: {
    funds_held_egp: number;
    escrows_held: number;
    host_payable_egp: number;
    host_net_pending_egp: number;
    payouts_pending_egp: number;
    payouts_paid_egp: number;
    escrows_by_status: { status: string; count: number; amount_egp: number }[];
    open_escrows: {
      escrow_id: string;
      booking_id: string;
      status: string;
      amount_egp: number;
      host_amount_egp: number | null;
      platform_share_egp: number | null;
      vat_egp: number | null;
    }[];
  };
  refunds: {
    refunded_egp: number;
    refund_pending_egp: number;
    vat_reversed_egp: number;
    adjustments: {
      adjustment_id: string;
      created_at: string | null;
      booking_id: string | null;
      adjustment_type: string;
      amount_egp: number;
      status: string;
      reason: string;
      actor: string | null;
    }[];
  };
  top_bookings: {
    booking_id: string;
    property: string | null;
    status: string;
    guest_total_egp: number;
    host_net_egp: number;
    stayos_revenue_egp: number;
    vat_egp: number;
  }[];
  date_bases: Record<string, string>;
}

/** Executive management report — presentation aggregation composed from
 * the same canonical backend facts as the report endpoints. */
export function useManagementReport(
  params: ReportQueryParams,
  enabled = true
) {
  return useQuery<ManagementReport>({
    queryKey: ["admin-management-report", params],
    queryFn: async () => {
      const { data } = await api.get<ManagementReport>(
        "/admin/reports/management",
        { params }
      );
      return data;
    },
    enabled,
    retry: false,
  });
}

export async function downloadReportExport(
  reportKey: string,
  params: ReportQueryParams,
  format: "csv" | "xlsx"
): Promise<void> {
  const { data } = await api.get(
    `/admin/reports/${reportKey}/export`,
    { params: { ...params, format }, responseType: "blob" }
  );
  const blob = new Blob([data], {
    type:
      format === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reportKey}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
