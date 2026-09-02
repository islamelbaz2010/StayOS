import { ScrollView, StyleSheet, View } from "react-native";
import type { Listing } from "../lib/types";
import { spacing } from "../lib/theme";
import { ListingCard } from "./ListingCard";

const CARD_WIDTH = 260;

interface ListingRailProps {
  listings: Listing[];
  onPress: (id: string) => void;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
}

export function ListingRail({ listings, onPress, isFavorite, onToggleFavorite }: ListingRailProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {listings.map((listing) => (
        <View key={listing.id} style={styles.cardWrapper}>
          <ListingCard
            listing={listing}
            onPress={onPress}
            isFavorite={isFavorite?.(listing.id)}
            onToggleFavorite={onToggleFavorite}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: {
    paddingRight: spacing.xl,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: spacing.md,
  },
});
