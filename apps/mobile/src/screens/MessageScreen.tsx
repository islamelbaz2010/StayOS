import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";

import { LoadingSpinner, ErrorView } from "../components/States";
import { useConversationForBooking, useMarkRead, useMe, useMessages, useSendMessage } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import type { RootStackParamList } from "../../App";

type MessageRoute = RouteProp<RootStackParamList, "Message">;

export function MessageScreen() {
  const { t } = useLocale();
  const route = useRoute<MessageRoute>();
  const { bookingId } = route.params;
  const flatListRef = useRef<FlatList>(null);
  const [input, setInput] = useState("");

  const { data: me } = useMe();
  const currentUserId = me?.id ?? null;
  const { data: conversation, isLoading: conversationLoading, error: conversationError } =
    useConversationForBooking(bookingId);
  const conversationId = conversation?.id ?? null;
  const { data: messages, isLoading: messagesLoading, error: messagesError } =
    useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const markRead = useMarkRead(conversationId);

  useEffect(() => {
    if (conversationId) {
      markRead.mutate();
    }
  }, [conversationId]);

  if (conversationLoading) return <LoadingSpinner />;
  if (conversationError || !conversation) {
    return <ErrorView message={t("loadMessagesError")} onRetry={() => {}} />;
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !conversationId) return;
    try {
      setInput("");
      await send.mutateAsync(text);
    } catch {
      Alert.alert(t("sendMessageError"));
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    // Use the sender's user ID to determine which side of the conversation
    // they are on. This is correct for both guest and host users. System
    // messages (sender_id is null) always appear on the "their" side.
    const isMe = currentUserId !== null && item.sender_id === currentUserId;
    return (
      <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.bubbleText, isMe ? styles.myBubbleText : styles.theirBubbleText]}>
          {item.content}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t("messagesTitle")}</Text>
      </View>

      {messagesLoading ? (
        <LoadingSpinner />
      ) : messagesError ? (
        <ErrorView message={t("loadMessagesError")} onRetry={() => {}} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("noMessages")}</Text>}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={t("typeMessage")}
          multiline
          maxLength={4000}
        />
        <Pressable
          style={[styles.sendButton, !input.trim() && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || send.isPending}
        >
          <Text style={styles.sendButtonText}>{t("send")}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  bubble: {
    maxWidth: "80%",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  theirBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  myBubbleText: {
    color: colors.white,
  },
  theirBubbleText: {
    color: colors.text,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    alignSelf: "flex-end",
  },
  empty: {
    textAlign: "center",
    color: colors.textTertiary,
    marginTop: spacing.xxl,
    fontStyle: "italic",
  },
  inputRow: {
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    marginRight: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
});
