import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Listing } from "./types";

const KEY = "stayos_recently_viewed";
const MAX_ITEMS = 10;

export async function addRecentlyViewed(listing: Listing): Promise<void> {
  try {
    const existing = await getRecentlyViewed();
    const next = [listing, ...existing.filter((l) => l.id !== listing.id)].slice(0, MAX_ITEMS);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Best-effort only; recently-viewed is a convenience feature.
  }
}

export async function getRecentlyViewed(): Promise<Listing[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
