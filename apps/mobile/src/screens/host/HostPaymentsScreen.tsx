import { useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useHostPayments } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { Empty, FilterChips, ListRow, StatusBadge } from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import { formatMoney } from "../../lib/money";
import type { PaymentListItem } from "../../lib/types";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TONE: Record<string, "ok" | "warn" | "err" | "info"> = {
  verified: "ok",
  refunded: "info",
  pending: "warn",
  proof_uploaded: "warn",
  rejected: "err",
  cancelled: "err",
};

const STATUS_FILTERS = [
  "",
  "pending",
  "proof_uploaded",
  "verified",
  "rejected",
  "cancelled",
  "refund_pending",
  "refunded",
] as const;

function statusLabelKey(status: string): string {
  return `paymentStatus${status.replace(/(^|_)([a-z])/g, (_, __, l) => l.toUpperCase())}`;
}

export function HostPaymentsScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data, isLoading, error, refetch } = useHostPayments();
  const [status, setStatus] = useState<string | null>(null);
  const [selected, setSelected] = useState<PaymentListItem | null>(null);
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(dateLocale) : "—";

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView message={t("error")} onRetry={refetch} />;

  const payments = data ?? [];
  const visible = status
    ? payments.filter((p: PaymentListItem) => p.status === status)
    : payments;

  const detailRow = (label: string, value: string | number | null | undefined) => (
    <View style={styles.detailRow} key={label}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} selectable>
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={visible}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <FilterChips
            options={STATUS_FILTERS.map((s) => ({
              key: s,
              label: s === "" ? t("all") : t(statusLabelKey(s)),
            }))}
            value={status}
            onChange={setStatus}
          />
        }
        renderItem={({ item }) => (
          <ListRow
            title={formatMoney(item.amount_egp, t("egp"))}
            subtitle={`${item.reference_number} · ${fmt(item.created_at)}`}
            right={<StatusBadge label={item.status} tone={TONE[item.status] ?? "info"} />}
            onPress={() => setSelected(item)}
          />
        )}
        ListEmptyComponent={<Empty text={t("noPayments")} />}
      />

      <Modal
        visible={selected !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSelected(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          {selected && (
            <ScrollView>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetAmount}>
                  {formatMoney(selected.amount_egp, t("egp"))}
                </Text>
                <StatusBadge
                  label={selected.status}
                  tone={TONE[selected.status] ?? "info"}
                />
              </View>
              {detailRow(t("referenceNumber"), selected.reference_number)}
              {detailRow(t("paymentMethod"), selected.method)}
              {detailRow(t("paymentCreatedAt"), fmt(selected.created_at))}
              {detailRow(t("paymentUpdatedAt"), fmt(selected.updated_at))}
              {selected.payment_deadline_at
                ? detailRow(t("paymentDeadlineShort"), fmt(selected.payment_deadline_at))
                : null}
              {selected.proof_uploaded_at
                ? detailRow(t("paymentProofUploadedAt"), fmt(selected.proof_uploaded_at))
                : null}
              {selected.proof_rejection_count > 0
                ? detailRow(t("rejectedProofsLabel"), selected.proof_rejection_count)
                : null}
              <Pressable
                style={styles.sheetAction}
                onPress={() => {
                  const bookingId = selected.booking_id;
                  setSelected(null);
                  navigation.navigate("HostReservationDetail", { bookingId });
                }}
              >
                <Text style={styles.sheetActionText}>{t("viewBooking")}</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: "70%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  sheetAmount: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.text,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  sheetAction: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary50,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  sheetActionText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.accentText,
  },
});
