import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";

function getSupportWhatsAppLink(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const message = encodeURIComponent("Hello StayOS support");
  return `https://wa.me/${cleaned}?text=${message}`;
}

export function SupportScreen() {
  const { t } = useLocale();
  const phone = (process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP_NUMBER || "").trim();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.title}>{t("supportTitle")}</Text>
        <Text style={styles.description}>{t("supportDescription")}</Text>

        {phone ? (
          <Pressable
            style={styles.button}
            onPress={() => Linking.openURL(getSupportWhatsAppLink(phone))}
          >
            <Text style={styles.buttonText}>{t("openWhatsApp")}</Text>
          </Pressable>
        ) : (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{t("supportNotConfigured")}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.white,
  },
  notice: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  noticeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
