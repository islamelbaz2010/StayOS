import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { LocaleProvider, useLocale } from "./src/lib/LocaleContext";
import { AuthProvider, useAuth } from "./src/lib/AuthContext";
import { colors } from "./src/lib/theme";
import { LoadingSpinner } from "./src/components/States";

import { HomeScreen } from "./src/screens/HomeScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { ListingDetailScreen } from "./src/screens/ListingDetailScreen";
import { FavoritesScreen } from "./src/screens/FavoritesScreen";
import { TripsScreen } from "./src/screens/TripsScreen";
import { AccountScreen } from "./src/screens/AccountScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { BookingScreen } from "./src/screens/BookingScreen";

export type RootStackParamList = {
  Home: undefined;
  Search: { city?: string } | undefined;
  ListingDetail: { unitId: string };
  Booking: { unitId: string; title: string; price: number; currency: string; maxGuests: number };
  Login: { nextScreen?: keyof RootStackParamList; nextParams?: any } | undefined;
  Favorites: undefined;
  Trips: undefined;
  Account: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function getTabIconName(routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case "HomeTab":
      return focused ? "home" : "home-outline";
    case "SearchTab":
      return focused ? "search" : "search-outline";
    case "FavoritesTab":
      return focused ? "heart" : "heart-outline";
    case "TripsTab":
      return focused ? "airplane" : "airplane-outline";
    case "AccountTab":
      return focused ? "person" : "person-outline";
    default:
      return "help-circle-outline";
  }
}

function HomeTabs() {
  const { t } = useLocale();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getTabIconName(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: t("home") }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ tabBarLabel: t("search") }} />
      <Tab.Screen name="FavoritesTab" component={FavoritesScreen} options={{ tabBarLabel: t("favorites") }} />
      <Tab.Screen name="TripsTab" component={TripsScreen} options={{ tabBarLabel: t("trips") }} />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ tabBarLabel: t("account") }} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isRTL } = useLocale();
  const { isHydrated } = useAuth();

  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  if (isRTL && !I18nManager.isRTL) {
    I18nManager.forceRTL(true);
  } else if (!isRTL && I18nManager.isRTL) {
    I18nManager.forceRTL(false);
  }

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.white,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: "Search" }}
        />
        <Stack.Screen
          name="ListingDetail"
          component={ListingDetailScreen}
          options={{ title: "" }}
        />
        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          options={{ title: "Booking" }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Login" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <LocaleProvider>
          <AuthProvider>
            <AppContent />
            <StatusBar style="auto" />
          </AuthProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
