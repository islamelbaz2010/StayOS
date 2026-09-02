import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import {
  useHostOwnProfile,
  useUpdateHostProfile,
  useHostEarnings,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { api, clearTokens, getRefreshToken } from "../../lib/api";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HostProfileScreen() {
  const { locale, setLocale, t } = useLocale();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError, refetch } = useHostOwnProfile();
  const { data: earnings } = useHostEarnings();
  const updateProfile = useUpdateHostProfile();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={t("error")} onRetry={refetch} />;
  if (!profile) return <LoadingSpinner />;

  const startEdit = () => {
    setDisplayName(profile.display_name || "");
    setEmail(profile.email || "");
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName || undefined,
        email: email || undefined,
      });
      setEditing(false);
      Alert.alert("", t("hostProfileSaved"));
    } catch {
      Alert.alert("", t("hostProfileSaveError"));
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await api.post("/auth/logout", { refresh_token: refreshToken }).catch(() => {});
      }
    } finally {
      await clearTokens();
      queryClient.removeQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["host"] });
      navigation.navigate("Home");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.display_name?.charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
        {editing ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t("hostProfileDisplayName")}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t("hostProfileEmail")}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.editActions}>
              <Pressable style={styles.saveButton} onPress={saveEdit}>
                <Text style={styles.saveButtonText}>{t("hostProfileSave")}</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={() => setEditing(false)}>
                <Text style={styles.cancelButtonText}>{t("back")}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.displayName}>{profile.display_name || "—"}</Text>
            <Text style={styles.phone}>{profile.phone_number || "—"}</Text>
            {profile.kyc_status === "verified" && (
              <Text style={styles.verifiedBadge}>✓ {t("verified")}</Text>
            )}
            <Pressable style={styles.editButton} onPress={startEdit}>
              <Text style={styles.editButtonText}>{t("hostProfileDisplayName")}</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("hostProfileTitle")}</Text>
        <StatRow label={t("hostProfileListings")} value={`${profile.total_listings} (${profile.listed_listings} ${t("listingsListed").replace("{count} ", "")})`} />
        <StatRow label={t("hostProfileCoHostUnits")} value={String(profile.co_host_units)} />
        <StatRow label={t("hostProfileKyc")} value={profile.kyc_status} />
      </View>

      {earnings && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("hostEarnings")}</Text>
          <StatRow label={t("earningsTotalRevenue")} value={`${earnings.total_revenue_egp} ${t("egp")}`} />
          <StatRow label={t("earningsNetEarnings")} value={`${earnings.net_earnings_egp} ${t("egp")}`} />
          <StatRow label={t("earningsTotalBookings")} value={String(earnings.total_bookings)} />
          <StatRow label={t("earningsCompletedStays")} value={String(earnings.completed_stays)} />
          <Pressable
            style={styles.linkButton}
            onPress={() => navigation.navigate("HostEarnings")}
          >
            <Text style={styles.linkText}>{t("hostEarnings")} →</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("language")}</Text>
        <View style={styles.langRow}>
          <Pressable
            style={[styles.langButton, locale === "en" && styles.langButtonActive]}
            onPress={() => setLocale("en")}
          >
            <Text style={[styles.langText, locale === "en" && styles.langTextActive]}>
              {t("english")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.langButton, locale === "ar" && styles.langButtonActive]}
            onPress={() => setLocale("ar")}
          >
            <Text style={[styles.langText, locale === "ar" && styles.langTextActive]}>
              {t("arabic")}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t("logout")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    color: colors.white,
  },
  displayName: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  phone: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  verifiedBadge: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: "600",
  },
  editButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },
  editForm: {
    width: "100%",
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  editActions: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
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
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
  },
  linkButton: {
    marginTop: spacing.sm,
  },
  linkText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: "600",
  },
  langRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  langButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  langText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  langTextActive: {
    color: colors.white,
  },
  logoutButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.error,
  },
});
