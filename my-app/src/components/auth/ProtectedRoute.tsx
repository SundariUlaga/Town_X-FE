import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth, KYC_ROUTE, ROLE_HOME_ROUTE } from "@/context/AuthContext";
import { AuthRequiredRedirect } from "@/components/auth/AuthRouteRedirect";
import TownLoader from "@/components/shared/TownLoader";
import { redirectToAdminConsole } from "@/lib/adminApp";
import { consumePostLogoutRedirect } from "@/lib/authStorage";
import type { UserRole } from "@/types/user";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  /** Omit to allow any authenticated user regardless of role. */
  allowedRoles?: UserRole[];
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const returnFrom = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (user?.role === "admin") {
      redirectToAdminConsole("/dashboard");
    }
  }, [user?.role]);

  // Cached user is enough to render. Only block when we have no session yet.
  if (isLoading && !isAuthenticated) {
    return <TownLoader fullScreen label="Checking session" />;
  }

  if (!isAuthenticated) {
    // Logout clears user before navigate("/") finishes — don't flash login drawer.
    if (consumePostLogoutRedirect()) {
      return <Navigate to="/" replace />;
    }
    return (
      <AuthRequiredRedirect
        from={returnFrom}
        feedState={location.state}
      />
    );
  }

  if (user?.role === "admin") {
    return <TownLoader fullScreen label="Opening admin console" />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME_ROUTE[user.role]} replace />;
  }

  const isKycExempt = location.pathname.startsWith(KYC_ROUTE);
  if (user && user.role !== "admin" && user.kyc_status !== "verified" && !isKycExempt) {
    return (
      <Navigate
        to={KYC_ROUTE}
        replace
        state={{ from: returnFrom, feedState: location.state }}
      />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
