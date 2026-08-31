import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFavorites, useToggleFavorite } from "../lib/hooks";
import { useAuth } from "../lib/AuthContext";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { ListingCard } from "../components/ListingCard";
import { LoadingSpinner, EmptyView } from "../components/States";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function FavoritesScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useFavorites();
  const toggleFav = useToggleFavorite();

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <EmptyView title={t("loginRequired")} subtitle={t("loginToViewFavorites")} />
        <Pressable
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginButtonText}>{t("login")}</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) return <LoadingSpinner />;

  const listings = data?.data || [];

  if (listings.length === 0) {
    return <EmptyView title={t("noFavorites")} subtitle={t("addFavorites")} />;
  }

  return (
    <FlatList
      data={listings}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <ListingCard
          listing={item}
          onPress={(id: string) => navigation.navigate("ListingDetail", { unitId: id })}
          isFavorite={true}
          onToggleFavorite={(id: string) => toggleFav.mutate(id)}
        />
      )}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
  },
  list: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: "center",
    alignSelf: "center",
    marginTop: spacing.lg,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
});
