import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { usePayments } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../components/States";
import type { PaymentListItem } from "../lib/types";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  proof_uploaded: colors.primary,
  verified: colors.success,
  rejected: colors.error,
  cancelled: colors.textTertiary,
  refund_pending: colors.warning,
  refunded: colors.success,
};

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PaymentsScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data: payments, isLoading, isError, refetch } = usePayments();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={t("error")} onRetry={refetch} />;
  if (!payments || payments.length === 0) {
    return <EmptyView title={t("noPayments")} subtitle={t("noPaymentsHint")} />;
  }

  const renderItem = ({ item }: { item: PaymentListItem }) => {
    const statusColor = STATUS_COLORS[item.status] ?? colors.textSecondary;
    const deadlineText = item.payment_deadline_at
      ? t("paymentDeadline").replace("{date}", formatDate(item.payment_deadline_at, locale))
      : null;
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("Payment", { bookingId: item.booking_id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.amount}>
            {item.amount_egp} {t("egp")}
          </Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>
              {t(`paymentStatus${item.status.replace(/(^|_)([a-z])/g, (_, __, l) => l.toUpperCase())}`)}
            </Text>
          </View>
        </View>
        <Text style={styles.reference}>{item.reference_number}</Text>
        {deadlineText && <Text style={styles.deadline}>{deadlineText}</Text>}
        {item.proof_rejection_count > 0 && (
          <Text style={styles.rejection}>
            {t("rejectedProofs").replace("{count}", String(item.proof_rejection_count))}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={payments}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<Text style={styles.title}>{t("paymentsTitle")}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  amount: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  reference: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  deadline: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  rejection: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
