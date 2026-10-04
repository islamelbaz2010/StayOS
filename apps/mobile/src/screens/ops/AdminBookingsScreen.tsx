import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  useAdminContactParticipant,
  useBookingFinancial,
  useBookingTimeline,
  useHostBookings,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, spacing } from "../../lib/theme";
import {
  Empty,
  Field,
  FilterChips,
  ListRow,
  PrimaryButton,
  Row,
  Section,
  StatusBadge,
} from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { BookingTimelineEvent, HostBooking } from "../../lib/types";

const QUEUES = [
  { key: "", en: "All", ar: "الكل" },
  { key: "requested", en: "Decision", ar: "قرار" },
  { key: "confirmed", en: "Confirmed", ar: "مؤكد" },
  { key: "completed", en: "Completed", ar: "مكتمل" },
  { key: "cancelled", en: "Cancelled", ar: "ملغي" },
];

const TONE: Record<string, "ok" | "warn" | "err" | "info"> = {
  confirmed: "ok",
  completed: "ok",
  requested: "warn",
  cancelled: "err",
};

export function AdminBookingsScreen() {
  const { t, locale } = useLocale();
  const [status, setStatus] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useHostBookings({
    status: status ?? undefined,
    limit: 100,
  });
  const [selected, setSelected] = useState<HostBooking | null>(null);
  const financial = useBookingFinancial(selected?.id ?? null);
  const timeline = useBookingTimeline(selected?.id ?? null);
  const contact = useAdminContactParticipant();
  const [contactTarget, setContactTarget] = useState<"guest" | "host">("guest");
  const [contactMsg, setContactMsg] = useState("");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const sendContact = async () => {
    if (!selected || !contactMsg.trim()) return;
    try {
      await contact.mutateAsync({
        booking_id: selected.id,
        target: contactTarget,
        content: contactMsg.trim(),
      });
      setContactMsg("");
      Alert.alert("", t("messageSent"));
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  if (selected) {
    const fin = financial.data;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={selected.unit_title ?? selected.id.slice(0, 8)}>
          <Row label={t("status")} value={selected.status} />
          <Row label={t("stayPhase")} value={selected.stay_phase} />
          <Row label={t("payCheckIn")} value={selected.check_in} />
          <Row label={t("payCheckOut")} value={selected.check_out} />
        </Section>

        {fin && (
          <Section title={t("financialContext")}>
            <Row label={t("guest")} value={fin.guest_name} />
            <Row label={t("host")} value={fin.host_name} />
            <Row label={t("paymentStatus")} value={fin.payment_status} />
            <Row
              label={t("amount")}
              value={fin.payment_amount_egp != null ? `${fin.payment_amount_egp} ${t("egp")}` : null}
            />
            <Row label={t("payReference")} value={fin.reference_number} mono />
            <Row
              label={t("refund")}
              value={fin.refund_amount_egp != null ? `${fin.refund_amount_egp} ${t("egp")}` : null}
            />
            {fin.disputes.length > 0 && (
              <Row label={t("disputes")} value={fin.disputes.length} />
            )}
            {fin.adjustments.length > 0 && (
              <Row label={t("adjustments")} value={fin.adjustments.length} />
            )}
          </Section>
        )}

        {timeline.data && timeline.data.events.length > 0 && (
          <Section title={t("timeline")}>
            {timeline.data.events.slice(0, 20).map((e: BookingTimelineEvent) => (
              <View key={e.id} style={styles.eventRow}>
                <Text style={styles.eventType}>{e.event_type}</Text>
                <Text style={styles.eventTime}>
                  {new Date(e.occurred_at).toLocaleString(dateLocale)}
                </Text>
              </View>
            ))}
          </Section>
        )}

        <Section title={t("contactParticipant")}>
          <View style={styles.targetRow}>
            {(["guest", "host"] as const).map((tgt) => (
              <PrimaryButton
                key={tgt}
                secondary={contactTarget !== tgt}
                label={t(tgt)}
                onPress={() => setContactTarget(tgt)}
                style={styles.targetBtn}
              />
            ))}
          </View>
          <Field
            label={t("message")}
            value={contactMsg}
            onChangeText={setContactMsg}
            multiline
          />
          <PrimaryButton
            label={contact.isPending ? t("loading") : t("send")}
            onPress={sendContact}
            disabled={contact.isPending || !contactMsg.trim()}
          />
        </Section>

        <PrimaryButton secondary label={t("back")} onPress={() => setSelected(null)} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FilterChips
          options={QUEUES.map((f) => ({ key: f.key, label: locale === "ar" ? f.ar : f.en }))}
          value={status}
          onChange={setStatus}
        />
      </View>
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorView message={t("error")} onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Section>
            {(data?.items ?? []).length === 0 ? (
              <Empty text={t("noBookings")} />
            ) : (
              (data?.items ?? []).map((b: HostBooking) => (
                <ListRow
                  key={b.id}
                  title={b.unit_title ?? b.unit_id.slice(0, 8)}
                  subtitle={`${b.check_in} → ${b.check_out}`}
                  right={<StatusBadge label={b.status} tone={TONE[b.status] ?? "info"} />}
                  onPress={() => setSelected(b)}
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  eventType: { fontSize: 13, color: colors.text, fontWeight: "600" },
  eventTime: { fontSize: 12, color: colors.textTertiary },
  targetRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  targetBtn: { flex: 1, marginTop: 0 },
});
