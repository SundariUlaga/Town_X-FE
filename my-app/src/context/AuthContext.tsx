import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";

import { authAPI, type VerifyOtpPayload } from "@/services/authAPI";
import type { User, UserRole } from "@/types/user";
import {
  clearSession,
  getStoredUser,
  getToken,
  pathOnly,
  persistSession as writeSession,
  persistUser,
  setUnauthorizedHandler,
  subscribeAuthBroadcast,
} from "@/lib/authStorage";

/** Where each role lands right after login/signup (KYC must be verified first). */
export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  buyer: "/home",
  owner: "/owner/dashboard",
  /** Marker only — admin is hard-redirected to the external console. */
  admin: "/admin/dashboard",
};

export const KYC_ROUTE = "/kyc";
export const LOGIN_ROUTE = "/login";

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
  if (user.role === "admin") return ROLE_HOME_ROUTE.admin;
  if (user.kyc_status !== "verified") return KYC_ROUTE;

  const trimmed = from?.trim();
  const base = pathOnly(trimmed);
  if (trimmed && base && !NON_APP_RETURN_PATHS.has(base)) {
    // Landing / generic "buyer home" must not override owner destinations.
    if (base === ROLE_HOME_ROUTE.buyer && user.role !== "buyer") {
      return ROLE_HOME_ROUTE[user.role];
    }
    return trimmed;
  }
  return ROLE_HOME_ROUTE[user.role];
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionDegraded: boolean;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session bootstrap matches:
 * Open app → cookie/token? → GET /api/auth/me → valid → logged in; else guest.
 * Close tab keeps HttpOnly cookie; reopen re-validates via /me.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [sessionDegraded, setSessionDegraded] = useState(false);

  const applyLoggedOut = () => {
    clearSession({ sync: false });
    setToken(null);
    setUser(null);
    setSessionDegraded(false);
  };

  const logout = () => {
    void authAPI.logout();
    clearSession({ sync: true });
    setToken(null);
    setUser(null);
    setSessionDegraded(false);
    queryClient.clear();
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession({ sync: true });
      setToken(null);
      setUser(null);
      setSessionDegraded(false);
      queryClient.clear();
      if (!window.location.pathname.startsWith(LOGIN_ROUTE)) {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        window.location.assign(
          `${LOGIN_ROUTE}?from=${encodeURIComponent(returnTo)}`
        );
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  // Always validate session via /me (cookie and/or cached Bearer).
  useEffect(() => {
    let cancelled = false;

    authAPI
      .me()
      .then((freshUser) => {
        if (cancelled) return;
        const existing = getToken();
        setUser(freshUser);
        setToken(existing);
        persistUser(freshUser, { sync: false });
        setSessionDegraded(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (status === 401 || status === 403) {
          applyLoggedOut();
        } else if (getToken() && getStoredUser()) {
          // Network blip with cached session — keep UX, mark degraded.
          setSessionDegraded(true);
        } else {
          applyLoggedOut();
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Cross-tab: login/logout in Tab A updates Tab B without full reload.
  useEffect(() => {
    return subscribeAuthBroadcast((msg) => {
      if (msg.type === "logout") {
        setToken(null);
        setUser(null);
        setSessionDegraded(false);
        queryClient.clear();
        return;
      }
      if (msg.type === "login") {
        setToken(msg.token);
        setUser(msg.user);
        setSessionDegraded(false);
        return;
      }
      if (msg.type === "user") {
        setUser(msg.user);
      }
    });
  }, [queryClient]);

  const verifyOtp = async (payload: VerifyOtpPayload) => {
    const result = await authAPI.verifyOtp(payload);
    writeSession(result.access_token, result.user, { sync: true });
    setToken(result.access_token);
    setUser(result.user);
    setSessionDegraded(false);
    return result.user;
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authAPI.me();
      const existing = getToken();
      persistUser(freshUser, { sync: true });
      setUser(freshUser);
      setToken(existing);
      setSessionDegraded(false);
      return freshUser;
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 401) {
        logout();
        return null;
      }
      setSessionDegraded(true);
      throw error;
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      // Cookie-only sessions may have user without a localStorage token after /me.
      isAuthenticated: Boolean(user),
      isLoading,
      sessionDegraded,
      verifyOtp,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, sessionDegraded]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
