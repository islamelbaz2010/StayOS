import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useMe } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import {
  articlesForRoles,
  articlesInCategory,
  categoriesForRoles,
  rolesForUser,
  searchArticles,
  type HelpRole,
} from "../lib/help/catalog";
import { GUEST_ARTICLES } from "../lib/help/articles-guest";
import { HOST_ARTICLES } from "../lib/help/articles-host";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ALL_ARTICLES = [...GUEST_ARTICLES, ...HOST_ARTICLES];

export function HelpCenterScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data: user } = useMe();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const roles: HelpRole[] = useMemo(() => rolesForUser(user?.role), [user?.role]);
  const categories = useMemo(() => categoriesForRoles(roles), [roles]);

  const articles = useMemo(() => {
    if (query.trim()) return searchArticles(ALL_ARTICLES, roles, query.trim(), locale);
    if (category) return articlesInCategory(ALL_ARTICLES, category, roles);
    return articlesForRoles(ALL_ARTICLES, roles);
  }, [query, category, roles, locale]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder={t("searchHelp")}
        placeholderTextColor={colors.textTertiary}
        value={query}
        onChangeText={setQuery}
      />
      {!query && (
        <View style={styles.catWrap}>
          {categories.map((c) => (
            <Pressable
              key={c.key}
              style={[styles.cat, category === c.key && styles.catActive]}
              onPress={() => setCategory(category === c.key ? null : c.key)}
            >
              <Text style={[styles.catText, category === c.key && styles.catTextActive]}>
                {c.title[locale]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <FlatList
        data={articles}
        keyExtractor={(a) => a.slug}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("HelpArticle", { slug: item.slug })}
          >
            <Text style={styles.cardTitle}>{item.title[locale]}</Text>
            <Text style={styles.cardSummary}>{item.summary[locale]}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t("noResults")}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  search: {
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
  },
  catWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  cat: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  catActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: fontSize.sm, color: colors.text, fontWeight: "600" },
  catTextActive: { color: colors.onPrimary },
  list: { padding: spacing.md, paddingTop: 0 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  cardSummary: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 19,
  },
  empty: {
    textAlign: "center",
    color: colors.textTertiary,
    marginTop: spacing.xxl,
  },
});
