import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface HostListing {
  id: string;
  host_id: string;
  property_type: string;
  status: string;
  lat: number;
  lng: number;
  governorate: string;
  city: string;
  country: string;
  district: string | null;
  address: string | null;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  category: string;
  title_ar: string;
  title_en: string | null;
  title: string;
  description_ar: string;
  description_en: string | null;
  description: string;
  amenities: string[];
  cultural_tags: string[];
  base_price_egp: number;
  cleaning_fee_egp: number;
  cancellation_policy: string;
  price: number;
  currency: string;
  weekend_mult: number;
  peak_mult: number;
  min_nights: number;
  max_nights: number;
  house_rules: string | null;
  check_in_instructions: string | null;
  policies: string | null;
  cover_image: string | null;
}

export interface ListingCreateInput {
  property_type: string;
  lat: number;
  lng: number;
  governorate: string;
  city: string;
  district?: string;
  address?: string;
  max_guests: number;
  bedrooms: number;
  beds?: number;
  bathrooms: number;
  category?: string;
  title_ar: string;
  title_en?: string;
  description_ar: string;
  description_en?: string;
  amenities?: string[];
  cultural_tags?: string[];
  base_price_egp: number;
  cleaning_fee_egp?: number;
  cancellation_policy?: string;
  weekend_mult?: number;
  peak_mult?: number;
  min_nights?: number;
  max_nights?: number;
  house_rules?: string;
  check_in_instructions?: string;
  policies?: string;
  country?: string;
  currency?: string;
  is_draft?: boolean;
}

export interface ListingUpdateInput {
  title_ar?: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  amenities?: string[];
  cultural_tags?: string[];
  base_price_egp?: number;
  cleaning_fee_egp?: number;
  cancellation_policy?: string;
  category?: string;
  address?: string;
  beds?: number;
  weekend_mult?: number;
  peak_mult?: number;
  min_nights?: number;
  max_nights?: number;
  house_rules?: string;
  check_in_instructions?: string;
  policies?: string;
  country?: string;
  currency?: string;
  cover_photo_id?: string;
}

export async function getHostListings(): Promise<HostListing[]> {
  const { data } = await api.get<HostListing[]>("/listings/host/listings");
  return data;
}

export async function getHostListing(unitId: string): Promise<HostListing> {
  const { data } = await api.get<HostListing>(`/listings/host/${unitId}`);
  return data;
}

export async function createListing(
  payload: ListingCreateInput
): Promise<HostListing> {
  const { data } = await api.post<HostListing>("/listings", payload);
  return data;
}

export async function updateListing(
  unitId: string,
  payload: ListingUpdateInput
): Promise<HostListing> {
  const { data } = await api.patch<HostListing>(
    `/listings/${unitId}`,
    payload
  );
  return data;
}

export async function submitForReview(unitId: string): Promise<HostListing> {
  const { data } = await api.post<HostListing>(
    `/listings/${unitId}/submit`
  );
  return data;
}

export async function getPendingListings(): Promise<HostListing[]> {
  const { data } = await api.get<HostListing[]>("/listings/admin/pending");
  return data;
}

export async function approveListing(unitId: string): Promise<HostListing> {
  const { data } = await api.post<HostListing>(
    `/listings/admin/${unitId}/approve`
  );
  return data;
}

export async function rejectListing(unitId: string): Promise<HostListing> {
  const { data } = await api.post<HostListing>(
    `/listings/admin/${unitId}/reject`
  );
  return data;
}

export function useHostListings() {
  return useQuery({
    queryKey: ["host-listings"],
    queryFn: getHostListings,
  });
}

export function useHostListing(unitId: string) {
  return useQuery({
    queryKey: ["host-listing", unitId],
    queryFn: () => getHostListing(unitId),
    enabled: Boolean(unitId),
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-listings"] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      unitId,
      payload,
    }: {
      unitId: string;
      payload: ListingUpdateInput;
    }) => updateListing(unitId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["host-listings"] });
      queryClient.invalidateQueries({
        queryKey: ["host-listing", variables.unitId],
      });
    },
  });
}

export function useSubmitForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitForReview,
    onSuccess: (_data, unitId) => {
      queryClient.invalidateQueries({ queryKey: ["host-listings"] });
      queryClient.invalidateQueries({
        queryKey: ["host-listing", unitId],
      });
    },
  });
}

export function usePendingListings() {
  return useQuery({
    queryKey: ["admin-pending-listings"],
    queryFn: getPendingListings,
  });
}

export function useApproveListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-listings"] });
    },
  });
}

export function useRejectListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-listings"] });
    },
  });
}
