import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import {
  useNotificationPrefs,
  usePrivacySettings,
  useUpdateNotificationPrefs,
  useUpdatePrivacy,
} from "../../lib/hooks";
import { api } from "../../lib/api";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, spacing } from "../../lib/theme";
import { Empty, PrimaryButton, Section } from "../../components/UI";
import { LoadingSpinner } from "../../components/States";

const TOGGLEABLE = ["messages", "host_activity", "offers"];
const LOCKED = ["account_policies", "reservations", "reminders"];

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  messages: { en: "Messages", ar: "الرسائل" },
  host_activity: { en: "Hosting activity", ar: "نشاط الاستضافة" },
  offers: { en: "Offers and promotions", ar: "العروض والترويج" },
  account_policies: { en: "Account and policy updates", ar: "تحديثات الحساب والسياسات" },
  reservations: { en: "Reservations", ar: "الحجوزات" },
  reminders: { en: "Reminders", ar: "التذكيرات" },
};

export function PrivacyScreen() {
  const { t, locale } = useLocale();
  const privacy = usePrivacySettings();
  const updatePrivacy = useUpdatePrivacy();
  const notifPrefs = useNotificationPrefs();
  const updateNotif = useUpdateNotificationPrefs();
  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);

  if (privacy.isLoading || notifPrefs.isLoading) return <LoadingSpinner />;

  const togglePrivacy = (key: "profile_public" | "read_receipts", value: boolean) => {
    updatePrivacy.mutate({ [key]: value });
  };

  const toggleNotif = (key: string, value: boolean) => {
    updateNotif.mutate(
      { preferences: { [key]: value } },
      {
        onError: (err: any) =>
          Alert.alert("", err?.response?.data?.error?.message || t("saveFailed")),
      }
    );
  };

  const requestExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get("/auth/me/export");
      setExportData(JSON.stringify(data, null, 2));
    } catch {
      Alert.alert("", t("error"));
    } finally {
      setExporting(false);
    }
  };

  const prefs = notifPrefs.data?.preferences ?? {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title={t("privacySettings")}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t("publicProfile")}</Text>
          <Switch
            value={privacy.data?.profile_public ?? true}
            onValueChange={(v) => togglePrivacy("profile_public", v)}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t("readReceipts")}</Text>
          <Switch
            value={privacy.data?.read_receipts ?? true}
            onValueChange={(v) => togglePrivacy("read_receipts", v)}
          />
        </View>
      </Section>

      <Section title={t("notificationPreferences")}>
        {TOGGLEABLE.map((key) => (
          <View key={key} style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {CATEGORY_LABELS[key]?.[locale] ?? key}
            </Text>
            <Switch
              value={prefs[key] !== false}
              onValueChange={(v) => toggleNotif(key, v)}
            />
          </View>
        ))}
        <View style={styles.divider} />
        {LOCKED.map((key) => (
          <View key={key} style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>
                {CATEGORY_LABELS[key]?.[locale] ?? key}
              </Text>
              <Text style={styles.lockedHint}>{t("requiredNotification")}</Text>
            </View>
            <Switch value disabled />
          </View>
        ))}
      </Section>

      <Section title={t("yourData")}>
        <Text style={styles.hint}>{t("exportHint")}</Text>
        <PrimaryButton
          secondary
          label={exporting ? t("loading") : t("exportMyData")}
          onPress={requestExport}
          disabled={exporting}
        />
        {exportData ? (
          <ScrollView style={styles.exportBox} nestedScrollEnabled>
            <Text style={styles.exportText} selectable>
              {exportData}
            </Text>
          </ScrollView>
        ) : null}
      </Section>

      {!privacy.data && <Empty text={t("error")} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  switchLabel: { fontSize: fontSize.md, color: colors.text, flexShrink: 1 },
  lockedHint: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  exportBox: {
    maxHeight: 260,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    backgroundColor: colors.surface,
  },
  exportText: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontFamily: "monospace",
  },
});
