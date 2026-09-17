/**
 * API origin for browser calls.
 * Empty string → same-origin (Vite proxies `/api` → backend) so HttpOnly
 * session cookies work. Set VITE_API_URL only when calling the API cross-origin.
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL;
  if (raw == null || String(raw).trim() === "") return "";
  return String(raw).replace(/\/$/, "");
}
