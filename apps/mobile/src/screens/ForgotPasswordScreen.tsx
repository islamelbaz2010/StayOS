import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { api } from "../lib/api";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, spacing } from "../lib/theme";
import { Field, PrimaryButton } from "../components/UI";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ForgotPasswordScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const requestReset = async () => {
    if (!identifier.trim()) {
      setError(t("enterEmailOrPhone"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/password/forgot", { identifier: identifier.trim() });
      setSent(true);
      setStep("reset");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || t("error"));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!code.trim() || newPassword.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/password/reset", {
        identifier: identifier.trim(),
        code: code.trim(),
        new_password: newPassword,
      });
      navigation.navigate("Login");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {step === "request" ? (
        <View>
          <Text style={styles.title}>{t("forgotPassword")}</Text>
          <Text style={styles.hint}>{t("forgotPasswordHint")}</Text>
          <Field
            label={t("emailOrPhone")}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="name@example.com"
          />
          <PrimaryButton
            label={loading ? t("loading") : t("sendResetCode")}
            onPress={requestReset}
            disabled={loading}
          />
        </View>
      ) : (
        <View>
          <Text style={styles.title}>{t("resetPassword")}</Text>
          {sent ? <Text style={styles.hint}>{t("resetCodeSent")}</Text> : null}
          <Field
            label={t("resetCode")}
            value={code}
            onChangeText={setCode}
            placeholder="------"
            keyboardType="numeric"
          />
          <Field
            label={t("newPassword")}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <PrimaryButton
            label={loading ? t("loading") : t("resetPassword")}
            onPress={resetPassword}
            disabled={loading}
          />
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingTop: spacing.xxl },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  error: { color: colors.error, fontSize: fontSize.sm, marginTop: spacing.md },
});
