import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface MessageResponse {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_role: string;
  content: string;
  status: string;
  automation_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationListItem {
  id: string;
  booking_id: string | null;
  unit_id: string | null;
  type: string;
  status: string;
  unread_count: number;
  counterparty_name: string | null;
  unit_title: string | null;
  last_message: MessageResponse | null;
  created_at: string;
  updated_at: string;
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await api.get<ConversationListItem[]>(
        "/messages/conversations"
      );
      return data;
    },
    refetchInterval: 15000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["conversations", "unread"],
    queryFn: async () => {
      const { data } = await api.get<{ total_unread: number }>(
        "/messages/conversations/unread"
      );
      return data;
    },
    refetchInterval: 15000,
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await api.get<MessageResponse[]>(
        `/messages/conversations/${conversationId}/messages`
      );
      return data;
    },
    enabled: Boolean(conversationId),
    refetchInterval: 10000,
  });
}

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<MessageResponse>(
        `/messages/conversations/${conversationId}/messages`,
        { content }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkRead(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post(`/messages/conversations/${conversationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export interface ConversationResponse {
  id: string;
  booking_id: string | null;
  unit_id: string | null;
  type: string;
  status: string;
}

export function useBookingConversation(bookingId: string | null) {
  return useQuery({
    queryKey: ["conversation", "booking", bookingId],
    queryFn: async () => {
      const { data } = await api.get<ConversationResponse>(
        `/messages/bookings/${bookingId}/conversation`
      );
      return data;
    },
    enabled: Boolean(bookingId),
  });
}
