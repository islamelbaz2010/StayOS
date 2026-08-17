import { FlatList, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFavorites, useToggleFavorite } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, spacing } from "../lib/theme";
import { ListingCard } from "../components/ListingCard";
import { LoadingSpinner, EmptyView } from "../components/States";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function FavoritesScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data, isLoading } = useFavorites();
  const toggleFav = useToggleFavorite();

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
  list: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
});
