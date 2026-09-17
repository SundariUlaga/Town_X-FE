import type { ReactNode } from "react";

import { useAuth, ROLE_HOME_ROUTE } from "@/context/AuthContext";
import AppNavbar from "@/components/shared/AppNavbar";

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
  onPostProperty,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
  onPostProperty?: () => void;
}) {
  const { user } = useAuth();
  const homeRoute = user ? ROLE_HOME_ROUTE[user.role] : "/home";
  const backTo = homeRoute;
  const backLabel = "Back to home";

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar
        variant="inner"
        backTo={backTo}
        backLabel={backLabel}
        onPostProperty={onPostProperty}
      />

      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-5 sm:py-6 pb-20 safe-bottom">
        <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {actions ? <div className="w-full sm:w-auto shrink-0 [&_button]:w-full sm:[&_button]:w-auto">{actions}</div> : null}
        </div>

        {children}
      </div>
    </div>
  );
}

export default DashboardShell;
