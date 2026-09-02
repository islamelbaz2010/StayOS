import { useMemo, useState, useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { addDays, format } from "date-fns";
import { useListingAvailability, type AvailabilityDay } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner } from "./States";

const MAX_RANGE_DAYS = 89;

function toKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

interface DateRangeCalendarProps {
  visible: boolean;
  unitId: string;
  initialCheckIn: Date | null;
  initialCheckOut: Date | null;
  onClose: () => void;
  onConfirm: (checkIn: Date, checkOut: Date) => void;
}

export function DateRangeCalendar({
  visible,
  unitId,
  initialCheckIn,
  initialCheckOut,
  onClose,
  onConfirm,
}: DateRangeCalendarProps) {
  const { t, isRTL } = useLocale();
  const [checkIn, setCheckIn] = useState<Date | null>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<Date | null>(initialCheckOut);
  const [rangeError, setRangeError] = useState(false);

  useEffect(() => {
    if (visible) {
      setCheckIn(initialCheckIn);
      setCheckOut(initialCheckOut);
      setRangeError(false);
    }
  }, [visible, initialCheckIn, initialCheckOut]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxDate = useMemo(() => addDays(today, MAX_RANGE_DAYS), [today]);

  const { data: availability, isLoading } = useListingAvailability(
    unitId,
    toKey(today),
    toKey(maxDate)
  );

  const blockedDates = useMemo(() => {
    const set = new Set<string>();
    availability?.days?.forEach((day: AvailabilityDay) => {
      if (day.status !== "AVAILABLE") set.add(day.date);
    });
    return set;
  }, [availability]);

  const hasBlockedDayBetween = (from: Date, to: Date): boolean => {
    let cursor = from;
    while (cursor < to) {
      if (blockedDates.has(toKey(cursor))) return true;
      cursor = addDays(cursor, 1);
    }
    return false;
  };

  const handleDayPress = (day: DateData) => {
    if (blockedDates.has(day.dateString)) return;
    const pressed = new Date(day.year, day.month - 1, day.day);
    setRangeError(false);

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(pressed);
      setCheckOut(null);
      return;
    }

    if (pressed <= checkIn) {
      setCheckIn(pressed);
      setCheckOut(null);
      return;
    }

    if (hasBlockedDayBetween(checkIn, pressed)) {
      setRangeError(true);
      return;
    }

    setCheckOut(pressed);
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    blockedDates.forEach((key) => {
      marks[key] = {
        disabled: true,
        disableTouchEvent: true,
        textColor: colors.textTertiary,
      };
    });

    if (checkIn && !checkOut) {
      const key = toKey(checkIn);
      marks[key] = {
        ...marks[key],
        startingDay: true,
        endingDay: true,
        color: colors.primary,
        textColor: colors.white,
      };
    } else if (checkIn && checkOut) {
      let cursor = checkIn;
      while (cursor <= checkOut) {
        const key = toKey(cursor);
        marks[key] = {
          ...marks[key],
          color: colors.primary,
          textColor: colors.white,
          startingDay: key === toKey(checkIn),
          endingDay: key === toKey(checkOut),
        };
        cursor = addDays(cursor, 1);
      }
    }

    return marks;
  }, [blockedDates, checkIn, checkOut]);

  const nights =
    checkIn && checkOut
      ? Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)
      : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("selectCheckInCheckOut")}</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <LoadingSpinner />
            </View>
          ) : (
            <Calendar
              current={toKey(today)}
              minDate={toKey(today)}
              maxDate={toKey(maxDate)}
              firstDay={isRTL ? 6 : 0}
              onDayPress={handleDayPress}
              markingType="period"
              markedDates={markedDates}
              theme={{
                selectedDayBackgroundColor: colors.primary,
                todayTextColor: colors.primary,
                arrowColor: colors.primary,
                textDayFontWeight: "500",
                textMonthFontWeight: "700",
              }}
            />
          )}

          {rangeError && (
            <Text style={styles.errorText}>{t("datesBlockedInRange")}</Text>
          )}

          <View style={styles.footer}>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>{t("checkInCheckOutLabel")}</Text>
              <Text style={styles.summaryValue}>
                {checkIn ? format(checkIn, "MMM d") : "—"}
                {"  →  "}
                {checkOut ? format(checkOut, "MMM d") : "—"}
                {nights > 0 ? `  ·  ${nights} ${t("nightsCount")}` : ""}
              </Text>
            </View>
            <View style={styles.footerButtons}>
              <Pressable
                style={styles.clearButton}
                onPress={() => {
                  setCheckIn(null);
                  setCheckOut(null);
                  setRangeError(false);
                }}
              >
                <Text style={styles.clearButtonText}>{t("clearDates")}</Text>
              </Pressable>
              <Pressable
                style={[styles.doneButton, !(checkIn && checkOut) && styles.doneButtonDisabled]}
                disabled={!(checkIn && checkOut)}
                onPress={() => checkIn && checkOut && onConfirm(checkIn, checkOut)}
              >
                <Text style={styles.doneButtonText}>{t("done")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  loadingBox: {
    height: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  summary: {
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  footerButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  clearButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  doneButton: {
    flex: 2,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  doneButtonText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.white,
  },
});
