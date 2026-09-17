import type { UserRole } from "@/types/user";

export const PUBLIC_ROLES = ["buyer", "owner"] as const;
export type PublicUserRole = (typeof PUBLIC_ROLES)[number];

export function isPublicUserRole(value: unknown): value is PublicUserRole {
  return value === "buyer" || value === "owner";
}

export function coercePublicRole(value: unknown, fallback: PublicUserRole = "buyer"): PublicUserRole {
  return isPublicUserRole(value) ? value : fallback;
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === "admin";
}
