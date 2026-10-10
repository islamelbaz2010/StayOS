import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useHostEarnings, useHostPayments } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../../components/States";
import { StatusBadge } from "../../components/UI";
import { formatMoney } from "../../lib/money";
import type { PaymentListItem } from "../../lib/types";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAYOUT_TONE: Record<string, "ok" | "warn" | "err" | "info"> = {
  paid: "ok",
  ready: "ok",
  held: "warn",
  waiting_checkin: "warn",
  refunded: "info",
  disputed: "err",
};

const PAYOUT_KEY: Record<string, string> = {
  held: "payoutStateHeld",
  ready: "payoutStateReady",
  paid: "payoutStatePaid",
  refunded: "payoutStateRefunded",
  disputed: "payoutStateDisputed",
  waiting_checkin: "payoutStateWaitingCheckin",
};

export function HostEarningsScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useHostEarnings();
  const paymentsQuery = useHostPayments();
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={t("error")} onRetry={refetch} />;
  if (!data) return <LoadingSpinner />;

  const hasEarnings = data.total_revenue_egp > 0 || data.total_bookings > 0;

  if (!hasEarnings) {
    return <EmptyView title={t("earningsNoEarnings")} />;
  }

  // Only payments where money was actually collected from the guest — the
  // backend's "collected" lifecycle set. Cancelled/rejected rows carry a
  // hypothetical host_net that never materialized, so showing it as
  // "Your earnings" would be misleading.
  const payments = (paymentsQuery.data ?? []).filter(
    (p: PaymentListItem) =>
      p.host_net_egp !== null &&
      ["verified", "refund_pending", "refunded"].includes(p.status)
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t("hostEarnings")}</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("earningsNetEarnings")}</Text>
          <Text style={styles.summaryValue}>{formatMoney(data.net_earnings_egp, t("egp"))}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("earningsTotalRevenue")}</Text>
          <Text style={styles.summaryValue}>{formatMoney(data.total_revenue_egp, t("egp"))}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("earningsYourEarnings")}</Text>
          <Text style={styles.summaryValue}>{formatMoney(data.host_earnings_egp, t("egp"))}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("reservationPayment")}</Text>
        <StatRow label={t("earningsTotalBookings")} value={String(data.total_bookings)} />
        <StatRow label={t("earningsConfirmedBookings")} value={String(data.confirmed_bookings)} />
        <StatRow label={t("earningsCompletedStays")} value={String(data.completed_stays)} />
        <StatRow label={t("earningsPendingVerification")} value={formatMoney(data.pending_verification_egp, t("egp"))} />
        <StatRow label={t("earningsRefundPending")} value={formatMoney(data.refund_pending_egp, t("egp"))} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("earningsFundsSection")}</Text>
        <StatRow label={t("earningsFundsHeld")} value={formatMoney(data.funds_held_egp, t("egp"))} />
        <StatRow label={t("earningsPayoutReady")} value={formatMoney(data.payout_ready_egp, t("egp"))} />
        <StatRow label={t("earningsPaidOut")} value={formatMoney(data.paid_out_egp, t("egp"))} />
        <StatRow label={t("earningsRefunded")} value={formatMoney(data.refunded_egp, t("egp"))} />
      </View>

      {payments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("earningsPerBooking")}</Text>
          {payments.map((p: PaymentListItem) => (
            <BookingEarningRow
              key={p.id}
              payment={p}
              dateLocale={dateLocale}
              egp={t("egp")}
              onPress={() =>
                navigation.navigate("HostReservationDetail", { bookingId: p.booking_id })
              }
            />
          ))}
        </View>
      )}

      {data.per_unit.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("earningsPerListing")}</Text>
          {data.per_unit.map((u: { unit_id: string; unit_title: string | null; booking_count: number; revenue_egp: number }) => (
            <View key={u.unit_id} style={styles.unitRow}>
              <Text style={styles.unitTitle} numberOfLines={1}>{u.unit_title || u.unit_id.slice(0, 8)}</Text>
              <View style={styles.unitStats}>
                <Text style={styles.unitBookings}>{u.booking_count} {t("hostReservations")}</Text>
                <Text style={styles.unitRevenue}>{formatMoney(u.revenue_egp, t("egp"))}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>{t("earningsDisclaimer")}</Text>
    </ScrollView>
  );
}

function BookingEarningRow({
  payment,
  dateLocale,
  egp,
  onPress,
}: {
  payment: PaymentListItem;
  dateLocale: string;
  egp: string;
  onPress: () => void;
}) {
  const { t } = useLocale();
  const stay =
    payment.check_in && payment.check_out
      ? `${new Date(payment.check_in).toLocaleDateString(dateLocale)} → ${new Date(payment.check_out).toLocaleDateString(dateLocale)}`
      : null;
  return (
    <Pressable
      style={({ pressed }) => [styles.bookingRow, pressed && styles.bookingRowPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.bookingRowTop}>
        <Text style={styles.bookingTitle} numberOfLines={1}>
          {payment.unit_title || payment.reference_number}
        </Text>
        {payment.payout_status ? (
          <StatusBadge
            label={t(PAYOUT_KEY[payment.payout_status] ?? "paymentStatusPending")}
            tone={PAYOUT_TONE[payment.payout_status] ?? "info"}
          />
        ) : null}
      </View>
      {stay ? <Text style={styles.bookingStay}>{stay}</Text> : null}
      <View style={styles.bookingAmounts}>
        <Text style={styles.bookingGross}>
          {t("earningsBookingTotal")}: {formatMoney(payment.amount_egp, egp)}
        </Text>
        {payment.status !== "refunded" ? (
          <Text style={styles.bookingNet}>
            {t("earningsYourEarnings")}: {formatMoney(payment.host_net_egp ?? 0, egp)}
          </Text>
        ) : null}
      </View>
      {payment.refund_amount_egp ? (
        <Text style={styles.bookingRefund}>
          {t("paymentStatusRefunded")}: {formatMoney(payment.refund_amount_egp, egp)}
        </Text>
      ) : null}
      {payment.expected_payout_at && payment.payout_status === "held" ? (
        <Text style={styles.bookingExpected}>
          {t("earningsExpectedPayout")}:{" "}
          {new Date(payment.expected_payout_at).toLocaleDateString(dateLocale)}
        </Text>
      ) : null}
    </Pressable>
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
    color: colors.onPrimary,
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.onPrimary,
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
  bookingRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bookingRowPressed: {
    backgroundColor: colors.surface,
  },
  bookingRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  bookingTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1,
  },
  bookingStay: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bookingAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  bookingGross: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  bookingNet: {
    fontSize: fontSize.sm,
    color: colors.accentText,
    fontWeight: "700",
  },
  bookingRefund: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: 2,
  },
  bookingExpected: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
    color: colors.accentText,
    fontWeight: "700",
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontStyle: "italic",
    marginTop: spacing.md,
  },
});
