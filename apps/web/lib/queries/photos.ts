import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface PhotoPresignRequest {
  filename: string;
  content_type: string;
}

export interface PhotoPresignResponse {
  upload_url: string;
  photo_key: string;
}

export interface PhotoCreate {
  s3_key: string;
  url: string;
  caption?: string;
  is_cover: boolean;
  display_order: number;
}

export interface PhotoResponse {
  id: string;
  unit_id: string;
  s3_key: string;
  url: string;
  display_order: number;
  is_cover: boolean;
  caption: string | null;
}

export async function presignPhoto(
  unitId: string,
  payload: PhotoPresignRequest
): Promise<PhotoPresignResponse> {
  const { data } = await api.post<PhotoPresignResponse>(
    `/listings/${unitId}/photos/presign`,
    payload
  );
  return data;
}

export async function createPhoto(
  unitId: string,
  payload: PhotoCreate
): Promise<PhotoResponse> {
  const { data } = await api.post<PhotoResponse>(
    `/listings/${unitId}/photos`,
    payload
  );
  return data;
}

export async function getPhotos(unitId: string): Promise<PhotoResponse[]> {
  const { data } = await api.get<PhotoResponse[]>(
    `/listings/${unitId}/photos`
  );
  return data;
}

export async function setCoverPhoto(
  unitId: string,
  photoId: string
): Promise<PhotoResponse> {
  const { data } = await api.patch<PhotoResponse>(
    `/listings/${unitId}/photos/${photoId}/cover`
  );
  return data;
}

export async function deletePhoto(
  unitId: string,
  photoId: string
): Promise<void> {
  await api.delete(`/listings/${unitId}/photos/${photoId}`);
}

export function usePhotos(unitId: string) {
  return useQuery({
    queryKey: ["photos", unitId],
    queryFn: () => getPhotos(unitId),
    enabled: Boolean(unitId),
  });
}

export function usePresignPhoto() {
  return useMutation({
    mutationFn: ({
      unitId,
      payload,
    }: {
      unitId: string;
      payload: PhotoPresignRequest;
    }) => presignPhoto(unitId, payload),
  });
}

export function useCreatePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      unitId,
      payload,
    }: {
      unitId: string;
      payload: PhotoCreate;
    }) => createPhoto(unitId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["photos", variables.unitId],
      });
    },
  });
}

export function useSetCoverPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      unitId,
      photoId,
    }: {
      unitId: string;
      photoId: string;
    }) => setCoverPhoto(unitId, photoId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["photos", variables.unitId],
      });
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      unitId,
      photoId,
    }: {
      unitId: string;
      photoId: string;
    }) => deletePhoto(unitId, photoId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["photos", variables.unitId],
      });
    },
  });
}
