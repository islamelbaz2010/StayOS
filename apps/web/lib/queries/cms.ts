import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const CMS_BLOCK_TYPES = [
  "hero",
  "heading_text",
  "image_text",
  "feature_cards",
  "cta",
  "faq",
  "testimonial",
  "banner",
  "gallery",
  "rich_text",
  "announcement",
] as const;

export type CmsBlockType = (typeof CMS_BLOCK_TYPES)[number];

export interface CmsPageListItem {
  id: string;
  slug: string;
  status: "draft" | "published" | "archived";
  title_en: string | null;
  title_ar: string | null;
  version: number;
  published_at: string | null;
  updated_at: string;
}

export interface CmsBlock {
  id: string;
  page_id: string;
  block_type: string;
  sort_order: number;
  enabled: boolean;
  content: Record<string, Record<string, unknown>>;
  updated_at: string;
}

export interface CmsPageDetail extends CmsPageListItem {
  seo: Record<string, unknown>;
  published_by: string | null;
  updated_by: string | null;
  blocks: CmsBlock[];
}

export interface CmsRevision {
  id: string;
  page_id: string;
  version: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CmsMedia {
  id: string;
  s3_key: string | null;
  url: string | null;
  content_type: string | null;
  alt_en: string | null;
  alt_ar: string | null;
  created_at: string;
}

export function useCmsPages() {
  return useQuery({
    queryKey: ["admin-cms-pages"],
    queryFn: async () => {
      const { data } = await api.get<CmsPageListItem[]>("/admin/cms/pages");
      return data;
    },
  });
}

export function useCmsPage(pageId: string) {
  return useQuery({
    queryKey: ["admin-cms-page", pageId],
    queryFn: async () => {
      const { data } = await api.get<CmsPageDetail>(
        `/admin/cms/pages/${pageId}`
      );
      return data;
    },
    enabled: Boolean(pageId),
  });
}

export function useCreateCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      slug: string;
      title_en?: string;
      title_ar?: string;
    }) => {
      const { data } = await api.post<CmsPageDetail>(
        "/admin/cms/pages",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cms-pages"] });
    },
  });
}

export function useUpdateCmsPage(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      slug?: string;
      title_en?: string;
      title_ar?: string;
      seo?: Record<string, unknown>;
    }) => {
      const { data } = await api.patch<CmsPageDetail>(
        `/admin/cms/pages/${pageId}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-cms-page", pageId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-cms-pages"] });
    },
  });
}

export function useCreateCmsBlock(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      block_type: string;
      sort_order?: number;
      enabled?: boolean;
      content?: Record<string, unknown>;
    }) => {
      const { data } = await api.post<CmsBlock>(
        `/admin/cms/pages/${pageId}/blocks`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-cms-page", pageId],
      });
    },
  });
}

export function useUpdateCmsBlock(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      blockId: string;
      block_type?: string;
      sort_order?: number;
      enabled?: boolean;
      content?: Record<string, unknown>;
    }) => {
      const { blockId, ...body } = payload;
      const { data } = await api.patch<CmsBlock>(
        `/admin/cms/blocks/${blockId}`,
        body
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-cms-page", pageId],
      });
    },
  });
}

export function useDeleteCmsBlock(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: string) => {
      await api.delete(`/admin/cms/blocks/${blockId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-cms-page", pageId],
      });
    },
  });
}

export function usePublishCmsPage(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (note?: string) => {
      const { data } = await api.post<CmsPageDetail>(
        `/admin/cms/pages/${pageId}/publish`,
        { note: note ?? null }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-cms-page", pageId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-cms-pages"] });
    },
  });
}

export function useUnpublishCmsPage(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<CmsPageDetail>(
        `/admin/cms/pages/${pageId}/unpublish`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-cms-page", pageId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-cms-pages"] });
    },
  });
}

export function useCmsRevisions(pageId: string) {
  return useQuery({
    queryKey: ["admin-cms-revisions", pageId],
    queryFn: async () => {
      const { data } = await api.get<CmsRevision[]>(
        `/admin/cms/pages/${pageId}/revisions`
      );
      return data;
    },
    enabled: Boolean(pageId),
  });
}

export function useRestoreCmsRevision(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (version: number) => {
      const { data } = await api.post<CmsPageDetail>(
        `/admin/cms/pages/${pageId}/revisions/${version}/restore`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-cms-page", pageId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-cms-revisions", pageId],
      });
    },
  });
}

export function useCmsMedia() {
  return useQuery({
    queryKey: ["admin-cms-media"],
    queryFn: async () => {
      const { data } = await api.get<CmsMedia[]>("/admin/cms/media");
      return data;
    },
  });
}

export function useRegisterCmsMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      s3_key?: string;
      url?: string;
      content_type?: string;
      alt_en?: string;
      alt_ar?: string;
    }) => {
      const { data } = await api.post<CmsMedia>("/admin/cms/media", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cms-media"] });
    },
  });
}
