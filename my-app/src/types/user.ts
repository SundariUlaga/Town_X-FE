export type UserRole = "buyer" | "owner" | "admin";
export type KycStatus = "pending" | "in_progress" | "verified" | "failed";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  kyc_status: KycStatus;
  kyc_verified_at?: string | null;
  kyc_mobile?: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  user: User;
}
