import { useState } from "react";
import { TouchableOpacity, StyleSheet, Text, TextInput, View, Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AkedlyTurnstileUnsupportedError, resolveOtpProof } from "../lib/akedlyShield";
import { api, setTokens } from "../lib/api";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LoginScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [phone_number, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone_number || phone_number.length < 10) {
      Alert.alert(t("error"), t("enterPhone"));
      return;
    }
    setLoading(true);
    try {
      // Solves Akedly's V1.2 Proof-of-Work challenge on-device via the official
      // @akedly/shield package before sending — the user never sees this step.
      const proof = await resolveOtpProof();
      await api.post("/auth/otp/send", { phone_number, ...proof });
      setStep("otp");
    } catch (err: any) {
      if (err instanceof AkedlyTurnstileUnsupportedError) {
        Alert.alert(t("error"), err.message);
      } else {
        const message = err?.response?.data?.error?.message_ar || err?.response?.data?.error?.message || t("error");
        Alert.alert(t("error"), message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert(t("error"), t("enterOtp"));
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/otp/verify", { phone_number, code: otp });
      await setTokens(data.access_token, data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      navigation.navigate("Home");
    } catch (err: any) {
      const message = err?.response?.data?.error?.message_ar || err?.response?.data?.error?.message || t("error");
      Alert.alert(t("error"), message);
    } finally {
      setLoading(false);
    }
  };

  const devGuestId = process.env.EXPO_PUBLIC_DEV_GUEST_ID;
  const devLoginEnabled = process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN === "1";

  const handleDevLogin = async () => {
    if (!devGuestId) {
      Alert.alert(t("error"), "Dev guest ID not configured");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{
        access_token: string;
        refresh_token: string;
      }>("/auth/dev-token", { user_id: devGuestId });
      await setTokens(data.access_token, data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      navigation.navigate("Home");
    } catch (err: any) {
      const message = err?.response?.data?.error?.message_ar || err?.response?.data?.error?.message || t("error");
      Alert.alert(t("error"), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>{t("appName")}</Text>

      {step === "phone" ? (
        <>
          <Text style={styles.label}>{t("phone")}</Text>
          <TextInput
            style={styles.input}
            placeholder="+20..."
            value={phone_number}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t("loading") : t("sendOtp")}
            </Text>
          </TouchableOpacity>
          {devLoginEnabled && (
            <TouchableOpacity
              style={[styles.devButton, loading && styles.buttonDisabled]}
              onPress={handleDevLogin}
              disabled={loading}
            >
              <Text style={styles.devButtonText}>Dev Login (Seed Guest)</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <Text style={styles.label}>{t("enterOtp")}</Text>
          <TextInput
            style={styles.input}
            placeholder="------"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t("loading") : t("verifyOtp")}
            </Text>
          </TouchableOpacity>
          {devLoginEnabled && (
            <TouchableOpacity
              style={[styles.devButton, loading && styles.buttonDisabled]}
              onPress={handleDevLogin}
              disabled={loading}
            >
              <Text style={styles.devButtonText}>Dev Login (Seed Guest)</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: "center",
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.xxl,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  devButton: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  devButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
