import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Alert, Platform } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { apiErrorMessage } from "../lib/api";
import { useBookingQuote, useCreateBooking, useMe } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import type { RootStackParamList } from "../../App";
import { currencyLabel, formatMoney } from "../lib/money";

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

function getBookingErrorMessage(
  error: unknown,
  t: (key: string) => string,
  locale: string
): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return t("authRequired");
    if (status === 403) return apiErrorMessage(error, locale) ?? t("authRequired");
    if (status === 409) return apiErrorMessage(error, locale) ?? t("datesUnavailable");
    if (!error.response) return t("networkError");
    // Backend envelope carries a safe human-readable message (+ Arabic
    // variant) for every StayOSError/HTTPException — surface it.
    const backendMsg = apiErrorMessage(error, locale);
    if (backendMsg && status && status < 500) return backendMsg;
  }
  return t("error");
}

export function BookingScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<BookingRoute>();
  const { unitId, title, price, currency, maxGuests, instantBook, hostId } = route.params;
  const { data: user } = useMe();

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [message, setMessage] = useState("");

  const createBooking = useCreateBooking();

  const totalGuests = adults + children + infants;
  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000))
    : 0;

  const { data: quote, isLoading: isQuoteLoading, error: quoteError } = useBookingQuote(
    unitId,
    checkIn ? toISODate(checkIn) : "",
    checkOut ? toISODate(checkOut) : ""
  );

  const quoteTotal = quote ? formatMoney(quote.total_egp, currencyLabel(currency, t("egp"))) : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
      const booking = await createBooking.mutateAsync({
        unit_id: unitId,
        check_in: toISODate(checkIn),
        check_out: toISODate(checkOut),
        adults,
        children,
        infants,
        message: message.trim() || undefined,
      });
      // Matches web BookingPanel: instant book → straight to checkout;
      // request-to-book → "request sent" state and back to trips.
      if (instantBook) {
        navigation.replace("Payment", { bookingId: booking.id });
        return;
      }
      Alert.alert(t("bookingRequestSent"), t("bookingRequestSentHint"), [
        { text: "OK", onPress: () => navigation.navigate("Home", { screen: "TripsTab" }) },
      ]);
    } catch (error) {
      Alert.alert(t("bookingFailed"), getBookingErrorMessage(error, t, locale));
    }
  };

  const isKycVerified = user?.kyc_status === "verified";
  const isOwnListing = Boolean(user?.id && hostId && user.id === hostId);

  // Mirrors web BookingPanel: unauthenticated, unverified, and
  // own-listing states are surfaced before any booking attempt —
  // the backend enforces the same rules (KYC check inside
  // create_booking, auth via get_current_user).
  const gate = !user
    ? { title: t("loginToBook"), cta: t("login"), route: "Login" as const }
    : isOwnListing
      ? { title: t("cantBookOwnListing"), cta: null, route: null }
      : !isKycVerified
        ? { title: t("kycRequiredToBook"), cta: t("verifyNow"), route: "Kyc" as const }
        : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.pricePerNight}>{formatMoney(price, currencyLabel(currency, t("egp")))} / {t("perNight")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("selectDates")}</Text>
        <Pressable style={styles.dateField} onPress={() => setShowCheckIn(true)}>
          <Text style={styles.dateLabel}>{t("checkIn")}</Text>
          <Text style={checkIn ? styles.dateValue : styles.datePlaceholder}>
            {checkIn ? formatDate(checkIn, locale) : "YYYY-MM-DD"}
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

        <Pressable style={styles.dateField} onPress={() => setShowCheckOut(true)}>
          <Text style={styles.dateLabel}>{t("checkOut")}</Text>
          <Text style={checkOut ? styles.dateValue : styles.datePlaceholder}>
            {checkOut ? formatDate(checkOut, locale) : "YYYY-MM-DD"}
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
            {nights} {t("nightsCount")}
          </Text>
        )}
        {quoteError && (
          <Text style={styles.errorText}>
            {t("quoteError")}
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
            {t("maxGuests")}: {maxGuests}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("messageToHost")}</Text>
        <TextInput
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          placeholder={t("messageToHostPlaceholder")}
          multiline
          numberOfLines={3}
          maxLength={4000}
          textAlignVertical="top"
        />
        <Text style={styles.messageHint}>{t("messageToHostHint")}</Text>
      </View>

      {isQuoteLoading || quote ? (
      <View style={styles.summary}>
        {isQuoteLoading ? (
          <Text style={styles.summaryText}>{t("loading")}</Text>
        ) : quote ? (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>{t("accommodation")}</Text>
              <Text style={styles.summaryValue}>{formatMoney(quote.total_egp, currencyLabel(currency, t("egp")))}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>{t("total")}</Text>
              <Text style={styles.summaryTotalValue}>{formatMoney(quote.total_egp, currencyLabel(currency, t("egp")))}</Text>
            </View>
            <Text style={styles.summaryText}>{t("includesAllFees")}</Text>
          </>
        ) : null}
      </View>
      ) : null}

      <View style={styles.trustBox}>
        <Text style={styles.trustTitle}>{t("trustMessage")}</Text>
        <Text style={styles.trustSubtitle}>{t("trustMessageSubtitle")}</Text>
      </View>

      {gate ? (
        <View style={styles.gateBox}>
          <Text style={styles.gateText}>{gate.title}</Text>
          {gate.cta && gate.route && (
            <Pressable
              style={styles.gateButton}
              onPress={() => navigation.navigate(gate.route as never)}
            >
              <Text style={styles.gateButtonText}>{gate.cta}</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <Pressable
          style={[styles.confirmButton, createBooking.isPending && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={createBooking.isPending}
        >
          <Text style={styles.confirmButtonText}>
            {createBooking.isPending ? t("creatingBooking") : t("confirmBooking")}
          </Text>
        </Pressable>
      )}
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
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 80,
    backgroundColor: colors.white,
  },
  messageHint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
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
    color: colors.accentText,
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
    color: colors.accentText,
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
    color: colors.accentText,
    marginTop: spacing.sm,
  },
  trustBox: {
    backgroundColor: colors.primary50,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  trustTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.accentText,
    marginBottom: 4,
  },
  trustSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
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
    color: colors.onPrimary,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  gateBox: {
    backgroundColor: colors.primary50,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  gateText: {
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  gateButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  gateButtonText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
});
