import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AkedlyTurnstileUnsupportedError, resolveOtpProof } from "../lib/akedlyShield";
import { api, setTokens } from "../lib/api";
import { isQaLoginEnabled } from "../lib/qa";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { Field, PrimaryButton } from "../components/UI";
import { MakazohMark } from "../components/MakazohMark";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Method = "email" | "phone";

// Seeded acceptance fixtures (public, non-secret identifiers documented
// in docs/RELEASE_TECHNICAL_HANDOFF.md §7). /auth/dev-token only works on
// development/staging backends — it 404s in production.
const QA_ACCOUNTS = [
  { key: "guest", userId: "seed-accept-gues-0000-000000000001" },
  { key: "host", userId: "seed-host-0000-0000-000000000002" },
  { key: "staff", userId: "seed-staff-0000-0000-000000000001" },
  { key: "admin", userId: "seed-admin-0000-0000-000000000001" },
] as const;

function errorMessage(err: any, fallback: string): string {
  return (
    err?.response?.data?.error?.message_ar ||
    err?.response?.data?.error?.message ||
    err?.response?.data?.detail ||
    fallback
  );
}

export function LoginScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev-token login is development-only: it requires Metro dev mode
  // (__DEV__), so it can never ship in a release/EAS build even if the
  // EXPO_PUBLIC_* flags are present in the build environment.
  const devGuestId = process.env.EXPO_PUBLIC_DEV_GUEST_ID;
  const devLoginEnabled = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN === "1";
  // QA acceptance logins: visible only in dev or the dedicated QA EAS
  // profile (EXPO_PUBLIC_QA_MODE=1). /auth/dev-token itself 404s on
  // production backends, so these can never mint sessions against prod.
  const qaEnabled = isQaLoginEnabled();

  const finishLogin = async (accessToken: string, refreshToken: string) => {
    await setTokens(accessToken, refreshToken);
    queryClient.invalidateQueries({ queryKey: ["me"] });
    navigation.navigate("Home");
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      setError(t("enterEmailPassword"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      await finishLogin(data.access_token, data.refresh_token);
    } catch (err: any) {
      setError(
        err?.response?.status === 401 ? t("invalidCredentials") : errorMessage(err, t("error"))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError(t("enterPhone"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Solves Akedly's V1.2 Proof-of-Work challenge on-device via the official
      // @akedly/shield package before sending — the user never sees this step.
      const proof = await resolveOtpProof();
      await api.post("/auth/otp/send", { phone_number: phoneNumber, ...proof });
      setOtpSent(true);
    } catch (err: any) {
      setError(
        err instanceof AkedlyTurnstileUnsupportedError ? err.message : errorMessage(err, t("error"))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setError(t("enterOtp"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/otp/verify", {
        phone_number: phoneNumber,
        code: otp,
      });
      await finishLogin(data.access_token, data.refresh_token);
    } catch (err: any) {
      setError(errorMessage(err, t("error")));
    } finally {
      setLoading(false);
    }
  };

  const devTokenLogin = async (userId: string) => {
    setLoading(true);
    try {
      const { data } = await api.post<{ access_token: string; refresh_token: string }>(
        "/auth/dev-token",
        { user_id: userId }
      );
      await finishLogin(data.access_token, data.refresh_token);
    } catch (err: any) {
      setError(errorMessage(err, t("error")));
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    if (!devGuestId) return;
    await devTokenLogin(devGuestId);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <View style={styles.logoWrap}>
          <MakazohMark fontSize={34} />
          <Text style={styles.tagline}>{t("brandTagline")}</Text>
        </View>

        <View style={styles.methodTabs}>
          <Pressable
            style={[styles.methodTab, method === "email" && styles.methodTabActive]}
            onPress={() => {
              setMethod("email");
              setError(null);
            }}
          >
            <Text style={[styles.methodTabText, method === "email" && styles.methodTabTextActive]}>
              {t("loginWithEmail")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.methodTab, method === "phone" && styles.methodTabActive]}
            onPress={() => {
              setMethod("phone");
              setError(null);
            }}
          >
            <Text style={[styles.methodTabText, method === "phone" && styles.methodTabTextActive]}>
              {t("loginWithPhone")}
            </Text>
          </Pressable>
        </View>

        {method === "email" ? (
          <>
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
            <PrimaryButton
              label={loading ? t("loading") : t("login")}
              onPress={handleEmailLogin}
              disabled={loading}
            />
            <Pressable
              style={styles.linkWrap}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.link}>{t("forgotPassword")}</Text>
            </Pressable>
          </>
        ) : !otpSent ? (
          <>
            <Field
              label={t("phone")}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+20..."
              keyboardType="phone-pad"
            />
            <PrimaryButton
              label={loading ? t("loading") : t("sendOtp")}
              onPress={handleSendOtp}
              disabled={loading}
            />
          </>
        ) : (
          <>
            <Field
              label={t("enterOtp")}
              value={otp}
              onChangeText={setOtp}
              placeholder="------"
              keyboardType="numeric"
            />
            <PrimaryButton
              label={loading ? t("loading") : t("verifyOtp")}
              onPress={handleVerifyOtp}
              disabled={loading}
            />
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.linkWrap} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>{t("createAccount")}</Text>
        </Pressable>

        {devLoginEnabled && (
          <Pressable
            style={styles.devButton}
            onPress={handleDevLogin}
            disabled={loading}
          >
            <Text style={styles.devButtonText}>Dev Login (Seed Guest)</Text>
          </Pressable>
        )}

        {qaEnabled && (
          <View style={styles.qaBox}>
            <Text style={styles.qaTitle}>{t("qaLoginTitle")}</Text>
            <View style={styles.qaGrid}>
              {QA_ACCOUNTS.map((a) => (
                <Pressable
                  key={a.key}
                  style={styles.qaButton}
                  onPress={() => devTokenLogin(a.userId)}
                  disabled={loading}
                >
                  <Text style={styles.qaButtonText}>
                    {t(`qaLogin_${a.key}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: "center" },
  logoWrap: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  methodTabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  methodTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  methodTabActive: { backgroundColor: colors.white },
  methodTabText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textSecondary },
  methodTabTextActive: { color: colors.text },
  linkWrap: { alignItems: "center", marginTop: spacing.lg },
  link: { color: colors.accentText, fontSize: fontSize.sm, fontWeight: "600" },
  error: { color: colors.error, fontSize: fontSize.sm, marginTop: spacing.md, textAlign: "center" },
  devButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  devButtonText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: "600" },
  qaBox: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  qaTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  qaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  qaButton: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  qaButtonText: { color: colors.accentText, fontSize: fontSize.sm, fontWeight: "600" },
});
