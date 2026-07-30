"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "@/lib/api";

import { firebaseAuth, isFirebaseConfigured } from "./firebase";
import { clearSession, getSession, setSession } from "./storage";
import type { TokenPair, User } from "./types";

import type { ConfirmationResult } from "firebase/auth";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isHost: boolean;
  isFirebaseConfigured: boolean;
  login: (tokens: TokenPair) => Promise<void>;
  logout: () => Promise<void>;
  sendOtp: (phone: string, buttonId: string) => Promise<ConfirmationResult>;
  confirmOtp: (confirmation: ConfirmationResult, code: string) => Promise<TokenPair>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSession = useCallback(async () => {
    const session = getSession();
    if (!session) {
      setIsLoading(false);
      return;
    }
    await fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = useCallback(
    async (tokens: TokenPair) => {
      const expiresAt = Date.now() + tokens.expires_in * 1000;
      setSession({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      });
      await fetchMe();
    },
    [fetchMe]
  );

  const logout = useCallback(async () => {
    const session = getSession();
    if (session?.refreshToken) {
      try {
        await api.post("/auth/logout", { refresh_token: session.refreshToken });
      } catch {
        // Ignore logout errors; clear local session regardless.
      }
    }
    clearSession();
    setUser(null);
    setIsLoading(false);
  }, []);

  const sendOtp = useCallback(async (phone: string, buttonId: string) => {
    if (!firebaseAuth) {
      throw new Error("Firebase authentication is not configured");
    }
    const container = document.getElementById(buttonId);
    if (!container) {
      throw new Error("Recaptcha container not found");
    }
    const verifier = new RecaptchaVerifier(firebaseAuth, container, {
      size: "invisible",
    });
    return signInWithPhoneNumber(firebaseAuth, phone, verifier);
  }, []);

  const confirmOtp = useCallback(
    async (confirmation: ConfirmationResult, code: string) => {
      const credential = await confirmation.confirm(code);
      const idToken = await credential.user.getIdToken();
      const { data } = await api.post<TokenPair>("/auth/firebase", {
        id_token: idToken,
      });
      await login(data);
      return data;
    },
    [login]
  );

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isLoading,
      isAuthenticated: user !== null,
      isGuest: user?.role === "guest",
      isHost: user?.role === "host",
      isFirebaseConfigured,
      login,
      logout,
      sendOtp,
      confirmOtp,
    };
  }, [user, isLoading, login, logout, sendOtp, confirmOtp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
