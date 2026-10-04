import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  useDeleteAccount,
  useLogoutAll,
  useMe,
  useSessions,
  useSetPassword,
} from "../../lib/hooks";
import { clearTokens } from "../../lib/api";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, spacing } from "../../lib/theme";
import { Empty, Field, ListRow, PrimaryButton, Section } from "../../components/UI";
import type { RootStackParamList } from "../../../App";
import type { SessionItem } from "../../lib/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SecurityScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { data: user } = useMe();
  const { data: sessions } = useSessions();
  const logoutAll = useLogoutAll();
  const setPassword = useSetPassword();
  const deleteAccount = useDeleteAccount();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const changePassword = async () => {
    if (next.length < 8) {
      Alert.alert("", t("passwordTooShort"));
      return;
    }
    setBusy(true);
    try {
      await setPassword.mutateAsync({
        new_password: next,
        current_password: user?.has_password ? current : undefined,
      });
      setCurrent("");
      setNext("");
      Alert.alert("", t("passwordUpdated"));
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const doLogoutAll = async () => {
    try {
      await logoutAll.mutateAsync();
      await clearTokens();
      queryClient.clear();
      navigation.navigate("Login");
    } catch {
      Alert.alert("", t("saveFailed"));
    }
  };

  const confirmDelete = () => {
    Alert.alert(t("deleteAccount"), t("deleteAccountConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAccount.mutateAsync();
            await clearTokens();
            queryClient.clear();
            navigation.navigate("Login");
          } catch (err: any) {
            Alert.alert("", err?.response?.data?.error?.message || t("error"));
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title={user?.has_password ? t("changePassword") : t("setPassword")}>
        {user?.has_password ? (
          <Field
            label={t("currentPassword")}
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
          />
        ) : null}
        <Field
          label={t("newPassword")}
          value={next}
          onChangeText={setNext}
          secureTextEntry
        />
        <PrimaryButton
          label={busy ? t("loading") : t("save")}
          onPress={changePassword}
          disabled={busy}
        />
      </Section>

      <Section title={t("activeSessions")}>
        {sessions && sessions.length > 0 ? (
          sessions.map((s: SessionItem) => (
            <ListRow
              key={s.id}
              title={`${t("session")} …${s.id.slice(-6)}`}
              subtitle={`${t("expires")}: ${new Date(s.expires_at).toLocaleString(dateLocale)}`}
            />
          ))
        ) : (
          <Empty text={t("noSessions")} />
        )}
        <PrimaryButton
          secondary
          label={logoutAll.isPending ? t("loading") : t("logoutAllDevices")}
          onPress={doLogoutAll}
          disabled={logoutAll.isPending}
        />
      </Section>

      <Section title={t("dangerZone")}>
        <Text style={styles.dangerHint}>{t("deleteAccountHint")}</Text>
        <PrimaryButton
          danger
          label={t("deleteAccount")}
          onPress={confirmDelete}
          disabled={deleteAccount.isPending}
        />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  dangerHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
});
