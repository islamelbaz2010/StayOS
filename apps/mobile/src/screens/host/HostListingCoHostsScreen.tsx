import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useCoHosts,
  useHostListingDetail,
  useInviteCoHost,
  useRemoveCoHost,
  useUpdateCoHost,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../../components/States";
import type { CoHost } from "../../lib/types";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type CoHostsRoute = RouteProp<RootStackParamList, "HostListingCoHosts">;

const SCOPES = [
  { value: "full_access", labelKey: "listingsPermissionFull" },
  { value: "calendar_messaging", labelKey: "listingsPermissionCalendarMessaging" },
  { value: "calendar_only", labelKey: "listingsPermissionCalendar" },
];

export function HostListingCoHostsScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<CoHostsRoute>();
  const unitId = route.params.unitId;
  const { data: listing, isLoading: listingLoading } = useHostListingDetail(unitId);
  const { data: coHosts, isLoading: cohostsLoading, isError, refetch } = useCoHosts(unitId);
  const inviteMut = useInviteCoHost();
  const updateMut = useUpdateCoHost();
  const removeMut = useRemoveCoHost();

  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState("");
  const [scope, setScope] = useState("calendar_only");

  if (listingLoading || cohostsLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={t("error")} onRetry={refetch} />;
  if (!listing) return <ErrorView message={t("error")} />;

  const isOwner = listing.permission_scope === "owner" ||
    listing.permission_scope === "admin";

  const handleInvite = async () => {
    if (!userId.trim()) return;
    try {
      await inviteMut.mutateAsync({
        unitId,
        coHostUserId: userId.trim(),
        permissionScope: scope,
      });
      setShowForm(false);
      setUserId("");
      setScope("calendar_only");
    } catch {
      Alert.alert(t("listingSaveError"));
    }
  };

  const handleRemove = (coHostId: string) => {
    Alert.alert(t("listingConfirm"), t("listingsRemoveCoHost"), [
      { text: t("listingCancel"), style: "cancel" },
      {
        text: t("listingConfirm"),
        style: "destructive",
        onPress: async () => {
          try {
            await removeMut.mutateAsync({ unitId, coHostId });
          } catch {
            Alert.alert(t("listingSaveError"));
          }
        },
      },
    ]);
  };

  const handleToggleActive = (coHostId: string, currentActive: boolean) => {
    updateMut.mutate({ unitId, coHostId, isActive: !currentActive });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("listingsCoHosts")}</Text>
        <Text style={styles.subtitle}>
          {(coHosts || []).length} {t("listingsCoHosts").toLowerCase()}
        </Text>
      </View>

      {isOwner && (
        <Pressable
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.addButtonText}>
            {showForm ? t("listingCancel") : `+ ${t("listingsAddCoHost")}`}
          </Text>
        </Pressable>
      )}

      {showForm && isOwner && (
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>{t("listingsCoHostUserId")}</Text>
          <TextInput
            style={styles.input}
            value={userId}
            onChangeText={setUserId}
            placeholder="user-uuid"
          />

          <Text style={styles.formLabel}>{t("listingsCoHostPermission")}</Text>
          <View style={styles.chipRow}>
            {SCOPES.map((s) => (
              <Pressable
                key={s.value}
                style={[styles.chip, scope === s.value && styles.chipSelected]}
                onPress={() => setScope(s.value)}
              >
                <Text style={[styles.chipText, scope === s.value && styles.chipTextSelected]}>
                  {t(s.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.saveButton, inviteMut.isPending && styles.saveButtonDisabled]}
            disabled={inviteMut.isPending}
            onPress={handleInvite}
          >
            <Text style={styles.saveButtonText}>
              {inviteMut.isPending ? t("listingSaving") : t("listingsInviteCoHost")}
            </Text>
          </Pressable>
          {inviteMut.isError && (
            <Text style={styles.errorText}>{t("listingSaveError")}</Text>
          )}
        </View>
      )}

      {(!coHosts || coHosts.length === 0) ? (
        <EmptyView title={t("listingsNoCoHosts")} />
      ) : (
        <View style={styles.list}>
          {coHosts.map((ch: CoHost) => (
            <View key={ch.id} style={styles.coHostCard}>
              <View style={styles.coHostInfo}>
                <Text style={styles.coHostName}>
                  {ch.co_host_display_name || ch.co_host_user_id}
                </Text>
                {ch.co_host_phone && (
                  <Text style={styles.coHostPhone}>{ch.co_host_phone}</Text>
                )}
                <Text style={styles.coHostScope}>
                  {t(`listingsPermission${ch.permission_scope.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`) || ch.permission_scope}
                </Text>
              </View>

              {isOwner && (
                <View style={styles.coHostActions}>
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>
                      {ch.is_active ? t("listingsActivateCoHost") : t("listingsDeactivateCoHost")}
                    </Text>
                    <Switch
                      value={ch.is_active}
                      onValueChange={() => handleToggleActive(ch.id, ch.is_active)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => handleRemove(ch.id)}
                  >
                    <Text style={styles.removeButtonText}>{t("listingsRemoveCoHost")}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  addButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  formCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  coHostCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coHostInfo: {
    marginBottom: spacing.sm,
  },
  coHostName: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  coHostPhone: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  coHostScope: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  coHostActions: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  toggleLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  removeButton: {
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  removeButtonText: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: "600",
  },
});
