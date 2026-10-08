import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  useAdminCreateStaff,
  useAdminStaff,
  useAdminStaffAction,
  useAdminStaffPermissions,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, spacing } from "../../lib/theme";
import {
  Empty,
  Field,
  ListRow,
  PrimaryButton,
  Row,
  Section,
  StatusBadge,
} from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { StaffMember } from "../../lib/types";

const PERMISSIONS = [
  "listings",
  "kyc",
  "payments",
  "operations",
  "disputes",
  "discovery",
  "content",
  "reports",
];

export function AdminStaffScreen() {
  const { t, locale } = useLocale();
  const { data, isLoading, error, refetch } = useAdminStaff();
  const updateAction = useAdminStaffAction();
  const updatePerms = useAdminStaffPermissions();
  const createStaff = useAdminCreateStaff();

  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [perms, setPerms] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>([]);
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView message={t("error")} onRetry={refetch} />;

  const togglePerm = (list: string[], p: string, setter: (v: string[]) => void) => {
    setter(list.includes(p) ? list.filter((x) => x !== p) : [...list, p]);
  };

  const permChips = (list: string[], setter: (v: string[]) => void) => (
    <View style={styles.chipRow}>
      {PERMISSIONS.map((p) => (
        <Text
          key={p}
          style={[styles.chip, list.includes(p) && styles.chipActive]}
          onPress={() => togglePerm(list, p, setter)}
        >
          {t(`perm_${p}`)}
        </Text>
      ))}
    </View>
  );

  const savePerms = async () => {
    if (!selected) return;
    try {
      await updatePerms.mutateAsync({ userId: selected.id, permissions: perms });
      setSelected(null);
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  const toggleActive = async () => {
    if (!selected) return;
    try {
      await updateAction.mutateAsync({
        userId: selected.id,
        payload: { is_active: !selected.is_active },
      });
      setSelected(null);
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  const create = async () => {
    if (!newPhone.trim() || !newName.trim()) {
      Alert.alert("", t("fillRequired"));
      return;
    }
    try {
      await createStaff.mutateAsync({
        phone_number: newPhone.trim(),
        display_name: newName.trim(),
        email: newEmail.trim() || undefined,
        permissions: newPerms,
      });
      setCreating(false);
      setNewPhone("");
      setNewName("");
      setNewEmail("");
      setNewPerms([]);
      Alert.alert("", t("staffCreated"));
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  if (selected) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={selected.display_name ?? selected.id.slice(0, 8)}>
          <Row label={t("role")} value={selected.role} />
          <Row label={t("phone")} value={selected.phone_number} />
          <Row label={t("email")} value={selected.email} />
          <Row
            label={t("joined")}
            value={new Date(selected.created_at).toLocaleDateString(dateLocale)}
          />
        </Section>
        <Section title={t("permissions")}>
          {permChips(perms, setPerms)}
          <PrimaryButton
            label={updatePerms.isPending ? t("loading") : t("savePermissions")}
            onPress={savePerms}
            disabled={updatePerms.isPending}
          />
        </Section>
        <Section>
          <PrimaryButton
            danger={selected.is_active}
            label={selected.is_active ? t("deactivate") : t("activate")}
            onPress={toggleActive}
            disabled={updateAction.isPending}
          />
          <PrimaryButton secondary label={t("back")} onPress={() => setSelected(null)} />
        </Section>
      </ScrollView>
    );
  }

  if (creating) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={t("newStaffMember")}>
          <Field
            label={t("phone")}
            value={newPhone}
            onChangeText={setNewPhone}
            keyboardType="phone-pad"
            placeholder="+20..."
          />
          <Field label={t("displayName")} value={newName} onChangeText={setNewName} />
          <Field
            label={t("email")}
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
          />
          <Text style={styles.groupLabel}>{t("permissions")}</Text>
          {permChips(newPerms, setNewPerms)}
          <PrimaryButton
            label={createStaff.isPending ? t("loading") : t("createStaff")}
            onPress={create}
            disabled={createStaff.isPending}
          />
          <PrimaryButton secondary label={t("back")} onPress={() => setCreating(false)} />
        </Section>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title={`${t("staff")} (${data?.length ?? 0})`}>
        {(data ?? []).length === 0 ? (
          <Empty text={t("noStaff")} />
        ) : (
          (data ?? []).map((s: StaffMember) => (
            <ListRow
              key={s.id}
              title={s.display_name ?? s.phone_number ?? s.id.slice(0, 8)}
              subtitle={s.permissions.join(", ") || t("noPermissions")}
              right={
                <StatusBadge
                  label={s.is_active ? t("active") : t("suspended")}
                  tone={s.is_active ? "ok" : "err"}
                />
              }
              onPress={() => {
                setSelected(s);
                setPerms(s.permissions);
              }}
            />
          ))
        )}
      </Section>
      <PrimaryButton label={t("newStaffMember")} onPress={() => setCreating(true)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.text,
    overflow: "hidden",
  },
  chipActive: {
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    borderColor: colors.primary,
  },
  groupLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
});
