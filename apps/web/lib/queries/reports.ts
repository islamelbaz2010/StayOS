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
