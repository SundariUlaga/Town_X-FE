import { useEffect } from "react";

const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL || "http://localhost:5190";

export default function AdminAppRedirect({ path = "/dashboard" }) {
  useEffect(() => {
    window.location.replace(`${ADMIN_APP_URL}${path}`);
  }, [path]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6 text-center text-sm text-muted-foreground">
      Redirecting to the admin console…
    </div>
  );
}
