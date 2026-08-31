import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Platform,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCreateBooking } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type BookingRoute = RouteProp<RootStackParamList, "Booking">;

function formatDate(date: Date | null, locale: string): string {
  if (!date) return "";
  return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toISODate(date: Date | null): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function BookingScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<BookingRoute>();
  const { unitId, title, price, currency, maxGuests } = route.params;

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const createBooking = useCreateBooking();

  const totalGuests = adults + children + infants;
  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000))
    : 0;
  const subtotal = price * Math.max(0, nights);

  const handleConfirm = async () => {
    if (!checkIn || !checkOut) {
      Alert.alert(t("error"), t("selectDates"));
      return;
    }
    if (checkOut <= checkIn) {
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

    try {
      const created = await createBooking.mutateAsync({
        unit_id: unitId,
        check_in: toISODate(checkIn),
        check_out: toISODate(checkOut),
        adults,
        children,
        infants,
      });
      Alert.alert(t("bookingConfirmed"), created.status, [
        { text: "OK", onPress: () => navigation.navigate("Trips") },
      ]);
    } catch (err: any) {
      const data = err?.response?.data;
      const message =
        data?.error?.message_ar ||
        data?.detail ||
        data?.error?.message ||
        t("error");
      Alert.alert(t("bookingFailed"), message);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.pricePerNight}>{price} {currency} / {t("perNight")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("selectDates")}</Text>
        <Pressable
          style={styles.dateField}
          onPress={() => setShowCheckIn(true)}
        >
          <Text style={styles.dateLabel}>{t("checkIn")}</Text>
          <Text style={checkIn ? styles.dateValue : styles.datePlaceholder}>
            {checkIn ? formatDate(checkIn, "en") : "YYYY-MM-DD"}
          </Text>
        </Pressable>
        {showCheckIn && (
          <DateTimePicker
            value={checkIn || today}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={today}
            onChange={(event, selectedDate) => {
              setShowCheckIn(false);
              if (event.type === "set" && selectedDate) {
                const d = new Date(selectedDate);
                d.setHours(0, 0, 0, 0);
                setCheckIn(d);
                if (checkOut && d >= checkOut) {
                  setCheckOut(addDays(d, 1));
                }
              }
            }}
          />
        )}

        <Pressable
          style={styles.dateField}
          onPress={() => setShowCheckOut(true)}
        >
          <Text style={styles.dateLabel}>{t("checkOut")}</Text>
          <Text style={checkOut ? styles.dateValue : styles.datePlaceholder}>
            {checkOut ? formatDate(checkOut, "en") : "YYYY-MM-DD"}
          </Text>
        </Pressable>
        {showCheckOut && (
          <DateTimePicker
            value={checkOut || (checkIn ? addDays(checkIn, 1) : addDays(today, 1))}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={checkIn ? addDays(checkIn, 1) : today}
            onChange={(event, selectedDate) => {
              setShowCheckOut(false);
              if (event.type === "set" && selectedDate) {
                const d = new Date(selectedDate);
                d.setHours(0, 0, 0, 0);
                setCheckOut(d);
              }
            }}
          />
        )}

        {nights > 0 && (
          <Text style={styles.nightsText}>
            {nights} {t("night")}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("guests")}</Text>
        <GuestStepper
          label={t("adults")}
          value={adults}
          min={1}
          onChange={setAdults}
        />
        <GuestStepper
          label={t("children")}
          value={children}
          min={0}
          onChange={setChildren}
        />
        <GuestStepper
          label={t("infants")}
          value={infants}
          min={0}
          onChange={setInfants}
        />
        {totalGuests > maxGuests && (
          <Text style={styles.errorText}>
            {t("guests")}: {maxGuests} {t("maxGuests")} {t("maxGuests")}
          </Text>
        )}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {price} {currency} × {Math.max(0, nights)} {t("night")}
          </Text>
          <Text style={styles.summaryValue}>{subtotal} {currency}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotal}>{t("total")}</Text>
          <Text style={styles.summaryTotalValue}>{subtotal} {currency}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.confirmButton, createBooking.isPending && styles.confirmButtonDisabled]}
        onPress={handleConfirm}
        disabled={createBooking.isPending}
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
  dateField: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    justifyContent: "center",
  },
  dateLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
  },
  datePlaceholder: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
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
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
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
