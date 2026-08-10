import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface DiscoveryCandidate {
  id: string;
  source: string;
  source_url: string;
  external_listing_id: string | null;
  discovered_at: string;
  candidate_type: string;

  raw_title: string | null;
  raw_description: string | null;
  raw_price: string | null;
  raw_location: string | null;
  raw_images: string[];
  raw_amenities: string[];

  title: string | null;
  description: string | null;
  country: string | null;
  city: string | null;
  zone: string | null;
  latitude: number | null;
  longitude: number | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  guest_capacity: number | null;
  nightly_price: number | null;
  currency: string | null;
  image_urls: string[];
  amenities: string[];

  source_confidence: number;
  data_completeness_score: number;
  qualification_score: number;

  contact_status: string;
  contact_type: string | null;
  contact_value: string | null;
  contact_confidence: number;

  duplicate_status: string;
  duplicate_confidence: number;
  duplicate_of_id: string | null;

  status: string;
  notes: string | null;
  imported_unit_id: string | null;
  run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateListResponse {
  data: DiscoveryCandidate[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface DiscoveryStats {
  total_candidates: number;
  unique_candidates: number;
  qualified_candidates: number;
  prospects: number;
  contacted: number;
  owner_responses: number;
  owners_interested: number;
  ready_for_import: number;
  imported: number;
  duplicate_rate: number;
  by_source: Record<string, number>;
  by_candidate_type: Record<string, number>;
  contactable_candidates: number;
}

export interface DiscoverySource {
  source: string;
  status: string;
}

export interface DiscoveryRun {
  id: string;
  config_id: string | null;
  source: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  pages_scanned: number;
  candidates_found: number;
  new_candidates: number;
  duplicates: number;
  qualified: number;
  rejected: number;
  errors: string[];
}

export interface CandidateFilters {
  source?: string;
  city?: string;
  property_type?: string;
  status?: string;
  candidate_type?: string;
  duplicate_status?: string;
  contact_status?: string;
  min_score?: number;
  max_score?: number;
  limit?: number;
  offset?: number;
  sort_by?: string;
}

export function useDiscoveryStats() {
  return useQuery({
    queryKey: ["discovery-stats"],
    queryFn: async () => {
      const { data } = await api.get<DiscoveryStats>("/discovery/stats");
      return data;
    },
  });
}

export function useDiscoverySources() {
  return useQuery({
    queryKey: ["discovery-sources"],
    queryFn: async () => {
      const { data } = await api.get<DiscoverySource[]>("/discovery/sources");
      return data;
    },
  });
}

export function useDiscoveryCandidates(filters: CandidateFilters = {}) {
  return useQuery({
    queryKey: ["discovery-candidates", filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value;
        }
      });
      const { data } = await api.get<CandidateListResponse>("/discovery/candidates", { params });
      return data;
    },
  });
}

export function useDiscoveryCandidate(id: string | null) {
  return useQuery({
    queryKey: ["discovery-candidate", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<DiscoveryCandidate>(`/discovery/candidates/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateCandidateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: string;
      notes?: string;
    }) => {
      const { data } = await api.patch<DiscoveryCandidate>(
        `/discovery/candidates/${id}/status`,
        { status, notes }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovery-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["discovery-stats"] });
      queryClient.invalidateQueries({ queryKey: ["discovery-candidate"] });
    },
  });
}

export function useImportCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      host_name,
      host_phone,
      host_email,
      overrides,
    }: {
      id: string;
      host_name?: string;
      host_phone?: string;
      host_email?: string;
      overrides?: Record<string, unknown>;
    }) => {
      const { data } = await api.post<{ unit_id: string; status: string }>(
        `/discovery/candidates/${id}/import`,
        { host_name, host_phone, host_email, overrides }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovery-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["discovery-stats"] });
    },
  });
}

export function useTriggerDiscoveryRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      config_id,
      source,
    }: {
      config_id?: string;
      source?: string;
    }) => {
      const { data } = await api.post<DiscoveryRun>("/discovery/runs", {
        config_id,
        source,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovery-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["discovery-stats"] });
    },
  });
}

export function useDiscoveryRuns(limit: number = 20) {
  return useQuery({
    queryKey: ["discovery-runs", limit],
    queryFn: async () => {
      const { data } = await api.get<DiscoveryRun[]>("/discovery/runs", {
        params: { limit },
      });
      return data;
    },
  });
}
