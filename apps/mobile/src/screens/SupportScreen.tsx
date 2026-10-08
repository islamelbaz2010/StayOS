import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useCreateSupportConversation, useConversations, useMe } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { Empty, ListRow, PrimaryButton, Section } from "../components/UI";
import { LoadingSpinner } from "../components/States";
import type { RootStackParamList } from "../../App";
import type { ConversationListItem } from "../lib/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function getSupportWhatsAppLink(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const message = encodeURIComponent("Hello MAKAZOH support");
  return `https://wa.me/${cleaned}?text=${message}`;
}

export function SupportScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data: user } = useMe();
  const { data: conversations, isLoading } = useConversations();
  const createSupport = useCreateSupportConversation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [composing, setComposing] = useState(false);

  const phone = (process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP_NUMBER || "").trim();
  const supportThreads = (conversations ?? []).filter((c: ConversationListItem) => c.type === "support");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const send = async () => {
    if (!message.trim()) return;
    try {
      const conv = await createSupport.mutateAsync({
        content: message.trim(),
        subject: subject.trim() || null,
      });
      setMessage("");
      setSubject("");
      setComposing(false);
      navigation.navigate("Message", { conversationId: conv.id });
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title={t("supportTitle")}>
        <Text style={styles.description}>{t("supportInAppDescription")}</Text>
        {!user ? (
          <PrimaryButton
            label={t("login")}
            onPress={() => navigation.navigate("Login")}
          />
        ) : composing ? (
          <View>
            <TextInput
              style={styles.input}
              placeholder={t("supportSubjectPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              value={subject}
              onChangeText={setSubject}
            />
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder={t("supportMessagePlaceholder")}
              placeholderTextColor={colors.textTertiary}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <PrimaryButton
              label={createSupport.isPending ? t("loading") : t("sendSupportRequest")}
              onPress={send}
              disabled={createSupport.isPending || !message.trim()}
            />
          </View>
        ) : (
          <PrimaryButton
            label={t("newSupportRequest")}
            onPress={() => setComposing(true)}
          />
        )}
      </Section>

      {user && supportThreads.length > 0 && (
        <Section title={t("yourSupportThreads")}>
          {supportThreads.map((c: ConversationListItem) => (
            <ListRow
              key={c.id}
              title={c.subject || t("supportThread")}
              subtitle={`${c.last_message?.content ?? ""} · ${new Date(
                c.updated_at
              ).toLocaleDateString(dateLocale)}`}
              badge={c.support_status ?? c.status}
              onPress={() => navigation.navigate("Message", { conversationId: c.id })}
            />
          ))}
        </Section>
      )}

      {user && supportThreads.length === 0 && (
        <Section>
          <Empty text={t("noSupportThreads")} />
        </Section>
      )}

      {phone ? (
        <Section>
          <Text style={styles.altTitle}>{t("supportAltChannel")}</Text>
          <PrimaryButton
            secondary
            label={t("openWhatsApp")}
            onPress={() => Linking.openURL(getSupportWhatsAppLink(phone))}
          />
        </Section>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputMulti: { minHeight: 100, textAlignVertical: "top" },
  altTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
