import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useCreateCalendarRule,
  useDeleteCalendarRule,
  useHostCalendar,
  useHostListingDetail,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../../components/States";
import type { HostCalendarDay } from "../../lib/types";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type AvailRoute = RouteProp<RootStackParamList, "HostListingAvailability">;

const BLOCK_TYPES = [
  { value: "manual", labelKey: "listingBlockManual" },
  { value: "cleaning", labelKey: "listingBlockCleaning" },
  { value: "maintenance", labelKey: "listingBlockMaintenance" },
];

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function plusDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function HostListingAvailabilityScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<AvailRoute>();
  const unitId = route.params.unitId;
  const { data: listing, isLoading: listingLoading } = useHostListingDetail(unitId);

  const checkIn = todayISO();
  const checkOut = plusDaysISO(90);
  const { data: calendar, isLoading: calLoading, isError, refetch } = useHostCalendar(
    checkIn,
    checkOut,
    unitId
  );

  const createRuleMut = useCreateCalendarRule();
  const deleteRuleMut = useDeleteCalendarRule();

  const [showForm, setShowForm] = useState(false);
  const [dateFrom, setDateFrom] = useState(checkIn);
  const [dateTo, setDateTo] = useState(plusDaysISO(7));
  const [blockType, setBlockType] = useState("manual");
  const [priceOverride, setPriceOverride] = useState("");

  if (listingLoading || calLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={t("error")} onRetry={refetch} />;
  if (!listing) return <ErrorView message={t("error")} />;

  const canManage = listing.permission_scope === "owner" ||
    listing.permission_scope === "admin" ||
    listing.permission_scope === "full_access" ||
    listing.permission_scope === "calendar_messaging" ||
    listing.permission_scope === "calendar_only";

  const days: HostCalendarDay[] = calendar?.days || [];
  const bookedDays = days.filter((d: HostCalendarDay) => d.status === "booked");
  const blockedDays = days.filter((d: HostCalendarDay) => d.status === "blocked");
  const availableDays = days.filter((d: HostCalendarDay) => d.status === "available");

  const handleCreateRule = async () => {
    try {
      await createRuleMut.mutateAsync({
        unitId,
        payload: {
          date_from: dateFrom,
          date_to: dateTo,
          status: "blocked",
          block_type: blockType,
          price_override: priceOverride ? Number(priceOverride) : null,
        },
      });
      setShowForm(false);
      setPriceOverride("");
    } catch {
      // Error shown via mutation state
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("listingAvailability")}</Text>
        <View style={styles.statsRow}>
          <Stat label={t("calendarAvailable")} value={availableDays.length} color={colors.success} />
          <Stat label={t("calendarBooked")} value={bookedDays.length} color={colors.primary} />
          <Stat label={t("calendarBlocked")} value={blockedDays.length} color={colors.warning} />
        </View>
      </View>

      {canManage && (
        <Pressable
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.addButtonText}>
            {showForm ? t("listingCancel") : `+ ${t("listingBlockDates")}`}
          </Text>
        </Pressable>
      )}

      {showForm && canManage && (
        <View style={styles.formCard}>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>{t("listingDateFrom")}</Text>
              <TextInput
                style={styles.input}
                value={dateFrom}
                onChangeText={setDateFrom}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>{t("listingDateTo")}</Text>
              <TextInput
                style={styles.input}
                value={dateTo}
                onChangeText={setDateTo}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <Text style={styles.formLabel}>{t("listingBlockType")}</Text>
          <View style={styles.chipRow}>
            {BLOCK_TYPES.map((bt) => (
              <Pressable
                key={bt.value}
                style={[styles.chip, blockType === bt.value && styles.chipSelected]}
                onPress={() => setBlockType(bt.value)}
              >
                <Text style={[styles.chipText, blockType === bt.value && styles.chipTextSelected]}>
                  {t(bt.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.formLabel}>{t("listingPriceOverride")}</Text>
          <TextInput
            style={styles.input}
            value={priceOverride}
            onChangeText={setPriceOverride}
            keyboardType="numeric"
            placeholder="—"
          />

          <Pressable
            style={[styles.saveButton, createRuleMut.isPending && styles.saveButtonDisabled]}
            disabled={createRuleMut.isPending}
            onPress={handleCreateRule}
          >
            <Text style={styles.saveButtonText}>
              {createRuleMut.isPending ? t("listingSaving") : t("listingAddRule")}
            </Text>
          </Pressable>
          {createRuleMut.isError && (
            <Text style={styles.errorText}>{t("listingRuleError")}</Text>
          )}
        </View>
      )}

      {/* Day list */}
      <View style={styles.dayList}>
        {days.length === 0 ? (
          <EmptyView title={t("calendarNoBookings")} />
        ) : (
          days
            .filter((d: HostCalendarDay) => d.status !== "available")
            .map((day: HostCalendarDay) => (
              <View key={day.date} style={styles.dayRow}>
                <View style={[styles.dayDot, day.status === "booked" ? styles.dotBooked : styles.dotBlocked]} />
                <Text style={styles.dayDate}>{day.date}</Text>
                <Text style={styles.dayStatus}>
                  {day.status === "booked" ? t("calendarBooked") : t("calendarBlocked")}
                </Text>
                {day.guest_name && (
                  <Text style={styles.dayGuest}>{day.guest_name}</Text>
                )}
                {day.price_egp > 0 && (
                  <Text style={styles.dayPrice}>
                    {day.price_egp} {t("listingEgp")}
                  </Text>
                )}
              </View>
            ))
        )}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  addButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  formCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  formField: {
    flex: 1,
  },
  formLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  dayList: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: "wrap",
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotBooked: { backgroundColor: colors.primary },
  dotBlocked: { backgroundColor: colors.warning },
  dayDate: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
  },
  dayStatus: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  dayGuest: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  dayPrice: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginLeft: "auto",
  },
});
