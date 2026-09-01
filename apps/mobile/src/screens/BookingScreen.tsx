import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCreateBooking, useAvailability } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { useAuth } from "../lib/AuthContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import type { CalendarDay } from "../lib/types";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type BookingRoute = RouteProp<RootStackParamList, "Booking">;

const MS_PER_DAY = 86_400_000;

function stripTime(d: Date): Date {
  const stripped = new Date(d);
  stripped.setHours(0, 0, 0, 0);
  return stripped;
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return stripTime(result);
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return stripTime(new Date(y, m - 1, d));
}

function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

function monthLabel(d: Date, locale: string): string {
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function BookingScreen() {
  const { locale, t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<BookingRoute>();
  const { isAuthenticated } = useAuth();
  const {
    unitId,
    title,
    price,
    currency,
    maxGuests,
    minNights,
    maxNights,
    checkIn: checkInParam,
    checkOut: checkOutParam,
    adults: adultsParam,
    children: childrenParam,
    infants: infantsParam,
  } = route.params;

  const today = useMemo(() => stripTime(new Date()), []);
  const windowEnd = useMemo(() => addDays(today, 60), [today]);
  const from = dateKey(today);
  const to = dateKey(windowEnd);

  const {
    data: availability,
    isLoading: isLoadingAvailability,
    isError: isAvailabilityError,
  } = useAvailability(unitId, from, to);

  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    if (availability?.days) {
      for (const day of availability.days) {
        map.set(day.date, day);
      }
    }
    return map;
  }, [availability]);

  const [checkIn, setCheckIn] = useState<Date | null>(
    checkInParam ? parseKey(checkInParam) : null
  );
  const [checkOut, setCheckOut] = useState<Date | null>(
    checkOutParam ? parseKey(checkOutParam) : null
  );
  const [adults, setAdults] = useState(adultsParam ?? 1);
  const [children, setChildren] = useState(childrenParam ?? 0);
  const [infants, setInfants] = useState(infantsParam ?? 0);

  useEffect(() => {
    if (checkInParam) setCheckIn(parseKey(checkInParam));
    if (checkOutParam) setCheckOut(parseKey(checkOutParam));
    if (adultsParam !== undefined) setAdults(adultsParam);
    if (childrenParam !== undefined) setChildren(childrenParam);
    if (infantsParam !== undefined) setInfants(infantsParam);
  }, [checkInParam, checkOutParam, adultsParam, childrenParam, infantsParam]);

  const createBooking = useCreateBooking();

  const totalGuests = adults + children + infants;
  const nights = checkIn && checkOut ? daysBetween(checkIn, checkOut) : 0;
  const subtotal = price * Math.max(0, nights);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let current = today;
    while (isBefore(current, windowEnd) || isSameDay(current, windowEnd)) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [today, windowEnd]);

  function isDayUnavailable(date: Date): boolean {
    if (isBefore(date, today)) return true;
    const key = dateKey(date);
    const day = dayMap.get(key);
    return !day || day.status !== "AVAILABLE";
  }

  function isInSelectedRange(date: Date): boolean {
    if (!checkIn || !checkOut) return false;
    return (
      (isBefore(checkIn, date) || isSameDay(checkIn, date)) &&
      (isBefore(date, checkOut) || isSameDay(date, checkOut))
    );
  }

  function rangeContainsUnavailable(start: Date, end: Date): boolean {
    let current = start;
    while (isBefore(current, end)) {
      if (isDayUnavailable(current)) return true;
      current = addDays(current, 1);
    }
    return false;
  }

  function handleDayPress(date: Date) {
    if (
      !checkIn ||
      (checkOut && !isSameDay(checkOut, date)) ||
      isBefore(date, checkIn) ||
      isSameDay(date, checkIn)
    ) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }

    const nights = daysBetween(checkIn, date);
    if (nights < minNights) {
      Alert.alert(
        t("selectDates"),
        t("minNights").replace("{n}", String(minNights))
      );
      return;
    }
    if (nights > maxNights) {
      Alert.alert(
        t("selectDates"),
        t("maxNights").replace("{n}", String(maxNights))
      );
      return;
    }
    if (rangeContainsUnavailable(checkIn, date)) {
      Alert.alert(t("selectDates"), t("unavailable"));
      return;
    }

    setCheckOut(date);
  }

  const handleConfirm = async () => {
    if (!checkIn || !checkOut) {
      Alert.alert(t("error"), t("selectDates"));
      return;
    }
    if (adults < 1) {
      Alert.alert(t("error"), t("adults"));
      return;
    }
    if (totalGuests > maxGuests) {
      Alert.alert(t("error"), `${t("guests")}: ${maxGuests} ${t("maxGuests")}`);
      return;
    }

    if (!isAuthenticated) {
      navigation.navigate("Login", {
        nextScreen: "Booking",
        nextParams: {
          ...route.params,
          checkIn: dateKey(checkIn),
          checkOut: dateKey(checkOut),
          adults,
          children,
          infants,
        },
      });
      return;
    }

    try {
      const created = await createBooking.mutateAsync({
        unit_id: unitId,
        check_in: dateKey(checkIn),
        check_out: dateKey(checkOut),
        adults,
        children,
        infants,
      });
      Alert.alert(t("bookingConfirmed"), created.status, [
        { text: "OK", onPress: () => (navigation as any).navigate("Home", { screen: "TripsTab" }) },
      ]);
    } catch (err: any) {
      const data = err?.response?.data;
      const messageAr = data?.error?.message_ar;
      const message =
        (messageAr && messageAr !== t("error") ? messageAr : undefined) ||
        data?.error?.message ||
        data?.detail ||
        t("error");
      Alert.alert(t("bookingFailed"), message);
    }
  };

  const sections = useMemo(() => {
    const byMonth = new Map<string, Date[]>();
    for (const d of calendarDays) {
      const label = monthLabel(d, locale);
      if (!byMonth.has(label)) byMonth.set(label, []);
      byMonth.get(label)!.push(d);
    }
    return Array.from(byMonth.entries()).map(([title, days]) => ({
      title,
      days,
      padding: days[0] ? days[0].getDay() : 0,
    }));
  }, [calendarDays, locale]);

  if (isAvailabilityError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t("error")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.pricePerNight}>
          {price} {currency} / {t("perNight")}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("selectDates")}</Text>
        {isLoadingAvailability && <Text style={styles.loadingText}>{t("loading")}</Text>}

        {sections.map((section) => (
          <View key={section.title} style={styles.monthBlock}>
            <Text style={styles.monthTitle}>{section.title}</Text>
            <View style={styles.weekRow}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <Text key={i} style={styles.weekDay}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {Array.from({ length: section.padding }).map((_, i) => (
                <View key={`pad-${i}`} style={styles.dayCell} />
              ))}
              {section.days.map((date) => {
                const key = dateKey(date);
                const unavailable = isDayUnavailable(date);
                const selected =
                  (checkIn && isSameDay(date, checkIn)) ||
                  (checkOut && isSameDay(date, checkOut));
                const inRange = isInSelectedRange(date);
                return (
                  <Pressable
                    key={key}
                    disabled={unavailable}
                    style={[
                      styles.dayCell,
                      unavailable && styles.dayUnavailable,
                      inRange && styles.dayInRange,
                      selected && styles.daySelected,
                    ]}
                    onPress={() => handleDayPress(date)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        unavailable && styles.dayTextUnavailable,
                        (selected || inRange) && styles.dayTextSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {checkIn && checkOut && (
          <Text style={styles.nightsText}>
            {nights} {t("night")}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("guests")}</Text>
        <GuestStepper label={t("adults")} value={adults} min={1} onChange={setAdults} />
        <GuestStepper label={t("children")} value={children} min={0} onChange={setChildren} />
        <GuestStepper label={t("infants")} value={infants} min={0} onChange={setInfants} />
        {totalGuests > maxGuests && (
          <Text style={styles.errorText}>
            {t("guests")}: {maxGuests} {t("maxGuests")}
          </Text>
        )}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {price} {currency} × {Math.max(0, nights)} {t("night")}
          </Text>
          <Text style={styles.summaryValue}>
            {subtotal} {currency}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotal}>{t("total")}</Text>
          <Text style={styles.summaryTotalValue}>
            {subtotal} {currency}
          </Text>
        </View>
      </View>

      <Pressable
        style={[
          styles.confirmButton,
          (createBooking.isPending || !checkIn || !checkOut) &&
            styles.confirmButtonDisabled,
        ]}
        onPress={handleConfirm}
        disabled={createBooking.isPending || !checkIn || !checkOut}
      >
        <Text style={styles.confirmButtonText}>
          {createBooking.isPending ? t("loading") : t("confirmBooking")}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function GuestStepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.guestRow}>
      <Text style={styles.guestLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          style={[styles.stepperButton, value <= min && styles.stepperButtonDisabled]}
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Text style={styles.stepperButtonText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable
          style={styles.stepperButton}
          onPress={() => onChange(value + 1)}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  pricePerNight: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  monthBlock: {
    marginBottom: spacing.lg,
  },
  monthTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.xs,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    color: colors.textTertiary,
    fontSize: fontSize.xs,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  dayUnavailable: {
    backgroundColor: colors.surface,
  },
  dayInRange: {
    backgroundColor: colors.primary50,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  dayTextUnavailable: {
    color: colors.textTertiary,
  },
  dayTextSelected: {
    color: colors.white,
  },
  nightsText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
  guestRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  guestLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    backgroundColor: colors.surface,
  },
  stepperButtonText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: "700",
  },
  stepperValue: {
    fontSize: fontSize.md,
    minWidth: 32,
    textAlign: "center",
    fontWeight: "600",
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  summaryText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
  },
  summaryTotal: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
  },
  summaryTotalValue: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.primary,
    marginTop: spacing.sm,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
});
