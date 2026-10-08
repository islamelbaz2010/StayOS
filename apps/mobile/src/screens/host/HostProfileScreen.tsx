import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import {
  useHostOwnProfile,
  useUpdateHostProfile,
  useHostEarnings,
  useHasTokens,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { api, clearTokens, getRefreshToken } from "../../lib/api";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { formatMoney } from "../../lib/money";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function MenuCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { isRTL } = useLocale();
  return (
    <Pressable
      style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.menuCardIcon}>
        <Ionicons name={icon} size={20} color={colors.accentText} />
      </View>
      <View style={styles.menuCardText}>
        <Text style={styles.menuCardTitle}>{title}</Text>
        <Text style={styles.menuCardSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Ionicons
        name={isRTL ? "chevron-back" : "chevron-forward"}
        size={18}
        color={colors.textTertiary}
      />
    </Pressable>
  );
}

const KYC_STATUS_LABELS: Record<string, string> = {
  verified: "verified",
  pending: "kycStatusPending",
  rejected: "kycStatusRejected",
  unverified: "kycStatusUnverified",
};

export function HostProfileScreen() {
  const { locale, setLocale, t } = useLocale();
  const arrow = locale === "ar" ? "←" : "→";
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError, refetch } = useHostOwnProfile();
  const { data: earnings } = useHostEarnings();
  const updateProfile = useUpdateHostProfile();
  const insets = useSafeAreaInsets();
  const authed = useHasTokens();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  if (!authed) return <LoadingSpinner />;
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

  const handleLogout = () => {
    getRefreshToken()
      .then((refreshToken) => {
        if (refreshToken) {
          api.post("/auth/logout", { refresh_token: refreshToken }).catch(() => {});
        }
      })
      .catch(() => {});
    clearTokens().catch(() => {});
    queryClient.removeQueries({ queryKey: ["me"] });
    queryClient.removeQueries({ queryKey: ["host"] });
    navigation.navigate("Home");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
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
        <StatRow label={t("hostProfileKyc")} value={KYC_STATUS_LABELS[profile.kyc_status ?? "unverified"] ? t(KYC_STATUS_LABELS[profile.kyc_status ?? "unverified"]) : (profile.kyc_status ?? "—")} />
        {profile.kyc_status !== "verified" && (
          <Pressable
            style={styles.linkButton}
            onPress={() => navigation.navigate("Kyc")}
          >
            <Text style={styles.linkText}>{t("verifyIdentity")} {arrow}</Text>
          </Pressable>
        )}
      </View>

      {earnings && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("hostEarnings")}</Text>
          <StatRow label={t("earningsTotalRevenue")} value={formatMoney(earnings.total_revenue_egp, t("egp"))} />
          <StatRow label={t("earningsNetEarnings")} value={formatMoney(earnings.net_earnings_egp, t("egp"))} />
          <StatRow label={t("earningsTotalBookings")} value={String(earnings.total_bookings)} />
          <StatRow label={t("earningsCompletedStays")} value={String(earnings.completed_stays)} />
          <Pressable
            style={styles.linkButton}
            onPress={() => navigation.navigate("HostEarnings")}
          >
            <Text style={styles.linkText}>{t("hostEarnings")} {arrow}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <MenuCard
          icon="business-outline"
          title={t("hosting")}
          subtitle={t("menuHostingDesc")}
          onPress={() =>
            navigation.navigate("MenuGroup", {
              title: t("hosting"),
              items: [
                { key: "today", label: t("hostToday"), route: "Home", params: { screen: "HostTodayTab" }, icon: "today-outline" },
                { key: "listings", label: t("hostListings"), route: "Home", params: { screen: "HostListingsTab" }, icon: "business-outline" },
                { key: "newListing", label: t("hostNewListing"), route: "HostCreateListing", icon: "add-circle-outline" },
                { key: "calendar", label: t("hostCalendar"), route: "Home", params: { screen: "HostCalendarTab" }, icon: "calendar-outline" },
                { key: "bookings", label: t("hostBookings"), route: "HostBookings", icon: "clipboard-outline" },
                { key: "payments", label: t("hostPayments"), route: "HostPayments", icon: "card-outline" },
                { key: "earnings", label: t("hostEarnings"), route: "HostEarnings", icon: "stats-chart-outline" },
              ],
            })
          }
        />
        <MenuCard
          icon="airplane-outline"
          title={t("travelerSection")}
          subtitle={t("menuTravelerDesc")}
          onPress={() =>
            navigation.navigate("MenuGroup", {
              title: t("travelerSection"),
              items: [
                { key: "trips", label: t("trips"), route: "Trips", icon: "airplane-outline" },
                { key: "favorites", label: t("favorites"), route: "Favorites", icon: "heart-outline" },
              ],
            })
          }
        />
        <MenuCard
          icon="person-outline"
          title={t("account")}
          subtitle={t("menuAccountDesc")}
          onPress={() =>
            navigation.navigate("MenuGroup", {
              title: t("account"),
              items: [
                { key: "notifications", label: t("notifications"), route: "Notifications", icon: "notifications-outline" },
                { key: "editProfile", label: t("editProfile"), route: "ProfileSettings", icon: "create-outline" },
                { key: "personalInfo", label: t("personalInfo"), route: "PersonalData", icon: "id-card-outline" },
                { key: "loginSecurity", label: t("loginSecurity"), route: "SecuritySettings", icon: "lock-closed-outline" },
                { key: "privacy", label: t("privacyNotifications"), route: "PrivacySettings", icon: "shield-checkmark-outline" },
              ],
            })
          }
        />
        <MenuCard
          icon="help-circle-outline"
          title={t("helpSupport")}
          subtitle={t("menuSupportDesc")}
          onPress={() =>
            navigation.navigate("MenuGroup", {
              title: t("helpSupport"),
              items: [
                { key: "help", label: t("helpCenter"), route: "HelpCenter", icon: "help-circle-outline" },
                { key: "support", label: t("contactSupport"), route: "Support", icon: "chatbubble-outline" },
              ],
            })
          }
        />
      </View>

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
    color: colors.onPrimary,
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
    color: colors.accentText,
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
    color: colors.onPrimary,
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
    color: colors.accentText,
    fontWeight: "600",
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  menuCardPressed: {
    backgroundColor: colors.surface,
  },
  menuCardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
  menuCardText: { flex: 1 },
  menuCardTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  menuCardSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
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
