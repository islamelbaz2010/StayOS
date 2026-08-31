import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AkedlyTurnstileUnsupportedError, resolveOtpProof } from "../lib/akedlyShield";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type LoginRoute = RouteProp<RootStackParamList, "Login">;

export function LoginScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<LoginRoute>();
  const { login } = useAuth();
  const [phone_number, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const nextScreen = route.params?.nextScreen;
  const nextParams = route.params?.nextParams;

  const handleSendOtp = async () => {
    if (!phone_number || phone_number.length < 10) {
      Alert.alert(t("error"), t("enterPhone"));
      return;
    }
    setLoading(true);
    try {
      const proof = await resolveOtpProof();
      await api.post("/auth/otp/send", { phone_number, ...proof });
      setStep("otp");
    } catch (err: any) {
      if (err instanceof AkedlyTurnstileUnsupportedError) {
        Alert.alert(t("error"), err.message);
      } else if (!err.response) {
        Alert.alert(t("error"), t("networkError"));
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
      await login(data.access_token, data.refresh_token);
      if (nextScreen) {
        navigation.navigate(nextScreen as any, nextParams);
      } else {
        navigation.navigate("Home");
      }
    } catch (err: any) {
      if (!err.response) {
        Alert.alert(t("error"), t("networkError"));
      } else {
        const message = err?.response?.data?.error?.message_ar || err?.response?.data?.error?.message || t("error");
        Alert.alert(t("error"), message);
      }
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
          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t("loading") : t("sendOtp")}
            </Text>
          </Pressable>
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
          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t("loading") : t("verifyOtp")}
            </Text>
          </Pressable>
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
});
