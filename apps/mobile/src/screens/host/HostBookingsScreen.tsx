import { useMemo, useState } from "react";
import { FlatList, StyleSheet, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useHostBookings, useHostListings } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { Empty, FilterChips, ListRow, StatusBadge } from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { RootStackParamList } from "../../../App";
import type { HostBooking, ListingDetail } from "../../lib/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_OPTIONS = [
  { key: "", label_en: "All", label_ar: "الكل" },
  { key: "requested", label_en: "Requested", label_ar: "مطلوب" },
  { key: "accepted", label_en: "Accepted", label_ar: "مقبول" },
  { key: "confirmed", label_en: "Confirmed", label_ar: "مؤكد" },
  { key: "completed", label_en: "Completed", label_ar: "مكتمل" },
  { key: "cancelled", label_en: "Cancelled", label_ar: "ملغي" },
];

const TONE: Record<string, "ok" | "warn" | "err" | "info"> = {
  confirmed: "ok",
  completed: "ok",
  accepted: "info",
  requested: "warn",
  cancelled: "err",
  rejected: "err",
};

export function HostBookingsScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const [status, setStatus] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [dateBucket, setDateBucket] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: listings } = useHostListings();
  const { data, isLoading, error, refetch } = useHostBookings({
    status: status ?? undefined,
    limit: 100,
  });

  // The backend only accepts `status`; listing/search/date filters are
  // applied client-side against the returned real bookings.
  const items = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const q = search.trim().toLowerCase();
    return (data?.items ?? []).filter((b: HostBooking) => {
      if (unitId && b.unit_id !== unitId) return false;
      if (
        dateBucket === "upcoming" &&
        !(b.check_in > today)
      )
        return false;
      if (
        dateBucket === "in_progress" &&
        !(b.check_in <= today && b.check_out > today)
      )
        return false;
      if (dateBucket === "past" && !(b.check_out <= today)) return false;
      if (
        q &&
        !(b.unit_title ?? "").toLowerCase().includes(q) &&
        !b.id.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [data, unitId, dateBucket, search]);

  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const unitOptions = [
    { key: "", label: t("allListings") },
    ...(listings ?? []).map((l: ListingDetail) => ({ key: l.id, label: l.title })),
  ];

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder={t("searchBookings")}
        placeholderTextColor={colors.textTertiary}
        value={search}
        onChangeText={setSearch}
      />
      <FilterChips
        options={STATUS_OPTIONS.map((o) => ({
          key: o.key,
          label: locale === "ar" ? o.label_ar : o.label_en,
        }))}
        value={status}
        onChange={setStatus}
      />
      {unitOptions.length > 1 && (
        <FilterChips options={unitOptions} value={unitId} onChange={setUnitId} />
      )}
      <FilterChips
        options={[
          { key: "", label: t("allDates") },
          { key: "upcoming", label: t("upcoming") },
          { key: "in_progress", label: t("inProgress") },
          { key: "past", label: t("past") },
        ]}
        value={dateBucket}
        onChange={setDateBucket}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorView message={t("error")} onRetry={refetch} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ListRow
              title={item.unit_title ?? item.unit_id.slice(0, 8)}
              subtitle={`${item.check_in} → ${item.check_out} · ${item.adults} ${t("guests").toLowerCase()}`}
              badge={new Date(item.requested_at).toLocaleDateString(dateLocale)}
              right={<StatusBadge label={item.status} tone={TONE[item.status] ?? "info"} />}
              onPress={() =>
                navigation.navigate("HostReservationDetail", { bookingId: item.id })
              }
            />
          )}
          ListEmptyComponent={<Empty text={t("noBookings")} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  list: { paddingTop: spacing.sm },
});
