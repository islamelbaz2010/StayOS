import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type PrivacySettings =
  components["schemas"]["PrivacySettingsResponse"];
export type PrivacySettingsUpdate =
  components["schemas"]["PrivacySettingsUpdate"];
export type NotificationPreferences =
  components["schemas"]["NotificationPreferencesResponse"];
export type NotificationPreferencesUpdate =
  components["schemas"]["NotificationPreferencesUpdate"];
export type SessionList =
  components["schemas"]["SessionListResponse"];
export type UserProfileUpdate =
  components["schemas"]["UserProfileUpdate"];
export type UserResponse = components["schemas"]["UserResponse"];

export function usePrivacySettings() {
  return useQuery({
    queryKey: ["privacySettings"],
    queryFn: async () => {
      const { data } = await api.get<PrivacySettings>("/auth/me/privacy");
      return data;
    },
  });
}

export function useUpdatePrivacySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PrivacySettingsUpdate) => {
      const { data } = await api.patch<PrivacySettings>(
        "/auth/me/privacy",
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["privacySettings"], data);
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: async () => {
      const { data } = await api.get<NotificationPreferences>(
        "/auth/me/notification-preferences"
      );
      return data;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NotificationPreferencesUpdate) => {
      const { data } = await api.put<NotificationPreferences>(
        "/auth/me/notification-preferences",
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["notificationPreferences"], data);
    },
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data } = await api.get<SessionList>("/auth/me/sessions");
      return data;
    },
  });
}

export async function logoutAllSessions(): Promise<number> {
  const { data } = await api.post<{ revoked: number }>(
    "/auth/me/logout-all"
  );
  return data.revoked;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UserProfileUpdate) => {
      const { data } = await api.patch<UserResponse>("/auth/me", payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["account"] });
    },
  });
}
