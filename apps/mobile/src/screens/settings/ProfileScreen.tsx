import { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import {
  useConfirmAvatar,
  useMe,
  usePresignAvatar,
  useUpdateProfile,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, spacing } from "../../lib/theme";
import { Field, PrimaryButton, Section } from "../../components/UI";
import { LoadingSpinner } from "../../components/States";

const LANGUAGE_OPTIONS = [
  { code: "ar", en: "Arabic", ar: "العربية" },
  { code: "en", en: "English", ar: "English" },
  { code: "fr", en: "French", ar: "الفرنسية" },
];

export function ProfileScreen() {
  const { t } = useLocale();
  const { data: user, isLoading } = useMe();
  const updateProfile = useUpdateProfile();
  const presignAvatar = usePresignAvatar();
  const confirmAvatar = useConfirmAvatar();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name ?? "");
      setBio(user.bio ?? "");
      setLocation(user.location ?? "");
      setLanguages(user.languages ?? []);
    }
  }, [user]);

  if (isLoading || !user) return <LoadingSpinner />;

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim() || undefined,
        bio: bio.trim() || null,
        location: location.trim() || null,
        languages,
      });
      Alert.alert("", t("profileSaved"));
    } catch {
      Alert.alert("", t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const toggleLanguage = (code: string) => {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setAvatarBusy(true);
    try {
      const contentType = asset.mimeType ?? "image/jpeg";
      const presigned = await presignAvatar.mutateAsync({
        filename: asset.fileName ?? `avatar_${Date.now()}.jpg`,
        content_type: contentType,
      });
      const blob = await (await fetch(asset.uri)).blob();
      const res = await fetch(presigned.upload_url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blob,
      });
      if (!res.ok) throw new Error("upload failed");
      await confirmAvatar.mutateAsync({
        s3_key: presigned.s3_key,
      });
    } catch {
      Alert.alert("", t("avatarUploadFailed"));
    } finally {
      setAvatarBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section>
        <View style={styles.avatarRow}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.display_name?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <PrimaryButton
            secondary
            label={avatarBusy ? t("loading") : t("changePhoto")}
            onPress={pickAvatar}
            disabled={avatarBusy}
            style={styles.avatarBtn}
          />
        </View>
      </Section>

      <Section>
        <Field
          label={t("displayName")}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Field label={t("bio")} value={bio} onChangeText={setBio} multiline />
        <Field
          label={t("location")}
          value={location}
          onChangeText={setLocation}
        />
        <Text style={styles.groupLabel}>{t("languagesSpoken")}</Text>
        <View style={styles.chipRow}>
          {LANGUAGE_OPTIONS.map((lang) => {
            const active = languages.includes(lang.code);
            return (
              <Text
                key={lang.code}
                style={[styles.langChip, active && styles.langChipActive]}
                onPress={() => toggleLanguage(lang.code)}
              >
                {lang.en} / {lang.ar}
              </Text>
            );
          })}
        </View>
      </Section>

      <PrimaryButton
        label={saving ? t("loading") : t("save")}
        onPress={save}
        disabled={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { fontSize: fontSize.xxl, fontWeight: "700", color: colors.onPrimary },
  avatarBtn: { flex: 1, marginTop: 0 },
  groupLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  langChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.text,
    overflow: "hidden",
  },
  langChipActive: {
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    borderColor: colors.primary,
  },
});
