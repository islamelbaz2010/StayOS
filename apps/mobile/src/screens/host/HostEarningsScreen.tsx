import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useHostEarnings } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../../components/States";

export function HostEarningsScreen() {
  const { t } = useLocale();
  const { data, isLoading, isError, refetch } = useHostEarnings();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={t("error")} onRetry={refetch} />;
  if (!data) return <LoadingSpinner />;

  const hasEarnings = data.total_revenue_egp > 0 || data.total_bookings > 0;

  if (!hasEarnings) {
    return <EmptyView title={t("earningsNoEarnings")} />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t("hostEarnings")}</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("earningsNetEarnings")}</Text>
          <Text style={styles.summaryValue}>{data.net_earnings_egp} {t("egp")}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("earningsTotalRevenue")}</Text>
          <Text style={styles.summaryValue}>{data.total_revenue_egp} {t("egp")}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("reservationPayment")}</Text>
        <StatRow label={t("earningsTotalBookings")} value={String(data.total_bookings)} />
        <StatRow label={t("earningsConfirmedBookings")} value={String(data.confirmed_bookings)} />
        <StatRow label={t("earningsCompletedStays")} value={String(data.completed_stays)} />
        <StatRow label={t("earningsPendingVerification")} value={`${data.pending_verification_egp} ${t("egp")}`} />
        <StatRow label={t("earningsRefundPending")} value={`${data.refund_pending_egp} ${t("egp")}`} />
      </View>

      {data.per_unit.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("earningsPerListing")}</Text>
          {data.per_unit.map((u: { unit_id: string; unit_title: string | null; booking_count: number; revenue_egp: number }) => (
            <View key={u.unit_id} style={styles.unitRow}>
              <Text style={styles.unitTitle} numberOfLines={1}>{u.unit_title || u.unit_id.slice(0, 8)}</Text>
              <View style={styles.unitStats}>
                <Text style={styles.unitBookings}>{u.booking_count} {t("hostReservations")}</Text>
                <Text style={styles.unitRevenue}>{u.revenue_egp} {t("egp")}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>{t("earningsDisclaimer")}</Text>
    </ScrollView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.white,
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.white,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
  },
  unitRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unitTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  unitStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  unitBookings: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  unitRevenue: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "700",
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontStyle: "italic",
    marginTop: spacing.md,
  },
});
