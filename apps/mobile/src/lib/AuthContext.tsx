import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getTokens, setTokens, clearTokens } from "./api";

interface AuthContextValue {
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    getTokens().then(({ access }) => {
      setIsAuthenticated(Boolean(access));
      setIsHydrated(true);
    });
  }, []);

  const login = async (access: string, refresh: string) => {
    await setTokens(access, refresh);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await clearTokens();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isHydrated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
