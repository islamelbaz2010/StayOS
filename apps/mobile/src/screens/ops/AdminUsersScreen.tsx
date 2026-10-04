import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { useAdminUserAction, useAdminUsers } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, spacing } from "../../lib/theme";
import {
  Empty,
  FilterChips,
  ListRow,
  PrimaryButton,
  Row,
  Section,
  StatusBadge,
} from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { AdminUser } from "../../lib/types";

const ROLE_FILTERS = [
  { key: "", en: "All", ar: "الكل" },
  { key: "guest", en: "Guests", ar: "الضيوف" },
  { key: "host", en: "Hosts", ar: "المضيفون" },
  { key: "staff", en: "Staff", ar: "الموظفون" },
];

export function AdminUsersScreen() {
  const { t, locale } = useLocale();
  const [role, setRole] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useAdminUsers({ role: role ?? undefined });
  const action = useAdminUserAction();
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const run = async (act: "suspend" | "reactivate" | "deactivate-hosting" | "restore-hosting") => {
    if (!selected) return;
    try {
      const updated = await action.mutateAsync({ userId: selected.id, action: act });
      setSelected((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  if (selected) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={selected.display_name ?? selected.id.slice(0, 8)}>
          <Row label={t("email")} value={selected.email} />
          <Row label={t("phone")} value={selected.phone_number} />
          <Row label={t("role")} value={selected.role} />
          <Row label={t("kycStatus")} value={selected.kyc_status} />
          <Row
            label={t("joined")}
            value={new Date(selected.created_at).toLocaleDateString(dateLocale)}
          />
        </Section>
        <Section>
          {selected.is_active ? (
            <PrimaryButton
              danger
              label={t("suspendUser")}
              onPress={() => run("suspend")}
              disabled={action.isPending}
            />
          ) : (
            <PrimaryButton
              label={t("reactivateUser")}
              onPress={() => run("reactivate")}
              disabled={action.isPending}
            />
          )}
          {selected.role === "host" && (
            <PrimaryButton
              secondary
              label={t("deactivateHosting")}
              onPress={() => run("deactivate-hosting")}
              disabled={action.isPending}
            />
          )}
          <PrimaryButton secondary label={t("back")} onPress={() => setSelected(null)} />
        </Section>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FilterChips
          options={ROLE_FILTERS.map((f) => ({ key: f.key, label: locale === "ar" ? f.ar : f.en }))}
          value={role}
          onChange={setRole}
        />
      </View>
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorView message={t("error")} onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Section>
            {(data ?? []).length === 0 ? (
              <Empty text={t("noUsers")} />
            ) : (
              (data ?? []).map((u: AdminUser) => (
                <ListRow
                  key={u.id}
                  title={u.display_name ?? u.email ?? u.id.slice(0, 8)}
                  subtitle={`${u.role} · KYC: ${u.kyc_status}`}
                  right={
                    <StatusBadge
                      label={u.is_active ? t("active") : t("suspended")}
                      tone={u.is_active ? "ok" : "err"}
                    />
                  }
                  onPress={() => setSelected(u)}
                />
              ))
            )}
          </Section>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filters: { padding: spacing.md, paddingBottom: 0 },
  content: { padding: spacing.lg },
});
