const ACCESS_TOKEN_KEY = "stayos_access_token";
const REFRESH_TOKEN_KEY = "stayos_refresh_token";
const EXPIRES_AT_KEY = "stayos_expires_at";

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function getSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  const expiresAt = window.localStorage.getItem(EXPIRES_AT_KEY);
  if (!accessToken || !refreshToken || !expiresAt) return null;
  return { accessToken, refreshToken, expiresAt: Number(expiresAt) };
}

export function setSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  window.localStorage.setItem(EXPIRES_AT_KEY, String(session.expiresAt));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(EXPIRES_AT_KEY);
}
