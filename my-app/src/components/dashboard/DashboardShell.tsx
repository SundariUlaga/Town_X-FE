import type { ReactNode } from "react";

import { useAuth, ROLE_HOME_ROUTE } from "@/context/AuthContext";
import AppNavbar from "@/components/shared/AppNavbar";

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const homeRoute = user ? ROLE_HOME_ROUTE[user.role] : "/home";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <AppNavbar variant="inner" backTo={homeRoute} backLabel="Back to app" />

      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-5 sm:py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {actions}
        </div>

        {children}
      </div>
    </div>
  );
}

export default DashboardShell;
