import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "INVITED",
  "ONBOARDED",
  "NOT_A_FIT",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadListItem {
  id: string;
  kind: "HOST" | "GUEST";
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  detail: string | null;
  status: LeadStatus;
  consent_at: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string | null;
}

export interface LeadNote {
  id: string;
  author_id: string | null;
  note: string;
  created_at: string | null;
}

export interface HostLeadDetail {
  id: string;
  kind: "HOST";
  status: LeadStatus;
  full_name: string;
  phone: string;
  email: string | null;
  city: string;
  property_type: string;
  units_count: number;
  property_readiness: string | null;
  preferred_contact: string | null;
  management_company: string | null;
  message: string | null;
  consent: boolean;
  consent_at: string | null;
  lang: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  created_at: string | null;
  updated_at: string | null;
  notes: LeadNote[];
}

export interface LeadFilters {
  q?: string;
  city?: string;
  status?: string;
  property_type?: string;
  readiness?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

function cleanParams(f: LeadFilters) {
  const params: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(f)) {
    if (v !== undefined && v !== "") params[k] = v;
  }
  return params;
}

export function useHostLeads(filters: LeadFilters) {
  return useQuery<LeadListItem[]>({
    queryKey: ["admin-host-leads", filters],
    queryFn: async () => {
      const { data } = await api.get<LeadListItem[]>("/admin/leads", {
        params: { kind: "HOST", ...cleanParams(filters) },
      });
      return data;
    },
    retry: false,
  });
}

export function useLeadDetail(kind: "HOST" | "GUEST", leadId: string | null) {
  return useQuery<HostLeadDetail>({
    queryKey: ["admin-lead-detail", kind, leadId],
    queryFn: async () => {
      const { data } = await api.get<HostLeadDetail>(
        `/admin/leads/${kind}/${leadId}`
      );
      return data;
    },
    enabled: Boolean(leadId),
    retry: false,
  });
}

export interface LeadsSummary {
  page_views: number;
  host_form_starts: number;
  guest_form_starts: number;
  guest_waitlist_submits: number;
  host_submissions: number;
  guest_submissions: number;
  host_conversion_rate: number;
  guest_conversion_rate: number;
  top_source: string | null;
  top_campaign: string | null;
  top_cities: { city: string; leads: number }[];
  host_by_property_type: { property_type: string; leads: number }[];
  host_units_total: number;
  leads_by_status: Record<string, number>;
}

export function useLeadsSummary() {
  return useQuery<LeadsSummary>({
    queryKey: ["admin-leads-summary"],
    queryFn: async () => {
      const { data } = await api.get<LeadsSummary>("/admin/leads/summary");
      return data;
    },
    retry: false,
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kind,
      leadId,
      status,
    }: {
      kind: "HOST" | "GUEST";
      leadId: string;
      status: LeadStatus;
    }) => {
      const { data } = await api.patch(
        `/admin/leads/${kind}/${leadId}/status`,
        { status }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-host-leads"] });
      qc.invalidateQueries({ queryKey: ["admin-lead-detail"] });
      qc.invalidateQueries({ queryKey: ["admin-leads-summary"] });
    },
  });
}

export function useAddLeadNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kind,
      leadId,
      note,
    }: {
      kind: "HOST" | "GUEST";
      leadId: string;
      note: string;
    }) => {
      const { data } = await api.post(
        `/admin/leads/${kind}/${leadId}/notes`,
        { note }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lead-detail"] });
    },
  });
}

/** Authenticated CSV export — the axios Authorization header travels with
 * the request, so no token ever lands in a URL. Respects the same filters
 * as the current table view. */
export async function downloadLeadsCsv(filters: LeadFilters): Promise<void> {
  const { data } = await api.get("/admin/leads/export.csv", {
    params: { kind: "HOST", ...cleanParams(filters) },
    responseType: "blob",
  });
  const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "makazoh-host-leads.csv";
  a.click();
  URL.revokeObjectURL(url);
}
