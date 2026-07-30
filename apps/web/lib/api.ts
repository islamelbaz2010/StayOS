import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { clearSession, getSession, setSession } from "@/lib/auth/storage";

const PUBLIC_PATHS = ["/auth/refresh", "/auth/firebase", "/auth/otp/send", "/auth/otp/verify"];

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window === "undefined") return config;
  if (PUBLIC_PATHS.some((path) => config.url?.startsWith(path))) return config;

  const session = getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

let isRefreshing = false;
const refreshSubscribers: Array<(token: string) => void> = [];

function subscribeRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers.length = 0;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (
      !original ||
      error.response?.status !== 401 ||
      original._retry ||
      PUBLIC_PATHS.some((path) => original.url?.startsWith(path))
    ) {
      return Promise.reject(error);
    }

    const session = getSession();
    if (!session?.refreshToken) {
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/ar/auth/login";
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeRefresh((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    original._retry = true;

    try {
      const { data } = await api.post<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
      }>("/auth/refresh", { refresh_token: session.refreshToken });

      const expiresAt = Date.now() + data.expires_in * 1000;
      setSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      });

      isRefreshing = false;
      onRefreshed(data.access_token);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return api(original);
    } catch (refreshError) {
      isRefreshing = false;
      refreshSubscribers.length = 0;
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/ar/auth/login";
      }
      return Promise.reject(refreshError);
    }
  }
);
