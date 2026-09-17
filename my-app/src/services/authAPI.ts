import api from "./api";
import type { AuthResponse, User, UserRole } from "@/types/user";

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
  name?: string;
  role?: UserRole;
}

/** @deprecated Legacy email login — use verifyOtp */
export interface LoginPayload {
  email: string;
  password: string;
}

/** @deprecated Legacy email signup — use verifyOtp */
export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const authAPI = {
  sendOtp: async (phone: string): Promise<{ message: string; phone: string; is_existing_user: boolean }> => {
    const response = await api.post<{ message: string; phone: string; is_existing_user: boolean }>(
      "/api/auth/send-otp",
      { phone }
    );
    return response.data;
  },

  verifyOtp: async (payload: VerifyOtpPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/api/auth/verify-otp", payload);
    return response.data;
  },

  me: async (signal?: AbortSignal): Promise<User> => {
    const response = await api.get<User>("/api/auth/me", { signal });
    return response.data;
  },

  /** Clears HttpOnly session cookie on the API. */
  logout: async (): Promise<void> => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Still clear client cache even if network fails.
    }
  },
};

export default authAPI;
