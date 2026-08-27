import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";

import { authAPI, type VerifyOtpPayload } from "@/services/authAPI";
import type { User, UserRole } from "@/types/user";

const TOKEN_KEY = "townx_token";
const USER_KEY = "townx_user";

/** Where each role lands right after login/signup (KYC must be verified first). */
export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  buyer: "/home",
  owner: "/owner/dashboard",
  admin: "/admin/dashboard",
};

export const KYC_ROUTE = "/kyc";

const NON_APP_RETURN_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/about",
  "/terms",
  "/privacy",
  "/faqs",
  KYC_ROUTE,
  "/kyc/callback",
]);

export function getPostAuthRoute(user: User, from?: string): string {
  if (user.kyc_status !== "verified") return KYC_ROUTE;
  const trimmed = from?.trim();
  if (trimmed && !NON_APP_RETURN_PATHS.has(trimmed)) {
    return trimmed;
  }
  return ROLE_HOME_ROUTE[user.role];
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    authAPI
      .me()
      .then((freshUser) => {
        if (cancelled) return;
        setUser(freshUser);
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persistSession = (accessToken: string, nextUser: User) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const verifyOtp = async (payload: VerifyOtpPayload) => {
    const result = await authAPI.verifyOtp(payload);
    persistSession(result.access_token, result.user);
    return result.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      return null;
    }
    const freshUser = await authAPI.me();
    localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
    setUser(freshUser);
    return freshUser;
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isLoading, verifyOtp, logout, refreshUser }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
