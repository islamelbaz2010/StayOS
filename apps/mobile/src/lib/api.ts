import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = "stayos_access_token";
const REFRESH_KEY = "stayos_refresh_token";

export async function getTokens() {
  const [access, refresh] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(REFRESH_KEY),
  ]);
  return { access, refresh };
}

export async function setTokens(access: string, refresh: string) {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, access),
    AsyncStorage.setItem(REFRESH_KEY, refresh),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_KEY),
  ]);
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const { access } = await getTokens();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refresh } = await getTokens();
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refresh,
          });
          await setTokens(data.access_token, data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          await clearTokens();
        }
      }
    }
    return Promise.reject(error);
  }
);
