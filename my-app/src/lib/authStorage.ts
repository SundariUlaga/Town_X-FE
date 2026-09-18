import type { User } from "@/types/user";

export const TOKEN_KEY = "townx_token";
export const USER_KEY = "townx_user";
export const KYC_RETURN_KEY = "townx_kyc_return";
export const AUTH_BROADCAST_KEY = "townx_auth_sync";
export const POST_LOGOUT_KEY = "townx_post_logout";
export const SESSION_NOTICE_KEY = "townx_session_notice";

export const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";

export type KycReturnState = {
  from?: string;
  feedState?: unknown;
};

export type AuthBroadcastMessage =
  | { type: "login"; token: string; user: User }
  | { type: "logout" }
  | { type: "expired" }
  | { type: "user"; user: User }
  | { type: "token"; token: string };

type UnauthorizedHandler = (reason?: "expired") => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let authChannel: BroadcastChannel | null = null;

/** Register a single handler invoked when the session cannot be recovered. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized(reason: "expired" = "expired") {
  unauthorizedHandler?.(reason);
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function hasCachedSession(): boolean {
  return Boolean(getStoredUser() || getToken());
}

function decodeJwtPayload(token: string): { exp?: number; typ?: string } | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as { exp?: number; typ?: string };
  } catch {
    return null;
  }
}

export function getAccessTokenExpiryMs(token: string | null): number | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return typeof payload?.exp === "number" ? payload.exp * 1000 : null;
}

/** True when the access JWT is missing or past (or within skew of) expiry. */
export function isAccessTokenExpired(token: string | null, skewMs = 15_000): boolean {
  if (!token) return true;
  const exp = getAccessTokenExpiryMs(token);
  if (!exp) return false;
  return Date.now() + skewMs >= exp;
}

export function isAccessTokenExpiringSoon(token: string | null, withinMs = 60_000): boolean {
  if (!token) return true;
  const exp = getAccessTokenExpiryMs(token);
  if (!exp) return false;
  return Date.now() + withinMs >= exp;
}

function broadcast(message: AuthBroadcastMessage) {
  try {
    if (typeof BroadcastChannel !== "undefined") {
      if (!authChannel) authChannel = new BroadcastChannel(AUTH_BROADCAST_KEY);
      authChannel.postMessage(message);
    }
    // storage event fallback for older browsers / Safari quirks
    localStorage.setItem(
      AUTH_BROADCAST_KEY,
      JSON.stringify({ ...message, ts: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

export function persistSession(token: string, user: User, { sync = true } = {}) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (sync) broadcast({ type: "login", token, user });
}

export function persistAccessToken(token: string, { sync = true } = {}) {
  localStorage.setItem(TOKEN_KEY, token);
  if (sync) broadcast({ type: "token", token });
}

export function persistUser(user: User, { sync = true } = {}) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (sync) broadcast({ type: "user", user });
}

export function clearSession({ sync = true, reason = "logout" }: { sync?: boolean; reason?: "logout" | "expired" } = {}) {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if (sync) broadcast({ type: reason === "expired" ? "expired" : "logout" });
}

/** Persist a message shown after redirecting a timed-out session to login. */
export function markSessionExpired(message: string = SESSION_EXPIRED_MESSAGE) {
  try {
    sessionStorage.setItem(SESSION_NOTICE_KEY, message);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("townx:session-expired"));
}

export function peekSessionNotice(): string | null {
  try {
    return sessionStorage.getItem(SESSION_NOTICE_KEY);
  } catch {
    return null;
  }
}

export function consumeSessionNotice(): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_NOTICE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SESSION_NOTICE_KEY);
    return raw;
  } catch {
    return null;
  }
}

/** Subscribe to login/logout from other tabs. Returns unsubscribe. */
export function subscribeAuthBroadcast(handler: (msg: AuthBroadcastMessage) => void) {
  const onMessage = (event: MessageEvent<AuthBroadcastMessage>) => {
    if (event?.data?.type) handler(event.data);
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== AUTH_BROADCAST_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as AuthBroadcastMessage & { ts?: number };
      if (parsed?.type) handler(parsed);
    } catch {
      /* ignore */
    }
  };

  let channel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(AUTH_BROADCAST_KEY);
      channel.addEventListener("message", onMessage);
    }
  } catch {
    channel = null;
  }
  window.addEventListener("storage", onStorage);

  return () => {
    channel?.removeEventListener("message", onMessage);
    channel?.close();
    window.removeEventListener("storage", onStorage);
  };
}

export function saveKycReturnState(state: KycReturnState) {
  try {
    sessionStorage.setItem(KYC_RETURN_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function consumeKycReturnState(): KycReturnState | null {
  try {
    const raw = sessionStorage.getItem(KYC_RETURN_KEY);
    sessionStorage.removeItem(KYC_RETURN_KEY);
    return raw ? (JSON.parse(raw) as KycReturnState) : null;
  } catch {
    return null;
  }
}

/** Pathname only — strips query/hash for NON_APP_RETURN_PATHS checks. */
export function pathOnly(pathWithSearch?: string | null): string {
  if (!pathWithSearch) return "";
  return pathWithSearch.split("?")[0].split("#")[0];
}

/** Mark intentional logout so ProtectedRoute sends home instead of opening login. */
export function markPostLogoutRedirect() {
  try {
    sessionStorage.setItem(POST_LOGOUT_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Returns true once if logout just happened, then clears the flag. */
export function consumePostLogoutRedirect(): boolean {
  try {
    if (sessionStorage.getItem(POST_LOGOUT_KEY) !== "1") return false;
    sessionStorage.removeItem(POST_LOGOUT_KEY);
    return true;
  } catch {
    return false;
  }
}
