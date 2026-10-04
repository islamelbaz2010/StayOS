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
import {
  useConversationForBooking,
  useConversationOffers,
  useCreateOffer,
  useMarkRead,
  useMe,
  useMessages,
  useOfferAction,
  useSendMessage,
} from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import type { BookingOffer } from "../lib/types";
import type { RootStackParamList } from "../../App";

type MessageRoute = RouteProp<RootStackParamList, "Message">;

export function MessageScreen() {
  const { t } = useLocale();
  const route = useRoute<MessageRoute>();
  const { bookingId, conversationId: directConversationId } = route.params;
  const flatListRef = useRef<FlatList>(null);
  const [input, setInput] = useState("");

  const { data: me } = useMe();
  const currentUserId = me?.id ?? null;
  const { data: conversation, isLoading: conversationLoading, error: conversationError } =
    useConversationForBooking(directConversationId ? "" : (bookingId ?? ""));
  const conversationId = directConversationId ?? conversation?.id ?? null;
  const { data: messages, isLoading: messagesLoading, error: messagesError } =
    useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const markRead = useMarkRead(conversationId);
  const { data: offers } = useConversationOffers(conversationId);
  const offerAction = useOfferAction();
  const createOffer = useCreateOffer();
  const [offerForm, setOfferForm] = useState(false);
  const [offerCheckIn, setOfferCheckIn] = useState("");
  const [offerCheckOut, setOfferCheckOut] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  useEffect(() => {
    if (conversationId) {
      markRead.mutate();
    }
  }, [conversationId]);

  if (conversationLoading && !directConversationId) return <LoadingSpinner />;
  if (!conversationId || (!directConversationId && (conversationError || !conversation))) {
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

  const isHost = me?.role === "host";

  const handleOfferAction = async (offerId: string, action: "accept" | "decline") => {
    try {
      await offerAction.mutateAsync({ offerId, action });
      Alert.alert("", t(action === "accept" ? "offerAcceptedSuccess" : "offerDeclinedSuccess"));
    } catch {
      Alert.alert("", t("offerError"));
    }
  };

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const handleCreateOffer = async () => {
    if (!conversationId) return;
    if (!DATE_RE.test(offerCheckIn) || !DATE_RE.test(offerCheckOut)) {
      Alert.alert("", t("offerDatesHint"));
      return;
    }
    const price = Number(offerPrice);
    if (!price || price <= 0) {
      Alert.alert("", t("offerError"));
      return;
    }
    try {
      await createOffer.mutateAsync({
        conversationId,
        check_in: offerCheckIn,
        check_out: offerCheckOut,
        total_price_egp: price,
        message: offerMessage.trim() || undefined,
      });
      setOfferForm(false);
      setOfferCheckIn("");
      setOfferCheckOut("");
      setOfferPrice("");
      setOfferMessage("");
      Alert.alert("", t("offerSent"));
    } catch {
      Alert.alert("", t("offerError"));
    }
  };

  const renderOffer = (offer: BookingOffer) => {
    const canAct = currentUserId === offer.guest_id && offer.status === "pending";
    const statusKey =
      offer.status === "pending"
        ? "offerPending"
        : offer.status === "accepted"
          ? "offerAccepted"
          : offer.status === "declined"
            ? "offerDeclined"
            : "offerExpired";
    return (
      <View key={offer.id} style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <Text style={styles.offerTitle}>{t("offer")}</Text>
          <Text style={styles.offerStatus}>{t(statusKey)}</Text>
        </View>
        <Text style={styles.offerBody}>
          {offer.check_in} → {offer.check_out}
        </Text>
        <Text style={styles.offerPrice}>
          {offer.total_price_egp.toLocaleString()} EGP
        </Text>
        {canAct && (
          <View style={styles.offerActions}>
            <Pressable
              style={[styles.offerButton, styles.offerAccept]}
              onPress={() => handleOfferAction(offer.id, "accept")}
              disabled={offerAction.isPending}
            >
              <Text style={styles.offerAcceptText}>{t("accept")}</Text>
            </Pressable>
            <Pressable
              style={[styles.offerButton, styles.offerDecline]}
              onPress={() => handleOfferAction(offer.id, "decline")}
              disabled={offerAction.isPending}
            >
              <Text style={styles.offerDeclineText}>{t("decline")}</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
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
          ListHeaderComponent={(offers ?? []).length > 0 ? (
            <View>{(offers ?? []).map(renderOffer)}</View>
          ) : null}
          ListEmptyComponent={<Text style={styles.empty}>{t("noMessages")}</Text>}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {isHost && conversationId && !offerForm && (
        <Pressable style={styles.offerToggle} onPress={() => setOfferForm(true)}>
          <Text style={styles.offerToggleText}>＋ {t("newOffer")}</Text>
        </Pressable>
      )}

      {isHost && offerForm && (
        <View style={styles.offerForm}>
          <View style={styles.offerFormHeader}>
            <Text style={styles.offerFormTitle}>{t("newOffer")}</Text>
            <Pressable onPress={() => setOfferForm(false)}>
              <Text style={styles.offerFormClose}>✕</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.offerInput}
            placeholder={`${t("checkIn")} ${t("offerDatesHint")}`}
            placeholderTextColor={colors.textTertiary}
            value={offerCheckIn}
            onChangeText={setOfferCheckIn}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.offerInput}
            placeholder={`${t("checkInCheckOutLabel").split("—")[1]?.trim() ?? "Check-out"} ${t("offerDatesHint")}`}
            placeholderTextColor={colors.textTertiary}
            value={offerCheckOut}
            onChangeText={setOfferCheckOut}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.offerInput}
            placeholder={t("offerTotal")}
            placeholderTextColor={colors.textTertiary}
            value={offerPrice}
            onChangeText={setOfferPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.offerInput}
            placeholder={t("offerMessageOptional")}
            placeholderTextColor={colors.textTertiary}
            value={offerMessage}
            onChangeText={setOfferMessage}
          />
          <Pressable
            style={[styles.sendButton, createOffer.isPending && styles.sendDisabled]}
            onPress={handleCreateOffer}
            disabled={createOffer.isPending}
          >
            <Text style={styles.sendButtonText}>
              {createOffer.isPending ? t("loading") : t("sendOffer")}
            </Text>
          </Pressable>
        </View>
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
  offerCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  offerTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.primary,
  },
  offerStatus: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: "600",
  },
  offerBody: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  offerPrice: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  offerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  offerButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  offerAccept: {
    backgroundColor: colors.primary,
  },
  offerAcceptText: {
    color: colors.white,
    fontWeight: "700",
  },
  offerDecline: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerDeclineText: {
    color: colors.text,
    fontWeight: "600",
  },
  offerToggle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  offerToggleText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  offerForm: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  offerFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  offerFormTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  offerFormClose: {
    fontSize: fontSize.lg,
    color: colors.textTertiary,
    padding: spacing.xs,
  },
  offerInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
