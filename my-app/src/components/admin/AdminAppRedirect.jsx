import { useEffect } from "react";
import { redirectToAdminConsole } from "@/lib/adminApp";

export default function AdminAppRedirect({ path = "/dashboard" }) {
  useEffect(() => {
    redirectToAdminConsole(path);
  }, [path]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6 text-center text-sm text-muted-foreground">
      Redirecting to the admin console…
    </div>
  );
}
