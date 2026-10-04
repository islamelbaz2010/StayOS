import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { GUEST_ARTICLES } from "../lib/help/articles-guest";
import { HOST_ARTICLES } from "../lib/help/articles-host";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type HelpRoute = RouteProp<RootStackParamList, "HelpArticle">;

const ALL_ARTICLES = [...GUEST_ARTICLES, ...HOST_ARTICLES];

export function HelpArticleScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<HelpRoute>();
  const article = ALL_ARTICLES.find((a) => a.slug === route.params.slug);

  if (!article) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>{t("error")}</Text>
      </View>
    );
  }

  const related = (article.related ?? [])
    .map((slug) => ALL_ARTICLES.find((a) => a.slug === slug))
    .filter((a): a is NonNullable<typeof a> => !!a);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{article.title[locale]}</Text>
      <Text style={styles.summary}>{article.summary[locale]}</Text>
      {article.body[locale].map((para, i) => (
        <Text key={i} style={styles.para}>
          {para}
        </Text>
      ))}

      {article.escalate ? (
        <Pressable
          style={styles.supportBox}
          onPress={() => navigation.navigate("Support")}
        >
          <Text style={styles.supportText}>{t("contactSupport")} →</Text>
        </Pressable>
      ) : null}

      {related.length > 0 && (
        <View style={styles.related}>
          <Text style={styles.relatedTitle}>{t("relatedArticles")}</Text>
          {related.map((r) => (
            <Pressable
              key={r.slug}
              style={styles.relatedRow}
              onPress={() => navigation.push("HelpArticle", { slug: r.slug })}
            >
              <Text style={styles.relatedText}>{r.title[locale]} ›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  missing: { color: colors.error },
  title: { fontSize: fontSize.xxl, fontWeight: "700", color: colors.text },
  summary: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  para: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  supportBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  supportText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.md },
  related: { marginTop: spacing.lg },
  relatedTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  relatedRow: { paddingVertical: spacing.sm },
  relatedText: { color: colors.primary, fontSize: fontSize.md, fontWeight: "600" },
});
