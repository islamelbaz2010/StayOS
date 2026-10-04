import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = "stayos_access_token";
const REFRESH_KEY = "stayos_refresh_token";

let _hasTokens = false;
const _tokenListeners = new Set<() => void>();

function _setHasTokens(value: boolean) {
  if (_hasTokens === value) return;
  _hasTokens = value;
  _tokenListeners.forEach((fn) => fn());
}

export function subscribeTokenChanges(listener: () => void): () => void {
  _tokenListeners.add(listener);
  return () => {
    _tokenListeners.delete(listener);
  };
}

export function hasTokens(): boolean {
  return _hasTokens;
}

export async function getTokens() {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  _setHasTokens(Boolean(access));
  return { access, refresh };
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setTokens(access: string, refresh: string) {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
  ]);
  _setHasTokens(true);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
  _setHasTokens(false);
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
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

/**
 * Extract the safe, human-readable message from the backend error
 * envelope `{error: {code, message, message_ar}}`. Falls back to the
 * axios `detail` field and then to null (caller supplies a generic key).
 * Never exposes stack traces — backend messages are already user-safe.
 */
export function apiErrorMessage(error: unknown, locale?: string): string | null {
  if (axios.isAxiosError(error)) {
    const env = error.response?.data?.error;
    if (env && typeof env === "object") {
      if (locale === "ar" && typeof env.message_ar === "string" && env.message_ar) {
        return env.message_ar;
      }
      if (typeof env.message === "string" && env.message) return env.message;
    }
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail) return detail;
  }
  return null;
}
