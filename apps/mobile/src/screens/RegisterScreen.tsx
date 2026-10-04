import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { api, setTokens } from "../lib/api";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { Field, PrimaryButton } from "../components/UI";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RegisterScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes("@")) {
      setError(t("enterValidEmail"));
      return;
    }
    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordsDoNotMatch"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/register", {
        email: trimmedEmail,
        password,
        display_name: displayName.trim() || null,
        locale,
      });
      await setTokens(data.access_token, data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      navigation.navigate("Home");
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.error?.message_ar ||
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail;
      setError(
        status === 409 || status === 400
          ? msg || t("accountExists")
          : msg || t("registrationFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t("createAccount")}</Text>
        <Field
          label={t("displayName")}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Field
          label={t("email")}
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
        />
        <Field
          label={t("password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Field
          label={t("confirmPassword")}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={loading ? t("loading") : t("register")}
          onPress={handleRegister}
          disabled={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingTop: spacing.xxl },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  error: { color: colors.error, fontSize: fontSize.sm, marginTop: spacing.sm },
});
