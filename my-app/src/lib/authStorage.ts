import type { User } from "@/types/user";

export const TOKEN_KEY = "townx_token";
export const USER_KEY = "townx_user";
export const KYC_RETURN_KEY = "townx_kyc_return";
export const AUTH_BROADCAST_KEY = "townx_auth_sync";
export const POST_LOGOUT_KEY = "townx_post_logout";

export type KycReturnState = {
  from?: string;
  feedState?: unknown;
};

export type AuthBroadcastMessage =
  | { type: "login"; token: string; user: User }
  | { type: "logout" }
  | { type: "user"; user: User };

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let authChannel: BroadcastChannel | null = null;

/** Register a single handler invoked on API 401 (clears React auth + query cache). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  unauthorizedHandler?.();
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

export function persistUser(user: User, { sync = true } = {}) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (sync) broadcast({ type: "user", user });
}

export function clearSession({ sync = true } = {}) {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if (sync) broadcast({ type: "logout" });
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
