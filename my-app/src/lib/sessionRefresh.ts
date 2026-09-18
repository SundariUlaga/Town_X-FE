import axios from "axios";

import { getApiBaseUrl } from "@/lib/apiBase";
import { persistAccessToken, persistUser } from "@/lib/authStorage";
import type { AuthResponse } from "@/types/user";

const refreshClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const AUTH_SKIP_PATHS = [
  "/api/auth/send-otp",
  "/api/auth/verify-otp",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/admin/auth/login",
];

let inflight: Promise<AuthResponse> | null = null;

export function isAuthSkipUrl(url: unknown): boolean {
  const value = String(url || "");
  return AUTH_SKIP_PATHS.some((path) => value.includes(path));
}

/** Single-flight refresh so concurrent 401s share one cookie rotation. */
export function refreshAccessToken(): Promise<AuthResponse> {
  if (!inflight) {
    inflight = refreshClient
      .post<AuthResponse>("/api/auth/refresh", {})
      .then((res) => {
        const data = res.data;
        if (data?.access_token) persistAccessToken(data.access_token);
        if (data?.user) persistUser(data.user, { sync: false });
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}
