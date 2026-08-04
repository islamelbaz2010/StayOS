import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface ImportRowError {
  row_number: number;
  field: string;
  message: string;
}

export interface ImportPreviewRow {
  row_number: number;
  title: string;
  city: string;
  governorate: string;
  price: number;
  property_type: string;
  host_name: string | null;
  host_phone: string | null;
  host_email: string | null;
  is_valid: boolean;
  is_duplicate: boolean;
  errors: ImportRowError[];
}

export interface ImportPreviewResponse {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  rows: ImportPreviewRow[];
}

export interface ImportRowData {
  row_number: number;
  title: string;
  description: string;
  address?: string | null;
  district?: string | null;
  city: string;
  governorate: string;
  country?: string;
  latitude: number;
  longitude: number;
  property_type: string;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  max_guests?: number;
  price: number;
  currency?: string;
  amenities?: string[];
  image_urls?: string[];
  host_name?: string | null;
  host_phone?: string | null;
  host_email?: string | null;
  status?: string;
}

export interface ImportResultRow {
  row_number: number;
  title: string;
  unit_id: string | null;
  status: string;
  error: string | null;
}

export interface ImportSummaryResponse {
  total_requested: number;
  created: number;
  failed: number;
  results: ImportResultRow[];
}

export function usePreviewImport() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<ImportPreviewResponse>(
        "/import/preview",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data;
    },
  });
}

export function useConfirmImport() {
  return useMutation({
    mutationFn: async (rows: ImportRowData[]) => {
      const { data } = await api.post<ImportSummaryResponse>("/import/confirm", {
        rows,
      });
      return data;
    },
  });
}
