import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface InAppNotificationItem {
  id: string;
  event_type: string;
  category: string;
  subject: string | null;
  body: string;
  locale: string;
  read_at: string | null;
  created_at: string;
}

export interface InAppNotificationList {
  items: InAppNotificationItem[];
  unread_count: number;
}

export async function getNotifications(): Promise<InAppNotificationList> {
  const { data } = await api.get<InAppNotificationList>("/notifications");
  return data;
}

export function useNotifications(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: options?.enabled ?? true,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await api.post<InAppNotificationItem>(
        `/notifications/${notificationId}/read`
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ marked: number }>(
        "/notifications/read-all"
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
