import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Ionicons } from "@expo/vector-icons";
import { useAdminOverview, useMe, useOpsDashboard } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { Section } from "../../components/UI";
import { OPS_GROUPS } from "../../lib/opsGroups";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function OpsHomeScreen() {
  const { t, locale, isRTL } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data: user } = useMe();
  const isAdmin = user?.role === "admin";
  const permissions = user?.staff_permissions ?? [];

  const adminOverview = useAdminOverview();
  const opsDashboard = useOpsDashboard();

  const visible = OPS_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(
      (s) => isAdmin || (s.permission !== null && permissions.includes(s.permission))
    ),
  })).filter((g) => g.items.length > 0);

  // /admin/overview: admin or staff with ≥1 grant. /operations/dashboard:
  // role-gated (admin only in practice — no "operations" role exists).
  const overview = isAdmin || permissions.length > 0 ? adminOverview.data : null;
  const ops = isAdmin ? opsDashboard.data : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {overview && (
        <Section title={t("marketplaceOverview")}>
          <View style={styles.statsGrid}>
            <Stat label={t("statUsers")} value={overview.users_total} />
            <Stat label={t("statHosts")} value={overview.users_hosts} />
            <Stat label={t("statListings")} value={overview.listings_total} />
            <Stat label={t("statBookings")} value={overview.bookings_total} />
            <Stat label={t("statPaymentsPending")} value={overview.payments_pending} />
            <Stat label={t("statKycPending")} value={overview.kyc_pending_documents} />
            <Stat label={t("statDisputes")} value={overview.disputes_open} />
            <Stat label={t("statTasks")} value={overview.tasks_pending} />
          </View>
        </Section>
      )}

      {ops && (
        <Section title={t("operationsOverview")}>
          <View style={styles.statsGrid}>
            <Stat label={t("statPendingTasks")} value={ops.pending_tasks} />
            <Stat label={t("statOverdue")} value={ops.overdue_tasks} />
            <Stat label={t("statMaintenance")} value={ops.open_maintenance_requests} />
            <Stat label={t("statNotReady")} value={ops.not_ready_units} />
          </View>
        </Section>
      )}

      {visible.map((group) => (
        <Pressable
          key={group.key}
          style={({ pressed }) => [styles.groupCard, pressed && styles.groupCardPressed]}
          onPress={() =>
            navigation.navigate("MenuGroup", {
              title: t(group.labelKey),
              items: group.items.map((s) => ({
                key: s.key,
                label: locale === "ar" ? s.labelAr : s.labelEn,
                route: s.route,
                icon: s.icon,
              })),
            })
          }
          accessibilityRole="button"
        >
          <View style={styles.groupIcon}>
            <Ionicons name={group.icon} size={22} color={colors.accentText} />
          </View>
          <View style={styles.groupText}>
            <Text style={styles.groupTitle}>{t(group.labelKey)}</Text>
            <Text style={styles.groupDesc} numberOfLines={1}>
              {t(group.descKey)}
            </Text>
          </View>
          <View style={styles.groupMeta}>
            <Text style={styles.groupCount}>{group.items.length}</Text>
            <Ionicons
              name={isRTL ? "chevron-back" : "chevron-forward"}
              size={18}
              color={colors.textTertiary}
            />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  stat: { width: "23%", alignItems: "center", marginBottom: spacing.md },
  statValue: { fontSize: fontSize.xl, fontWeight: "800", color: colors.accentText },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  groupCardPressed: { backgroundColor: colors.surface },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
  groupText: { flex: 1 },
  groupTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  groupDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  groupMeta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  groupCount: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
