import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useAdminOverview, useMe, useOpsDashboard } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { Section } from "../../components/UI";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type OpsRoute = keyof RootStackParamList;

interface OpsItem {
  key: string;
  route: OpsRoute;
  permission: string | null; // null = admin-only
  labelEn: string;
  labelAr: string;
}

interface OpsGroup {
  key: string;
  labelKey: string;
  items: OpsItem[];
}

// Mirrors the web AdminLayout navGroups (adminNav.groups.*).
const GROUPS: OpsGroup[] = [
  {
    key: "marketplace",
    labelKey: "opsGroupMarketplace",
    items: [
      { key: "listings", route: "OpsListings", permission: "listings", labelEn: "Listing moderation", labelAr: "مراجعة الإعلانات" },
      { key: "listingsAll", route: "AdminListings", permission: "listings", labelEn: "All listings", labelAr: "كل الإعلانات" },
      { key: "discovery", route: "AdminDiscovery", permission: "discovery", labelEn: "Discovery & import", labelAr: "الاكتشاف والاستيراد" },
    ],
  },
  {
    key: "usersTrust",
    labelKey: "opsGroupUsersTrust",
    items: [
      { key: "users", route: "AdminUsers", permission: null, labelEn: "Users", labelAr: "المستخدمون" },
      { key: "kyc", route: "OpsKyc", permission: "kyc", labelEn: "KYC verification queue", labelAr: "قائمة توثيق الهوية" },
    ],
  },
  {
    key: "money",
    labelKey: "opsGroupMoney",
    items: [
      { key: "payments", route: "OpsPayments", permission: "payments", labelEn: "Payment review queue", labelAr: "قائمة مراجعة المدفوعات" },
      // /admin/adjustments* is guarded by the "payments" permission
      { key: "adjustments", route: "AdminAdjustments", permission: "payments", labelEn: "Adjustments", labelAr: "التسويات" },
      { key: "finance", route: "AdminFinance", permission: "payments", labelEn: "Finance", labelAr: "المالية" },
    ],
  },
  {
    key: "insights",
    labelKey: "opsGroupInsights",
    items: [
      { key: "reports", route: "AdminReports", permission: "reports", labelEn: "Reports", labelAr: "التقارير" },
    ],
  },
  {
    key: "operations",
    labelKey: "opsGroupOperations",
    items: [
      // AdminBookingsScreen lists via /host/bookings → "operations" grant
      { key: "bookings", route: "AdminBookings", permission: "operations", labelEn: "Bookings", labelAr: "الحجوزات" },
      { key: "support", route: "OpsSupport", permission: "operations", labelEn: "Support queue", labelAr: "قائمة الدعم" },
      { key: "disputes", route: "OpsDisputes", permission: "disputes", labelEn: "Disputes", labelAr: "النزاعات" },
      { key: "reviews", route: "OpsReviewReports", permission: "disputes", labelEn: "Review reports", labelAr: "بلاغات التقييمات" },
      // /operations/* is role-gated (admin/operations/field_staff), not
      // permission-gated — staff with the "operations" grant still 403.
      { key: "tasks", route: "OpsTasks", permission: null, labelEn: "Maintenance & readiness", labelAr: "الصيانة والجاهزية" },
    ],
  },
  {
    key: "admin",
    labelKey: "opsGroupAdmin",
    items: [
      { key: "staff", route: "AdminStaff", permission: null, labelEn: "Staff & permissions", labelAr: "الموظفون والصلاحيات" },
    ],
  },
];

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function OpsHomeScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data: user } = useMe();
  const isAdmin = user?.role === "admin";
  const permissions = user?.staff_permissions ?? [];

  const adminOverview = useAdminOverview();
  const opsDashboard = useOpsDashboard();

  const visible = GROUPS.map((g) => ({
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
        <Section key={group.key} title={t(group.labelKey)}>
          {group.items.map((s) => (
            <Pressable
              key={s.key}
              style={styles.sectionRow}
              onPress={() => navigation.navigate(s.route as never)}
            >
              <Text style={styles.sectionRowText}>
                {locale === "ar" ? s.labelAr : s.labelEn}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </Section>
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
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sectionRowText: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  chevron: { fontSize: 20, color: colors.textTertiary },
});
