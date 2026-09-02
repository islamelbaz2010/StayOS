import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useHostCalendar, useHostListings } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../../components/States";
import type { HostCalendarDay } from "../../lib/types";

function formatISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  AVAILABLE: { bg: colors.primary50, text: colors.primary },
  BLOCKED: { bg: "#FEE2E2", text: colors.error },
  BOOKED: { bg: colors.primary, text: colors.white },
  HOLD: { bg: "#FEF3C7", text: "#92400E" },
};

export function HostCalendarScreen() {
  const { t } = useLocale();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(undefined);

  const checkIn = formatISO(startOfMonth(cursor));
  const checkOut = formatISO(addDays(endOfMonth(cursor), 1));

  const { data: listings } = useHostListings();
  const { data, isLoading, isError, refetch } = useHostCalendar(checkIn, checkOut, selectedUnitId);

  const monthLabel = useMemo(() => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${months[cursor.getMonth()]} ${cursor.getFullYear()}`;
  }, [cursor]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("hostCalendar")}</Text>
        <View style={styles.navRow}>
          <Pressable style={styles.navButton} onPress={() => setCursor(addDays(cursor, -31))}>
            <Text style={styles.navButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable style={styles.navButton} onPress={() => setCursor(addDays(cursor, 31))}>
            <Text style={styles.navButtonText}>›</Text>
          </Pressable>
        </View>
        {listings && listings.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
            <Pressable
              style={[styles.unitChip, !selectedUnitId && styles.unitChipActive]}
              onPress={() => setSelectedUnitId(undefined)}
            >
              <Text style={[styles.unitChipText, !selectedUnitId && styles.unitChipTextActive]}>
                {t("hostListings")}
              </Text>
            </Pressable>
            {listings.map((l: { id: string; title_ar?: string; title_en?: string | null }) => (
              <Pressable
                key={l.id}
                style={[styles.unitChip, selectedUnitId === l.id && styles.unitChipActive]}
                onPress={() => setSelectedUnitId(l.id)}
              >
                <Text style={[styles.unitChipText, selectedUnitId === l.id && styles.unitChipTextActive]}>
                  {l.title_ar || l.title_en || l.id.slice(0, 8)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorView message={t("error")} onRetry={refetch} />
      ) : !data || data.days.length === 0 ? (
        <EmptyView title={t("calendarNoBookings")} />
      ) : (
        <CalendarGrid days={data.days} t={t} />
      )}
    </View>
  );
}

function CalendarGrid({
  days,
  t,
}: {
  days: HostCalendarDay[];
  t: (key: string) => string;
}) {
  // Group days into weeks
  const weeks: HostCalendarDay[][] = [];
  let current: HostCalendarDay[] = [];
  for (let i = 0; i < days.length; i++) {
    current.push(days[i]);
    if (current.length === 7 || i === days.length - 1) {
      weeks.push(current);
      current = [];
    }
  }

  return (
    <ScrollView style={styles.calendarScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.weekHeader}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <Text key={i} style={styles.weekDayLabel}>{d}</Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            const sc = STATUS_COLORS[day.status] || STATUS_COLORS.AVAILABLE;
            const dayNum = new Date(day.date).getDate();
            return (
              <View key={di} style={[styles.dayCell, { backgroundColor: sc.bg }]}>
                <Text style={[styles.dayNum, { color: sc.text }]}>{dayNum}</Text>
                <Text style={[styles.dayStatus, { color: sc.text }]}>
                  {day.status === "BOOKED" && day.guest_name
                    ? day.guest_name.slice(0, 6)
                    : day.status === "AVAILABLE"
                    ? `${day.price_egp}`
                    : day.status.slice(0, 4)}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
      <View style={styles.legend}>
        {Object.entries(STATUS_COLORS).map(([status, sc]) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: sc.bg, borderColor: sc.text }]} />
            <Text style={styles.legendText}>{t(`calendar${status.charAt(0)}${status.slice(1).toLowerCase()}`)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtonText: {
    fontSize: fontSize.xxl,
    color: colors.text,
  },
  monthLabel: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
  },
  unitScroll: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  unitChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  unitChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  unitChipTextActive: {
    color: colors.white,
    fontWeight: "600",
  },
  calendarScroll: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.xs,
  },
  weekDayLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: "600",
    width: 44,
    textAlign: "center",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.xs,
  },
  dayCell: {
    width: 44,
    minHeight: 56,
    borderRadius: radius.sm,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayNum: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  dayStatus: {
    fontSize: 9,
    marginTop: 2,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
