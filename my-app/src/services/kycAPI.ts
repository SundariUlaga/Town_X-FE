import api from "./api";
import type { User } from "@/types/user";

export interface KycConfig {
  mode: "demo" | "sandbox";
  effective_mode?: "demo" | "sandbox" | "sandbox-fallback";
  sandbox_fallback?: boolean;
  redirect_url: string;
  demo_hint: string;
  sandbox_hint?: string;
  fallback_message?: string | null;
}

export interface KycVerifyAccountPayload {
  mobile_number?: string;
  aadhaar_number?: string;
}

export interface KycVerifyAccountResult {
  verification_id: string;
  reference_id?: number;
  status: string;
  mobile_number?: string;
  digilocker_id?: string;
  mode: string;
}

export interface KycSessionResult {
  verification_id: string;
  reference_id?: number;
  url: string;
  status: string;
  mode: string;
}

export interface KycStatusResult {
  kyc_status: User["kyc_status"];
  verification_id?: string;
  reference_id?: number;
  digilocker_status?: string;
  mode: string;
  message?: string;
}

export const kycAPI = {
  getConfig: async (): Promise<KycConfig> => {
    const response = await api.get<KycConfig>("/api/kyc/config");
    return response.data;
  },

  getStatus: async (): Promise<KycStatusResult> => {
    const response = await api.get<KycStatusResult>("/api/kyc/status");
    return response.data;
  },

  verifyAccount: async (payload: KycVerifyAccountPayload): Promise<KycVerifyAccountResult> => {
    const response = await api.post<KycVerifyAccountResult>("/api/kyc/verify-account", payload);
    return response.data;
  },

  createSession: async (): Promise<KycSessionResult> => {
    const response = await api.post<KycSessionResult>("/api/kyc/create-session");
    return response.data;
  },

  demoComplete: async (): Promise<User> => {
    const response = await api.post<User>("/api/kyc/demo/complete");
    return response.data;
  },
};

export default kycAPI;
