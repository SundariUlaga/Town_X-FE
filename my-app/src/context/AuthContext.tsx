import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";

import { authAPI, type VerifyOtpPayload } from "@/services/authAPI";
import type { User, UserRole } from "@/types/user";
import { refreshAccessToken } from "@/lib/sessionRefresh";
import {
  clearSession,
  getStoredUser,
  getToken,
  hasCachedSession,
  isAccessTokenExpired,
  isAccessTokenExpiringSoon,
  markSessionExpired,
  pathOnly,
  persistSession as writeSession,
  persistUser,
  SESSION_EXPIRED_MESSAGE,
  setUnauthorizedHandler,
  subscribeAuthBroadcast,
} from "@/lib/authStorage";

/** Where each role lands right after login/signup (KYC must be verified first). */
export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  buyer: "/home",
  owner: "/home",
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

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function endExpiredSession() {
  markSessionExpired(SESSION_EXPIRED_MESSAGE);
  clearSession({ sync: true, reason: "expired" });
}

/**
 * Cached user is trusted immediately so reopen doesn't sit on a loader.
 * GET /api/auth/me revalidates in the background (cookie and/or Bearer).
 * Expired access tokens are refreshed silently; a dead refresh session asks
 * the user to log in again.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState(() => !getStoredUser() && hasCachedSession());
  const [sessionDegraded, setSessionDegraded] = useState(false);

  const applyLoggedOut = (expired = false) => {
    if (expired) {
      markSessionExpired(SESSION_EXPIRED_MESSAGE);
      clearSession({ sync: true, reason: "expired" });
    } else {
      clearSession({ sync: false });
    }
    setToken(null);
    setUser(null);
    setSessionDegraded(false);
    queryClient.clear();
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
      endExpiredSession();
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

  const applyUser = (freshUser: User) => {
    const existing = getToken();
    setUser(freshUser);
    setToken(existing);
    persistUser(freshUser, { sync: false });
    setSessionDegraded(false);
  };

  // Revalidate in the background. Cached sessions must not wait on /me.
  useEffect(() => {
    let cancelled = false;

    const hydrate = async (): Promise<"ok" | "signed-out" | "retry"> => {
      if (!hasCachedSession()) {
        return "signed-out";
      }

      try {
        if (isAccessTokenExpired(getToken())) {
          const refreshed = await refreshAccessToken();
          if (cancelled) return "ok";
          if (refreshed?.access_token) setToken(refreshed.access_token);
          if (refreshed?.user) applyUser(refreshed.user);
        }
        const freshUser = await authAPI.me();
        if (cancelled) return "ok";
        applyUser(freshUser);
        setToken(getToken());
        return "ok";
      } catch (error: unknown) {
        if (cancelled) return "ok";
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (status === 401) {
          applyLoggedOut(hasCachedSession());
          return "signed-out";
        }
        if (getStoredUser()) {
          setSessionDegraded(true);
          return "retry";
        }
        applyLoggedOut(false);
        return "signed-out";
      }
    };

    void (async () => {
      const first = await hydrate();
      if (!cancelled) setIsLoading(false);
      if (first !== "retry" || cancelled) return;
      for (const ms of [1200, 3500]) {
        await sleep(ms);
        if (cancelled) return;
        if ((await hydrate()) !== "retry") return;
      }
    })();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!hasCachedSession()) return;
      if (isAccessTokenExpiringSoon(getToken())) {
        void refreshAccessToken()
          .then((data) => {
            if (data?.access_token) setToken(data.access_token);
          })
          .catch(() => {
            void hydrate();
          });
        return;
      }
      void hydrate();
    };
    document.addEventListener("visibilitychange", onVisible);

    const interval = window.setInterval(() => {
      if (!hasCachedSession()) return;
      if (!isAccessTokenExpiringSoon(getToken())) return;
      void refreshAccessToken()
        .then((data) => {
          if (data?.access_token) setToken(data.access_token);
        })
        .catch(() => {
          /* interceptor / hydrate handles hard expiry */
        });
    }, 60_000);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, []);

  // Cross-tab: login/logout in Tab A updates Tab B without full reload.
  useEffect(() => {
    return subscribeAuthBroadcast((msg) => {
      if (msg.type === "logout" || msg.type === "expired") {
        if (msg.type === "expired") markSessionExpired(SESSION_EXPIRED_MESSAGE);
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
      if (msg.type === "token") {
        setToken(msg.token);
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
        applyLoggedOut(true);
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
