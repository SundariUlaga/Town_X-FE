export const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL || "http://localhost:5190";

export function redirectToAdminConsole(path = "/dashboard") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  window.location.replace(`${ADMIN_APP_URL}${normalized}`);
}
